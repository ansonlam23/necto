/**
 * Agent Module
 * 
 * Provider ranking engine for intelligent compute selection.
 * Exports filtering, scoring, ranking, reasoning, and orchestration components.
 * 
 * Usage:
 * ```typescript
 * import { Ranker, filterProviders, scoreProviders, submitJob } from '@/lib/agent';
 * 
 * // Use the orchestrator for full pipeline
 * const result = await submitJob(jobRequest);
 * 
 * // Or use individual components
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

// Orchestrator exports
export {
  AgentOrchestrator,
  processJobRequest,
  orchestrator,
} from './orchestrator';

export type {
  OrchestratorConfig,
  PipelineMetrics,
  OrchestratorResult,
} from './orchestrator';

// Convenience functions for common use cases
import { orchestrator } from './orchestrator';
import { JobRequest, IdentityMode } from '@/types/job';
import { JobConstraints } from '@/types/job';
import { ProviderRecommendation } from './ranker';

/**
 * Submit a job request to the agent
 * 
 * Convenience wrapper around orchestrator.processJob()
 * 
 * @param request - Job request parameters
 * @returns Job result with recommendations and reasoning hash
 * 
 * @example
 * ```typescript
 * const result = await submitJob({
 *   id: 'job-123',
 *   buyerAddress: '0x...',
 *   gpuCount: 2,
 *   durationHours: 24,
 *   constraints: {
 *     identityMode: IdentityMode.TRACKED,
 *     requiredGpuType: GpuType.A100_80GB
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export async function submitJob(request: JobRequest) {
  return orchestrator.processJob(request);
}

/**
 * Get provider recommendations without full job submission
 * 
 * Use this for preview/dry-run scenarios where you want to see
 * recommendations without creating a job record.
 * 
 * @param constraints - Job constraints for filtering/ranking
 * @param gpuCount - Number of GPUs needed
 * @param durationHours - Duration in hours
 * @returns Array of provider recommendations
 * 
 * @example
 * ```typescript
 * const recommendations = await getRecommendations(
 *   {
 *     identityMode: IdentityMode.UNTRACKED,
 *     requiredGpuType: GpuType.A100_80GB,
 *     maxPricePerHour: 5.0
 *   },
 *   4,  // gpuCount
 *   12  // durationHours
 * );
 * ```
 */
export async function getRecommendations(
  constraints: JobConstraints,
  gpuCount: number = 1,
  durationHours: number = 1
): Promise<ProviderRecommendation[]> {
  // Create a mock request for preview
  const mockRequest: JobRequest = {
    id: `preview-${Date.now()}`,
    buyerAddress: '0x0000000000000000000000000000000000000000',
    gpuCount,
    durationHours,
    constraints,
    createdAt: new Date(),
  };

  const result = await orchestrator.processJob(mockRequest);
  return result.recommendations || [];
}

// Re-export identity mode for convenience
export { IdentityMode } from '@/types/job';
