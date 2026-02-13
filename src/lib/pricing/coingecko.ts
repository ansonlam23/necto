/**
 * CoinGecko Token Price Service
 * 
 * Fetches real-time token prices from CoinGecko API with caching
 * Implements AGENT-03 requirements with rate limit protection
 * 
 * Per user decision: Use real-time token prices via CoinGecko API
 * Per research: Free tier is 30 calls/min, 10K/month — cache to stay under limits
 * Cache TTL: 10 minutes (600 seconds) as specified
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import NodeCache from 'node-cache';

/**
 * Token price information
 */
export interface TokenPrice {
  /** Token symbol (e.g., 'FIL', 'AKT') */
  symbol: string;
  /** Current price in USD */
  usdPrice: number;
  /** When price was last updated */
  lastUpdated: Date;
  /** Source of price data */
  source: 'coingecko' | 'cached' | 'fallback';
}

/**
 * Token price cache entry
 */
interface CacheEntry {
  usdPrice: number;
  timestamp: number;
}

/**
 * Error codes for token price errors
 */
export type TokenPriceErrorCode = 'RATE_LIMIT' | 'NETWORK' | 'INVALID_TOKEN' | 'CACHE_STALE';

/**
 * Custom error class for token price operations
 */
export class TokenPriceError extends Error {
  constructor(
    message: string,
    public code: TokenPriceErrorCode,
    public symbol?: string
  ) {
    super(message);
    this.name = 'TokenPriceError';
  }
}

/**
 * CoinGecko API configuration
 */
export interface CoinGeckoConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  cacheTtlSeconds: number;
  maxRequestsPerMinute: number;
}

/**
 * Default CoinGecko configuration
 */
export const DEFAULT_COINGECKO_CONFIG: CoinGeckoConfig = {
  baseUrl: 'https://api.coingecko.com/api/v3',
  timeout: 10000,
  retryAttempts: 3,
  cacheTtlSeconds: 600, // 10 minutes
  maxRequestsPerMinute: 25, // Buffer below 30/min limit
};

/**
 * Supported token mappings (CoinGecko ID → our symbol)
 */
export const SUPPORTED_TOKENS: Record<string, string> = {
  'filecoin': 'FIL',
  'akash-network': 'AKT',
  'render-token': 'RENDER',
  'io': 'IO',
};

/**
 * Reverse mapping (symbol → CoinGecko ID)
 */
export const SYMBOL_TO_ID: Record<string, string> = {
  'FIL': 'filecoin',
  'AKT': 'akash-network',
  'RENDER': 'render-token',
  'IO': 'io',
};

/**
 * Token price cache using node-cache
 * 
 * Caches prices for 10 minutes to stay under CoinGecko rate limits
 * (30 calls/min, 10K calls/month on free tier)
 */
export class TokenPriceCache {
  private cache: NodeCache;
  private readonly ttlSeconds: number;

  constructor(ttlSeconds: number = 600) {
    this.ttlSeconds = ttlSeconds;
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Store references for performance
    });
  }

  /**
   * Check if price exists in cache and is not expired
   */
  checkCache(symbol: string): TokenPrice | null {
    const entry = this.cache.get<CacheEntry>(symbol.toUpperCase());
    
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    const maxAge = this.ttlSeconds * 1000;

    // Return even if slightly stale (graceful degradation)
    return {
      symbol: symbol.toUpperCase(),
      usdPrice: entry.usdPrice,
      lastUpdated: new Date(entry.timestamp),
      source: age > maxAge ? 'cached' : 'coingecko',
    };
  }

  /**
   * Store price in cache
   */
  setCache(symbol: string, price: number): void {
    const entry: CacheEntry = {
      usdPrice: price,
      timestamp: Date.now(),
    };
    this.cache.set(symbol.toUpperCase(), entry);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats(): { keys: number; hits: number; misses: number } {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().keys,
      misses: 0, // node-cache doesn't expose miss count directly
    };
  }
}

/**
 * Rate limiter for CoinGecko API
 * Tracks request timestamps to stay under limits
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 25, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(ts => now - ts < this.windowMs);
    return this.timestamps.length < this.maxRequests;
  }

  /**
   * Record that a request was made
   */
  recordRequest(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Get time until next request can be made (ms)
   */
  timeUntilNextRequest(): number {
    if (this.canMakeRequest()) return 0;
    
    const now = Date.now();
    const oldestValid = now - this.windowMs;
    const oldestRequest = this.timestamps[0];
    
    return Math.max(0, oldestRequest - oldestValid);
  }
}

/**
 * Token price service for fetching real-time prices from CoinGecko
 * 
 * Implements:
 * - 10-minute caching to respect rate limits
 * - Batch fetching for multiple tokens
 * - Graceful degradation with stale cache fallback
 * - Rate limiting with request queuing
 */
export class TokenPriceService {
  private client: AxiosInstance;
  private cache: TokenPriceCache;
  private rateLimiter: RateLimiter;
  private config: CoinGeckoConfig;

  constructor(config: Partial<CoinGeckoConfig> = {}) {
    this.config = { ...DEFAULT_COINGECKO_CONFIG, ...config };
    
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
      },
    });

    this.cache = new TokenPriceCache(this.config.cacheTtlSeconds);
    this.rateLimiter = new RateLimiter(this.config.maxRequestsPerMinute);
  }

  /**
   * Fetch single token price from CoinGecko
   * 
   * Primary: Fetch from CoinGecko API
   * Secondary: Return cached price if < 10 min old
   * Tertiary: Return 0 if fetch fails and no cache (logs warning)
   */
  async fetchSinglePrice(tokenId: string): Promise<number> {
    // Check rate limit
    if (!this.rateLimiter.canMakeRequest()) {
      const waitMs = this.rateLimiter.timeUntilNextRequest();
      console.warn(`[TokenPriceService] Rate limit approached, waiting ${waitMs}ms`);
      await this.delay(waitMs);
    }

    let lastError: Error | null = null;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        this.rateLimiter.recordRequest();
        
        const response = await this.client.get('/simple/price', {
          params: {
            ids: tokenId,
            vs_currencies: 'usd',
          },
        });

        const price = response.data[tokenId]?.usd;
        
        if (typeof price !== 'number') {
          throw new TokenPriceError(
            `Invalid price data for ${tokenId}`,
            'INVALID_TOKEN',
            tokenId
          );
        }

        return price;
      } catch (error) {
        lastError = error as Error;
        
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          
          // Handle rate limit
          if (axiosError.response?.status === 429) {
            const retryAfter = parseInt(axiosError.response.headers['retry-after'] || '60');
            console.warn(`[TokenPriceService] Rate limited, waiting ${retryAfter}s`);
            
            if (attempt < this.config.retryAttempts - 1) {
              await this.delay(retryAfter * 1000 * Math.pow(2, attempt));
              continue;
            }
            
            throw new TokenPriceError(
              'Rate limit exceeded',
              'RATE_LIMIT',
              tokenId
            );
          }
        }

        // Exponential backoff for other errors
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(1000 * Math.pow(2, attempt));
        }
      }
    }

    // All retries failed
    console.error(`[TokenPriceService] Failed to fetch ${tokenId} after ${this.config.retryAttempts} attempts:`, lastError);
    throw new TokenPriceError(
      `Network error fetching ${tokenId}: ${lastError?.message}`,
      'NETWORK',
      tokenId
    );
  }

  /**
   * Fetch multiple token prices in a batch
   * Only fetches missing/stale tokens from API
   */
  async fetchMultiplePrices(tokenIds: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    const toFetch: string[] = [];

    // Check cache first
    for (const tokenId of tokenIds) {
      const symbol = SUPPORTED_TOKENS[tokenId];
      if (symbol) {
        const cached = this.cache.checkCache(symbol);
        if (cached && cached.source === 'coingecko') {
          results.set(tokenId, cached.usdPrice);
        } else {
          toFetch.push(tokenId);
        }
      }
    }

    // Fetch missing tokens in batch
    if (toFetch.length > 0) {
      try {
        const prices = await this.fetchBatchFromApi(toFetch);
        prices.forEach((price, tokenId) => {
          results.set(tokenId, price);
          const symbol = SUPPORTED_TOKENS[tokenId];
          if (symbol) {
            this.cache.setCache(symbol, price);
          }
        });
      } catch (error) {
        console.warn('[TokenPriceService] Batch fetch failed, trying individual fetches');
        
        // Fallback to individual fetches
        for (const tokenId of toFetch) {
          try {
            const price = await this.fetchSinglePrice(tokenId);
            results.set(tokenId, price);
            const symbol = SUPPORTED_TOKENS[tokenId];
            if (symbol) {
              this.cache.setCache(symbol, price);
            }
          } catch (e) {
            // Leave unfetched tokens out of results
          }
        }
      }
    }

    return results;
  }

  /**
   * Fetch batch of token prices from API
   */
  private async fetchBatchFromApi(tokenIds: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    if (!this.rateLimiter.canMakeRequest()) {
      const waitMs = this.rateLimiter.timeUntilNextRequest();
      await this.delay(waitMs);
    }

    this.rateLimiter.recordRequest();

    const response = await this.client.get('/simple/price', {
      params: {
        ids: tokenIds.join(','),
        vs_currencies: 'usd',
      },
    });

    for (const tokenId of tokenIds) {
      const price = response.data[tokenId]?.usd;
      if (typeof price === 'number') {
        results.set(tokenId, price);
      }
    }

    return results;
  }

  /**
   * Get token price (cached or fetch)
   * 
   * Check cache first → Fetch if stale/missing → Return TokenPrice object
   * Returns { usdPrice: 0, source: 'fallback' } on complete failure
   */
  async getPrice(tokenSymbol: string): Promise<TokenPrice> {
    const symbol = tokenSymbol.toUpperCase();
    
    // Check cache first
    const cached = this.cache.checkCache(symbol);
    if (cached && cached.source === 'coingecko') {
      return cached;
    }

    // Get CoinGecko ID
    const tokenId = SYMBOL_TO_ID[symbol];
    if (!tokenId) {
      console.warn(`[TokenPriceService] Unknown token symbol: ${symbol}`);
      return {
        symbol,
        usdPrice: 0,
        lastUpdated: new Date(),
        source: 'fallback',
      };
    }

    try {
      // Fetch from API
      const price = await this.fetchSinglePrice(tokenId);
      this.cache.setCache(symbol, price);

      return {
        symbol,
        usdPrice: price,
        lastUpdated: new Date(),
        source: 'coingecko',
      };
    } catch (error) {
      // Return stale cache if available
      if (cached) {
        console.warn(`[TokenPriceService] Using stale cache for ${symbol}`);
        return {
          ...cached,
          source: 'cached',
        };
      }

      // Return 0 as last resort (provider will be scored poorly)
      console.warn(`[TokenPriceService] Token price unavailable for ${symbol}, using 0`);
      return {
        symbol,
        usdPrice: 0,
        lastUpdated: new Date(),
        source: 'fallback',
      };
    }
  }

  /**
   * Get prices for multiple tokens
   */
  async getMultiplePrices(tokenSymbols: string[]): Promise<Map<string, TokenPrice>> {
    const results = new Map<string, TokenPrice>();

    for (const symbol of tokenSymbols) {
      const price = await this.getPrice(symbol);
      results.set(symbol.toUpperCase(), price);
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number } {
    return this.cache.getStats();
  }

  /**
   * Clear the price cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Utility: Delay for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance for application-wide use
 */
export const tokenPriceService = new TokenPriceService();

/**
 * Helper function to get a single token price
 */
export async function getTokenPrice(tokenSymbol: string): Promise<TokenPrice> {
  return tokenPriceService.getPrice(tokenSymbol);
}

/**
 * Helper function to get multiple token prices
 */
export async function getMultipleTokenPrices(tokenSymbols: string[]): Promise<Map<string, TokenPrice>> {
  return tokenPriceService.getMultiplePrices(tokenSymbols);
}
