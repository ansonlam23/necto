/**
 * @title Route to Akash Tool
 * @notice Google ADK FunctionTool for routing compute jobs to Akash Network
 * @dev Uses zod schema so Gemini sees proper function declarations
 */

import { LongRunningFunctionTool } from '@google/adk';
import { z } from 'zod';
import { routeToAkash, isAkashSuitable, type RouteRequest, type RouteLog } from '../akash-router';
import { JobRequirements } from '@/lib/akash/sdl-generator';
import type { AkashDeployment, ProviderBid } from '@/types/akash';
import type { Provider } from '../provider-selection';

export interface RouteToAkashParams {
  jobId: string;
  requirements: JobRequirements;
  autoAcceptBid?: boolean;
  bidTimeoutSeconds?: number;
}

export interface RouteToAkashResult {
  success: boolean;
  deployment?: AkashDeployment;
  provider?: Provider;
  bids?: ProviderBid[];
  logs: RouteLog[];
  error?: string;
  suitability: {
    suitable: boolean;
    score: number;
    reasons: string[];
  };
}

/**
 * Execute routing to Akash (used by both the tool and fallback)
 */
export async function executeRouteToAkash(
  params: RouteToAkashParams,
  onProgress?: (log: RouteLog) => void
): Promise<RouteToAkashResult> {
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

// Zod schema for the tool parameters
const routeToAkashSchema = z.object({
  jobId: z.string().describe('Unique identifier for this compute job'),
  image: z.string().optional().describe('Docker image to deploy, e.g. "pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime" or "nginx:alpine"'),
  cpu: z.number().optional().describe('CPU units to request (in vCPUs), e.g. 4'),
  memory: z.string().optional().describe('Memory to request, e.g. "8Gi", "16Gi"'),
  storage: z.string().optional().describe('Storage to request, e.g. "100Gi"'),
  gpuUnits: z.number().optional().describe('Number of GPUs to request, e.g. 1'),
  gpuVendor: z.string().optional().describe('GPU vendor, e.g. "nvidia"'),
  gpuModel: z.string().optional().describe('Specific GPU model, e.g. "a100", "h100"'),
  autoAcceptBid: z.boolean().optional().describe('If true, automatically accept the best bid. Defaults to true.'),
  bidTimeoutSeconds: z.number().optional().describe('How long to wait for bids in seconds. Defaults to 300.'),
});

/**
 * ADK FunctionTool for routing to Akash
 * Uses LongRunningFunctionTool since deployment can take minutes
 */
export const routeToAkashTool = new LongRunningFunctionTool({
  name: 'route_to_akash',
  description: 'Route a compute job to Akash Network. Creates a deployment, waits for provider bids, and optionally auto-accepts the best bid. Returns deployment details and provider info.',
  parameters: routeToAkashSchema,
  execute: async ({ jobId, image, cpu, memory, storage, gpuUnits, gpuVendor, gpuModel, autoAcceptBid, bidTimeoutSeconds }) => {
    console.log('[TOOL] route_to_akash called with:', { jobId, image, cpu, memory, gpuUnits, gpuModel, autoAcceptBid });

    const requirements: JobRequirements = {
      name: jobId,
      image: image || 'ubuntu:22.04',
      cpu: cpu || 4,
      memory: memory || '8Gi',
      storage: storage || '100Gi',
    };

    if (gpuUnits && gpuUnits > 0) {
      requirements.gpu = {
        units: gpuUnits,
        vendor: gpuVendor || 'nvidia',
        ...(gpuModel ? { models: [gpuModel] } : {})
      };
    }

    const result = await executeRouteToAkash({
      jobId,
      requirements,
      autoAcceptBid: autoAcceptBid ?? true,
      bidTimeoutSeconds: bidTimeoutSeconds ?? 300
    });

    return result;
  }
});

// Legacy class name kept as alias for backwards compatibility
export const RouteToAkashTool = routeToAkashTool;
