/**
 * Pricing Module
 * 
 * Unified pricing normalization pipeline for Synapse compute marketplace.
 * Converts diverse provider pricing models to comparable USD/GPU-hr metrics.
 * 
 * @module pricing
 * 
 * @example
 * ```typescript
 * import { priceNormalizer, getTokenPrice } from '@/lib/pricing';
 * 
 * // Normalize a provider quote
 * const normalized = await priceNormalizer.normalizeQuote(quote, jobRequest);
 * console.log(`Effective rate: ${normalized.effectiveUsdPerA100Hour}/GPU-hr`);
 * 
 * // Get current token prices
 * const aktPrice = await getTokenPrice('AKT');
 * console.log(`AKT: $${aktPrice.usdPrice}`);
 * ```
 */

// Token price service
export {
  TokenPriceService,
  TokenPriceCache,
  RateLimiter,
  TokenPriceError,
  getTokenPrice,
  getMultipleTokenPrices,
  tokenPriceService,
  SUPPORTED_TOKENS,
  SYMBOL_TO_ID,
  DEFAULT_COINGECKO_CONFIG,
  type TokenPrice,
  type TokenPriceErrorCode,
  type CoinGeckoConfig,
} from './coingecko';

// GPU ratios
export {
  GPU_RATIOS,
  GPU_SPECS,
  getA100Equivalent,
  normalizeToA100,
  getGpuTier,
  getGpuSpecs,
  compareGpus,
  getGpusByPerformance,
  type GpuSpecs,
} from './gpu-ratios';

// Hidden costs
export {
  HIDDEN_COST_DEFAULTS,
  DEFAULT_ML_ASSUMPTIONS,
  DEFAULT_INFERENCE_ASSUMPTIONS,
  calculateHiddenCosts,
  estimateUsage,
  calculateEffectivePrice,
  formatHiddenCosts,
  type HiddenCostFactors,
  type UsageAssumptions,
  type HiddenCostParams,
} from './hidden-costs';

// Price normalizer
export {
  PriceNormalizer,
  normalizeQuote,
  comparePrices,
  formatPrice,
  formatEffectiveRate,
  DEFAULT_NORMALIZER_CONFIG,
  type NormalizationResult,
  type NormalizerConfig,
  type PriceComparisonEntry,
} from './normalizer';

// Singleton instances for application-wide use
import { TokenPriceService } from './coingecko';
import { PriceNormalizer } from './normalizer';

/**
 * Global token price service instance
 * Use this for all token price operations
 */
export const tokenService = new TokenPriceService();

/**
 * Global price normalizer instance
 * Pre-configured with token service
 */
export const priceNormalizer = new PriceNormalizer(tokenService);
