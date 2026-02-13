/**
 * Agent Provider Ranking
 * 
 * Implements AGENT-05: Ranking engine that produces top 3 recommendations.
 * Orchestrates filtering, scoring, and quote fetching to produce final rankings.
 * 
 * Design:
 * - Ranker class orchestrates the full pipeline
 * - Parallel quote fetching with timeout handling
 * - Tradeoff analysis for recommendations
 * - Top 3 providers with detailed recommendations
 */

import { ComputeProvider, ProviderInstance, GpuType, RegionCode } from '@/types/provider';
import { JobRequest, JobConstraints } from '@/types/job';
import { NormalizedPrice, PriceQuote } from '@/types/pricing';
import { ProviderAdapter, QuoteRequest, QuoteResult } from '@/providers/base';
import { ProviderRegistry, registry, getAllProviders } from '@/lib/provider-registry';
import { PriceNormalizer, NormalizationResult } from '@/lib/pricing/normalizer';
import { TokenPriceService } from '@/lib/pricing/coingecko';
import { 
  ConstraintFilter, 
  FilterResult, 
  partitionResults 
} from './filter';
import { 
  ScoredProvider, 
  scoreProviders, 
  ScoringWeights,
  DEFAULT_WEIGHTS 
} from './scorer';

/**
 * Provider recommendation with ranking and tradeoffs
 */
export interface ProviderRecommendation {
  /** Rank (1, 2, or 3) */
  rank: number;
  /** Provider information */
  provider: ComputeProvider;
  /** Normalized price for comparison */
  normalizedPrice: NormalizedPrice;
  /** Total weighted score */
  totalScore: number;
  /** Score breakdown by factor */
  scoreBreakdown: Record<string, number>;
  /** Human-readable tradeoff descriptions */
  tradeoffs: string[];
  /** Estimated savings vs most expensive option */
  estimatedSavings: string;
}

/**
 * Rejected provider with reason
 */
export interface RejectedProvider {
  /** Provider that was rejected */
  provider: ComputeProvider;
  /** Rejection reason */
  rejectionReason: string;
  /** Stage where rejection occurred */
  failedAt: 'filter' | 'scoring';
}

/**
 * Complete ranking result
 */
export interface RankingResult {
  /** Top 3 recommendations */
  recommendations: ProviderRecommendation[];
  /** Providers that were rejected */
  rejected: RejectedProvider[];
  /** Metadata about the ranking operation */
  metadata: {
    /** Total providers available */
    totalProviders: number;
    /** Number that passed filtering */
    filteredCount: number;
    /** Number that were scored */
    scoredCount: number;
    /** Execution duration in milliseconds */
    durationMs: number;
  };
}

/**
 * Quote fetch result with timeout handling
 */
interface QuoteFetchResult {
  provider: ProviderAdapter;
  result: QuoteResult | null;
  error?: string;
  timedOut: boolean;
}

/**
 * Ranker configuration options
 */
export interface RankerConfig {
  /** Maximum time to wait for quotes per provider (ms) */
  quoteTimeoutMs: number;
  /** Number of top recommendations to return */
  topN: number;
  /** Whether to include rejected providers in result */
  includeRejected: boolean;
  /** Scoring weights */
  weights: ScoringWeights;
}

/**
 * Default ranker configuration
 */
const DEFAULT_CONFIG: RankerConfig = {
  quoteTimeoutMs: 5000,
  topN: 3,
  includeRejected: true,
  weights: DEFAULT_WEIGHTS,
};

/**
 * Provider ranking engine
 * 
 * Orchestrates the full provider selection pipeline:
 * 1. Get all providers from registry
 * 2. Filter by constraints
 * 3. Fetch quotes from passed providers
 * 4. Normalize prices
 * 5. Score providers
 * 6. Return top N with tradeoff analysis
 */
export class Ranker {
  private filter: ConstraintFilter;
  private normalizer: PriceNormalizer;
  private config: RankerConfig;

  constructor(
    filter: ConstraintFilter = new ConstraintFilter(),
    normalizer?: PriceNormalizer,
    config: Partial<RankerConfig> = {}
  ) {
    this.filter = filter;
    this.normalizer = normalizer || new PriceNormalizer(new TokenPriceService());
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Rank providers for a job request
   * 
   * @param jobRequest - Job requirements
   * @returns Ranking result with recommendations
   */
  async rank(jobRequest: JobRequest): Promise<RankingResult> {
    const startTime = performance.now();

    console.log(`[Ranker] Starting ranking for job ${jobRequest.id}`);
    console.log(`[Ranker] Requirements: ${jobRequest.gpuCount}x GPU, ${jobRequest.durationHours}h`);

    // Step 1: Get all providers from registry
    const allProviders = getAllProviders();
    console.log(`[Ranker] Retrieved ${allProviders.length} providers`);

    // Step 2: Filter by constraints
    const filterResults = this.filter.filter(
      allProviders.map(p => p.getProviderInfo()),
      jobRequest.constraints
    );

    const { passed: passedFilters, rejected: rejectedFilters } = partitionResults(filterResults);
    console.log(`[Ranker] Filtering: ${passedFilters.length} passed, ${rejectedFilters.length} rejected`);

    // Map back to adapters for quote fetching
    const passedAdapters = passedFilters
      .map(f => allProviders.find(p => p.id === f.provider.id))
      .filter((p): p is ProviderAdapter => p !== undefined);

    // Step 3: Fetch quotes from passed providers (parallel with timeout)
    const quoteResults = await this.fetchQuotesParallel(passedAdapters, jobRequest);

    // Separate successful and failed quote fetches
    const successfulQuotes: Array<{ provider: ProviderAdapter; quotes: PriceQuote[] }> = [];
    const failedQuotes: Array<{ provider: ProviderAdapter; error: string }> = [];

    quoteResults.forEach(result => {
      if (result.result && result.result.quotes.length > 0) {
        successfulQuotes.push({
          provider: result.provider,
          quotes: result.result.quotes,
        });
      } else {
        failedQuotes.push({
          provider: result.provider,
          error: result.error || result.timedOut ? 'Request timed out' : 'No quotes available',
        });
      }
    });

    console.log(`[Ranker] Quotes: ${successfulQuotes.length} successful, ${failedQuotes.length} failed`);

    // Step 4: Normalize prices
    const normalizedPrices: Array<{ provider: ProviderAdapter; price: NormalizationResult }> = [];
    
    for (const { provider, quotes } of successfulQuotes) {
      // Use first quote for simplicity (best match)
      const quote = quotes[0];
      const normalized = await this.normalizer.normalizeQuote(quote, jobRequest);
      normalizedPrices.push({ provider, price: normalized });
    }

    // Filter out errors
    const validPrices = normalizedPrices.filter(p => !p.price.hasError);
    console.log(`[Ranker] Normalization: ${validPrices.length} valid prices`);

    // Step 5: Score providers
    const scoredProviders = scoreProviders(
      validPrices.map(p => ({
        provider: p.provider.getProviderInfo(),
        normalizedPrice: p.price,
      })),
      this.config.weights,
      jobRequest.constraints
    );

    console.log(`[Ranker] Scoring: ${scoredProviders.length} providers scored`);

    // Step 6: Select top N with tradeoff analysis
    const topRecommendations = this.getTopRecommendations(
      scoredProviders,
      validPrices.map(p => p.price)
    );

    console.log(`[Ranker] Generated ${topRecommendations.length} recommendations`);

    // Step 7: Build rejected list
    const rejected: RejectedProvider[] = [];

    // Add filtered providers
    rejectedFilters.forEach(r => {
      rejected.push({
        provider: r.provider,
        rejectionReason: r.rejectionReason || 'Failed constraint check',
        failedAt: 'filter',
      });
    });

    // Add failed quote fetches
    failedQuotes.forEach(f => {
      rejected.push({
        provider: f.provider.getProviderInfo(),
        rejectionReason: f.error,
        failedAt: 'scoring',
      });
    });

    const durationMs = Math.round(performance.now() - startTime);

    return {
      recommendations: topRecommendations,
      rejected: this.config.includeRejected ? rejected : [],
      metadata: {
        totalProviders: allProviders.length,
        filteredCount: passedFilters.length,
        scoredCount: scoredProviders.length,
        durationMs,
      },
    };
  }

  /**
   * Fetch quotes from multiple providers in parallel with timeout
   * 
   * @param providers - Provider adapters to query
   * @param jobRequest - Job requirements
   * @returns Array of quote fetch results
   */
  private async fetchQuotesParallel(
    providers: ProviderAdapter[],
    jobRequest: JobRequest
  ): Promise<QuoteFetchResult[]> {
    const quoteRequest: QuoteRequest = {
      gpuType: jobRequest.constraints.requiredGpuType || GpuType.A100_80GB,
      gpuCount: jobRequest.gpuCount,
      durationHours: jobRequest.durationHours,
      region: jobRequest.constraints.preferredRegions?.[0],
      useSpot: jobRequest.constraints.allowSpot ?? false,
    };

    const promises = providers.map(async (provider) => {
      try {
        const result = await this.fetchQuoteWithTimeout(provider, quoteRequest);
        return {
          provider,
          result: result.result,
          error: result.error,
          timedOut: result.timedOut,
        };
      } catch (error) {
        return {
          provider,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          timedOut: false,
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Fetch quote from a single provider with timeout
   * 
   * @param provider - Provider adapter
   * @param request - Quote request
   * @returns Quote result with timeout info
   */
  private async fetchQuoteWithTimeout(
    provider: ProviderAdapter,
    request: QuoteRequest
  ): Promise<{ result: QuoteResult | null; error?: string; timedOut: boolean }> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          result: null,
          error: 'Quote request timed out',
          timedOut: true,
        });
      }, this.config.quoteTimeoutMs);

      provider.getQuotes(request)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve({ result, timedOut: false });
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          resolve({
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            timedOut: false,
          });
        });
    });
  }

  /**
   * Get top N recommendations from scored providers
   * 
   * @param scored - Array of scored providers (already sorted)
   * @param allPrices - All normalized prices for savings calculation
   * @returns Array of recommendations
   */
  private getTopRecommendations(
    scored: ScoredProvider[],
    allPrices: NormalizedPrice[]
  ): ProviderRecommendation[] {
    const topN = Math.min(this.config.topN, scored.length);
    const topScored = scored.slice(0, topN);

    // Find most expensive for savings calculation
    const mostExpensive = allPrices.length > 0
      ? allPrices.reduce((max, p) => 
          p.effectiveUsdPerA100Hour > max.effectiveUsdPerA100Hour ? p : max
        )
      : null;

    return topScored.map((scored, index) => {
      const rank = index + 1;
      const tradeoffs = this.generateTradeoffs(scored, topScored, rank);
      
      // Calculate savings vs most expensive
      let estimatedSavings = 'N/A';
      if (mostExpensive) {
        const currentPrice = scored.normalizedPrice.effectiveUsdPerA100Hour;
        const maxPrice = mostExpensive.effectiveUsdPerA100Hour;
        if (maxPrice > 0) {
          const savingsPercent = ((maxPrice - currentPrice) / maxPrice) * 100;
          estimatedSavings = `${savingsPercent.toFixed(1)}%`;
        }
      }

      return {
        rank,
        provider: scored.provider,
        normalizedPrice: scored.normalizedPrice,
        totalScore: scored.weightedScore,
        scoreBreakdown: scored.breakdown,
        tradeoffs,
        estimatedSavings,
      };
    });
  }

  /**
   * Generate tradeoff descriptions for a recommendation
   * 
   * @param recommendation - The recommendation to describe
   * @param allRecommendations - All top recommendations for comparison
   * @param rank - Rank of this recommendation
   * @returns Array of tradeoff descriptions
   */
  private generateTradeoffs(
    recommendation: ScoredProvider,
    allRecommendations: ScoredProvider[],
    rank: number
  ): string[] {
    const tradeoffs: string[] = [];
    const { provider, factors, normalizedPrice } = recommendation;

    // Price tradeoffs
    const isCheapest = rank === 1 && allRecommendations.length > 1;
    const isMostExpensive = rank === allRecommendations.length && allRecommendations.length > 1;

    if (isCheapest) {
      tradeoffs.push('Best price — most cost-effective option');
    } else if (isMostExpensive) {
      const cheaperOption = allRecommendations[0];
      const priceDiff = ((recommendation.weightedScore - cheaperOption.weightedScore) / cheaperOption.weightedScore * 100);
      tradeoffs.push(`Higher price — consider option 1 for ${Math.abs(priceDiff).toFixed(0)}% savings`);
    } else {
      tradeoffs.push(`Balanced price/performance`);
    }

    // Latency tradeoff
    if (factors.latency >= 90) {
      tradeoffs.push('Lowest latency — optimal for real-time workloads');
    } else if (factors.latency >= 70) {
      tradeoffs.push('Good latency — suitable for most workloads');
    } else {
      tradeoffs.push('Tradeoff: Higher latency — consider for batch workloads');
    }

    // Reputation tradeoff
    if (factors.reputation >= 85) {
      const uptime = provider.metadata.uptimePercentage;
      tradeoffs.push(`Highest reputation${uptime ? ` — ${uptime.toFixed(1)}% uptime` : ''}`);
    } else if (factors.reputation < 60) {
      tradeoffs.push('Tradeoff: Lower reputation — monitor closely');
    }

    // Geography tradeoff
    if (factors.geography >= 80) {
      tradeoffs.push('Strong geographic match — good regional coverage');
    }

    // Hardware tradeoff
    const gpuTypes = provider.capabilities.gpuTypes;
    if (gpuTypes.includes(GpuType.H100) || gpuTypes.includes(GpuType.H200)) {
      tradeoffs.push('Premium hardware — latest generation GPUs');
    } else if (gpuTypes.includes(GpuType.RTX4090) || gpuTypes.includes(GpuType.RTX3090)) {
      tradeoffs.push('Consumer GPU — cost-effective for inference');
    }

    return tradeoffs;
  }

  /**
   * Update ranker configuration
   */
  setConfig(config: Partial<RankerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RankerConfig {
    return { ...this.config };
  }
}

/**
 * Standalone function to get top recommendations
 * 
 * @param jobRequest - Job requirements
 * @param config - Optional ranker configuration
 * @returns Ranking result
 */
export async function rankProviders(
  jobRequest: JobRequest,
  config?: Partial<RankerConfig>
): Promise<RankingResult> {
  const ranker = new Ranker(undefined, undefined, config);
  return ranker.rank(jobRequest);
}

/**
 * Get top N recommendations from scored providers
 * 
 * @param scoredProviders - Array of scored providers
 * @param count - Number of recommendations (default: 3)
 * @returns Top N recommendations
 */
export function getTopRecommendations(
  scoredProviders: ScoredProvider[],
  count: number = 3
): Array<{ provider: ComputeProvider; score: number; rank: number }> {
  return scoredProviders
    .slice(0, count)
    .map((scored, index) => ({
      provider: scored.provider,
      score: scored.weightedScore,
      rank: index + 1,
    }));
}

/**
 * Format ranking result for display
 * 
 * @param result - Ranking result
 * @returns Formatted string
 */
export function formatRankingResult(result: RankingResult): string {
  const lines: string[] = [
    `Provider Ranking Results`,
    `=======================`,
    ``,
    `Top ${result.recommendations.length} Recommendations:`,
  ];

  result.recommendations.forEach(rec => {
    lines.push(`\n#${rec.rank}: ${rec.provider.name}`);
    lines.push(`  Score: ${rec.totalScore}/100`);
    lines.push(`  Price: $${rec.normalizedPrice.effectiveUsdPerA100Hour.toFixed(2)}/GPU-hr`);
    lines.push(`  Savings: ${rec.estimatedSavings} vs most expensive`);
    lines.push(`  Tradeoffs:`);
    rec.tradeoffs.forEach(t => lines.push(`    - ${t}`));
  });

  if (result.rejected.length > 0) {
    lines.push(`\nRejected Providers (${result.rejected.length}):`);
    result.rejected.slice(0, 5).forEach(r => {
      lines.push(`  - ${r.provider.name}: ${r.rejectionReason}`);
    });
    if (result.rejected.length > 5) {
      lines.push(`  ... and ${result.rejected.length - 5} more`);
    }
  }

  lines.push(`\nMetadata:`);
  lines.push(`  Duration: ${result.metadata.durationMs}ms`);
  lines.push(`  Providers: ${result.metadata.totalProviders} total, ${result.metadata.filteredCount} passed filter, ${result.metadata.scoredCount} scored`);

  return lines.join('\n');
}
