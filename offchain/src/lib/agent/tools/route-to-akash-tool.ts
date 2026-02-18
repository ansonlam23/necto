/**
 * @title Route to Akash Tool
 * @notice Google ADK tool for routing compute jobs to Akash Network
 * @dev Wraps the Akash router as an ADK FunctionDeclaration for LLM agent use
 */

import { BaseTool, type RunAsyncToolRequest } from '@google/adk';
import { routeToAkash, isAkashSuitable, type RouteRequest, type RouteLog } from '../akash-router';
import { JobRequirements } from '@/lib/akash/sdl-generator';
import type { AkashDeployment, ProviderBid } from '@/types/akash';
import type { Provider } from '../provider-selection';

/**
 * Parameters for the routeToAkashTool
 */
export interface RouteToAkashParams {
  /** Unique job identifier */
  jobId: string;
  /** Hardware and software requirements for the job */
  requirements: JobRequirements;
  /** Automatically accept the best bid (optional, default: false) */
  autoAcceptBid?: boolean;
  /** Timeout for bid polling in seconds (optional, default: 300) */
  bidTimeoutSeconds?: number;
}

/**
 * Structured result from routing to Akash
 */
export interface RouteToAkashResult {
  /** Whether the routing was successful */
  success: boolean;
  /** Deployment details if successful */
  deployment?: AkashDeployment;
  /** Selected provider details */
  provider?: Provider;
  /** Provider bids received */
  bids?: ProviderBid[];
  /** Routing decision logs */
  logs: RouteLog[];
  /** Error message if failed */
  error?: string;
  /** Suitability assessment */
  suitability: {
    suitable: boolean;
    score: number;
    reasons: string[];
  };
}

/**
 * Helper function to route a job to Akash Network
 * Can be used directly or via the ADK tool
 * 
 * @param params - Routing parameters including jobId, requirements, and options
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with structured routing result
 */
export async function executeRouteToAkash(
  params: RouteToAkashParams,
  onProgress?: (log: RouteLog) => void
): Promise<RouteToAkashResult> {
  // Check suitability first
  const suitability = isAkashSuitable(params.requirements);

  try {
    const request: RouteRequest = {
      jobId: params.jobId,
      requirements: params.requirements,
      autoAcceptBid: params.autoAcceptBid ?? false,
      bidTimeoutMs: (params.bidTimeoutSeconds ?? 300) * 1000
    };

    const result = await routeToAkash(request, onProgress);

    return {
      success: result.success,
      deployment: result.deployment,
      provider: result.provider,
      bids: result.bids,
      logs: result.logs,
      error: result.error,
      suitability
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      logs: [{
        timestamp: Date.now(),
        level: 'error',
        message: `Routing failed: ${message}`
      }],
      error: message,
      suitability
    };
  }
}

/**
 * Route to Akash Tool - ADK FunctionDeclaration
 * 
 * This tool exposes Akash Network routing capabilities to the LLM agent.
 * The agent can use this tool to:
 * 1. Check if a workload is suitable for Akash
 * 2. Create a deployment on Akash Network
 * 3. Poll for provider bids
 * 4. Automatically accept the best bid (if enabled)
 * 
 * Adding a new provider? Create a similar tool in this directory
 * and add it to the agent's tools array.
 */
export class RouteToAkashTool extends BaseTool {
  constructor() {
    super({
      name: 'route_to_akash',
      description: `Route a compute job to Akash Network providers.

Akash is a decentralized compute marketplace with auction-based pricing.
Best for: GPU workloads, containerized applications, web services.

Parameters:
- jobId: Unique identifier for this job
- requirements: Hardware/software requirements (image, cpu, memory, gpu, etc.)
- autoAcceptBid: If true, automatically accepts the best bid
- bidTimeoutSeconds: How long to wait for bids (default: 300s)

Returns: Deployment details, provider info, bids received, and routing logs.`,
      isLongRunning: true // Deployment creation can take several minutes
    });
  }

  /**
   * Execute the tool - called by the ADK agent
   */
  async runAsync(request: RunAsyncToolRequest): Promise<unknown> {
    const { args } = request;

    // Validate required parameters
    if (!args.jobId || typeof args.jobId !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'Missing required parameter: jobId (string)',
        logs: [],
        suitability: { suitable: false, score: 0, reasons: ['Invalid parameters'] }
      } as RouteToAkashResult);
    }

    if (!args.requirements || typeof args.requirements !== 'object') {
      return JSON.stringify({
        success: false,
        error: 'Missing required parameter: requirements (object)',
        logs: [],
        suitability: { suitable: false, score: 0, reasons: ['Invalid parameters'] }
      } as RouteToAkashResult);
    }

    const params: RouteToAkashParams = {
      jobId: args.jobId as string,
      requirements: args.requirements as JobRequirements,
      autoAcceptBid: args.autoAcceptBid as boolean | undefined,
      bidTimeoutSeconds: args.bidTimeoutSeconds as number | undefined
    };

    const result = await executeRouteToAkash(params);
    return JSON.stringify(result);
  }
}

/**
 * Singleton instance of the RouteToAkashTool
 * Use this when adding tools to the ADK agent
 */
export const routeToAkashTool = new RouteToAkashTool();
