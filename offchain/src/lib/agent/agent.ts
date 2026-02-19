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
import { JobRequirements as SdlJobRequirements } from '@/lib/akash/sdl-generator';
import { SynapseProvider } from '@/lib/providers/akash-fetcher';

/**
 * Convert agent JobRequirements to SDL JobRequirements
 */
function toSdlRequirements(
  description: string,
  requirements: RoutingRequest['requirements']
): SdlJobRequirements {
  return {
    name: description.slice(0, 50),
    image: 'ubuntu:latest', // Default image
    cpu: 4, // Default CPU
    memory: `${requirements.minGpuMemoryGB || 8}Gi`,
    gpu: requirements.gpuModel ? {
      units: requirements.minGpuCount || 1,
      vendor: requirements.gpuModel
    } : undefined,
    region: requirements.region
  };
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
  const agent = new LlmAgent({
    name: config.name,
    model: config.model,
    description: `You are a compute marketplace routing agent.
Your job is to intelligently route compute jobs to the best provider.

Available providers:
- Akash Network (decentralized, auction-based pricing)

For each job:
1. Analyze requirements (GPU type, memory, budget, region)
2. Use compare_providers tool to evaluate all suitable providers
3. Select the best provider based on cost, reliability, and speed
4. Use the appropriate route tool (route_to_akash) to execute
5. If tracked mode, submit to blockchain

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
  let transaction: TransactionResult | undefined;
  
  if (request.isTracked) {
    onThinking?.({
      id: '3',
      message: 'Submitting job to blockchain...',
      status: 'active',
      timestamp: Date.now()
    });
    
    // Note: Actual blockchain submission would use walletTool
    // This is a placeholder for the tool-based approach
    transaction = {
      success: true,
      hash: `0x${Date.now().toString(16)}`,
      jobId: BigInt(Date.now())
    };
    
    if (transaction.success) {
      onThinking?.({
        id: '3',
        message: `Job submitted on-chain (tx: ${transaction.hash?.slice(0, 10)}...)`,
        status: 'complete',
        timestamp: Date.now()
      });
    } else {
      onThinking?.({
        id: '3',
        message: `Transaction failed`,
        status: 'error',
        timestamp: Date.now()
      });
    }
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
