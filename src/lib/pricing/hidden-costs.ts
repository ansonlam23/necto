/**
 * Hidden Costs Calculator
 * 
 * Calculates often-overlooked infrastructure costs for compute workloads.
 * Implements AGENT-02 requirements for effective rate calculation.
 * 
 * Per user decision: Include typical usage assumptions in effective rate.
 * These costs are often hidden in raw pricing but significant in practice.
 */

import { RegionCode } from '@/types/provider';
import { HiddenCosts } from '@/types/pricing';
import { JobRequest } from '@/types/job';

/**
 * Hidden cost factors by region
 * Based on AWS-ish baseline pricing with regional variations
 */
export interface HiddenCostFactors {
  /** Bandwidth cost per GB ($/GB) */
  bandwidthRate: number;
  /** Storage cost per GB per month ($/GB/month) */
  storageRate: number;
  /** API call cost per 1000 calls ($/1000 calls) */
  apiCallRate: number;
}

/**
 * Default hidden cost factors by region
 * 
 * These are conservative estimates based on typical cloud provider pricing.
 * Actual costs vary by provider and usage patterns.
 * 
 * Sources:
 * - AWS data transfer pricing (us-east-1, us-west-2, eu-west-1)
 * - AWS EBS storage pricing (gp3 volumes)
 * - AWS API Gateway pricing (REST APIs)
 */
export const HIDDEN_COST_DEFAULTS: Record<RegionCode, HiddenCostFactors> = {
  'us-east': {
    bandwidthRate: 0.09,      // $0.09/GB egress
    storageRate: 0.023,       // $0.023/GB/month (gp3)
    apiCallRate: 0.003,       // $0.003/1000 calls
  },
  'us-west': {
    bandwidthRate: 0.09,
    storageRate: 0.023,
    apiCallRate: 0.003,
  },
  'us-central': {
    bandwidthRate: 0.09,
    storageRate: 0.023,
    apiCallRate: 0.003,
  },
  'eu-west': {
    bandwidthRate: 0.09,
    storageRate: 0.024,       // Slightly higher in EU
    apiCallRate: 0.003,
  },
  'eu-central': {
    bandwidthRate: 0.09,
    storageRate: 0.024,
    apiCallRate: 0.003,
  },
  'eu-north': {
    bandwidthRate: 0.09,
    storageRate: 0.022,       // Slightly cheaper in Nordics
    apiCallRate: 0.003,
  },
  'ap-south': {
    bandwidthRate: 0.109,     // Higher in APAC
    storageRate: 0.025,
    apiCallRate: 0.003,
  },
  'ap-northeast': {
    bandwidthRate: 0.114,     // Japan is expensive
    storageRate: 0.026,
    apiCallRate: 0.003,
  },
  'ap-southeast': {
    bandwidthRate: 0.109,
    storageRate: 0.025,
    apiCallRate: 0.003,
  },
  'sa-east': {
    bandwidthRate: 0.138,     // South America is most expensive
    storageRate: 0.027,
    apiCallRate: 0.003,
  },
};

/**
 * Usage assumptions for ML workloads
 * 
 * Per user decision: Conservative defaults based on typical usage patterns.
 * These can be overridden based on specific job requirements.
 */
export interface UsageAssumptions {
  /** Expected bandwidth usage in GB per hour */
  bandwidthGBPerHour: number;
  /** Expected storage usage in GB */
  storageGB: number;
  /** Expected API calls per hour */
  apiCallsPerHour: number;
}

/**
 * Default usage assumptions for ML training workloads
 * 
 * Assumptions based on:
 * - 1-2 GB/hour bandwidth for model checkpoints and data loading
 * - 50-100 GB storage for datasets and model files
 * - 10 API calls/hour for health checks and metrics
 */
export const DEFAULT_ML_ASSUMPTIONS: UsageAssumptions = {
  bandwidthGBPerHour: 1.5,    // 1.5 GB/hour (checkpoints + data)
  storageGB: 75,              // 75 GB (dataset + model)
  apiCallsPerHour: 10,        // 10 calls/hour
};

/**
 * Default usage assumptions for inference workloads
 * Lower storage, higher bandwidth for request/response
 */
export const DEFAULT_INFERENCE_ASSUMPTIONS: UsageAssumptions = {
  bandwidthGBPerHour: 2.0,    // Higher bandwidth for API traffic
  storageGB: 25,              // Just model files
  apiCallsPerHour: 100,       // More API calls for inference serving
};

/**
 * Calculate hidden costs for a compute job
 * 
 * All costs are amortized to per-hour rate for comparison.
 * 
 * @param params - Calculation parameters
 * @returns HiddenCosts breakdown
 */
export interface HiddenCostParams {
  /** Geographic region */
  region: RegionCode;
  /** Job duration in hours */
  durationHours: number;
  /** Expected bandwidth in GB */
  expectedBandwidthGB?: number;
  /** Expected storage in GB */
  expectedStorageGB?: number;
  /** Expected API calls per hour */
  expectedApiCallsPerHour?: number;
  /** Override default cost factors */
  costFactors?: HiddenCostFactors;
  /** Workload type for default assumptions */
  workloadType?: 'training' | 'inference';
}

/**
 * Calculate hidden costs for a compute job
 * 
 * Formula:
 * - bandwidthCost = bandwidthGB * bandwidthRate
 * - storageCost = storageGB * storageRate * (durationHours/720)
 * - apiCost = (durationHours * apiCallsPerHour) * apiCallRate / 1000
 * - totalHourly = (bandwidthCost + storageCost + apiCost) / durationHours
 * 
 * @param params - Hidden cost calculation parameters
 * @returns HiddenCosts breakdown with per-hour rates
 */
export function calculateHiddenCosts(params: HiddenCostParams): HiddenCosts {
  const {
    region,
    durationHours,
    expectedBandwidthGB,
    expectedStorageGB,
    expectedApiCallsPerHour,
    costFactors,
    workloadType = 'training',
  } = params;

  // Get cost factors for region (fallback to us-east)
  const factors = costFactors || HIDDEN_COST_DEFAULTS[region] || HIDDEN_COST_DEFAULTS['us-east'];
  
  // Get default assumptions based on workload type
  const defaults = workloadType === 'inference' 
    ? DEFAULT_INFERENCE_ASSUMPTIONS 
    : DEFAULT_ML_ASSUMPTIONS;

  // Use provided values or defaults
  const bandwidthGB = expectedBandwidthGB ?? defaults.bandwidthGBPerHour * durationHours;
  const storageGB = expectedStorageGB ?? defaults.storageGB;
  const apiCallsPerHour = expectedApiCallsPerHour ?? defaults.apiCallsPerHour;

  // Calculate costs
  // Bandwidth: one-time cost for the job (egress)
  const bandwidthCost = bandwidthGB * factors.bandwidthRate;
  
  // Storage: prorated for job duration (assuming storage is allocated for full duration)
  // 720 hours = 30 days (typical month)
  const storageCost = storageGB * factors.storageRate * (durationHours / 720);
  
  // API calls: total calls during job duration
  const totalApiCalls = durationHours * apiCallsPerHour;
  const apiCost = (totalApiCalls / 1000) * factors.apiCallRate;

  // Total hidden costs
  const total = bandwidthCost + storageCost + apiCost;

  // Amortize to per-hour rate for fair comparison
  const hourlyRate = durationHours > 0 ? total / durationHours : 0;

  return {
    bandwidthUsdPerHour: bandwidthCost / durationHours,
    storageUsdPerHour: storageCost / durationHours,
    apiCallsUsdPerHour: apiCost / durationHours,
    total: hourlyRate,
  };
}

/**
 * Estimate usage based on job request
 * 
 * Provides reasonable defaults based on GPU count and duration.
 * More GPUs = more bandwidth for distributed training.
 * Longer duration = more checkpoints = more bandwidth.
 * 
 * @param jobRequest - The job request
 * @returns Estimated usage parameters
 */
export function estimateUsage(jobRequest: JobRequest): {
  expectedBandwidthGB: number;
  expectedStorageGB: number;
  expectedApiCallsPerHour: number;
} {
  const { gpuCount = 1, durationHours = 4 } = jobRequest;

  // Bandwidth scales with GPU count (distributed training sync)
  // and duration (checkpoint frequency)
  const baseBandwidth = 1.0; // 1 GB baseline
  const bandwidthPerGpu = 0.5; // 0.5 GB per additional GPU
  const bandwidthPerHour = 0.1; // Slight increase for checkpoint frequency
  
  const expectedBandwidthGB = (baseBandwidth + (gpuCount - 1) * bandwidthPerGpu + 
    durationHours * bandwidthPerHour) * durationHours;

  // Storage scales with GPU count (larger models need more GPUs)
  const baseStorage = 50; // 50 GB baseline
  const storagePerGpu = 25; // 25 GB per GPU (model parallelism overhead)
  
  const expectedStorageGB = baseStorage + (gpuCount - 1) * storagePerGpu;

  // API calls: base rate + small increase per GPU for monitoring
  const baseApiCalls = 10;
  const apiCallsPerGpu = 2;
  
  const expectedApiCallsPerHour = baseApiCalls + (gpuCount - 1) * apiCallsPerGpu;

  return {
    expectedBandwidthGB,
    expectedStorageGB,
    expectedApiCallsPerHour,
  };
}

/**
 * Calculate total effective price including hidden costs
 * 
 * @param basePricePerHour - Raw compute price per hour
 * @param hiddenCosts - Hidden costs per hour
 * @returns Total effective price per hour
 */
export function calculateEffectivePrice(
  basePricePerHour: number,
  hiddenCosts: HiddenCosts
): number {
  return basePricePerHour + hiddenCosts.total;
}

/**
 * Format hidden costs for display
 */
export function formatHiddenCosts(costs: HiddenCosts): string {
  return [
    `Bandwidth: $${costs.bandwidthUsdPerHour.toFixed(4)}/hr`,
    `Storage: $${costs.storageUsdPerHour.toFixed(4)}/hr`,
    `API Calls: $${costs.apiCallsUsdPerHour.toFixed(4)}/hr`,
    `Total Hidden: $${costs.total.toFixed(4)}/hr`,
  ].join(', ');
}
