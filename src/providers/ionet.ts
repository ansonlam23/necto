/**
 * io.net Provider Adapter
 * 
 * Implements the ProviderAdapter interface for io.net.
 * io.net is a decentralized computing network with consumer GPUs.
 * 
 * Note: Using hardcoded realistic data for hackathon demo.
 * Live API integration deferred to post-hackathon.
 * 
 * Capabilities:
 * - SPOT pricing with consumer GPUs
 * - RTX 4090, 3090 focus
 * - Competitive pricing for consumer hardware
 * - Global distributed network
 */

import {
  BaseProviderAdapter,
  QuoteRequest,
  QuoteResult,
  ProviderError,
  calculateLatency
} from './base';
import { ComputeProvider, ProviderCapabilities, GpuType, PricingModel } from '@/types/provider';
import { PriceQuote } from '@/types/pricing';

/**
 * io.net provider adapter
 */
export class IonetProvider extends BaseProviderAdapter {
  readonly id = 'ionet';
  readonly name = 'io.net';
  readonly type = 'ionet' as const;

  readonly capabilities: ProviderCapabilities = {
    gpuTypes: [GpuType.RTX4090, GpuType.RTX3090, GpuType.A10G],
    regions: ['us-west', 'us-east', 'eu-west', 'ap-south', 'ap-northeast'],
    maxDurationHours: 336, // 14 days
    supportsSpot: true
  };

  // Hardcoded realistic pricing data for hackathon demo
  // Source: Approximated from io.net marketplace data
  private readonly pricingData: Record<
    string,
    {
      fixedPrice: number;
      spotPrice: number;
    }
  > = {
    [GpuType.RTX4090]: {
      fixedPrice: 0.65, // $0.65/hr
      spotPrice: 0.45 // $0.45/hr (30% discount)
    },
    [GpuType.RTX3090]: {
      fixedPrice: 0.5, // $0.50/hr
      spotPrice: 0.35 // $0.35/hr (30% discount)
    },
    [GpuType.A10G]: {
      fixedPrice: 0.55,
      spotPrice: 0.4
    }
  };

  /**
   * Get quotes for io.net
   * Returns consumer GPU pricing
   */
  async getQuotes(request: QuoteRequest): Promise<QuoteResult> {
    const startTime = Date.now();

    try {
      // Validate GPU type is supported
      if (!this.capabilities.gpuTypes.includes(request.gpuType)) {
        throw new ProviderError(
          'INVALID_REQUEST',
          `GPU type ${request.gpuType} not supported by io.net. Available: RTX4090, RTX3090, A10G`,
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
          'Decentralized computing network offering consumer GPUs at competitive spot prices. RTX 4090 and 3090 specialists.',
        website: 'https://io.net',
        reputationScore: 80,
        uptimePercentage: 96.5
      },
      isActive: true,
      listedAt: new Date('2023-08-01')
    };
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    await this.simulateLatency(60);
    return true;
  }
}

/**
 * Factory function to create io.net provider instance
 */
export function createIonetProvider(): IonetProvider {
  return new IonetProvider();
}
