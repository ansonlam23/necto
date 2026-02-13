/**
 * Filecoin FVM Provider Adapter
 * 
 * Implements the ProviderAdapter interface for Filecoin via FVM (Filecoin Virtual Machine).
 * Filecoin provides decentralized storage + compute with FIL token pricing.
 * 
 * Note: Using hardcoded realistic data for hackathon demo.
 * Live API integration deferred to post-hackathon.
 * 
 * Capabilities:
 * - TOKEN pricing with FIL
 * - Storage + compute bundles
 * - Global distributed network
 * - GPU types: A100 focused
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
 * Filecoin FVM provider adapter
 */
export class FilecoinProvider extends BaseProviderAdapter {
  readonly id = 'filecoin';
  readonly name = 'Filecoin (FVM)';
  readonly type = 'filecoin' as const;

  readonly capabilities: ProviderCapabilities = {
    gpuTypes: [GpuType.A100_80GB, GpuType.A100_40GB, GpuType.V100],
    regions: ['us-west', 'eu-west', 'ap-south'],
    maxDurationHours: 2160, // 90 days (long-term storage focus)
    supportsSpot: false
  };

  // Hardcoded realistic pricing data for hackathon demo
  // Source: Approximated from Filecoin network data
  private readonly pricingData: Record<
    string,
    {
      computePrice: number; // Base compute price in USD
      storagePricePerHour: number; // Storage component
      tokenSymbol: string;
      tokenPriceUsd: number;
    }
  > = {
    [GpuType.A100_80GB]: {
      computePrice: 1.8, // $1.80/hr base compute
      storagePricePerHour: 0.05, // Storage bundle premium
      tokenSymbol: 'FIL',
      tokenPriceUsd: 4.25 // FIL price reference
    },
    [GpuType.A100_40GB]: {
      computePrice: 1.5,
      storagePricePerHour: 0.04,
      tokenSymbol: 'FIL',
      tokenPriceUsd: 4.25
    },
    [GpuType.V100]: {
      computePrice: 0.95,
      storagePricePerHour: 0.03,
      tokenSymbol: 'FIL',
      tokenPriceUsd: 4.25
    }
  };

  /**
   * Get quotes for Filecoin FVM
   * Returns storage + compute bundle pricing
   */
  async getQuotes(request: QuoteRequest): Promise<QuoteResult> {
    const startTime = Date.now();

    try {
      // Validate GPU type is supported
      if (!this.capabilities.gpuTypes.includes(request.gpuType)) {
        throw new ProviderError(
          'INVALID_REQUEST',
          `GPU type ${request.gpuType} not supported by Filecoin FVM`,
          this.id
        );
      }

      // Simulate API latency (Filecoin can be slower due to consensus)
      const targetRegion = request.region || 'us-west';
      const baseLatency = calculateLatency('us-west', targetRegion);
      const latencyMs = baseLatency * 1.3; // 30% slower due to blockchain consensus
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

      // Calculate total price (compute + storage bundle)
      const totalPrice = pricing.computePrice + pricing.storagePricePerHour;

      // Add USD quote for compute + storage bundle
      quotes.push({
        providerId: this.id,
        gpuType: request.gpuType,
        pricePerHour: totalPrice,
        currency: 'USD',
        region: targetRegion,
        isSpot: false,
        providerName: this.name
      });

      // Add FIL token quote
      const filPricePerHour = totalPrice / pricing.tokenPriceUsd;
      quotes.push({
        providerId: this.id,
        gpuType: request.gpuType,
        pricePerHour: filPricePerHour,
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
      pricingModel: PricingModel.TOKEN,
      capabilities: this.capabilities,
      metadata: {
        description:
          'Decentralized storage and compute via Filecoin Virtual Machine. FIL token pricing with storage bundles.',
        website: 'https://filecoin.io',
        reputationScore: 88,
        uptimePercentage: 97.0
      },
      isActive: true,
      listedAt: new Date('2023-03-01')
    };
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    // Simulate consensus check
    await this.simulateLatency(100);
    return true;
  }
}

/**
 * Factory function to create Filecoin provider instance
 */
export function createFilecoinProvider(): FilecoinProvider {
  return new FilecoinProvider();
}
