/**
 * Price Normalizer
 * 
 * Core AGENT-02 implementation: Converts diverse provider pricing
 * (fixed USD, dynamic spot, volatile tokens) into standardized USD/GPU-hr metric.
 * 
 * Pipeline:
 * 1. Token conversion (TOKEN → USD via CoinGecko)
 * 2. Spot discount application
 * 3. Hidden cost addition (bandwidth, storage, API)
 * 4. GPU normalization (→ A100-equivalent)
 * 5. Output: Single comparable USD/GPU-hr rate
 * 
 * Per user decision: Output single effective rate displayed to users ($X.XX/GPU-hr)
 */

import { PriceQuote, NormalizedPrice, HiddenCosts } from '@/types/pricing';
import { JobRequest } from '@/types/job';
import { GpuType, RegionCode, PricingModel } from '@/types/provider';
import { TokenPriceService, getTokenPrice } from './coingecko';
import { getA100Equivalent, normalizeToA100 } from './gpu-ratios';
import { calculateHiddenCosts, estimateUsage } from './hidden-costs';

/**
 * Price normalization result with optional error flag
 */
export interface NormalizationResult extends NormalizedPrice {
  /** Whether normalization encountered errors */
  hasError?: boolean;
  /** Error message if normalization failed */
  errorMessage?: string;
}

/**
 * Price normalizer configuration
 */
export interface NormalizerConfig {
  /** Whether to include hidden costs in calculation */
  includeHiddenCosts: boolean;
  /** Whether to apply spot discounts */
  applySpotDiscounts: boolean;
  /** Default workload type for usage estimation */
  defaultWorkloadType: 'training' | 'inference';
}

/**
 * Default normalizer configuration
 */
export const DEFAULT_NORMALIZER_CONFIG: NormalizerConfig = {
  includeHiddenCosts: true,
  applySpotDiscounts: true,
  defaultWorkloadType: 'training',
};

/**
 * Price comparison entry with ranking info
 */
export interface PriceComparisonEntry extends NormalizedPrice {
  /** Rank by price (1 = cheapest) */
  rank: number;
  /** Savings vs cheapest option (0 for cheapest) */
  savingsPercent: number;
  /** Savings vs most expensive option */
  vsMaxSavingsPercent: number;
}

/**
 * Price normalizer for converting provider quotes to comparable metrics
 * 
 * Implements the full normalization pipeline per AGENT-02:
 * - Token price conversion
 * - Spot discount application
 * - Hidden cost inclusion
 * - GPU performance normalization
 */
export class PriceNormalizer {
  private tokenService: TokenPriceService;
  private config: NormalizerConfig;

  constructor(
    tokenService: TokenPriceService,
    config: Partial<NormalizerConfig> = {}
  ) {
    this.tokenService = tokenService;
    this.config = { ...DEFAULT_NORMALIZER_CONFIG, ...config };
  }

  /**
   * Normalize a single price quote
   * 
   * Pipeline:
   * 1. Convert token prices to USD
   * 2. Apply spot discounts
   * 3. Add hidden costs
   * 4. Normalize to A100-equivalent
   * 5. Return comparable effective rate
   * 
   * @param quote - Raw price quote from provider
   * @param jobRequest - Job requirements for usage estimation
   * @returns Normalized price with A100-equivalent rate
   */
  async normalizeQuote(
    quote: PriceQuote,
    jobRequest: JobRequest
  ): Promise<NormalizationResult> {
    try {
      // 1. Get base price in USD
      let usdPrice: number;
      let tokenPrice: number | undefined;

      if (quote.currency === 'USD') {
        usdPrice = quote.pricePerHour;
      } else if (quote.currency === 'TOKEN' && quote.tokenSymbol) {
        const tokenPriceData = await this.tokenService.getPrice(quote.tokenSymbol);
        tokenPrice = tokenPriceData.usdPrice;
        
        // Handle token price unavailability (AGENT-03 fallback)
        if (tokenPrice === 0) {
          console.warn(`[PriceNormalizer] Token price unavailable for ${quote.tokenSymbol}, using 0`);
          usdPrice = 0;
        } else {
          usdPrice = quote.pricePerHour * tokenPrice;
        }
      } else {
        // Unknown currency type
        console.warn(`[PriceNormalizer] Unknown currency type: ${quote.currency}`);
        usdPrice = quote.pricePerHour; // Assume USD as fallback
      }

      // 2. Apply spot discount if applicable
      let discountedPrice = usdPrice;
      if (this.config.applySpotDiscounts && quote.isSpot && quote.spotDiscountPercent) {
        discountedPrice = usdPrice * (1 - quote.spotDiscountPercent / 100);
      }

      // 3. Add hidden costs
      let hiddenCosts: HiddenCosts = {
        bandwidthUsdPerHour: 0,
        storageUsdPerHour: 0,
        apiCallsUsdPerHour: 0,
        total: 0,
      };

      if (this.config.includeHiddenCosts) {
        const usage = estimateUsage(jobRequest);
        hiddenCosts = calculateHiddenCosts({
          region: quote.region,
          durationHours: jobRequest.durationHours,
          expectedBandwidthGB: usage.expectedBandwidthGB,
          expectedStorageGB: usage.expectedStorageGB,
          expectedApiCallsPerHour: usage.expectedApiCallsPerHour,
          workloadType: this.config.defaultWorkloadType,
        });
      }

      const totalPrice = discountedPrice + hiddenCosts.total;

      // 4. Normalize to A100-equivalent
      let a100Ratio: number;
      let effectivePrice: number;
      
      try {
        a100Ratio = getA100Equivalent(quote.gpuType);
        effectivePrice = totalPrice / a100Ratio;
      } catch (error) {
        // Unknown GPU type - use price as-is without normalization
        console.warn(`[PriceNormalizer] Unknown GPU type: ${quote.gpuType}`);
        a100Ratio = 1.0;
        effectivePrice = totalPrice;
      }

      // 5. Determine source type
      const source: PricingModel = quote.isSpot ? PricingModel.SPOT : 
                     quote.currency === 'TOKEN' ? PricingModel.TOKEN : PricingModel.FIXED;

      return {
        providerId: quote.providerId,
        gpuType: quote.gpuType,
        usdPerGpuHour: totalPrice,
        a100Equivalent: a100Ratio,
        effectiveUsdPerA100Hour: effectivePrice,
        hiddenCosts,
        source,
        calculatedAt: new Date(),
        tokenSymbol: quote.tokenSymbol,
        tokenPrice,
        hasError: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PriceNormalizer] Failed to normalize quote: ${errorMessage}`);

      // Return partial result with error flag
      return {
        providerId: quote.providerId,
        gpuType: quote.gpuType,
        usdPerGpuHour: 0,
        a100Equivalent: 1.0,
        effectiveUsdPerA100Hour: Infinity,
        hiddenCosts: {
          bandwidthUsdPerHour: 0,
          storageUsdPerHour: 0,
          apiCallsUsdPerHour: 0,
          total: 0,
        },
        source: quote.isSpot ? PricingModel.SPOT : quote.currency === 'TOKEN' ? PricingModel.TOKEN : PricingModel.FIXED,
        calculatedAt: new Date(),
        hasError: true,
        errorMessage,
      };
    }
  }

  /**
   * Normalize multiple quotes in parallel
   * 
   * @param quotes - Array of price quotes
   * @param jobRequest - Job requirements
   * @returns Array of normalized prices
   */
  async normalizeMultipleQuotes(
    quotes: PriceQuote[],
    jobRequest: JobRequest
  ): Promise<NormalizationResult[]> {
    const promises = quotes.map(quote => this.normalizeQuote(quote, jobRequest));
    return Promise.all(promises);
  }

  /**
   * Compare normalized prices and rank by value
   * 
   * Sorts by effectiveUsdPerA100Hour (lowest first = best value)
   * Returns ranked array with savings percentages
   * 
   * @param prices - Normalized prices to compare
   * @returns Ranked comparison entries
   */
  comparePrices(prices: NormalizedPrice[]): PriceComparisonEntry[] {
    if (prices.length === 0) return [];

    // Filter out errors
    const validPrices = prices.filter(p => 
      !('hasError' in p && p.hasError) && 
      p.effectiveUsdPerA100Hour !== Infinity
    );

    if (validPrices.length === 0) return [];

    // Sort by effective price (lowest first)
    const sorted = [...validPrices].sort((a, b) => 
      a.effectiveUsdPerA100Hour - b.effectiveUsdPerA100Hour
    );

    const cheapest = sorted[0].effectiveUsdPerA100Hour;
    const mostExpensive = sorted[sorted.length - 1].effectiveUsdPerA100Hour;

    return sorted.map((price, index) => {
      const savingsPercent = cheapest > 0 
        ? ((price.effectiveUsdPerA100Hour - cheapest) / cheapest) * 100 
        : 0;
      
      const vsMaxSavingsPercent = mostExpensive > 0 
        ? ((mostExpensive - price.effectiveUsdPerA100Hour) / mostExpensive) * 100 
        : 0;

      return {
        ...price,
        rank: index + 1,
        savingsPercent,
        vsMaxSavingsPercent,
      };
    });
  }

  /**
   * Format price for display
   * 
   * Per user decision: Output format is $X.XX/GPU-hr
   * 
   * @param price - Price to format
   * @returns Formatted price string
   */
  formatPrice(price: number): string {
    if (price === Infinity || isNaN(price)) return '$∞/GPU-hr';
    if (price === 0) return '$0.00/GPU-hr';
    
    // Format with 2 decimal places
    return `$${price.toFixed(2)}/GPU-hr`;
  }

  /**
   * Format effective rate for display
   * Includes A100-equivalent notation
   * 
   * @param normalizedPrice - Normalized price object
   * @returns Formatted string with context
   */
  formatEffectiveRate(normalizedPrice: NormalizedPrice): string {
    const { effectiveUsdPerA100Hour, gpuType, a100Equivalent } = normalizedPrice;
    
    if (effectiveUsdPerA100Hour === Infinity || isNaN(effectiveUsdPerA100Hour)) {
      return 'Price unavailable';
    }

    const formatted = this.formatPrice(effectiveUsdPerA100Hour);
    
    if (gpuType === 'A100_80GB') {
      return formatted; // Already A100, no conversion needed
    }
    
    return `${formatted} (≈ ${gpuType} @ ${a100Equivalent}x A100)`;
  }

  /**
   * Get the best price from a list
   * 
   * @param prices - Normalized prices
   * @returns Best price or null if none valid
   */
  getBestPrice(prices: NormalizedPrice[]): NormalizedPrice | null {
    const validPrices = prices.filter(p => 
      !('hasError' in p && p.hasError) && 
      p.effectiveUsdPerA100Hour !== Infinity
    );

    if (validPrices.length === 0) return null;

    return validPrices.reduce((best, current) => 
      current.effectiveUsdPerA100Hour < best.effectiveUsdPerA100Hour ? current : best
    );
  }

  /**
   * Calculate savings between two prices
   * 
   * @param baseline - Baseline price (e.g., most expensive)
   * @param comparison - Price to compare
   * @returns Savings percentage
   */
  calculateSavings(baseline: NormalizedPrice, comparison: NormalizedPrice): number {
    if (baseline.effectiveUsdPerA100Hour === 0) return 0;
    
    const savings = baseline.effectiveUsdPerA100Hour - comparison.effectiveUsdPerA100Hour;
    return (savings / baseline.effectiveUsdPerA100Hour) * 100;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<NormalizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): NormalizerConfig {
    return { ...this.config };
  }
}

/**
 * Standalone normalization function for simple use cases
 * Uses default token service
 * 
 * @param quote - Price quote to normalize
 * @param jobRequest - Job requirements
 * @returns Normalized price
 */
export async function normalizeQuote(
  quote: PriceQuote,
  jobRequest: JobRequest
): Promise<NormalizationResult> {
  const normalizer = new PriceNormalizer(new TokenPriceService());
  return normalizer.normalizeQuote(quote, jobRequest);
}

/**
 * Standalone comparison function
 * 
 * @param prices - Normalized prices to compare
 * @returns Ranked comparison entries
 */
export function comparePrices(prices: NormalizedPrice[]): PriceComparisonEntry[] {
  const normalizer = new PriceNormalizer(new TokenPriceService());
  return normalizer.comparePrices(prices);
}

/**
 * Format price utility function
 * 
 * @param price - Price to format
 * @returns Formatted string
 */
export function formatPrice(price: number): string {
  if (price === Infinity || isNaN(price)) return '$∞/GPU-hr';
  if (price === 0) return '$0.00/GPU-hr';
  return `$${price.toFixed(2)}/GPU-hr`;
}

/**
 * Format effective rate utility function
 * 
 * @param normalizedPrice - Normalized price object
 * @returns Formatted string
 */
export function formatEffectiveRate(normalizedPrice: NormalizedPrice): string {
  const { effectiveUsdPerA100Hour, gpuType, a100Equivalent } = normalizedPrice;
  
  if (effectiveUsdPerA100Hour === Infinity || isNaN(effectiveUsdPerA100Hour)) {
    return 'Price unavailable';
  }

  const formatted = formatPrice(effectiveUsdPerA100Hour);
  
  if (gpuType === 'A100_80GB') {
    return formatted;
  }
  
  return `${formatted} (≈ ${gpuType} @ ${a100Equivalent}x A100)`;
}
