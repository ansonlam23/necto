/**
 * Application Constants and Configuration
 * 
 * Central configuration for GPU performance ratios, provider settings,
 * default weights, and integration endpoints.
 */

import { GpuType, ProviderType, PricingModel } from '@/types/provider';
import { RankingWeights, HiddenCosts, ComputeProvider } from '@/types';

/**
 * GPU Performance Ratios
 * 
 * Normalized to A100 80GB as baseline (1.0)
 * Based on approximate AI/ML training performance (TFLOPS, memory bandwidth)
 * 
 * Sources:
 * - NVIDIA datasheets for H100, H200, A100 specs
 * - Approximate ratios for consumer cards based on benchmarks
 * - Conservative estimates for non-datacenter GPUs
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
 * Supported Compute Providers
 * 
 * Mix of real DePIN providers and mock Synapse-listed providers for demo
 */
export const SUPPORTED_PROVIDERS: { id: string; name: string; type: ProviderType }[] = [
  { id: 'akash', name: 'Akash Network', type: 'akash' },
  { id: 'lambda', name: 'Lambda Labs', type: 'lambda' },
  { id: 'filecoin', name: 'Filecoin (FVM)', type: 'filecoin' },
  { id: 'ionet', name: 'io.net', type: 'ionet' },
  // Mock Synapse-listed providers for demonstration
  { id: 'synapse-1', name: 'Synapse Compute Alpha', type: 'synapse' },
  { id: 'synapse-2', name: 'Synapse Compute Beta', type: 'synapse' },
  { id: 'synapse-3', name: 'Synapse Cloud Gamma', type: 'synapse' },
];

/**
 * Default Ranking Weights
 * 
 * Per user discretion: price prioritized at 60%
 * All weights must sum to 1.0
 */
export const DEFAULT_WEIGHTS: RankingWeights = {
  price: 0.6,        // Price is most important factor
  latency: 0.15,     // Network latency matters for interactive workloads
  reputation: 0.15,  // Provider track record
  geography: 0.1,    // Regional preference (latency, compliance)
};

/**
 * Default Hidden Costs
 * 
 * Estimated infrastructure costs often overlooked in raw pricing
 * Per user decision: conservative estimates for operational overhead
 */
export const HIDDEN_COSTS: HiddenCosts = {
  bandwidthUsdPerHour: 0.05,   // Egress/ingress costs
  storageUsdPerHour: 0.02,     // Volume storage, snapshots
  apiCallsUsdPerHour: 0.01,    // Control plane API costs
  total: 0.08,                  // Sum of above
};

/**
 * Geographic Regions
 * 
 * Standard region codes for provider deployment
 */
export const REGIONS = [
  'us-east',
  'us-west',
  'us-central',
  'eu-west',
  'eu-central',
  'eu-north',
  'ap-south',
  'ap-northeast',
  'ap-southeast',
  'sa-east',
] as const;

export type Region = (typeof REGIONS)[number];

/**
 * CoinGecko Configuration
 * 
 * Token price API settings for normalizing TOKEN pricing models
 */
export const COINGECKO_CONFIG = {
  /** API endpoint for price data */
  apiEndpoint: 'https://api.coingecko.com/api/v3',
  /** Cache duration in minutes */
  cacheMinutes: 10,
  /** Supported DePIN tokens for pricing */
  supportedTokens: [
    'filecoin',      // FIL
    'akash-network', // AKT
    'render-token',  // RENDER
    'io',            // IO (io.net)
  ],
  /** Token symbol mapping */
  symbolMap: {
    'filecoin': 'FIL',
    'akash-network': 'AKT',
    'render-token': 'RENDER',
    'io': 'IO',
  } as Record<string, string>,
};

/**
 * 0G Storage Configuration
 * 
 * 0G Testnet settings for reasoning trace uploads
 */
export const ZERO_G_CONFIG = {
  /** 0G Testnet Chain ID */
  chainId: 16602,
  /** RPC endpoint for transactions */
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  /** 0G Storage indexer endpoint */
  indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai',
  /** Maximum upload retries */
  maxRetries: 3,
  /** Upload timeout in milliseconds */
  uploadTimeoutMs: 30000,
  /** Gas limit for upload transactions */
  gasLimit: 100000,
};

/**
 * ADI Chain Configuration
 * 
 * ADI Testnet settings for escrow and settlement
 */
export const ADI_CONFIG = {
  /** ADI Testnet Chain ID */
  chainId: 100002,
  /** RPC endpoint */
  rpcUrl: 'https://rpc-devnet-1.adichain.app',
  /** Contract addresses (to be updated after deployment) */
  contracts: {
    computeRouter: '', // Will be set after deployment
    usdc: '',          // USDC token contract
  },
  /** Block confirmation requirements */
  confirmations: 1,
  /** Gas settings */
  gasLimit: 500000,
};

/**
 * Mock Provider Data
 * 
 * Realistic pricing data for 8 providers across different pricing models
 * Used for development, testing, and demo scenarios
 */
export const PROVIDER_MOCK_DATA: ComputeProvider[] = [
  {
    id: 'akash-us-east-1',
    name: 'Akash Network (US East)',
    type: 'akash',
    pricingModel: PricingModel.TOKEN,
    capabilities: {
      gpuTypes: [GpuType.A100_80GB, GpuType.A100_40GB, GpuType.V100],
      regions: ['us-east' as const, 'us-west' as const, 'eu-west' as const],
      maxDurationHours: 168,
      supportsSpot: true,
      minGpuCount: 1,
      maxGpuCount: 8,
    },
    metadata: {
      description: 'Decentralized compute marketplace on Cosmos',
      website: 'https://akash.network',
      reputationScore: 85,
      uptimePercentage: 98.5,
      completedJobs: 15000,
      avgLatencyMs: 45,
    },
    isActive: true,
    listedAt: new Date('2024-01-15'),
  },
  {
    id: 'lambda-us-west-1',
    name: 'Lambda Labs (US West)',
    type: 'lambda',
    pricingModel: PricingModel.FIXED,
    capabilities: {
      gpuTypes: [GpuType.H100, GpuType.A100_80GB, GpuType.A10G],
      regions: ['us-west' as const, 'us-central' as const],
      maxDurationHours: 720,
      supportsSpot: false,
      minGpuCount: 1,
      maxGpuCount: 16,
    },
    metadata: {
      description: 'GPU cloud for deep learning',
      website: 'https://lambdalabs.com',
      reputationScore: 92,
      uptimePercentage: 99.5,
      completedJobs: 25000,
      avgLatencyMs: 25,
    },
    isActive: true,
    listedAt: new Date('2024-01-20'),
  },
  {
    id: 'filecoin-ap-south-1',
    name: 'Filecoin Compute (AP South)',
    type: 'filecoin',
    pricingModel: PricingModel.TOKEN,
    capabilities: {
      gpuTypes: [GpuType.A100_40GB, GpuType.V100, GpuType.T4],
      regions: ['ap-south' as const, 'ap-southeast' as const],
      maxDurationHours: 336,
      supportsSpot: true,
      minGpuCount: 1,
      maxGpuCount: 4,
    },
    metadata: {
      description: 'DePIN storage and compute on Filecoin',
      website: 'https://filecoin.io',
      reputationScore: 78,
      uptimePercentage: 96.0,
      completedJobs: 8000,
      avgLatencyMs: 120,
    },
    isActive: true,
    listedAt: new Date('2024-02-01'),
  },
  {
    id: 'ionet-eu-west-1',
    name: 'io.net (EU West)',
    type: 'ionet',
    pricingModel: PricingModel.TOKEN,
    capabilities: {
      gpuTypes: [GpuType.RTX4090, GpuType.RTX3090, GpuType.A100_80GB],
      regions: ['eu-west' as const, 'eu-central' as const],
      maxDurationHours: 168,
      supportsSpot: true,
      minGpuCount: 1,
      maxGpuCount: 12,
    },
    metadata: {
      description: 'Decentralized GPU network on Solana',
      website: 'https://io.net',
      reputationScore: 80,
      uptimePercentage: 97.0,
      completedJobs: 12000,
      avgLatencyMs: 60,
    },
    isActive: true,
    listedAt: new Date('2024-02-10'),
  },
  {
    id: 'synapse-us-east-1',
    name: 'Synapse Cloud Alpha',
    type: 'synapse',
    pricingModel: PricingModel.SPOT,
    capabilities: {
      gpuTypes: [GpuType.A100_80GB, GpuType.H100],
      regions: ['us-east' as const, 'us-west' as const],
      maxDurationHours: 48,
      supportsSpot: true,
      minGpuCount: 1,
      maxGpuCount: 32,
    },
    metadata: {
      description: 'High-performance spot compute on Synapse',
      website: 'https://synapse.example',
      reputationScore: 88,
      uptimePercentage: 99.0,
      completedJobs: 5000,
      avgLatencyMs: 35,
    },
    isActive: true,
    listedAt: new Date('2024-02-15'),
  },
  {
    id: 'synapse-eu-central-1',
    name: 'Synapse Cloud Beta',
    type: 'synapse',
    pricingModel: PricingModel.FIXED,
    capabilities: {
      gpuTypes: [GpuType.RTX4090, GpuType.A10G],
      regions: ['eu-central' as const, 'eu-west' as const],
      maxDurationHours: 720,
      supportsSpot: false,
      minGpuCount: 1,
      maxGpuCount: 8,
    },
    metadata: {
      description: 'Reliable fixed-price compute on Synapse',
      website: 'https://synapse.example',
      reputationScore: 90,
      uptimePercentage: 99.2,
      completedJobs: 8000,
      avgLatencyMs: 40,
    },
    isActive: true,
    listedAt: new Date('2024-02-20'),
  },
  {
    id: 'synapse-ap-northeast-1',
    name: 'Synapse Cloud Gamma',
    type: 'synapse',
    pricingModel: PricingModel.TOKEN,
    capabilities: {
      gpuTypes: [GpuType.V100, GpuType.T4],
      regions: ['ap-northeast' as const, 'ap-southeast' as const],
      maxDurationHours: 168,
      supportsSpot: true,
      minGpuCount: 1,
      maxGpuCount: 4,
    },
    metadata: {
      description: 'Cost-effective inference on Synapse',
      website: 'https://synapse.example',
      reputationScore: 82,
      uptimePercentage: 97.5,
      completedJobs: 6000,
      avgLatencyMs: 80,
    },
    isActive: true,
    listedAt: new Date('2024-02-25'),
  },
  {
    id: 'synapse-us-central-1',
    name: 'Synapse Cloud Delta',
    type: 'synapse',
    pricingModel: PricingModel.SPOT,
    capabilities: {
      gpuTypes: [GpuType.H200, GpuType.H100],
      regions: ['us-central' as const, 'us-east' as const],
      maxDurationHours: 24,
      supportsSpot: true,
      minGpuCount: 4,
      maxGpuCount: 64,
    },
    metadata: {
      description: 'High-end spot training on Synapse',
      website: 'https://synapse.example',
      reputationScore: 85,
      uptimePercentage: 95.0,
      completedJobs: 3000,
      avgLatencyMs: 30,
    },
    isActive: true,
    listedAt: new Date('2024-03-01'),
  },
];

/**
 * Job Constraints Defaults
 * 
 * Sensible defaults for job creation
 */
export const DEFAULT_JOB_CONSTRAINTS = {
  minGpuCount: 1,
  maxGpuCount: 8,
  minDurationHours: 1,
  maxDurationHours: 168,
  defaultDurationHours: 4,
  defaultGpuCount: 1,
};

/**
 * Agent Configuration
 * 
 * Settings for the routing agent
 */
export const AGENT_CONFIG = {
  /** Maximum providers to consider in ranking */
  maxProvidersToRank: 50,
  /** Number of top candidates to include in reasoning trace */
  topCandidatesCount: 5,
  /** Number of final rankings to include in reasoning trace */
  finalRankingCount: 3,
  /** Minimum score threshold (0-100) */
  minScoreThreshold: 50,
  /** Timeout for provider queries in milliseconds */
  providerQueryTimeoutMs: 5000,
};
