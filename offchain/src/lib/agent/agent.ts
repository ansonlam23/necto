/**
 * @title Google ADK Agent
 * @notice Main agent implementation using Google ADK and AI Studio
 * @dev Routes compute jobs using tool-based architecture for multi-provider support
 */

import { LlmAgent } from '@google/adk';
import { 
  routeToAkashTool, 
  compareProvidersTool,
  executeRouteToAkash,
  executeCompareProviders,
  type RouteToAkashResult 
} from './tools';
import { walletTool } from './wallet-tool';
import type { AgentConfig, RoutingRequest, RoutingResult, TransactionResult, ThinkingStep } from './types';
import { 
  JobRequirements as SdlJobRequirements,
  getTemplates,
  generateFromTemplate
} from '@/lib/akash/sdl-generator';
import { resolveDockerImage, getSuggestedImages, type ImageResolutionResult } from '@/lib/docker-image-resolver';
import { SynapseProvider } from '@/lib/providers/akash-fetcher';

/**
 * Convert agent JobRequirements to SDL JobRequirements
 * Uses Docker image resolver to intelligently match descriptions to images
 */
function toSdlRequirements(
  description: string,
  requirements: RoutingRequest['requirements']
): SdlJobRequirements {
  // First, try to resolve a Docker image from the description
  const imageMatch = resolveDockerImage(description);
  
  // Determine the best base template
  let templateId = 'ubuntu';
  if (imageMatch?.category === 'ai' || requirements.gpuModel) {
    templateId = 'pytorch-gpu';
  } else if (imageMatch?.category === 'database') {
    templateId = 'postgres-db';
  } else if (imageMatch?.category === 'web') {
    templateId = 'nginx-web';
  }
  
  // Get the base template
  const templates = getTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  
  // Start with template requirements
  const sdlReq: SdlJobRequirements = {
    ...template.requirements,
    name: description.slice(0, 50).replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
  };
  
  // Override with resolved Docker image if found
  if (imageMatch) {
    sdlReq.image = imageMatch.image;
    if (imageMatch.port) {
      sdlReq.port = imageMatch.port;
      sdlReq.expose = true;
    }
  }
  
  // Apply user-specific overrides
  if (requirements.minGpuCount && sdlReq.gpu) {
    sdlReq.gpu.units = requirements.minGpuCount;
  }
  
  if (requirements.minGpuMemoryGB) {
    sdlReq.memory = `${requirements.minGpuMemoryGB}Gi`;
  }
  
  if (requirements.gpuModel && sdlReq.gpu) {
    sdlReq.gpu.vendor = requirements.gpuModel;
  }
  
  if (requirements.region) {
    sdlReq.region = requirements.region;
  }
  
  return sdlReq;
}

/**
 * Get available Docker images for agent context
 */
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

/**
 * Create the routing agent with Google AI Studio
 * 
 * The agent uses a tool-based architecture where each provider capability
 * is exposed as an ADK tool. This enables:
 * 1. Multi-provider support (Akash, io.net, Lambda Labs, etc.)
 * 2. Easy addition of new providers (just add a tool)
 * 3. Clear separation of concerns
 * 4. LLM-driven decision making
 */
export function createRoutingAgent(config: AgentConfig): LlmAgent {
  const dockerImages = getDockerImageHelp();
  
  const agent = new LlmAgent({
    name: config.name,
    model: config.model,
    description: `You are a compute marketplace routing agent.
Your job is to intelligently route compute jobs to the best provider.

Available providers:
- Akash Network (decentralized, auction-based pricing)

Available Docker Images:
${dockerImages}

For each job:
1. Analyze requirements (GPU type, memory, budget, region)
2. Use compare_providers tool to evaluate all suitable providers
3. Select the best provider based on cost, reliability, and speed
4. Use the appropriate route tool (route_to_akash) to execute
5. If tracked mode, submit to blockchain

The system will automatically detect Docker images from natural language descriptions.
Users can also specify exact images like "Use pytorch/pytorch:2.0" or "Deploy nginx:alpine".

Always explain your reasoning. Consider price, uptime, and hardware match.`,
    tools: [
      routeToAkashTool,
      compareProvidersTool,
      walletTool
    ]
  });
  
  return agent;
}

/**
 * Route a compute job using the agent
 * 
 * This is the main entry point for job routing. It uses a tool-based
 * approach where the agent delegates to specialized tools rather than
 * having hardcoded provider logic.
 * 
 * Tool flow:
 * 1. compare_providers - Evaluate available providers
 * 2. route_to_akash - Execute routing on selected provider
 * 3. submit_job_to_blockchain (wallet tool) - Record on-chain (if tracked)
 */
export async function routeComputeJob(
  request: RoutingRequest,
  config: AgentConfig,
  onThinking?: (step: ThinkingStep) => void
): Promise<{ result: RoutingResult; transaction?: TransactionResult; routeResult?: RouteToAkashResult }> {
  const startTime = Date.now();
  
  // Step 1: Compare providers
  onThinking?.({
    id: '1',
    message: 'Evaluating providers for this workload...',
    status: 'active',
    timestamp: startTime
  });

  const sdlRequirements = toSdlRequirements(request.description, request.requirements);
  
  // Log the resolved image for debugging
  console.log('Resolved Docker image:', sdlRequirements.image, 'from description:', request.description);

  const comparisonResult = await executeCompareProviders({
    requirements: sdlRequirements,
    providersToCompare: ['akash'] // Start with Akash, add others as implemented
  });

  if (!comparisonResult.success) {
    onThinking?.({
      id: '1',
      message: `Provider comparison failed: ${comparisonResult.error}`,
      status: 'error',
      timestamp: Date.now()
    });
    throw new Error(`Failed to compare providers: ${comparisonResult.error}`);
  }

  const recommendedProvider = comparisonResult.recommended;
  const akashComparison = comparisonResult.comparisons.find(c => c.provider === 'akash');

  onThinking?.({
    id: '1',
    message: recommendedProvider 
      ? `Recommended provider: ${recommendedProvider} (score: ${akashComparison?.score || 0})`
      : 'No suitable providers found',
    status: recommendedProvider ? 'complete' : 'error',
    timestamp: Date.now()
  });

  if (!recommendedProvider) {
    throw new Error(
      'No providers suitable for this workload. ' +
      'Try adjusting requirements or check back later.'
    );
  }

  // Step 2: Route to selected provider
  onThinking?.({
    id: '2',
    message: `Routing job to ${recommendedProvider}...`,
    status: 'active',
    timestamp: Date.now()
  });

  let routeResult: RouteToAkashResult | undefined;

  if (recommendedProvider === 'akash') {
    routeResult = await executeRouteToAkash({
      jobId: `job-${Date.now()}`,
      requirements: sdlRequirements,
      autoAcceptBid: false,
      bidTimeoutSeconds: 300
    }, (log) => {
      // Forward route logs as thinking steps
      onThinking?.({
        id: `route-${Date.now()}`,
        message: log.message,
        status: log.level === 'error' ? 'error' : 'active',
        timestamp: log.timestamp
      });
    });

    if (!routeResult.success) {
      onThinking?.({
        id: '2',
        message: `Routing failed: ${routeResult.error}`,
        status: 'error',
        timestamp: Date.now()
      });
      throw new Error(`Failed to route to Akash: ${routeResult.error}`);
    }

    onThinking?.({
      id: '2',
      message: `Deployment created: ${routeResult.deployment?.id.slice(0, 16)}...`,
      status: 'complete',
      timestamp: Date.now()
    });
  }

  // Step 3: Prepare result
  // Create a SynapseProvider-compatible result
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
      cpuUnits: 4000, // 4 vCPUs in milli-units
      memory: (request.requirements.minGpuMemoryGB || 8) * 1024 * 1024 * 1024, // Convert GB to bytes
      memoryGB: request.requirements.minGpuMemoryGB || 8
    }
  };

  const result: RoutingResult = {
    provider: mockProvider,
    reasoning: akashComparison?.assessment || `Selected ${recommendedProvider} based on provider comparison`,
    estimatedCost: akashComparison?.estimatedCost || 0,
    confidence: (akashComparison?.score || 50) / 100
  };

  // Step 4: Submit to blockchain if tracked
  // TODO: Implement walletTool-based blockchain submission
  // Currently disabled - jobs are routed off-chain only until blockchain
  // integration is fully implemented. The walletTool exists but needs
  // proper integration with the ComputeRouter contract.
  let transaction: TransactionResult | undefined;
  
  if (request.isTracked) {
    onThinking?.({
      id: '3',
      message: 'Blockchain tracking not yet implemented - job routed off-chain only',
      status: 'complete',
      timestamp: Date.now()
    });
    
    // Blockchain submission not yet implemented
    // transaction = await walletTool({
    //   action: 'submit_job',
    //   jobId: BigInt(Date.now()),
    //   provider: recommendedProvider,
    //   amount: BigInt(Math.floor((result.estimatedCost || 0) * 1_000_000))
    // });
    transaction = undefined;
  }
  
  return { result, transaction, routeResult };
}

/**
 * Quick route without thinking steps
 * Used for auto-sign mode
 */
export async function quickRoute(
  request: RoutingRequest,
  config: AgentConfig
): Promise<{ result: RoutingResult; transaction?: TransactionResult; routeResult?: RouteToAkashResult }> {
  return routeComputeJob(request, config);
}

/**
 * Re-export all tools for direct use
 */
export {
  routeToAkashTool,
  compareProvidersTool,
  executeRouteToAkash,
  executeCompareProviders
};
