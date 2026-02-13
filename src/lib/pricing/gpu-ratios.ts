/**
 * GPU Performance Ratios
 * 
 * Normalizes GPU performance to A100 80GB baseline (1.0)
 * Implements AGENT-02 requirements for fair price comparison
 * 
 * Per user decision: A100 80GB = 1.0 baseline for performance normalization
 * Per accumulated context: GPU_RATIOS also defined in constants.ts for reference
 * 
 * Sources for ratios:
 * - MLPerf inference/training benchmarks
 * - NVIDIA datasheets for TFLOPS and memory bandwidth
 * - Conservative estimates for non-datacenter GPUs
 */

import { GpuType } from '@/types/provider';

/**
 * GPU performance ratios relative to A100 80GB
 * 
 * A100 80GB = 1.0 (baseline)
 * Higher values = more powerful GPUs
 * Lower values = less powerful GPUs
 * 
 * Calculation basis:
 * - H100: ~2x A100 in many workloads, conservative 1.5x
 * - H200: H100 + 141GB HBM3e, 2.0x
 * - RTX 4090: Consumer flagship, good TFLOPS but limited memory, 0.6x
 * - A10G: AWS inference optimized, 0.4x
 * - V100: Previous generation datacenter, 0.3x
 * - T4: Entry-level inference, 0.15x
 */
export const GPU_RATIOS: Record<GpuType, number> = {
  [GpuType.A100_80GB]: 1.0,    // Baseline - 80GB HBM2e, 312 TFLOPS FP16
  [GpuType.A100_40GB]: 0.9,    // Same chip, less memory - slight performance hit
  [GpuType.H100]: 1.5,         // ~2x A100 in many workloads, conservative 1.5x
  [GpuType.H200]: 2.0,         // H100 + 141GB HBM3e memory, better bandwidth
  [GpuType.RTX4090]: 0.6,      // Consumer flagship, ~330 TFLOPS but less memory
  [GpuType.RTX3090]: 0.5,      // Previous gen consumer, 24GB VRAM
  [GpuType.A10G]: 0.4,         // AWS inference chip, 24GB, good for inference
  [GpuType.V100]: 0.3,         // Previous gen datacenter, 16/32GB HBM2
  [GpuType.T4]: 0.15,          // Entry inference, 16GB, low power
};

/**
 * Get the A100-equivalent ratio for a GPU type
 * 
 * @param gpuType - The GPU type to get ratio for
 * @returns Performance ratio relative to A100 80GB (1.0)
 * @throws Error if GPU type is unknown
 */
export function getA100Equivalent(gpuType: GpuType): number {
  const ratio = GPU_RATIOS[gpuType];
  
  if (typeof ratio !== 'number') {
    throw new Error(`Unknown GPU type: ${gpuType}. Cannot determine A100-equivalent ratio.`);
  }
  
  return ratio;
}

/**
 * Normalize a price to A100-equivalent
 * 
 * Converts price-per-hour of any GPU to the equivalent price
 * if it were an A100 80GB. Lower normalized prices = better value.
 * 
 * Example: H100 at $3.00/hr → $3.00/1.5 = $2.00/A100-hr
 * Example: T4 at $0.50/hr → $0.50/0.15 = $3.33/A100-hr
 * 
 * @param pricePerHour - Price per hour in USD (or native currency)
 * @param gpuType - The GPU type
 * @returns Normalized price per A100-equivalent hour
 */
export function normalizeToA100(pricePerHour: number, gpuType: GpuType): number {
  const ratio = getA100Equivalent(gpuType);
  return pricePerHour / ratio;
}

/**
 * Get a human-readable description of the GPU performance tier
 */
export function getGpuTier(gpuType: GpuType): 'high' | 'medium' | 'low' {
  const ratio = GPU_RATIOS[gpuType];
  
  if (ratio >= 1.0) return 'high';
  if (ratio >= 0.5) return 'medium';
  return 'low';
}

/**
 * Get GPU specifications for display
 */
export interface GpuSpecs {
  name: string;
  memoryGB: number;
  memoryType: string;
  tflopsFP16: number;
  tdpWatts: number;
  releaseYear: number;
}

/**
 * GPU specifications reference
 * Used for informational purposes and UI display
 */
export const GPU_SPECS: Record<GpuType, GpuSpecs> = {
  [GpuType.A100_80GB]: {
    name: 'NVIDIA A100 80GB',
    memoryGB: 80,
    memoryType: 'HBM2e',
    tflopsFP16: 312,
    tdpWatts: 400,
    releaseYear: 2020,
  },
  [GpuType.A100_40GB]: {
    name: 'NVIDIA A100 40GB',
    memoryGB: 40,
    memoryType: 'HBM2',
    tflopsFP16: 312,
    tdpWatts: 400,
    releaseYear: 2020,
  },
  [GpuType.H100]: {
    name: 'NVIDIA H100',
    memoryGB: 80,
    memoryType: 'HBM3',
    tflopsFP16: 989,
    tdpWatts: 700,
    releaseYear: 2022,
  },
  [GpuType.H200]: {
    name: 'NVIDIA H200',
    memoryGB: 141,
    memoryType: 'HBM3e',
    tflopsFP16: 989,
    tdpWatts: 700,
    releaseYear: 2024,
  },
  [GpuType.RTX4090]: {
    name: 'NVIDIA RTX 4090',
    memoryGB: 24,
    memoryType: 'GDDR6X',
    tflopsFP16: 330,
    tdpWatts: 450,
    releaseYear: 2022,
  },
  [GpuType.RTX3090]: {
    name: 'NVIDIA RTX 3090',
    memoryGB: 24,
    memoryType: 'GDDR6X',
    tflopsFP16: 142,
    tdpWatts: 350,
    releaseYear: 2020,
  },
  [GpuType.A10G]: {
    name: 'NVIDIA A10G',
    memoryGB: 24,
    memoryType: 'GDDR6',
    tflopsFP16: 125,
    tdpWatts: 150,
    releaseYear: 2021,
  },
  [GpuType.V100]: {
    name: 'NVIDIA V100',
    memoryGB: 32,
    memoryType: 'HBM2',
    tflopsFP16: 112,
    tdpWatts: 300,
    releaseYear: 2017,
  },
  [GpuType.T4]: {
    name: 'NVIDIA T4',
    memoryGB: 16,
    memoryType: 'GDDR6',
    tflopsFP16: 65,
    tdpWatts: 70,
    releaseYear: 2018,
  },
};

/**
 * Get GPU specifications
 */
export function getGpuSpecs(gpuType: GpuType): GpuSpecs {
  const specs = GPU_SPECS[gpuType];
  
  if (!specs) {
    throw new Error(`Unknown GPU type: ${gpuType}`);
  }
  
  return specs;
}

/**
 * Compare two GPUs by performance
 * Returns positive if gpuA is faster, negative if gpuB is faster
 */
export function compareGpus(gpuA: GpuType, gpuB: GpuType): number {
  return GPU_RATIOS[gpuA] - GPU_RATIOS[gpuB];
}

/**
 * Get all GPU types sorted by performance (descending)
 */
export function getGpusByPerformance(): GpuType[] {
  return Object.entries(GPU_RATIOS)
    .sort(([, ratioA], [, ratioB]) => ratioB - ratioA)
    .map(([gpuType]) => gpuType as GpuType);
}
