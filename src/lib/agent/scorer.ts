/**
 * Agent Provider Scoring
 * 
 * Implements AGENT-05: Weighted scoring algorithm for provider ranking.
 * Scores providers across four factors: price, latency, reputation, and geography.
 * 
 * Design:
 * - Each factor scored 0-100 for comparability
 * - Weights: price (60%), latency (15%), reputation (15%), geography (10%)
 * - ScoreFactors interface for individual factor scores
 * - ScoredProvider interface for complete scoring result
 * - Calculates weighted composite score (0-100)
 */

import { ComputeProvider, RegionCode } from '@/types/provider';
import { NormalizedPrice } from '@/types/pricing';
import { JobConstraints } from '@/types/job';

/**
 * Individual factor scores (0-100 scale)
 */
export interface ScoreFactors {
  /** Price competitiveness (0-100, higher = better value) */
  price: number;
  /** Network latency to target region (0-100, higher = lower latency) */
  latency: number;
  /** Provider reputation based on history (0-100, higher = better) */
  reputation: number;
  /** Geographic diversity match (0-100, higher = better coverage) */
  geography: number;
}

/**
 * Scoring weights for weighted composite calculation
 * Must sum to 1.0
 */
export interface ScoringWeights {
  /** Weight for price factor (default: 0.6) */
  price: number;
  /** Weight for latency factor (default: 0.15) */
  latency: number;
  /** Weight for reputation factor (default: 0.15) */
  reputation: number;
  /** Weight for geography factor (default: 0.10) */
  geography: number;
}

/**
 * Complete scored provider result
 */
export interface ScoredProvider {
  /** The provider that was scored */
  provider: ComputeProvider;
  /** Normalized price information */
  normalizedPrice: NormalizedPrice;
  /** Individual factor scores */
  factors: ScoreFactors;
  /** Weighted composite score (0-100) */
  weightedScore: number;
  /** Raw contribution per factor (for transparency) */
  breakdown: Record<string, number>;
}

/**
 * Default scoring weights per user decision
 * Price priority: 60%, Quality factors: 40%
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  price: 0.6,
  latency: 0.15,
  reputation: 0.15,
  geography: 0.10,
};

/**
 * Validate that weights sum to 1.0
 * 
 * @param weights - Weights to validate
 * @returns True if valid
 * @throws Error if weights don't sum to 1.0
 */
export function validateWeights(weights: ScoringWeights): boolean {
  const sum = weights.price + weights.latency + weights.reputation + weights.geography;
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(`Weights must sum to 1.0, got ${sum}`);
  }
  return true;
}

/**
 * Calculate price score (0-100)
 * 
 * Higher score = lower price = better value
 * Formula: 100 * (1 - (price / maxPrice))
 * 
 * @param normalizedPrice - Provider's normalized price
 * @param allPrices - All prices for normalization context
 * @returns Price score (0-100)
 */
export function scorePrice(
  normalizedPrice: NormalizedPrice,
  allPrices: NormalizedPrice[]
): number {
  // Filter out invalid prices
  const validPrices = allPrices.filter(
    p => p.effectiveUsdPerA100Hour !== Infinity && p.effectiveUsdPerA100Hour > 0
  );

  if (validPrices.length === 0) {
    return 50; // Neutral score if no valid prices
  }

  const prices = validPrices.map(p => p.effectiveUsdPerA100Hour);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  if (priceRange === 0) {
    return 100; // All same price, everyone gets max score
  }

  const providerPrice = normalizedPrice.effectiveUsdPerA100Hour;
  
  // Handle error case
  if (providerPrice === Infinity || providerPrice <= 0) {
    return 0;
  }

  // Score inversely proportional to price within range
  // Best price = 100, Worst price = 0
  const score = 100 * (1 - (providerPrice - minPrice) / priceRange);
  return Math.round(score);
}

/**
 * Calculate latency score based on geographic distance (0-100)
 * 
 * Higher score = lower latency = better performance
 * Base scores by region distance:
 * - Same region: 100
 * - Same continent: 80
 * - Different continent: 50
 * 
 * Adjusted by provider's latency reputation if available
 * 
 * @param providerRegions - Regions where provider operates
 * @param targetRegion - Target/customer region
 * @param providerLatencyRep - Provider's latency reputation (optional)
 * @returns Latency score (0-100)
 */
export function scoreLatency(
  providerRegions: RegionCode[],
  targetRegion?: RegionCode,
  providerLatencyRep?: number
): number {
  if (!targetRegion) {
    // No target region specified, use neutral score
    return 70;
  }

  // Region groups for distance calculation
  const regionGroups: Record<string, RegionCode[]> = {
    'us': ['us-east', 'us-west', 'us-central'],
    'eu': ['eu-west', 'eu-central', 'eu-north'],
    'ap': ['ap-south', 'ap-northeast', 'ap-southeast'],
    'sa': ['sa-east']
  };

  // Find which group the target region belongs to
  const targetGroup = Object.entries(regionGroups).find(([_, regions]) => 
    regions.includes(targetRegion)
  )?.[0] || 'unknown';

  // Check if provider has instances in target region
  const hasSameRegion = providerRegions.includes(targetRegion);
  
  // Check if provider has instances in same continent
  const hasSameContinent = providerRegions.some(region => {
    const providerGroup = Object.entries(regionGroups).find(([_, regions]) => 
      regions.includes(region)
    )?.[0] || 'unknown';
    return providerGroup === targetGroup;
  });

  // Base score by distance
  let baseScore: number;
  if (hasSameRegion) {
    baseScore = 100; // Same region
  } else if (hasSameContinent) {
    baseScore = 80; // Same continent
  } else {
    baseScore = 50; // Different continent
  }

  // Adjust by provider's latency reputation if available
  // providerLatencyRep is expected to be in milliseconds (lower = better)
  if (providerLatencyRep !== undefined && providerLatencyRep > 0) {
    // Typical latency ranges: 20-250ms
    // Score adjustment: < 50ms = +10, 50-100ms = +5, > 200ms = -10
    if (providerLatencyRep < 50) {
      baseScore = Math.min(100, baseScore + 10);
    } else if (providerLatencyRep < 100) {
      baseScore = Math.min(100, baseScore + 5);
    } else if (providerLatencyRep > 200) {
      baseScore = Math.max(0, baseScore - 10);
    }
  }

  return Math.round(baseScore);
}

/**
 * Calculate reputation score (0-100)
 * 
 * Based on:
 * - Provider's reputation score (0-100)
 * - Provider's uptime percentage
 * - New providers get neutral score (50)
 * 
 * @param provider - Provider to score
 * @returns Reputation score (0-100)
 */
export function scoreReputation(provider: ComputeProvider): number {
  const { reputationScore, uptimePercentage, completedJobs } = provider.metadata;

  // New provider detection: low completed jobs or default reputation
  const isNewProvider = 
    (completedJobs === undefined || completedJobs < 10) &&
    reputationScore === 50; // Default/neutral reputation

  if (isNewProvider) {
    return 50; // Neutral score for new providers
  }

  // Base score from reputation
  let score = reputationScore;

  // Adjust by uptime if available
  if (uptimePercentage !== undefined) {
    // Uptime typically 95-99.9%
    // Bonus for high uptime: > 99% = +10, > 98% = +5
    if (uptimePercentage >= 99.9) {
      score = Math.min(100, score + 10);
    } else if (uptimePercentage >= 99.0) {
      score = Math.min(100, score + 5);
    } else if (uptimePercentage < 95.0) {
      score = Math.max(0, score - 10);
    }
  }

  // Boost for established providers with many completed jobs
  if (completedJobs !== undefined && completedJobs > 100) {
    score = Math.min(100, score + 5);
  }

  return Math.round(score);
}

/**
 * Calculate geography score (0-100)
 * 
 * Based on how many preferred regions the provider covers.
 * Formula: 100 * (matchingRegions / totalPreferred)
 * Bonus for geographic diversity (presence in multiple continents)
 * 
 * @param providerRegions - Regions where provider operates
 * @param preferredRegions - User's preferred regions
 * @returns Geography score (0-100)
 */
export function scoreGeography(
  providerRegions: RegionCode[],
  preferredRegions?: RegionCode[]
): number {
  if (!preferredRegions || preferredRegions.length === 0) {
    // No preferences, give neutral score
    return 70;
  }

  // Count matching regions
  const matchingRegions = preferredRegions.filter(region => 
    providerRegions.includes(region)
  );

  // Base score based on coverage ratio
  const coverageRatio = matchingRegions.length / preferredRegions.length;
  let score = 100 * coverageRatio;

  // Bonus for geographic diversity
  const regionGroups: Record<string, RegionCode[]> = {
    'us': ['us-east', 'us-west', 'us-central'],
    'eu': ['eu-west', 'eu-central', 'eu-north'],
    'ap': ['ap-south', 'ap-northeast', 'ap-southeast'],
    'sa': ['sa-east']
  };

  const coveredGroups = new Set<string>();
  providerRegions.forEach(region => {
    const group = Object.entries(regionGroups).find(([_, regions]) => 
      regions.includes(region)
    )?.[0];
    if (group) coveredGroups.add(group);
  });

  // Bonus for covering multiple continents
  if (coveredGroups.size >= 3) {
    score += 10;
  } else if (coveredGroups.size === 2) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Calculate complete score for a provider
 * 
 * @param provider - Provider to score
 * @param normalizedPrice - Provider's normalized price
 * @param allPrices - All prices for context
 * @param weights - Scoring weights
 * @param jobConstraints - Job constraints for context
 * @returns Complete scored provider
 */
export function calculateScore(
  provider: ComputeProvider,
  normalizedPrice: NormalizedPrice,
  allPrices: NormalizedPrice[],
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  jobConstraints?: JobConstraints
): ScoredProvider {
  // Validate weights
  validateWeights(weights);

  // Calculate individual factor scores
  const priceScore = scorePrice(normalizedPrice, allPrices);
  const latencyScore = scoreLatency(
    provider.capabilities.regions,
    jobConstraints?.preferredRegions?.[0],
    provider.metadata.avgLatencyMs
  );
  const reputationScore = scoreReputation(provider);
  const geographyScore = scoreGeography(
    provider.capabilities.regions,
    jobConstraints?.preferredRegions
  );

  const factors: ScoreFactors = {
    price: priceScore,
    latency: latencyScore,
    reputation: reputationScore,
    geography: geographyScore,
  };

  // Calculate weighted score
  const weightedScore = 
    priceScore * weights.price +
    latencyScore * weights.latency +
    reputationScore * weights.reputation +
    geographyScore * weights.geography;

  // Calculate breakdown (raw contribution per factor)
  const breakdown: Record<string, number> = {
    price: Math.round(priceScore * weights.price * 100) / 100,
    latency: Math.round(latencyScore * weights.latency * 100) / 100,
    reputation: Math.round(reputationScore * weights.reputation * 100) / 100,
    geography: Math.round(geographyScore * weights.geography * 100) / 100,
    rawTotal: Math.round(weightedScore * 100) / 100,
  };

  return {
    provider,
    normalizedPrice,
    factors,
    weightedScore: Math.round(weightedScore),
    breakdown,
  };
}

/**
 * Score multiple providers and sort by weighted score
 * 
 * @param providers - Array of providers with normalized prices
 * @param weights - Scoring weights
 * @param jobConstraints - Job constraints for context
 * @returns Array of scored providers sorted by score (highest first)
 */
export function scoreProviders(
  providers: Array<{ provider: ComputeProvider; normalizedPrice: NormalizedPrice }>,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  jobConstraints?: JobConstraints
): ScoredProvider[] {
  if (providers.length === 0) {
    return [];
  }

  const allPrices = providers.map(p => p.normalizedPrice);

  const scored = providers.map((item) =>
    calculateScore(item.provider, item.normalizedPrice, allPrices, weights, jobConstraints)
  );

  // Sort by weighted score descending (highest score first)
  return scored.sort((a: ScoredProvider, b: ScoredProvider) => b.weightedScore - a.weightedScore);
}

/**
 * Get scoring explanation for a provider
 * 
 * @param scored - Scored provider
 * @returns Human-readable explanation
 */
export function getScoringExplanation(scored: ScoredProvider): string {
  const { provider, factors, weightedScore, breakdown } = scored;
  
  const explanations: string[] = [
    `${provider.name}: ${weightedScore}/100`,
    `  Price: ${factors.price}/100 (contribution: ${breakdown.price})`,
    `  Latency: ${factors.latency}/100 (contribution: ${breakdown.latency})`,
    `  Reputation: ${factors.reputation}/100 (contribution: ${breakdown.reputation})`,
    `  Geography: ${factors.geography}/100 (contribution: ${breakdown.geography})`,
  ];

  return explanations.join('\n');
}

/**
 * Compare two scored providers
 * 
 * @param a - First scored provider
 * @param b - Second scored provider
 * @returns Comparison result
 */
export function compareScores(a: ScoredProvider, b: ScoredProvider): number {
  return b.weightedScore - a.weightedScore;
}

/**
 * Get the best scored provider
 * 
 * @param scored - Array of scored providers
 * @returns Best provider or undefined if empty
 */
export function getBestProvider(scored: ScoredProvider[]): ScoredProvider | undefined {
  if (scored.length === 0) return undefined;
  return scored.reduce((best, current) => 
    current.weightedScore > best.weightedScore ? current : best
  );
}
