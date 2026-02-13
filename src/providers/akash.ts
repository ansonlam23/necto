/**
 * Akash Network Provider Adapter
 * 
 * Implements the ProviderAdapter interface for Akash Network.
 * Akash is a decentralized cloud marketplace using the AKT token.
 * 
 * Note: Using hardcoded realistic data for hackathon demo.
 * Live API integration deferred to post-hackathon using @akashnetwork/akashjs SDK.
 * 
 * Capabilities:
 * - SPOT and FIXED pricing models
 * - Multiple GPU types (A100, V100)
 * - Global regions (US, EU, APAC)
 * - Token-based pricing with AKT
 */

import {
  BaseProviderAdapter,
  QuoteRequest,
  QuoteResult,
  ProviderError,
  calculateLatency
} from './base';
import { ComputeProvider, ProviderCapabilities, GpuType, RegionCode, PricingModel } from '@/types/provider';
import { PriceQuote } from '@/types/pricing';

/**
 * Akash Network provider adapter
 */
export class AkashProvider extends BaseProviderAdapter {
  readonly id = 'akash';
  readonly name = 'Akash Network';
  readonly type = 'akash' as const;

  readonly capabilities: ProviderCapabilities = {
    gpuTypes: [GpuType.A100_80GB, GpuType.A100_40GB, GpuType.V100, GpuType.RTX4090],
    regions: ['us-west', 'us-east', 'eu-west', 'ap-south'],
    maxDurationHours: 720, // 30 days
    supportsSpot: true
  };

  // Hardcoded realistic pricing data for hackathon demo
  // Source: Approximated from Akash Network marketplace data
  private readonly pricingData: Record<
    string,
    {
      fixedPrice: number;
      spotPrice: number;
      tokenSymbol: string;
      tokenPriceUsd: number;
    }
  > = {
    [GpuType.A100_80GB]: {
      fixedPrice: 2.5, // $2.50/hr
      spotPrice: 1.5, // $1.50/hr (40% discount)
      tokenSymbol: 'AKT',
      tokenPriceUsd: 2.85 // AKT price reference
    },
    [GpuType.A100_40GB]: {
      fixedPrice: 2.0,
      spotPrice: 1.2,
      tokenSymbol: 'AKT',
      tokenPriceUsd: 2.85
    },
    [GpuType.V100]: {
      fixedPrice: 1.2,
      spotPrice: 0.8, // $0.80/hr
      tokenSymbol: 'AKT',
      tokenPriceUsd: 2.85
    },
    [GpuType.RTX4090]: {
      fixedPrice: 1.1,
      spotPrice: 0.75,
      tokenSymbol: 'AKT',
      tokenPriceUsd: 2.85
    }
  };

  /**
   * Get quotes for Akash Network
   * Returns hardcoded realistic pricing for demo purposes
   */
  async getQuotes(request: QuoteRequest): Promise<QuoteResult> {
    const startTime = Date.now();

    try {
      // Validate GPU type is supported
      if (!this.capabilities.gpuTypes.includes(request.gpuType)) {
        throw new ProviderError(
          'INVALID_REQUEST',
          `GPU type ${request.gpuType} not supported by Akash Network`,
          this.id
        );
      }

      // Simulate API latency
      const targetRegion = request.region || 'us-west';
      const latencyMs = calculateLatency('us-west', targetRegion);
      await this.simulateLatency(Math.floor(latencyMs));

      const pricing = this.pricingData[request.gpuType];
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

      // Add spot price quote if requested and available
      if (request.useSpot !== false && this.capabilities.supportsSpot) {
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

      // Add token price quote (AKT)
      const aktPricePerHour = pricing.fixedPrice / pricing.tokenPriceUsd;
      quotes.push({
        providerId: this.id,
        gpuType: request.gpuType,
        pricePerHour: aktPricePerHour,
        currency: 'TOKEN',
        tokenSymbol: pricing.tokenSymbol,
        region: targetRegion,
        isSpot: false,
        providerName: this.name
      });

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
      pricingModel: PricingModel.SPOT,
      capabilities: this.capabilities,
      metadata: {
        description:
          'Decentralized cloud marketplace offering GPU compute with competitive spot pricing.',
        website: 'https://akash.network',
        reputationScore: 85,
        uptimePercentage: 98.5
      },
      isActive: true,
      listedAt: new Date('2023-01-15')
    };
  }

  /**
   * Check if provider is available
   * For demo, always returns true
   */
  async isAvailable(): Promise<boolean> {
    // Simulate a quick health check
    await this.simulateLatency(50);
    return true;
  }
}

/**
 * Factory function to create Akash provider instance
 */
export function createAkashProvider(): AkashProvider {
  return new AkashProvider();
}
