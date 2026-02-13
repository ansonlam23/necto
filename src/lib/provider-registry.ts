/**
 * Provider Registry and Discovery
 * 
 * Central registry for managing provider adapters.
 * Supports provider discovery, filtering, and lookup operations.
 * 
 * Key Features:
 * - Register/unregister providers dynamically
 * - Filter providers by GPU type, region, pricing model
 * - Pre-populated with all 8 providers for hackathon demo
 * - Singleton pattern for global access
 * 
 * Providers (8 total):
 * - Akash Network (decentralized, SPOT + TOKEN)
 * - Lambda Labs (premium, FIXED only)
 * - Filecoin FVM (storage + compute, TOKEN)
 * - io.net (consumer GPUs, SPOT)
 * - Vertex Compute (budget, Synapse-listed mock)
 * - Nebula Cloud (premium H100, Synapse-listed mock)
 * - Quantum Labs (balanced A100, Synapse-listed mock)
 * - Stellar Nodes (EU-focused, Synapse-listed mock)
 */

import { ProviderAdapter } from '@/providers/base';
import { createAkashProvider } from '@/providers/akash';
import { createLambdaProvider } from '@/providers/lambda';
import { createFilecoinProvider } from '@/providers/filecoin';
import { createIonetProvider } from '@/providers/ionet';
import {
  createVertexProvider,
  createNebulaProvider,
  createQuantumProvider,
  createStellarProvider
} from '@/providers/mock';
import { GpuType, PricingModel, RegionCode } from '@/types/provider';

/**
 * Filter criteria for provider discovery
 */
export interface FilterCriteria {
  /** Filter by specific GPU type */
  gpuType?: GpuType;
  /** Filter by supported regions */
  regions?: RegionCode[];
  /** Filter by pricing models */
  pricingModels?: PricingModel[];
  /** Minimum reputation score (0-100) */
  minReputation?: number;
  /** Require spot pricing support */
  requireSpot?: boolean;
}

/**
 * Provider Registry
 * Manages provider lifecycle and discovery
 */
export class ProviderRegistry {
  /** Map of provider ID to adapter instance */
  private providers: Map<string, ProviderAdapter> = new Map();

  /**
   * Register a provider adapter
   * @param provider Provider adapter instance
   */
  register(provider: ProviderAdapter): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider ${provider.id} is already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
  }

  /**
   * Unregister a provider adapter
   * @param providerId Provider identifier
   */
  unregister(providerId: string): void {
    if (!this.providers.has(providerId)) {
      console.warn(`Provider ${providerId} is not registered.`);
      return;
    }
    this.providers.delete(providerId);
  }

  /**
   * Get a provider by ID
   * @param providerId Provider identifier
   * @returns Provider adapter or undefined if not found
   */
  get(providerId: string): ProviderAdapter | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all registered providers
   * @returns Array of all provider adapters
   */
  getAll(): ProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get count of registered providers
   */
  getCount(): number {
    return this.providers.size;
  }

  /**
   * Check if a provider is registered
   * @param providerId Provider identifier
   */
  has(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Filter providers based on criteria
   * @param criteria Filter criteria
   * @returns Filtered array of provider adapters
   */
  filter(criteria: FilterCriteria): ProviderAdapter[] {
    return this.getAll().filter(provider => {
      const info = provider.getProviderInfo();

      // Filter by GPU type
      if (criteria.gpuType && !info.capabilities.gpuTypes.includes(criteria.gpuType)) {
        return false;
      }

      // Filter by regions (must support at least one)
      if (criteria.regions && criteria.regions.length > 0) {
        const hasMatchingRegion = criteria.regions.some(region =>
          info.capabilities.regions.includes(region)
        );
        if (!hasMatchingRegion) {
          return false;
        }
      }

      // Filter by pricing models
      if (criteria.pricingModels && criteria.pricingModels.length > 0) {
        if (!criteria.pricingModels.includes(info.pricingModel)) {
          return false;
        }
      }

      // Filter by minimum reputation
      if (criteria.minReputation !== undefined) {
        if (info.metadata.reputationScore < criteria.minReputation) {
          return false;
        }
      }

      // Filter by spot support requirement
      if (criteria.requireSpot && !info.capabilities.supportsSpot) {
        return false;
      }

      return true;
    });
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
  }

  /**
   * Get provider statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    byPricingModel: Record<string, number>;
    avgReputation: number;
  } {
    const all = this.getAll();
    const byType: Record<string, number> = {};
    const byPricingModel: Record<string, number> = {};
    let totalReputation = 0;

    all.forEach(provider => {
      const info = provider.getProviderInfo();

      // Count by type
      byType[info.type] = (byType[info.type] || 0) + 1;

      // Count by pricing model
      byPricingModel[info.pricingModel] = (byPricingModel[info.pricingModel] || 0) + 1;

      // Sum reputation
      totalReputation += info.metadata.reputationScore;
    });

    return {
      total: all.length,
      byType,
      byPricingModel,
      avgReputation: all.length > 0 ? totalReputation / all.length : 0
    };
  }
}

/**
 * Get all providers instantiated
 * Creates instances of all 8 providers
 * @returns Array of initialized provider adapters
 */
export function getAllProviders(): ProviderAdapter[] {
  const providers: ProviderAdapter[] = [
    // Real providers (will have live APIs post-hackathon)
    createAkashProvider(),
    createLambdaProvider(),
    createFilecoinProvider(),
    createIonetProvider(),

    // Mock Synapse-listed providers
    createVertexProvider(),
    createNebulaProvider(),
    createQuantumProvider(),
    createStellarProvider()
  ];

  console.log(`[ProviderRegistry] Initialized ${providers.length} providers:`);
  providers.forEach(p => {
    const info = p.getProviderInfo();
    console.log(`  - ${info.name} (${info.type}, ${info.pricingModel})`);
  });

  return providers;
}

/**
 * Filter providers based on criteria
 * @param providers Array of providers to filter
 * @param criteria Filter criteria
 * @returns Filtered array
 */
export function filterProviders(
  providers: ProviderAdapter[],
  criteria: FilterCriteria
): ProviderAdapter[] {
  // Create temporary registry to use its filter method
  const registry = new ProviderRegistry();
  providers.forEach(p => registry.register(p));
  return registry.filter(criteria);
}

/**
 * Get providers by specific region
 * @param providers Array of providers
 * @param region Region code to filter by
 * @returns Providers supporting the region
 */
export function getProvidersByRegion(
  providers: ProviderAdapter[],
  region: RegionCode
): ProviderAdapter[] {
  return providers.filter(provider => {
    const info = provider.getProviderInfo();
    return info.capabilities.regions.includes(region);
  });
}

/**
 * Get providers by GPU type
 * @param providers Array of providers
 * @param gpuType GPU type to filter by
 * @returns Providers supporting the GPU type
 */
export function getProvidersByGpu(
  providers: ProviderAdapter[],
  gpuType: GpuType
): ProviderAdapter[] {
  return providers.filter(provider => {
    const info = provider.getProviderInfo();
    return info.capabilities.gpuTypes.includes(gpuType);
  });
}

/**
 * Get all unique regions across providers
 * @param providers Array of providers
 * @returns Array of unique region codes
 */
export function getProviderRegions(providers: ProviderAdapter[]): RegionCode[] {
  const regions = new Set<RegionCode>();
  providers.forEach(provider => {
    const info = provider.getProviderInfo();
    info.capabilities.regions.forEach(region => regions.add(region));
  });
  return Array.from(regions).sort();
}

/**
 * Get all unique GPU types across providers
 * @param providers Array of providers
 * @returns Array of unique GPU types
 */
export function getProviderGpus(providers: ProviderAdapter[]): GpuType[] {
  const gpus = new Set<GpuType>();
  providers.forEach(provider => {
    const info = provider.getProviderInfo();
    info.capabilities.gpuTypes.forEach(gpu => gpus.add(gpu));
  });
  return Array.from(gpus).sort();
}

/**
 * Initialize the provider registry with all providers
 * @returns Configured ProviderRegistry instance
 */
export function initializeRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  const providers = getAllProviders();

  providers.forEach(provider => {
    registry.register(provider);
  });

  console.log(`[ProviderRegistry] Registry initialized with ${registry.getCount()} providers`);

  return registry;
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global provider registry instance
 * Pre-populated with all 8 providers
 */
export const registry = initializeRegistry();

/**
 * Re-initialize the global registry (useful for testing)
 */
export function reinitializeRegistry(): ProviderRegistry {
  registry.clear();
  const providers = getAllProviders();
  providers.forEach(p => registry.register(p));
  return registry;
}

// Export types for consumers
export type { ProviderAdapter };
