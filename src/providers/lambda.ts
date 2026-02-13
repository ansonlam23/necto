/**
 * Lambda Labs Provider Adapter
 * 
 * Implements the ProviderAdapter interface for Lambda Labs.
 * Lambda is a premium GPU cloud provider with high-performance NVIDIA GPUs.
 * 
 * Note: Using hardcoded realistic data for hackathon demo.
 * Live API integration deferred to post-hackathon.
 * 
 * Capabilities:
 * - FIXED pricing only (no spot)
 * - High-performance GPUs (H100, A100)
 * - US regions only
 * - Lower latency (premium provider)
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
 * Lambda Labs provider adapter
 */
export class LambdaProvider extends BaseProviderAdapter {
  readonly id = 'lambda';
  readonly name = 'Lambda Labs';
  readonly type = 'lambda' as const;

  readonly capabilities: ProviderCapabilities = {
    gpuTypes: [GpuType.H100, GpuType.A100_80GB, GpuType.A100_40GB, GpuType.A10G],
    regions: ['us-east', 'us-west', 'us-central'],
    maxDurationHours: 168, // 7 days
    supportsSpot: false // Lambda doesn't offer spot pricing
  };

  // Hardcoded realistic pricing data for hackathon demo
  // Source: Lambda Labs public pricing (approximated)
  private readonly pricingData: Record<
    string,
    {
      fixedPrice: number;
      minDuration: number;
    }
  > = {
    [GpuType.H100]: {
      fixedPrice: 2.99, // $2.99/hr
      minDuration: 1
    },
    [GpuType.A100_80GB]: {
      fixedPrice: 1.99, // $1.99/hr
      minDuration: 1
    },
    [GpuType.A100_40GB]: {
      fixedPrice: 1.49,
      minDuration: 1
    },
    [GpuType.A10G]: {
      fixedPrice: 0.6, // $0.60/hr
      minDuration: 1
    }
  };

  /**
   * Get quotes for Lambda Labs
   * Returns hardcoded realistic pricing for demo purposes
   */
  async getQuotes(request: QuoteRequest): Promise<QuoteResult> {
    const startTime = Date.now();

    try {
      // Validate GPU type is supported
      if (!this.capabilities.gpuTypes.includes(request.gpuType)) {
        throw new ProviderError(
          'INVALID_REQUEST',
          `GPU type ${request.gpuType} not supported by Lambda Labs`,
          this.id
        );
      }

      // Validate region is supported (US only)
      if (request.region && !this.capabilities.regions.includes(request.region)) {
        throw new ProviderError(
          'INVALID_REQUEST',
          `Region ${request.region} not supported by Lambda Labs. Available: ${this.capabilities.regions.join(', ')}`,
          this.id
        );
      }

      // Simulate lower latency (premium provider)
      const targetRegion = request.region || 'us-west';
      const baseLatency = calculateLatency('us-west', targetRegion);
      const latencyMs = baseLatency * 0.7; // 30% faster than typical
      await this.simulateLatency(Math.floor(latencyMs));

      const pricing = this.pricingData[request.gpuType];
      if (!pricing) {
        throw new ProviderError(
          'INVALID_REQUEST',
          `No pricing data available for ${request.gpuType}`,
          this.id
        );
      }

      // Lambda only offers fixed pricing
      const quotes: PriceQuote[] = [
        {
          providerId: this.id,
          gpuType: request.gpuType,
          pricePerHour: pricing.fixedPrice,
          currency: 'USD',
          region: targetRegion,
          isSpot: false,
          providerName: this.name
        }
      ];

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
      pricingModel: PricingModel.FIXED,
      capabilities: this.capabilities,
      metadata: {
        description:
          'Premium GPU cloud with high-performance NVIDIA H100 and A100 GPUs. Optimized for AI/ML workloads.',
        website: 'https://lambdalabs.com',
        reputationScore: 95,
        uptimePercentage: 99.9
      },
      isActive: true,
      listedAt: new Date('2022-06-01')
    };
  }

  /**
   * Check if provider is available
   * Premium providers have better availability
   */
  async isAvailable(): Promise<boolean> {
    // Simulate a quick health check with better response time
    await this.simulateLatency(30);
    return true;
  }

  /**
   * Get health status with premium metrics
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    latencyMs: number;
    message?: string;
    lastChecked: Date;
  }> {
    const startTime = Date.now();
    await this.simulateLatency(30);
    return {
      healthy: true,
      latencyMs: Date.now() - startTime,
      message: 'All systems operational',
      lastChecked: new Date()
    };
  }
}

/**
 * Factory function to create Lambda provider instance
 */
export function createLambdaProvider(): LambdaProvider {
  return new LambdaProvider();
}
