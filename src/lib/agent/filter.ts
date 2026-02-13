/**
 * Agent Provider Filtering
 * 
 * Implements AGENT-04: Constraint-aware filtering for provider selection.
 * Filters providers by price, region, GPU type, and pricing model exclusions.
 * 
 * Design:
 * - FilterResult captures pass/fail with detailed rejection reasons
 * - Individual constraint checkers for modularity
 * - ConstraintFilter class for batch processing
 * - Logging for observability and debugging
 */

import { ComputeProvider, GpuType, PricingModel, RegionCode } from '@/types/provider';
import { JobConstraints } from '@/types/job';

/**
 * Result of filtering a single provider against constraints
 */
export interface FilterResult {
  /** The provider that was checked */
  provider: ComputeProvider;
  /** Whether the provider passed all constraints */
  passed: boolean;
  /** List of constraint names that failed */
  failedConstraints: string[];
  /** Human-readable rejection reason (if failed) */
  rejectionReason?: string;
}

/**
 * Performance metrics for filtering operation
 */
export interface FilterMetrics {
  /** Total number of providers checked */
  totalProviders: number;
  /** Number of providers that passed */
  passedCount: number;
  /** Number of providers filtered out */
  rejectedCount: number;
  /** Execution time in milliseconds */
  durationMs: number;
}

/**
 * Constraint filter configuration
 */
export interface FilterConfig {
  /** Whether to log detailed rejection reasons */
  verboseLogging: boolean;
  /** Whether to continue checking after first failure */
  continueOnFailure: boolean;
}

/**
 * Default filter configuration
 */
const DEFAULT_CONFIG: FilterConfig = {
  verboseLogging: true,
  continueOnFailure: true,
};

/**
 * Check if provider meets price constraint
 * 
 * @param provider - Provider to check
 * @param basePrice - Provider's base price for requested GPU
 * @param maxPrice - Maximum acceptable price
 * @returns Object with pass status and rejection reason
 */
export function checkPriceConstraint(
  provider: ComputeProvider,
  basePrice: number,
  maxPrice?: number
): { passed: boolean; reason?: string } {
  if (maxPrice === undefined) {
    return { passed: true };
  }

  if (basePrice <= maxPrice) {
    return { passed: true };
  }

  return {
    passed: false,
    reason: `Price $${basePrice.toFixed(2)} exceeds max $${maxPrice.toFixed(2)}`,
  };
}

/**
 * Check if provider meets region constraint
 * 
 * @param provider - Provider to check
 * @param preferredRegions - List of preferred regions
 * @returns Object with pass status and rejection reason
 */
export function checkRegionConstraint(
  provider: ComputeProvider,
  preferredRegions?: RegionCode[]
): { passed: boolean; reason?: string } {
  if (!preferredRegions || preferredRegions.length === 0) {
    return { passed: true };
  }

  const providerRegions = provider.capabilities.regions;
  const hasMatchingRegion = preferredRegions.some(region => 
    providerRegions.includes(region)
  );

  if (hasMatchingRegion) {
    return { passed: true };
  }

  return {
    passed: false,
    reason: `No instances in preferred regions [${preferredRegions.join(', ')}]`,
  };
}

/**
 * Check if provider offers required GPU type
 * 
 * @param provider - Provider to check
 * @param requiredGpuType - GPU type required
 * @returns Object with pass status and rejection reason
 */
export function checkGpuConstraint(
  provider: ComputeProvider,
  requiredGpuType?: GpuType
): { passed: boolean; reason?: string } {
  if (!requiredGpuType) {
    return { passed: true };
  }

  const availableGpus = provider.capabilities.gpuTypes;
  if (availableGpus.includes(requiredGpuType)) {
    return { passed: true };
  }

  return {
    passed: false,
    reason: `Does not offer ${requiredGpuType}`,
  };
}

/**
 * Check if provider's pricing model is excluded
 * 
 * @param provider - Provider to check
 * @param excludeModels - Pricing models to exclude
 * @returns Object with pass status and rejection reason
 */
export function checkPricingModelConstraint(
  provider: ComputeProvider,
  excludeModels?: PricingModel[]
): { passed: boolean; reason?: string } {
  if (!excludeModels || excludeModels.length === 0) {
    return { passed: true };
  }

  const providerModel = provider.pricingModel;
  if (!excludeModels.includes(providerModel)) {
    return { passed: true };
  }

  return {
    passed: false,
    reason: `Pricing model ${providerModel} excluded by user`,
  };
}

/**
 * Check if provider has available capacity
 * 
 * NOTE: Per user decision, capacity checking is IGNORED for hackathon demo.
 * Always returns true with a comment indicating deferred implementation.
 * 
 * @param _provider - Provider to check (unused)
 * @returns Always returns true
 */
export function checkCapacityConstraint(_provider: ComputeProvider): { 
  passed: boolean; 
  reason?: string 
} {
  // Capacity checking deferred post-hackathon
  // This would check real-time availability from provider APIs
  return { passed: true };
}

/**
 * Constraint filter for batch provider processing
 * 
 * Applies all constraints to a list of providers and returns
 * detailed pass/fail results with rejection reasons.
 */
export class ConstraintFilter {
  private config: FilterConfig;

  constructor(config: Partial<FilterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Filter providers against job constraints
   * 
   * @param providers - Array of providers to filter
   * @param constraints - Job constraints to apply
   * @param basePrices - Map of provider ID to base price (for price checking)
   * @returns Array of filter results with pass/fail status
   */
  filter(
    providers: ComputeProvider[],
    constraints: JobConstraints,
    basePrices: Map<string, number> = new Map()
  ): FilterResult[] {
    const startTime = performance.now();

    console.log(`[ConstraintFilter] Starting filter of ${providers.length} providers`);
    console.log(`[ConstraintFilter] Constraints:`, {
      maxPricePerHour: constraints.maxPricePerHour,
      preferredRegions: constraints.preferredRegions,
      requiredGpuType: constraints.requiredGpuType,
      excludePricingModels: constraints.excludePricingModels,
    });

    const results = providers.map(provider => 
      this.checkProvider(provider, constraints, basePrices)
    );

    const passedCount = results.filter(r => r.passed).length;
    const rejectedCount = results.length - passedCount;
    const durationMs = Math.round(performance.now() - startTime);

    console.log(`[ConstraintFilter] Filter complete: ${passedCount} passed, ${rejectedCount} rejected (${durationMs}ms)`);

    if (this.config.verboseLogging) {
      results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`[ConstraintFilter] Rejected ${r.provider.name}: ${r.rejectionReason}`);
        });
    }

    return results;
  }

  /**
   * Check a single provider against all constraints
   * 
   * @param provider - Provider to check
   * @param constraints - Constraints to apply
   * @param basePrices - Map of provider ID to base price
   * @returns Filter result with pass/fail status
   */
  private checkProvider(
    provider: ComputeProvider,
    constraints: JobConstraints,
    basePrices: Map<string, number>
  ): FilterResult {
    const failedConstraints: string[] = [];
    const failureReasons: string[] = [];

    // Check price constraint
    const basePrice = basePrices.get(provider.id) ?? 0;
    const priceCheck = checkPriceConstraint(
      provider,
      basePrice,
      constraints.maxPricePerHour
    );
    if (!priceCheck.passed) {
      failedConstraints.push('price');
      failureReasons.push(priceCheck.reason!);
      if (!this.config.continueOnFailure) {
        return this.createResult(provider, false, failedConstraints, failureReasons);
      }
    }

    // Check region constraint
    const regionCheck = checkRegionConstraint(
      provider,
      constraints.preferredRegions
    );
    if (!regionCheck.passed) {
      failedConstraints.push('region');
      failureReasons.push(regionCheck.reason!);
      if (!this.config.continueOnFailure) {
        return this.createResult(provider, false, failedConstraints, failureReasons);
      }
    }

    // Check GPU constraint
    const gpuCheck = checkGpuConstraint(
      provider,
      constraints.requiredGpuType
    );
    if (!gpuCheck.passed) {
      failedConstraints.push('gpu');
      failureReasons.push(gpuCheck.reason!);
      if (!this.config.continueOnFailure) {
        return this.createResult(provider, false, failedConstraints, failureReasons);
      }
    }

    // Check pricing model constraint
    const pricingCheck = checkPricingModelConstraint(
      provider,
      constraints.excludePricingModels
    );
    if (!pricingCheck.passed) {
      failedConstraints.push('pricingModel');
      failureReasons.push(pricingCheck.reason!);
      if (!this.config.continueOnFailure) {
        return this.createResult(provider, false, failedConstraints, failureReasons);
      }
    }

    // Check capacity constraint (always passes per user decision)
    const capacityCheck = checkCapacityConstraint(provider);
    if (!capacityCheck.passed) {
      failedConstraints.push('capacity');
      failureReasons.push(capacityCheck.reason!);
    }

    const passed = failedConstraints.length === 0;
    return this.createResult(provider, passed, failedConstraints, failureReasons);
  }

  /**
   * Create a filter result object
   */
  private createResult(
    provider: ComputeProvider,
    passed: boolean,
    failedConstraints: string[],
    failureReasons: string[]
  ): FilterResult {
    return {
      provider,
      passed,
      failedConstraints,
      rejectionReason: failureReasons.length > 0 
        ? failureReasons.join('; ')
        : undefined,
    };
  }

  /**
   * Get metrics from a filter operation
   * 
   * @param results - Filter results
   * @param durationMs - Execution duration
   * @returns Filter metrics
   */
  getMetrics(results: FilterResult[], durationMs: number): FilterMetrics {
    const passedCount = results.filter(r => r.passed).length;
    return {
      totalProviders: results.length,
      passedCount,
      rejectedCount: results.length - passedCount,
      durationMs,
    };
  }
}

/**
 * Standalone function to filter providers by constraints
 * 
 * @param providers - Array of providers to filter
 * @param constraints - Job constraints to apply
 * @param basePrices - Optional map of provider ID to base price
 * @returns Array of filter results
 */
export function filterProviders(
  providers: ComputeProvider[],
  constraints: JobConstraints,
  basePrices?: Map<string, number>
): FilterResult[] {
  const filter = new ConstraintFilter();
  return filter.filter(providers, constraints, basePrices);
}

/**
 * Separate passed and failed providers from filter results
 * 
 * @param results - Filter results
 * @returns Object with passed and rejected arrays
 */
export function partitionResults(results: FilterResult[]): {
  passed: FilterResult[];
  rejected: FilterResult[];
} {
  return {
    passed: results.filter(r => r.passed),
    rejected: results.filter(r => !r.passed),
  };
}

/**
 * Get only the providers that passed filtering
 * 
 * @param results - Filter results
 * @returns Array of passing providers
 */
export function getPassedProviders(results: FilterResult[]): ComputeProvider[] {
  return results
    .filter(r => r.passed)
    .map(r => r.provider);
}

/**
 * Get rejection summary for debugging
 * 
 * @param results - Filter results
 * @returns Object with rejection counts by constraint type
 */
export function getRejectionSummary(results: FilterResult[]): Record<string, number> {
  const summary: Record<string, number> = {};

  results
    .filter(r => !r.passed)
    .forEach(r => {
      r.failedConstraints.forEach(constraint => {
        summary[constraint] = (summary[constraint] || 0) + 1;
      });
    });

  return summary;
}
