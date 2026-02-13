/**
 * Agent Module
 * 
 * Provider ranking engine for intelligent compute selection.
 * Exports filtering, scoring, ranking, and reasoning components.
 * 
 * Usage:
 * ```typescript
 * import { Ranker, filterProviders, scoreProviders } from '@/lib/agent';
 * 
 * const ranker = new Ranker();
 * const result = await ranker.rank(jobRequest);
 * ```
 */

// Filter exports
export {
  ConstraintFilter,
  filterProviders,
  partitionResults,
  getPassedProviders,
  getRejectionSummary,
  checkPriceConstraint,
  checkRegionConstraint,
  checkGpuConstraint,
  checkPricingModelConstraint,
  checkCapacityConstraint,
} from './filter';

export type {
  FilterResult,
  FilterMetrics,
  FilterConfig,
} from './filter';

// Scorer exports
export {
  scoreProviders,
  calculateScore,
  scorePrice,
  scoreLatency,
  scoreReputation,
  scoreGeography,
  validateWeights,
  getScoringExplanation,
  compareScores,
  getBestProvider,
  DEFAULT_WEIGHTS,
} from './scorer';

export type {
  ScoreFactors,
  ScoringWeights,
  ScoredProvider,
} from './scorer';

// Ranker exports
export {
  Ranker,
  rankProviders,
  getTopRecommendations,
  formatRankingResult,
} from './ranker';

export type {
  ProviderRecommendation,
  RejectedProvider,
  RankingResult,
  RankerConfig,
} from './ranker';

// Reasoning exports
export {
  generateReasoningTrace,
  validateReasoningTrace,
  formatTradeoffs,
  summarizeRejection,
  traceToJson,
  traceFromJson,
  summarizeTrace,
  extractTraceMetrics,
} from './reasoning';

export type {
  TraceCandidate,
  TraceRanking,
  ReasoningTrace,
  GenerateTraceParams,
} from './reasoning';
