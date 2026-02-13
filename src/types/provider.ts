/**
 * Provider Type Definitions
 * 
 * Core type definitions for compute providers, GPU types, and provider capabilities.
 * These types define the domain model for provider discovery and evaluation.
 */

/**
 * Supported GPU types with A100 80GB as the performance baseline (1.0)
 * Performance ratios are approximate and based on AI/ML training workloads
 */
export enum GpuType {
  A100_80GB = 'A100_80GB',
  A100_40GB = 'A100_40GB',
  H100 = 'H100',
  H200 = 'H200',
  RTX4090 = 'RTX4090',
  RTX3090 = 'RTX3090',
  A10G = 'A10G',
  V100 = 'V100',
  T4 = 'T4',
}

/**
 * Pricing models supported by compute providers
 * - FIXED: Standard hourly rate in USD
 * - SPOT: Discounted rate with potential interruption
 * - TOKEN: Native token pricing (e.g., AKT, FIL)
 */
export enum PricingModel {
  FIXED = 'FIXED',
  SPOT = 'SPOT',
  TOKEN = 'TOKEN',
}

/**
 * Geographic region codes for provider deployment
 * Used for latency optimization and compliance requirements
 */
export type RegionCode = 
  | 'us-east'
  | 'us-west'
  | 'us-central'
  | 'eu-west'
  | 'eu-central'
  | 'eu-north'
  | 'ap-south'
  | 'ap-northeast'
  | 'ap-southeast'
  | 'sa-east';

/**
 * Provider capabilities define what a provider can offer
 * Used for initial filtering of providers based on job requirements
 */
export interface ProviderCapabilities {
  /** GPU types available from this provider */
  gpuTypes: GpuType[];
  
  /** Geographic regions where provider operates */
  regions: RegionCode[];
  
  /** Maximum job duration supported in hours */
  maxDurationHours: number;
  
  /** Whether provider supports spot/preemptible instances */
  supportsSpot: boolean;
  
  /** Minimum GPUs per instance */
  minGpuCount?: number;
  
  /** Maximum GPUs per instance */
  maxGpuCount?: number;
}

/**
 * Provider type identifier
 * Used for provider-specific logic and API integrations
 */
export type ProviderType = 
  | 'akash'
  | 'lambda'
  | 'filecoin'
  | 'ionet'
  | 'synapse';

/**
 * Provider metadata for display and reputation tracking
 */
export interface ProviderMetadata {
  /** Human-readable description of the provider */
  description: string;
  
  /** Official website URL */
  website: string;
  
  /** Reputation score (0-100) based on historical performance */
  reputationScore: number;
  
  /** Historical uptime percentage */
  uptimePercentage: number;
  
  /** Number of completed jobs (if available) */
  completedJobs?: number;
  
  /** Average response time in milliseconds */
  avgLatencyMs?: number;
}

/**
 * Compute provider definition
 * Represents a compute marketplace participant that offers GPU instances
 */
export interface ComputeProvider {
  /** Unique identifier (e.g., 'akash-us-east-1') */
  id: string;
  
  /** Display name for UI */
  name: string;
  
  /** Provider type for API integration */
  type: ProviderType;
  
  /** Pricing model used by this provider */
  pricingModel: PricingModel;
  
  /** Capabilities and constraints */
  capabilities: ProviderCapabilities;
  
  /** Additional metadata */
  metadata: ProviderMetadata;
  
  /** Whether provider is currently accepting jobs */
  isActive: boolean;
  
  /** When provider was first listed */
  listedAt: Date;
}

/**
 * Specific instance offering from a provider
 * Represents an available GPU configuration at a specific price point
 */
export interface ProviderInstance {
  /** Reference to parent provider */
  providerId: string;
  
  /** GPU type for this instance */
  gpuType: GpuType;
  
  /** Geographic region */
  region: RegionCode;
  
  /** Raw price per hour in native currency */
  pricePerHour: number;
  
  /** Currency symbol for TOKEN pricing (e.g., 'AKT', 'FIL') */
  tokenSymbol?: string;
  
  /** Spot discount percentage (0-100) for SPOT model */
  spotDiscount?: number;
  
  /** Whether this is currently available */
  isAvailable: boolean;
}

/**
 * Provider filter criteria for initial matching
 * Used to narrow down providers before detailed evaluation
 */
export interface ProviderFilter {
  gpuType?: GpuType;
  region?: RegionCode;
  maxPricePerHour?: number;
  requiresSpot?: boolean;
  minReputationScore?: number;
}
