/**
 * Agent Reasoning Trace Generation
 * 
 * Implements 0G-01: Full decision tree capture for 0G Storage.
 * Captures every provider checked, rejection reasons, and final ranking.
 * 
 * Design:
 * - Complete trace with timestamp, job ID, and query parameters
 * - Top 5 candidates with scores and prices
 * - Rejected providers with reasons
 * - Final ranking (top 3)
 * - Metadata for verification
 */

import { JobRequest, JobConstraints, IdentityMode } from '@/types/job';
import { ComputeProvider, GpuType, RegionCode, PricingModel } from '@/types/provider';
import { NormalizedPrice } from '@/types/pricing';
import { ScoringWeights, ScoreFactors } from './scorer';
import { RankingResult, ProviderRecommendation } from './ranker';
import { FilterResult } from './filter';

/**
 * Candidate provider in reasoning trace
 */
export interface TraceCandidate {
  /** Provider identifier */
  providerId: string;
  /** Provider display name */
  providerName: string;
  /** Raw price per GPU hour in USD */
  rawPrice: number | null;
  /** Normalized price to A100 equivalent */
  normalizedPrice: number | null;
  /** Individual factor scores (if scored) */
  scores: Partial<ScoreFactors>;
  /** Rejection reason (if rejected) */
  rejectionReason?: string;
}

/**
 * Final ranking entry in trace
 */
export interface TraceRanking {
  /** Provider identifier */
  providerId: string;
  /** Provider display name */
  providerName: string;
  /** Total weighted score */
  totalScore: number;
  /** Normalized price information */
  normalizedPrice: NormalizedPrice;
  /** Rank position */
  rank: number;
}

/**
 * Complete reasoning trace for 0G Storage
 */
export interface ReasoningTrace {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Job identifier */
  jobId: string;
  /** Total number of providers queried */
  providerCount: number;
  /** Query parameters used */
  query: {
    gpuType?: GpuType;
    region?: RegionCode[];
    duration: number;
    identityMode: IdentityMode;
  };
  /** Ranking weights applied */
  weights: ScoringWeights;
  /** Top candidates considered (up to 5) */
  candidates: TraceCandidate[];
  /** Rejected providers with reasons */
  rejected: TraceCandidate[];
  /** Final ranking (top 3) */
  finalRanking: TraceRanking[];
  /** Additional metadata */
  metadata: {
    /** Agent version identifier */
    agentVersion: string;
    /** Calculation time in milliseconds */
    calculationTimeMs: number;
    /** Number of providers that passed filtering */
    filteredCount: number;
    /** Number of providers scored */
    scoredCount: number;
  };
}

/**
 * Generate a complete reasoning trace
 * 
 * @param params - Trace generation parameters
 * @returns Complete reasoning trace
 */
export interface GenerateTraceParams {
  /** Original job request */
  jobRequest: JobRequest;
  /** Filter results from constraint checking */
  filterResults: FilterResult[];
  /** Scored providers */
  scoredProviders: Array<{
    provider: ComputeProvider;
    normalizedPrice: NormalizedPrice;
    factors: ScoreFactors;
    weightedScore: number;
  }>;
  /** Weights used in scoring */
  weights: ScoringWeights;
  /** Execution duration in milliseconds */
  duration: number;
  /** Final ranking result */
  rankingResult?: RankingResult;
}

/**
 * Generate a complete reasoning trace for 0G Storage
 * 
 * @param params - Trace generation parameters
 * @returns Complete reasoning trace
 */
export function generateReasoningTrace(params: GenerateTraceParams): ReasoningTrace {
  const { jobRequest, filterResults, scoredProviders, weights, duration, rankingResult } = params;

  // Build candidates list (top 5 from scored providers)
  const candidates: TraceCandidate[] = scoredProviders.slice(0, 5).map(scored => ({
    providerId: scored.provider.id,
    providerName: scored.provider.name,
    rawPrice: scored.normalizedPrice.usdPerGpuHour,
    normalizedPrice: scored.normalizedPrice.effectiveUsdPerA100Hour,
    scores: scored.factors,
  }));

  // Build rejected list from filter results
  const rejectedResults = filterResults.filter(r => !r.passed);
  const rejected: TraceCandidate[] = rejectedResults.slice(0, 10).map(result => ({
    providerId: result.provider.id,
    providerName: result.provider.name,
    rawPrice: null,
    normalizedPrice: null,
    scores: {},
    rejectionReason: result.rejectionReason,
  }));

  // Add scoring rejections if any scored providers have issues
  const scoredWithErrors = scoredProviders.filter(
    s => s.normalizedPrice.effectiveUsdPerA100Hour === Infinity || 
          s.weightedScore === 0
  );
  
  scoredWithErrors.forEach(scored => {
    rejected.push({
      providerId: scored.provider.id,
      providerName: scored.provider.name,
      rawPrice: scored.normalizedPrice.usdPerGpuHour,
      normalizedPrice: scored.normalizedPrice.effectiveUsdPerA100Hour,
      scores: scored.factors,
      rejectionReason: 'Price normalization failed or zero score',
    });
  });

  // Build final ranking
  let finalRanking: TraceRanking[] = [];
  
  if (rankingResult) {
    // Use provided ranking result
    finalRanking = rankingResult.recommendations.map(rec => ({
      providerId: rec.provider.id,
      providerName: rec.provider.name,
      totalScore: rec.totalScore,
      normalizedPrice: rec.normalizedPrice,
      rank: rec.rank,
    }));
  } else {
    // Build from scored providers
    finalRanking = scoredProviders.slice(0, 3).map((scored, index) => ({
      providerId: scored.provider.id,
      providerName: scored.provider.name,
      totalScore: scored.weightedScore,
      normalizedPrice: scored.normalizedPrice,
      rank: index + 1,
    }));
  }

  const passedFilters = filterResults.filter(r => r.passed);

  const trace: ReasoningTrace = {
    timestamp: new Date().toISOString(),
    jobId: jobRequest.id,
    providerCount: filterResults.length,
    query: {
      gpuType: jobRequest.constraints.requiredGpuType,
      region: jobRequest.constraints.preferredRegions,
      duration: jobRequest.durationHours,
      identityMode: jobRequest.constraints.identityMode,
    },
    weights,
    candidates,
    rejected,
    finalRanking,
    metadata: {
      agentVersion: '1.0.0',
      calculationTimeMs: duration,
      filteredCount: passedFilters.length,
      scoredCount: scoredProviders.length,
    },
  };

  // Validate the trace
  validateReasoningTrace(trace);

  return trace;
}

/**
 * Validate a reasoning trace has all required fields
 * 
 * @param trace - Trace to validate
 * @throws Error if validation fails
 */
export function validateReasoningTrace(trace: ReasoningTrace): void {
  const requiredFields: Array<keyof ReasoningTrace> = [
    'timestamp',
    'jobId',
    'providerCount',
    'query',
    'weights',
    'candidates',
    'rejected',
    'finalRanking',
    'metadata',
  ];

  for (const field of requiredFields) {
    if (trace[field] === undefined || trace[field] === null) {
      throw new Error(`Reasoning trace missing required field: ${field}`);
    }
  }

  // Validate timestamp format (ISO 8601)
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!timestampRegex.test(trace.timestamp)) {
    throw new Error('Reasoning trace timestamp must be ISO 8601 format');
  }

  // Validate provider IDs are non-empty strings
  trace.candidates.forEach((candidate, index) => {
    if (!candidate.providerId || typeof candidate.providerId !== 'string') {
      throw new Error(`Candidate ${index} has invalid providerId`);
    }
  });

  trace.finalRanking.forEach((rank, index) => {
    if (!rank.providerId || typeof rank.providerId !== 'string') {
      throw new Error(`Ranking ${index} has invalid providerId`);
    }
  });
}

/**
 * Format tradeoffs as human-readable markdown
 * 
 * @param recommendations - Provider recommendations
 * @returns Markdown formatted string
 */
export function formatTradeoffs(recommendations: ProviderRecommendation[]): string {
  const lines: string[] = [
    '# Provider Recommendations',
    '',
    `Generated ${new Date().toISOString()}`,
    '',
  ];

  recommendations.forEach(rec => {
    lines.push(`## #${rec.rank}: ${rec.provider.name}`);
    lines.push('');
    lines.push(`**Score:** ${rec.totalScore}/100`);
    lines.push(`**Price:** $${rec.normalizedPrice.effectiveUsdPerA100Hour.toFixed(2)}/GPU-hr`);
    lines.push(`**Savings:** ${rec.estimatedSavings} vs most expensive`);
    lines.push('');
    lines.push('**Tradeoffs:**');
    rec.tradeoffs.forEach(tradeoff => {
      lines.push(`- ${tradeoff}`);
    });
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Summarize rejection reason for user display
 * 
 * @param reason - Technical rejection reason
 * @returns User-friendly summary
 */
export function summarizeRejection(reason: string): string {
  const summaries: Record<string, string> = {
    'price': 'Price exceeds your budget',
    'region': 'Not available in your preferred region',
    'gpu': 'Does not offer your required GPU type',
    'pricingModel': 'Uses a pricing model you excluded',
    'capacity': 'Currently at capacity',
  };

  // Check if reason contains any known patterns
  for (const [key, summary] of Object.entries(summaries)) {
    if (reason.toLowerCase().includes(key.toLowerCase())) {
      return summary;
    }
  }

  // Return truncated original if no match
  if (reason.length > 50) {
    return reason.substring(0, 50) + '...';
  }

  return reason;
}

/**
 * Convert reasoning trace to JSON string
 * 
 * @param trace - Reasoning trace
 * @returns JSON string
 */
export function traceToJson(trace: ReasoningTrace): string {
  return JSON.stringify(trace, null, 2);
}

/**
 * Parse reasoning trace from JSON string
 * 
 * @param json - JSON string
 * @returns Parsed reasoning trace
 * @throws Error if parsing or validation fails
 */
export function traceFromJson(json: string): ReasoningTrace {
  const parsed = JSON.parse(json) as ReasoningTrace;
  validateReasoningTrace(parsed);
  return parsed;
}

/**
 * Create a summary of the reasoning trace
 * 
 * @param trace - Reasoning trace
 * @returns Human-readable summary
 */
export function summarizeTrace(trace: ReasoningTrace): string {
  const lines: string[] = [
    `Reasoning Trace Summary for Job ${trace.jobId}`,
    `Timestamp: ${trace.timestamp}`,
    ``,
    `Query:`,
    `  GPU: ${trace.query.gpuType || 'Any'}`,
    `  Duration: ${trace.query.duration}h`,
    `  Identity: ${trace.query.identityMode}`,
    ``,
    `Results:`,
    `  Total providers: ${trace.providerCount}`,
    `  Passed filter: ${trace.metadata.filteredCount}`,
    `  Scored: ${trace.metadata.scoredCount}`,
    ``,
    `Top Recommendations:`,
  ];

  trace.finalRanking.forEach(rank => {
    lines.push(`  #${rank.rank}: ${rank.providerName} (${rank.totalScore} pts)`);
  });

  if (trace.rejected.length > 0) {
    lines.push('');
    lines.push(`Rejected (${trace.rejected.length}):`);
    trace.rejected.slice(0, 5).forEach(r => {
      lines.push(`  - ${r.providerName}: ${summarizeRejection(r.rejectionReason || 'Unknown')}`);
    });
    if (trace.rejected.length > 5) {
      lines.push(`  ... and ${trace.rejected.length - 5} more`);
    }
  }

  lines.push('');
  lines.push(`Calculation time: ${trace.metadata.calculationTimeMs}ms`);

  return lines.join('\n');
}

/**
 * Extract key metrics from trace for analytics
 * 
 * @param trace - Reasoning trace
 * @returns Key metrics
 */
export function extractTraceMetrics(trace: ReasoningTrace): {
  filterPassRate: number;
  averageScore: number;
  topProviderId: string;
  priceRange: { min: number; max: number };
} {
  const filterPassRate = trace.providerCount > 0
    ? trace.metadata.filteredCount / trace.providerCount
    : 0;

  const scores = trace.finalRanking.map(r => r.totalScore);
  const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  const topProviderId = trace.finalRanking[0]?.providerId || '';

  const validPrices = trace.candidates
    .filter(c => c.normalizedPrice !== null && c.normalizedPrice !== Infinity)
    .map(c => c.normalizedPrice as number);

  const priceRange = validPrices.length > 0
    ? { min: Math.min(...validPrices), max: Math.max(...validPrices) }
    : { min: 0, max: 0 };

  return {
    filterPassRate,
    averageScore,
    topProviderId,
    priceRange,
  };
}
