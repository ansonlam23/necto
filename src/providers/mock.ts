/**
 * Mock Providers for Synapse-Listed Organizations
 * 
 * Implements mock provider adapters for demonstration purposes.
 * These represent hypothetical providers listed on the Synapse marketplace
 * to showcase provider diversity and marketplace dynamics.
 * 
 * Note: These are fictional providers with realistic pricing for demo only.
 * 
 * Mock Providers:
 * - Vertex Compute: Budget-focused, T4/V100
 * - Nebula Cloud: Premium H100s
 * - Quantum Labs: Balanced A100s
 * - Stellar Nodes: Europe-focused
 */

import {
  BaseProviderAdapter,
  QuoteRequest,
  QuoteResult,
  ProviderError,
  calculateLatency
} from './base';
import {
  ComputeProvider,
  ProviderCapabilities,
  GpuType,
  ProviderType,
  PricingModel
} from '@/types/provider';
import { PriceQuote } from '@/types/pricing';

/**
 * Configuration for mock provider
 */
export interface MockProviderConfig {
  id: string;
  name: string;
  description: string;
  website: string;
  reputationScore: number;
  uptimePercentage: number;
  capabilities: ProviderCapabilities;
  pricing: Record<
    string,
    {
      fixedPrice: number;
      spotPrice?: number;
    }
  >;
  pricingModel: PricingModel;
  listedAt: Date;
}

/**
 * Mock provider adapter for Synapse-listed organizations
 */
export class MockProvider extends BaseProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType = 'synapse';
  readonly capabilities: ProviderCapabilities;
  readonly pricingModel: PricingModel;

  private readonly config: MockProviderConfig;
  private readonly pricing: MockProviderConfig['pricing'];

  constructor(config: MockProviderConfig) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.capabilities = config.capabilities;
    this.pricing = config.pricing;
    this.pricingModel = config.pricingModel;
    this.config = config;
  }

  /**
   * Get quotes for mock provider
   */
  async getQuotes(request: QuoteRequest): Promise<QuoteResult> {
    const startTime = Date.now();

    try {
      // Validate GPU type is supported
      if (!this.capabilities.gpuTypes.includes(request.gpuType)) {
        throw new ProviderError(
          'INVALID_REQUEST',
          `GPU type ${request.gpuType} not supported by ${this.name}`,
          this.id
        );
      }

      // Simulate API latency
      const targetRegion = request.region || this.capabilities.regions[0];
      const baseLatency = calculateLatency(this.capabilities.regions[0], targetRegion);
      await this.simulateLatency(Math.floor(baseLatency));

      const pricing = this.pricing[request.gpuType];
      if (!pricing) {
        throw new ProviderError(
          'INVALID_REQUEST',
          `No pricing data available for ${request.gpuType}`,
          this.id
        );
      }

      const quotes: PriceQuote[] = [];

      // Add fixed price quote
      quotes.push({
        providerId: this.id,
        gpuType: request.gpuType,
        pricePerHour: pricing.fixedPrice,
        currency: 'USD',
        region: targetRegion,
        isSpot: false,
        providerName: this.name
      });

      // Add spot price if available and requested
      if (
        request.useSpot !== false &&
        this.capabilities.supportsSpot &&
        pricing.spotPrice
      ) {
        const spotDiscount = Math.round(
          ((pricing.fixedPrice - pricing.spotPrice) / pricing.fixedPrice) * 100
        );
        quotes.push({
          providerId: this.id,
          gpuType: request.gpuType,
          pricePerHour: pricing.spotPrice,
          currency: 'USD',
          region: targetRegion,
          isSpot: true,
          spotDiscountPercent: spotDiscount,
          providerName: this.name
        });
      }

      return {
        providerId: this.id,
        quotes,
        latencyMs: Date.now() - startTime,
        fetchedAt: new Date()
      };
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        'UNKNOWN',
        `Failed to get quotes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get full provider information
   */
  getProviderInfo(): ComputeProvider {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      pricingModel: this.pricingModel,
      capabilities: this.capabilities,
      metadata: {
        description: this.config.description,
        website: this.config.website,
        reputationScore: this.config.reputationScore,
        uptimePercentage: this.config.uptimePercentage
      },
      isActive: true,
      listedAt: this.config.listedAt
    };
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    await this.simulateLatency(40);
    return true;
  }
}

// ============================================================================
// Pre-configured Mock Providers
// ============================================================================

/**
 * Vertex Compute - Budget-focused provider
 * T4 and V100 GPUs at competitive prices
 */
export function createVertexProvider(): MockProvider {
  return new MockProvider({
    id: 'vertex-compute',
    name: 'Vertex Compute',
    description: 'Budget-focused cloud compute specializing in T4 and V100 GPUs for cost-conscious workloads.',
    website: 'https://vertexcompute.example',
    reputationScore: 78,
    uptimePercentage: 97.5,
    capabilities: {
      gpuTypes: [GpuType.T4, GpuType.V100, GpuType.RTX3090],
      regions: ['us-east', 'us-west', 'eu-west'],
      maxDurationHours: 336,
      supportsSpot: true
    },
    pricing: {
      [GpuType.T4]: { fixedPrice: 0.25, spotPrice: 0.18 },
      [GpuType.V100]: { fixedPrice: 0.85, spotPrice: 0.6 },
      [GpuType.RTX3090]: { fixedPrice: 0.48, spotPrice: 0.35 }
    },
    pricingModel: PricingModel.SPOT,
    listedAt: new Date('2023-05-15')
  });
}

/**
 * Nebula Cloud - Premium H100 provider
 * High-end H100 and H200 GPUs for demanding workloads
 */
export function createNebulaProvider(): MockProvider {
  return new MockProvider({
    id: 'nebula-cloud',
    name: 'Nebula Cloud',
    description: 'Premium GPU cloud specializing in H100 and H200 GPUs for large-scale AI training.',
    website: 'https://nebulacloud.example',
    reputationScore: 92,
    uptimePercentage: 99.5,
    capabilities: {
      gpuTypes: [GpuType.H100, GpuType.H200, GpuType.A100_80GB],
      regions: ['us-west', 'us-east', 'ap-northeast'],
      maxDurationHours: 720,
      supportsSpot: false
    },
    pricing: {
      [GpuType.H100]: { fixedPrice: 3.2 },
      [GpuType.H200]: { fixedPrice: 4.5 },
      [GpuType.A100_80GB]: { fixedPrice: 2.3 }
    },
    pricingModel: PricingModel.FIXED,
    listedAt: new Date('2023-07-20')
  });
}

/**
 * Quantum Labs - Balanced A100 provider
 * Mid-range pricing with solid A100 availability
 */
export function createQuantumProvider(): MockProvider {
  return new MockProvider({
    id: 'quantum-labs',
    name: 'Quantum Labs',
    description: 'Balanced compute provider offering reliable A100 GPUs at competitive mid-range prices.',
    website: 'https://quantumlabs.example',
    reputationScore: 85,
    uptimePercentage: 98.0,
    capabilities: {
      gpuTypes: [GpuType.A100_80GB, GpuType.A100_40GB, GpuType.A10G],
      regions: ['us-west', 'us-central', 'eu-west', 'ap-south'],
      maxDurationHours: 504,
      supportsSpot: true
    },
    pricing: {
      [GpuType.A100_80GB]: { fixedPrice: 2.1, spotPrice: 1.6 },
      [GpuType.A100_40GB]: { fixedPrice: 1.75, spotPrice: 1.35 },
      [GpuType.A10G]: { fixedPrice: 0.58, spotPrice: 0.45 }
    },
    pricingModel: PricingModel.SPOT,
    listedAt: new Date('2023-04-10')
  });
}

/**
 * Stellar Nodes - Europe-focused provider
 * EU-region specialist with GDPR compliance
 */
export function createStellarProvider(): MockProvider {
  return new MockProvider({
    id: 'stellar-nodes',
    name: 'Stellar Nodes',
    description: 'Europe-focused compute provider with GDPR compliance and competitive EU pricing.',
    website: 'https://stellarnodes.example',
    reputationScore: 88,
    uptimePercentage: 98.8,
    capabilities: {
      gpuTypes: [GpuType.A100_80GB, GpuType.V100, GpuType.RTX4090],
      regions: ['eu-west', 'eu-central', 'eu-north'],
      maxDurationHours: 720,
      supportsSpot: true
    },
    pricing: {
      [GpuType.A100_80GB]: { fixedPrice: 2.05, spotPrice: 1.55 },
      [GpuType.V100]: { fixedPrice: 0.92, spotPrice: 0.72 },
      [GpuType.RTX4090]: { fixedPrice: 0.62, spotPrice: 0.48 }
    },
    pricingModel: PricingModel.SPOT,
    listedAt: new Date('2023-06-01')
  });
}

/**
 * Create all mock providers
 */
export function createAllMockProviders(): MockProvider[] {
  return [
    createVertexProvider(),
    createNebulaProvider(),
    createQuantumProvider(),
    createStellarProvider()
  ];
}
