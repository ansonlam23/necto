/**
 * Agent Orchestrator
 * 
 * Core orchestration layer that coordinates the full agent pipeline:
 * 1. Identity handling (Tracked/Untracked modes)
 * 2. Provider filtering by constraints
 * 3. Parallel quote fetching with timeouts
 * 4. Price normalization to A100-equivalent
 * 5. Provider scoring and ranking
 * 6. 0G Storage upload of reasoning trace
 * 7. Result assembly with top recommendations
 * 
 * This is the single entry point for job processing. All other modules
 * integrate here to provide end-to-end compute routing.
 */

import { ComputeProvider } from '@/types/provider';
import { JobRequest, JobResult, JobStatus } from '@/types/job';
import { PriceQuote, NormalizedPrice } from '@/types/pricing';
import { QuoteRequest, ProviderAdapter } from '@/providers/base';
import { ProviderRegistry, registry, getAllProviders } from '@/lib/provider-registry';
import { PriceNormalizer } from '@/lib/pricing/normalizer';
import { TokenPriceService } from '@/lib/pricing/coingecko';
import { 
  StorageService, 
  uploadReasoningTrace
} from '@/lib/storage';
import { 
  IdentityService
} from '@/lib/identity';
import { 
  ConstraintFilter
} from './filter';
import { 
  ScoringWeights,
  DEFAULT_WEIGHTS 
} from './scorer';
import { 
  Ranker,
  ProviderRecommendation
} from './ranker';
import { 
  generateReasoningTrace
} from './reasoning';
import { ReasoningTrace as StorageReasoningTrace } from '@/types/agent';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorConfig {
  /** Maximum time to wait for quotes per provider (ms) */
  quoteTimeoutMs: number;
  /** Maximum trace size before warning (bytes) */
  traceWarningSize: number;
  /** Maximum trace size before truncation (bytes) */
  traceMaxSize: number;
  /** Number of top recommendations to return */
  topN: number;
  /** Whether to include rejected providers in trace */
  includeRejected: boolean;
  /** Scoring weights for provider ranking */
  weights: ScoringWeights;
}

/**
 * Pipeline step timing metrics
 */
export interface PipelineMetrics {
  /** Identity processing duration */
  identityMs: number;
  /** Provider filtering duration */
  filterMs: number;
  /** Quote fetching duration */
  quotesMs: number;
  /** Price normalization duration */
  normalizeMs: number;
  /** Scoring and ranking duration */
  rankMs: number;
  /** Trace generation duration */
  traceMs: number;
  /** 0G upload duration */
  uploadMs: number;
  /** Total pipeline duration */
  totalMs: number;
}

/**
 * Pipeline execution result with detailed metrics
 */
export interface OrchestratorResult extends JobResult {
  /** Provider recommendations (top N) */
  recommendations: ProviderRecommendation[];
  /** 0G Storage hash for reasoning trace */
  reasoningHash: string;
  /** Pipeline execution metrics */
  metrics: PipelineMetrics;
  /** Number of providers at each stage */
  providerCounts: {
    total: number;
    passedFilter: number;
    quoted: number;
    normalized: number;
    scored: number;
  };
}

/**
 * Default orchestrator configuration
 */
const DEFAULT_CONFIG: OrchestratorConfig = {
  quoteTimeoutMs: 5000,
  traceWarningSize: 5 * 1024 * 1024, // 5MB
  traceMaxSize: 9 * 1024 * 1024, // 9MB
  topN: 3,
  includeRejected: true,
  weights: DEFAULT_WEIGHTS,
};

/**
 * Agent Orchestrator
 * 
 * Coordinates the full compute routing pipeline from job request
 * to provider recommendation with 0G Storage audit trail.
 */
export class AgentOrchestrator {
  private config: OrchestratorConfig;

  constructor(
    private providerRegistry: ProviderRegistry = registry,
    private priceNormalizer: PriceNormalizer = new PriceNormalizer(new TokenPriceService()),
    private ranker: Ranker = new Ranker(),
    private storageService: StorageService = storageService,
    private identityService: IdentityService = identityService,
    config: Partial<OrchestratorConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process a job request through the full pipeline
   * 
   * Pipeline:
   * 1. Handle identity (Tracked/Untracked mode)
   * 2. Get all providers from registry
   * 3. Filter by constraints
   * 4. Fetch quotes in parallel with timeout
   * 5. Normalize prices to A100-equivalent
   * 6. Score and rank providers
   * 7. Generate reasoning trace
   * 8. Upload trace to 0G Storage
   * 9. Assemble final result
   * 
   * @param request - Job request with constraints
   * @returns Job result with recommendations and reasoning hash
   */
  async processJob(request: JobRequest): Promise<OrchestratorResult> {
    const pipelineStart = Date.now();
    const stepTimings: Partial<PipelineMetrics> = {};

    console.log('[Agent] Starting job processing:', request.id);
    console.log('[Agent] Requirements:', {
      gpuCount: request.gpuCount,
      durationHours: request.durationHours,
      identityMode: request.constraints.identityMode,
    });

    try {
      // Step 1: Handle identity (AGENT-06)
      console.log('[Agent] Processing identity...');
      const identityStart = Date.now();
      
      const identity = this.identityService.createIdentity({
        walletAddress: request.buyerAddress,
        organizationId: request.teamMemberId ? 'team-' + request.teamMemberId : undefined,
        teamMemberId: request.teamMemberId,
        mode: request.constraints.identityMode
      });
      
      stepTimings.identityMs = Date.now() - identityStart;
      console.log('[Agent] Identity created:', identity.auditId, `(${request.constraints.identityMode})`);

      // Step 2: Get all providers (AGENT-01)
      console.log('[Agent] Fetching providers...');
      const allProviders = getAllProviders();
      console.log(`[Agent] Found ${allProviders.length} providers in registry`);

      // Step 3: Filter by constraints (AGENT-04)
      console.log('[Agent] Filtering providers...');
      const filterStart = Date.now();
      
      const filter = new ConstraintFilter();
      const filterResults = filter.filter(
        allProviders.map(p => p.getProviderInfo()),
        request.constraints
      );
      
      const passedProviders = filterResults
        .filter(r => r.passed)
        .map(r => r.provider);
      const rejectedProviders = filterResults.filter(r => !r.passed);
      
      stepTimings.filterMs = Date.now() - filterStart;
      console.log(`[Agent] Filtering: ${passedProviders.length} passed, ${rejectedProviders.length} rejected (${stepTimings.filterMs}ms)`);

      // Step 4: Get quotes from passed providers
      console.log('[Agent] Getting quotes from', passedProviders.length, 'providers...');
      const quotesStart = Date.now();
      
      const quoteRequests = passedProviders.map(provider => ({
        provider,
        request: {
          gpuType: request.constraints.requiredGpuType || provider.capabilities.gpuTypes[0],
          gpuCount: request.gpuCount,
          durationHours: request.durationHours,
          region: request.constraints.preferredRegions?.[0],
          useSpot: false
        } as QuoteRequest
      }));

      // Fetch quotes in parallel with timeout
      const quoteResults = await Promise.allSettled(
        quoteRequests.map(async ({ provider, request: quoteReq }) => {
          const adapter = allProviders.find(p => p.id === provider.id);
          if (!adapter) return null;
          
          try {
            return await Promise.race([
              adapter.getQuotes(quoteReq),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), this.config.quoteTimeoutMs)
              )
            ]);
          } catch (error) {
            console.warn(`[Agent] Quote fetch failed for ${provider.id}:`, error);
            return null;
          }
        })
      );

      stepTimings.quotesMs = Date.now() - quotesStart;
      
      // Count successful/failed quote fetches
      const successfulQuotes = quoteResults.filter(
        r => r.status === 'fulfilled' && r.value && (r.value as { quotes: unknown[] }).quotes.length > 0
      );
      console.log(`[Agent] Quotes: ${successfulQuotes.length}/${quoteRequests.length} successful (${stepTimings.quotesMs}ms)`);

      // Step 5: Normalize prices (AGENT-02, AGENT-03)
      console.log('[Agent] Normalizing prices...');
      const normalizeStart = Date.now();
      
      const validQuotes: PriceQuote[] = [];
      quoteResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const quoteResult = result.value as { quotes: PriceQuote[] };
          validQuotes.push(...quoteResult.quotes);
        }
      });

      const normalizedPrices = await this.priceNormalizer.normalizeMultipleQuotes(
        validQuotes,
        request
      );
      
      stepTimings.normalizeMs = Date.now() - normalizeStart;
      console.log(`[Agent] Normalized ${normalizedPrices.length} prices (${stepTimings.normalizeMs}ms)`);

      // Step 6: Score and rank providers (AGENT-05)
      console.log('[Agent] Ranking providers...');
      const rankStart = Date.now();

      // Provider adapters already resolved in quote fetching step

      // Use ranker to get full ranking result
      const rankingResult = await this.ranker.rank(request);
      
      stepTimings.rankMs = Date.now() - rankStart;
      console.log(`[Agent] Ranked ${rankingResult.recommendations.length} providers (${stepTimings.rankMs}ms)`);

      // Step 7: Generate reasoning trace (0G-01)
      console.log('[Agent] Generating reasoning trace...');
      const traceStart = Date.now();
      
      // Build scored providers array for trace
      const scoredProviders: Array<{
        provider: ComputeProvider;
        normalizedPrice: NormalizedPrice;
        factors: { price: number; latency: number; reputation: number; geography: number };
        weightedScore: number;
      }> = rankingResult.recommendations.map(rec => ({
        provider: rec.provider,
        normalizedPrice: rec.normalizedPrice,
        factors: {
          price: rec.scoreBreakdown['price'] || 0,
          latency: rec.scoreBreakdown['latency'] || 0,
          reputation: rec.scoreBreakdown['reputation'] || 0,
          geography: rec.scoreBreakdown['geography'] || 0,
        },
        weightedScore: rec.totalScore,
      }));

      const trace = generateReasoningTrace({
        jobRequest: request,
        filterResults,
        scoredProviders,
        weights: this.config.weights,
        duration: Date.now() - pipelineStart,
        rankingResult
      });
      
      stepTimings.traceMs = Date.now() - traceStart;

      // Step 7b: Validate trace size before upload
      const traceSize = JSON.stringify(trace).length;
      if (traceSize > this.config.traceWarningSize) {
        console.warn('[Agent] Trace size', traceSize, 'approaching 0G limits');
      }
      if (traceSize > this.config.traceMaxSize) {
        console.warn('[Agent] Trace too large, truncating...');
        trace.rejected = trace.rejected.slice(0, 3);
      }

      // Step 8: Upload to 0G Storage (0G-01, 0G-02)
      console.log('[Agent] Uploading to 0G...');
      const uploadStart = Date.now();
      
      let reasoningHash: string;
      try {
        reasoningHash = await uploadReasoningTrace(trace as unknown as StorageReasoningTrace);
        console.log('[Agent] Uploaded to 0G, hash:', reasoningHash);
      } catch (error) {
        console.error('[Agent] 0G upload failed:', error);
        reasoningHash = 'upload-failed-' + Date.now();
      }
      
      stepTimings.uploadMs = Date.now() - uploadStart;

      // Step 9: Build result
      const totalDuration = Date.now() - pipelineStart;
      const topRecommendation = rankingResult.recommendations[0];

      if (!topRecommendation) {
        throw new Error('No providers available for this job request');
      }

      const totalCost = topRecommendation.normalizedPrice.effectiveUsdPerA100Hour * 
                       request.durationHours * request.gpuCount;

      const result: OrchestratorResult = {
        jobId: request.id,
        selectedProviderId: topRecommendation.provider.id,
        selectedProviderName: topRecommendation.provider.name,
        selectedProviderType: topRecommendation.provider.type,
        normalizedPrice: topRecommendation.normalizedPrice,
        totalCost,
        status: JobStatus.CONFIRMED,
        reasoningHash,
        createdAt: new Date(),
        recommendations: rankingResult.recommendations,
        metrics: {
          identityMs: stepTimings.identityMs || 0,
          filterMs: stepTimings.filterMs || 0,
          quotesMs: stepTimings.quotesMs || 0,
          normalizeMs: stepTimings.normalizeMs || 0,
          rankMs: stepTimings.rankMs || 0,
          traceMs: stepTimings.traceMs || 0,
          uploadMs: stepTimings.uploadMs || 0,
          totalMs: totalDuration,
        },
        providerCounts: {
          total: allProviders.length,
          passedFilter: passedProviders.length,
          quoted: validQuotes.length,
          normalized: normalizedPrices.filter(p => !p.hasError).length,
          scored: scoredProviders.length,
        },
      };

      console.log('[Agent] Job processed in', totalDuration, 'ms');
      console.log('[Agent] Selected:', topRecommendation.provider.name, 
                 '($' + totalCost.toFixed(2), 'total)');

      return result;

    } catch (error) {
      console.error('[Agent] Pipeline error:', error);
      
      // Return partial result if possible, otherwise throw structured error
      if (error instanceof Error && error.message === 'No providers available for this job request') {
        throw error;
      }
      
      // For other errors, throw with context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Agent processing failed: ${errorMessage}`);
    }
  }

  /**
   * Get current orchestrator configuration
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Update orchestrator configuration
   */
  setConfig(config: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if storage service is initialized
   */
  isStorageInitialized(): boolean {
    return this.storageService.isInitialized();
  }

  /**
   * Initialize storage service for 0G uploads
   */
  async initializeStorage(): Promise<void> {
    if (!this.storageService.isInitialized()) {
      await this.storageService.initialize();
    }
  }
}

/**
 * Standalone function to process a job request
 * 
 * Uses default orchestrator instance with all dependencies.
 * 
 * @param request - Job request
 * @returns Job result with recommendations
 */
export async function processJobRequest(request: JobRequest): Promise<OrchestratorResult> {
  const orchestrator = new AgentOrchestrator();
  return orchestrator.processJob(request);
}

/**
 * Global orchestrator instance
 * 
 * Use this for most operations unless you need custom configuration.
 */
export const orchestrator = new AgentOrchestrator();
