/**
 * Agent reasoning and ranking type definitions
 * Handles provider scoring, evaluation, and decision tracing
 */

import { ComputeProvider, ProviderInstance, GpuType } from './provider';
import { NormalizedPrice } from './pricing';
import { JobConstraints } from './job';

/** Ranking weights for provider evaluation (must sum to 1.0) */
export interface RankingWeights {
  /** Price importance (0-1) */
  price: number;
  /** Latency importance (0-1) */
  latency: number;
  /** Reputation importance (0-1) */
  reputation: number;
  /** Geography importance (0-1) */
  geography: number;
}

/** Individual provider evaluation */
export interface ProviderEvaluation {
  /** Provider being evaluated */
  provider: ComputeProvider;
  /** Specific instance evaluated */
  instance: ProviderInstance;
  /** Normalized price for comparison */
  normalizedPrice: NormalizedPrice;
  /** Individual factor scores (0-100) */
  scores: {
    /** Price competitiveness score */
    price: number;
    /** Network latency score */
    latency: number;
    /** Provider reputation score */
    reputation: number;
    /** Geographic preference score */
    geography: number;
  };
  /** Reason for rejection if filtered out */
  rejectionReason?: string;
}

/** Final provider ranking entry */
export interface ProviderScore {
  /** Provider identifier */
  providerId: string;
  /** Provider display name */
  providerName: string;
  /** Composite total score (0-100) */
  totalScore: number;
  /** Normalized price information */
  normalizedPrice: NormalizedPrice;
  /** Tradeoff descriptions */
  tradeoffs: string[];
  /** Individual factor scores */
  breakdown: {
    price: number;
    latency: number;
    reputation: number;
    geography: number;
  };
}

/** Reasoning trace for 0G Storage upload */
export interface ReasoningTrace {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Job identifier */
  jobId: string;
  /** Number of providers queried */
  providerCount: number;
  /** Query constraints used */
  query: JobConstraints;
  /** Ranking weights applied */
  weights: RankingWeights;
  /** Top candidates considered (up to 5) */
  candidates: ProviderEvaluation[];
  /** Rejected providers with reasons */
  rejected: ProviderEvaluation[];
  /** Final ranking (top 3) */
  finalRanking: ProviderScore[];
  /** Metadata about the agent */
  metadata: {
    /** Agent version identifier */
    agentVersion: string;
    /** Calculation time in milliseconds */
    calculationTimeMs: number;
    /** Number of providers filtered out */
    filteredCount: number;
  };
}

// FilterResult and AggregationResult are exported from ./pricing
