/**
 * @title Google ADK Agent
 * @notice Main agent implementation using Google ADK with forced tool calling
 * @dev Uses aggressive prompting and retry logic to ensure tools are called
 */

import { LlmAgent, InMemoryRunner } from '@google/adk';
import { createPartFromText, type GenerateContentConfig } from '@google/genai';
import { 
  routeToAkashTool, 
  compareProvidersTool,
  logReasoningTo0gTool,
  type RouteToAkashResult,
  type CompareProvidersResult
} from './tools';
import { walletTool } from './wallet-tool';
import type { AgentConfig, RoutingRequest, RoutingResult, TransactionResult, ThinkingStep } from './types';
import { 
  JobRequirements as SdlJobRequirements,
  getTemplates
} from '@/lib/akash/sdl-generator';
import { resolveDockerImage, getSuggestedImages } from '@/lib/docker-image-resolver';
import { SynapseProvider } from '@/lib/providers/akash-fetcher';

const GPU_MODEL_TO_VENDOR: Record<string, string> = {
  'a100': 'nvidia', 'h100': 'nvidia', 'v100': 'nvidia',
  'rtx4090': 'nvidia', 'rtx3090': 'nvidia', 'rtx4080': 'nvidia', 'rtx3080': 'nvidia',
  'a40': 'nvidia', 'a10': 'nvidia', 't4': 'nvidia',
};

function normalizeGpuModel(model: string): string {
  return model.toLowerCase().replace(/\s+/g, '').replace(/^nvidia/, '');
}

function getVendorFromModel(model: string): string {
  return GPU_MODEL_TO_VENDOR[normalizeGpuModel(model)] || 'nvidia';
}

function toSdlRequirements(description: string, requirements: RoutingRequest['requirements']): SdlJobRequirements {
  const imageMatch = resolveDockerImage(description);
  let templateId = 'ubuntu';
  if (imageMatch?.category === 'ai' || requirements.gpuModel) templateId = 'pytorch-gpu';
  else if (imageMatch?.category === 'database') templateId = 'postgres-db';
  else if (imageMatch?.category === 'web') templateId = 'nginx-web';
  
  const template = getTemplates().find(t => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);
  
  const sdlReq: SdlJobRequirements = { 
    ...template.requirements, 
    name: description.slice(0, 50).replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() 
  };
  
  if (imageMatch) {
    sdlReq.image = imageMatch.image;
    if (imageMatch.port) { sdlReq.port = imageMatch.port; sdlReq.expose = true; }
  }
  
  if (requirements.minGpuCount && sdlReq.gpu) sdlReq.gpu.units = requirements.minGpuCount;
  if (requirements.minGpuMemoryGB) sdlReq.memory = `${requirements.minGpuMemoryGB}Gi`;
  if (requirements.gpuModel && sdlReq.gpu) {
    sdlReq.gpu.vendor = getVendorFromModel(requirements.gpuModel);
    sdlReq.gpu.models = [normalizeGpuModel(requirements.gpuModel)];
  }
  if (requirements.region) sdlReq.region = requirements.region;
  
  return sdlReq;
}

function getDockerImageHelp(): string {
  const suggestions = getSuggestedImages();
  const grouped = suggestions.reduce((acc, s) => { 
    if (!acc[s.category]) acc[s.category] = []; 
    acc[s.category].push(`${s.image} - ${s.description}`); 
    return acc; 
  }, {} as Record<string, string[]>);
  return Object.entries(grouped)
    .map(([category, images]) => `${category.toUpperCase()}:\n${images.map(i => `  - ${i}`).join('\n')}`)
    .join('\n\n');
}

export function createRoutingAgent(config: AgentConfig): LlmAgent {
  return new LlmAgent({
    name: config.name,
    model: config.model || 'gemini-2.5-flash',
    instruction: `You are a compute routing agent. Your ONLY job is to CALL TOOLS.

CRITICAL RULES - VIOLATING THESE IS A FAILURE:
1. You MUST call the tool specified in the user message
2. You MUST NOT generate text responses - ONLY tool calls
3. You MUST NOT ask questions - just call the tool
4. If you see "Call the X tool" in the message, you MUST call that tool

AVAILABLE TOOLS:
- compare_providers: Evaluates compute providers
- route_to_akash: Creates deployments on Akash Network
- log_reasoning_to_0g: Stores agent reasoning immutably to 0G Storage

Docker Images:
${getDockerImageHelp()}

REMEMBER: TOOL CALL ONLY. NO TEXT.`,
    tools: [routeToAkashTool, compareProvidersTool, walletTool, logReasoningTo0gTool],
    generateContentConfig: { 
      temperature: 0,
      topP: 0.1,
    } as GenerateContentConfig
  });
}

async function runAgentUntilToolCalled<T>(
  runner: InMemoryRunner,
  sessionId: string,
  userId: string,
  toolName: string,
  initialPrompt: string,
  maxRetries: number,
  onThinking?: (step: ThinkingStep) => void
): Promise<{ result: T | null; error: string | null }> {
  let attempt = 0;
  let capturedResult: T | null = null;

  while (attempt < maxRetries && !capturedResult) {
    attempt++;
    console.log(`[AGENT DEBUG] Attempt ${attempt}/${maxRetries} for ${toolName}`);

    const prompt = attempt === 1 
      ? initialPrompt 
      : `You failed to call the ${toolName} tool. Try again.

${initialPrompt}`;

    for await (const event of runner.runAsync({
      userId,
      sessionId,
      newMessage: { parts: [createPartFromText(prompt)] }
    })) {
      console.log(`[AGENT DEBUG] Attempt ${attempt} event:`, {
        hasText: !!event.content?.parts?.[0]?.text,
        hasFunctionCall: !!event.content?.parts?.[0]?.functionCall,
        hasFunctionResponse: !!event.content?.parts?.[0]?.functionResponse,
        errorCode: event.errorCode,
        finishReason: event.finishReason,
      });

      // Handle rate limits - real errors
      if (event.errorCode === '429' || event.errorCode === 'RESOURCE_EXHAUSTED') {
        return { result: null, error: event.errorMessage || `Error ${event.errorCode}` };
      }

      // Capture text (means model didn't call tool)
      if (event.content?.parts?.[0]?.text) {
        console.log(`[AGENT DEBUG] Attempt ${attempt} - Model returned text instead of calling tool`);
      }

      // Capture function response
      if (event.content?.parts?.[0]?.functionResponse) {
        const funcResponse = event.content.parts[0].functionResponse;
        if (funcResponse.name === toolName && funcResponse.response) {
          try {
            capturedResult = typeof funcResponse.response === 'string'
              ? JSON.parse(funcResponse.response)
              : funcResponse.response;
            console.log(`[AGENT DEBUG] Successfully captured ${toolName} result on attempt ${attempt}`);
            break; // Got the result, exit loop
          } catch (e) {
            console.error(`[AGENT DEBUG] Failed to parse ${toolName} response:`, e);
          }
        }
      }

      // STOP means model finished - if we have result, success; if not, will retry
      if (event.finishReason === 'STOP' || event.errorCode === 'STOP') {
        console.log(`[AGENT DEBUG] Attempt ${attempt} - Model stopped`);
        if (capturedResult) {
          break; // Have result, exit
        }
        // No result, let loop continue to retry
      }
    }
  }

  if (!capturedResult) {
    return { 
      result: null, 
      error: `Failed to get ${toolName} result after ${maxRetries} attempts. Model did not call the tool.` 
    };
  }

  return { result: capturedResult, error: null };
}

export async function routeComputeJob(
  request: RoutingRequest,
  config: AgentConfig,
  onThinking?: (step: ThinkingStep) => void
): Promise<{ result: RoutingResult; transaction?: TransactionResult; routeResult?: RouteToAkashResult }> {
  const startTime = Date.now();
  onThinking?.({ id: 'init', message: 'Initializing routing agent...', status: 'active', timestamp: startTime });

  const agent = createRoutingAgent(config);
  const runner = new InMemoryRunner({ agent, appName: 'necto_router' });
  const sdlRequirements = toSdlRequirements(request.description, request.requirements);

  // === PHASE 1: Agent calls compare_providers ===
  onThinking?.({ id: 'phase1', message: 'Phase 1: Requesting provider comparison...', status: 'active', timestamp: Date.now() });

  const phase1Prompt = `CALL THE compare_providers TOOL NOW.

Job Description: ${request.description}
GPU Model: ${request.requirements.gpuModel || 'Any'}
Min GPU Count: ${request.requirements.minGpuCount || 1}
Max Price: ${request.requirements.maxPricePerHour || 'Not specified'}/hr
Region: ${request.requirements.region || 'Any'}

Call compare_providers with providersToCompare=["akash"].

DO NOT RESPOND WITH TEXT. CALL THE TOOL.`;

  const phase1Session = await runner.sessionService.createSession({
    appName: 'necto_router',
    userId: request.userAddress || 'anonymous',
    sessionId: `session-${Date.now()}-p1`
  });

  const phase1Result = await runAgentUntilToolCalled<CompareProvidersResult>(
    runner,
    phase1Session.id,
    request.userAddress || 'anonymous',
    'compare_providers',
    phase1Prompt,
    3,
    onThinking
  );

  if (phase1Result.error) throw new Error(`Failed to compare providers: ${phase1Result.error}`);
  if (!phase1Result.result) throw new Error('Agent did not return comparison results');

  const comparisonResult = phase1Result.result;
  console.log('[AGENT DEBUG] Phase 1 complete:', comparisonResult);

  // Determine provider
  let recommendedProvider = comparisonResult.recommended;
  if (!recommendedProvider && comparisonResult.comparisons.length > 0) {
    const best = [...comparisonResult.comparisons].sort((a, b) => b.score - a.score)[0];
    if (best && best.score > 0) {
      recommendedProvider = best.provider;
      console.log('[AGENT DEBUG] Using highest scored:', recommendedProvider);
    }
  }

  if (!recommendedProvider) throw new Error('No providers suitable for this workload.');
  const akashComparison = comparisonResult.comparisons.find(c => c.provider === 'akash');

  // === PHASE 2: Agent calls route_to_akash ===
  onThinking?.({ id: 'phase2', message: `Phase 2: Requesting deployment to ${recommendedProvider}...`, status: 'active', timestamp: Date.now() });

  const phase2Prompt = `CALL THE route_to_akash TOOL NOW.

Provider Selected: ${recommendedProvider}
Score: ${akashComparison?.score || 0}

Use these parameters:
- jobId: "job-${Date.now()}"
- image: "${sdlRequirements.image}"
- cpu: ${sdlRequirements.cpu}
- memory: "${sdlRequirements.memory}"
- autoAcceptBid: true

DO NOT RESPOND WITH TEXT. CALL THE TOOL.`;

  const phase2Session = await runner.sessionService.createSession({
    appName: 'necto_router',
    userId: request.userAddress || 'anonymous',
    sessionId: `session-${Date.now()}-p2`
  });

  const phase2Result = await runAgentUntilToolCalled<RouteToAkashResult>(
    runner,
    phase2Session.id,
    request.userAddress || 'anonymous',
    'route_to_akash',
    phase2Prompt,
    3,
    onThinking
  );

  if (phase2Result.error) throw new Error(`Failed to create deployment: ${phase2Result.error}`);
  if (!phase2Result.result) throw new Error('Agent did not return deployment results');

  const routeResult = phase2Result.result;
  console.log('[AGENT DEBUG] Phase 2 complete:', routeResult);

  if (!routeResult.success) throw new Error(`Deployment failed: ${routeResult.error}`);

  onThinking?.({ id: 'complete', message: `Deployment created: ${routeResult.deployment?.id.slice(0, 16)}...`, status: 'complete', timestamp: Date.now() });

  // Prepare result
  const mockProvider: SynapseProvider = {
    id: recommendedProvider,
    name: akashComparison?.name || recommendedProvider,
    source: 'Akash',
    region: request.requirements.region,
    priceEstimate: akashComparison?.estimatedCost || 0,
    uptimePercentage: 99,
    hardware: {
      gpuModel: request.requirements.gpuModel || 'unknown',
      gpuCount: request.requirements.minGpuCount || 1,
      cpuUnits: 4000,
      memory: (request.requirements.minGpuMemoryGB || 8) * 1024 * 1024 * 1024,
      memoryGB: request.requirements.minGpuMemoryGB || 8
    }
  };

  const result: RoutingResult = {
    provider: mockProvider,
    reasoning: akashComparison?.assessment || `Selected ${recommendedProvider}`,
    estimatedCost: akashComparison?.estimatedCost || 0,
    confidence: (akashComparison?.score || 50) / 100
  };

  return { result, transaction: undefined, routeResult };
}

export async function quickRoute(request: RoutingRequest, config: AgentConfig) {
  return routeComputeJob(request, config);
}

export { routeToAkashTool, compareProvidersTool, logReasoningTo0gTool };
