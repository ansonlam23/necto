/**
 * Pricing Type Definitions
 * 
 * Price normalization, token pricing, and quote structures.
 * Supports USD normalization and hidden cost calculation.
 */

import { GpuType, RegionCode, PricingModel } from './provider';

/**
 * Token price information from external sources
 * Used for normalizing token-based pricing to USD
 */
export interface TokenPrice {
  /** Token symbol (e.g., 'FIL', 'AKT') */
  symbol: string;
  /** Current price in USD */
  usdPrice: number;
  /** When price was last updated */
  lastUpdated: Date;
  /** Source of price data */
  source: 'coingecko' | 'cached' | 'manual';
}

/**
 * Hidden costs associated with compute (per user decision)
 * These are often overlooked infrastructure costs
 */
export interface HiddenCosts {
  /** Bandwidth cost per hour in USD */
  bandwidthUsdPerHour: number;
  /** Storage cost per hour in USD */
  storageUsdPerHour: number;
  /** API call cost per hour in USD */
  apiCallsUsdPerHour: number;
  /** Total hidden costs per hour */
  total: number;
}

/**
 * Raw price quote from a provider
 * Represents unnormalized pricing from a specific instance
 */
export interface PriceQuote {
  /** Provider identifier */
  providerId: string;
  /** GPU type for this quote */
  gpuType: GpuType;
  /** Price per hour (raw, in native currency) */
  pricePerHour: number;
  /** Currency type */
  currency: 'USD' | 'TOKEN';
  /** Token symbol if currency is TOKEN */
  tokenSymbol?: string;
  /** Geographic region */
  region: RegionCode;
  /** Whether this is a spot/preemptible price */
  isSpot: boolean;
  /** Spot discount percentage (0-100) */
  spotDiscountPercent?: number;
  /** Provider name for display */
  providerName?: string;
  /** Instance identifier */
  instanceId?: string;
}

/**
 * Normalized price for comparison across providers (implements AGENT-02)
 * All prices converted to USD and normalized to A100-equivalent
 */
export interface NormalizedPrice {
  /** Provider identifier */
  providerId: string;
  /** GPU type */
  gpuType: GpuType;
  /** Price per GPU hour in USD */
  usdPerGpuHour: number;
  /** Performance ratio relative to A100 80GB (baseline = 1.0) */
  a100Equivalent: number;
  /** Effective price normalized to A100 equivalent */
  effectiveUsdPerA100Hour: number;
  /** Hidden costs breakdown */
  hiddenCosts: HiddenCosts;
  /** Source pricing model */
  source: PricingModel;
  /** When calculation was performed */
  calculatedAt: Date;
  /** Token symbol if applicable */
  tokenSymbol?: string;
  /** Token price used for normalization */
  tokenPrice?: number;
}

/**
 * Price comparison result across multiple providers
 */
export interface PriceComparison {
  /** Query that generated this comparison */
  query: {
    gpuType: GpuType;
    durationHours: number;
    region?: RegionCode;
  };
  /** All normalized prices from providers */
  prices: NormalizedPrice[];
  /** Cheapest option */
  cheapest: NormalizedPrice;
  /** Most expensive option */
  mostExpensive: NormalizedPrice;
  /** Average price across providers */
  average: number;
  /** Generated timestamp */
  timestamp: Date;
}
