/**
 * Base Provider Adapter Interface
 * 
 * Abstracts all provider-specific APIs behind a common interface.
 * Enables the agent to query any provider using the same interface.
 * 
 * Design Pattern: Adapter Pattern
 * - New providers implement ProviderAdapter
 * - Common interface handles provider-specific quirks internally
 * - Graceful degradation when APIs change
 */

import { 
  ComputeProvider, 
  ProviderCapabilities, 
  GpuType, 
  ProviderType,
  RegionCode 
} from '@/types/provider';
import { PriceQuote } from '@/types/pricing';

/**
 * Request parameters for getting quotes from a provider
 */
export interface QuoteRequest {
  /** GPU type required */
  gpuType: GpuType;
  /** Number of GPUs needed */
  gpuCount: number;
  /** Duration in hours */
  durationHours: number;
  /** Preferred region (optional) */
  region?: RegionCode;
  /** Whether to use spot pricing if available */
  useSpot?: boolean;
}

/**
 * Result of a quote request from a provider
 */
export interface QuoteResult {
  /** Provider identifier */
  providerId: string;
  /** Array of price quotes */
  quotes: PriceQuote[];
  /** Response latency in milliseconds (simulated or real) */
  latencyMs: number;
  /** When quotes were fetched */
  fetchedAt: Date;
  /** Error message if request failed */
  error?: string;
}

/**
 * Standardized error codes for provider operations
 */
export type ProviderErrorCode = 
  | 'UNAVAILABLE' 
  | 'RATE_LIMIT' 
  | 'INVALID_REQUEST' 
  | 'UNKNOWN'
  | 'TIMEOUT'
  | 'AUTH_ERROR';

/**
 * Standardized error class for provider operations
 */
export class ProviderError extends Error {
  /** Error code classification */
  readonly code: ProviderErrorCode;
  /** Provider that raised the error */
  readonly providerId: string;
  /** Original error if wrapped */
  readonly originalError?: Error;

  constructor(
    code: ProviderErrorCode,
    message: string,
    providerId: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.providerId = providerId;
    this.originalError = originalError;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return ['RATE_LIMIT', 'TIMEOUT', 'UNAVAILABLE'].includes(this.code);
  }

  /**
   * Get user-friendly error message
   */
  toDisplayString(): string {
    const prefix = `[${this.providerId}] `;
    switch (this.code) {
      case 'UNAVAILABLE':
        return `${prefix}Provider is currently unavailable. Please try again later.`;
      case 'RATE_LIMIT':
        return `${prefix}Rate limit exceeded. Please wait before retrying.`;
      case 'INVALID_REQUEST':
        return `${prefix}Invalid request parameters. ${this.message}`;
      case 'TIMEOUT':
        return `${prefix}Request timed out. Please try again.`;
      case 'AUTH_ERROR':
        return `${prefix}Authentication failed. Check provider credentials.`;
      default:
        return `${prefix}Unexpected error: ${this.message}`;
    }
  }
}

/**
 * Abstract provider adapter interface
 * 
 * All compute provider adapters must implement this interface.
 * Provides a common contract for querying prices and provider info.
 */
export interface ProviderAdapter {
  /** Unique provider identifier */
  readonly id: string;
  
  /** Display name for the provider */
  readonly name: string;
  
  /** Provider type classification */
  readonly type: ProviderType;
  
  /** Provider capabilities */
  readonly capabilities: ProviderCapabilities;

  /**
   * Get quotes for a specific GPU configuration
   * @param request Quote request parameters
   * @returns Promise resolving to quote result
   * @throws ProviderError if request fails
   */
  getQuotes(request: QuoteRequest): Promise<QuoteResult>;

  /**
   * Get full provider information
   * @returns ComputeProvider with all metadata
   */
  getProviderInfo(): ComputeProvider;

  /**
   * Check if provider is currently available
   * @returns Promise resolving to availability status
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider health status with details
   * @returns Promise resolving to health info
   */
  getHealthStatus?(): Promise<{
    healthy: boolean;
    latencyMs: number;
    message?: string;
    lastChecked: Date;
  }>;
}

/**
 * Abstract base class for provider adapters
 * Provides common functionality and error handling
 */
export abstract class BaseProviderAdapter implements ProviderAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: ProviderType;
  abstract readonly capabilities: ProviderCapabilities;

  /**
   * Get quotes - must be implemented by subclass
   */
  abstract getQuotes(request: QuoteRequest): Promise<QuoteResult>;

  /**
   * Get provider info - must be implemented by subclass
   */
  abstract getProviderInfo(): ComputeProvider;

  /**
   * Check availability - default implementation returns true
   * Override for providers with health checks
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Default: assume available for demo
      // Real implementations should check actual API health
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Protected helper to handle errors consistently
   */
  protected handleError(
    code: ProviderErrorCode,
    message: string,
    originalError?: Error
  ): never {
    throw new ProviderError(code, message, this.id, originalError);
  }

  /**
   * Protected helper to simulate API latency
   */
  protected async simulateLatency(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Calculate simulated latency between regions
 * Used for latency estimation when real latency data unavailable
 * 
 * @param providerRegion Provider's region
 * @param targetRegion Target/customer region
 * @returns Estimated latency in milliseconds
 */
export function calculateLatency(
  providerRegion: RegionCode,
  targetRegion: RegionCode
): number {
  // Same region = low latency
  if (providerRegion === targetRegion) {
    return 20 + Math.random() * 30; // 20-50ms
  }

  // Define region groups for distance calculation
  const regionGroups: Record<string, RegionCode[]> = {
    'us': ['us-east', 'us-west', 'us-central'],
    'eu': ['eu-west', 'eu-central', 'eu-north'],
    'ap': ['ap-south', 'ap-northeast', 'ap-southeast'],
    'sa': ['sa-east']
  };

  // Find which groups the regions belong to
  const providerGroup = Object.entries(regionGroups).find(([_, regions]) => 
    regions.includes(providerRegion)
  )?.[0] || 'unknown';
  
  const targetGroup = Object.entries(regionGroups).find(([_, regions]) => 
    regions.includes(targetRegion)
  )?.[0] || 'unknown';

  // Same continent/group
  if (providerGroup === targetGroup) {
    return 40 + Math.random() * 60; // 40-100ms
  }

  // Cross-continent
  if (providerGroup === 'us' && targetGroup === 'eu' || 
      providerGroup === 'eu' && targetGroup === 'us') {
    return 80 + Math.random() * 70; // 80-150ms
  }

  if (providerGroup === 'us' && targetGroup === 'ap' || 
      providerGroup === 'ap' && targetGroup === 'us') {
    return 120 + Math.random() * 80; // 120-200ms
  }

  if (providerGroup === 'eu' && targetGroup === 'ap' || 
      providerGroup === 'ap' && targetGroup === 'eu') {
    return 150 + Math.random() * 100; // 150-250ms
  }

  // Default for unknown combinations
  return 100 + Math.random() * 100; // 100-200ms
}

/**
 * Check if a GPU type is available from a provider
 * 
 * @param capabilities Provider capabilities
 * @param gpuType GPU type to check
 * @returns True if GPU type is available
 */
export function isGpuAvailable(
  capabilities: ProviderCapabilities,
  gpuType: GpuType
): boolean {
  return capabilities.gpuTypes.includes(gpuType);
}

/**
 * Get supported pricing models for a provider
 * Derived from capabilities
 * 
 * @param capabilities Provider capabilities
 * @returns Array of supported pricing models
 */
export function getSupportedPricingModels(
  capabilities: ProviderCapabilities
): string[] {
  const models: string[] = ['FIXED'];
  if (capabilities.supportsSpot) models.push('SPOT');
  // Token pricing determined by provider type or instance configuration
  return models;
}
