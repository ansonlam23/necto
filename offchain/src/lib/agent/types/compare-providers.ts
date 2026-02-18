/**
 * @title Compare Providers Types
 * @notice Shared types for provider comparison (client-safe)
 * @dev These types can be imported by both client and server code
 */

import { JobRequirements } from '@/lib/akash/sdl-generator';
import { SelectionWeights } from '../provider-selection';

/**
 * Parameters for comparing providers
 */
export interface CompareProvidersParams {
  /** Hardware and software requirements */
  requirements: JobRequirements;
  /** Provider IDs to compare (e.g., ['akash', 'ionet']) */
  providersToCompare: string[];
  /** Optional custom weights for scoring */
  weights?: SelectionWeights;
}

/**
 * Provider comparison result
 */
export interface ProviderComparison {
  /** Provider identifier */
  provider: string;
  /** Provider name */
  name: string;
  /** Whether this provider can handle the workload */
  suitable: boolean;
  /** Suitability score (0-100) */
  score: number;
  /** Estimated cost in USD per hour */
  estimatedCost: number;
  /** Estimated time to deploy */
  timeToDeploy: string;
  /** Advantages of this provider */
  pros: string[];
  /** Disadvantages of this provider */
  cons: string[];
  /** Detailed assessment */
  assessment: string;
}

/**
 * Result from compare providers tool
 */
export interface CompareProvidersResult {
  /** Whether comparison was successful */
  success: boolean;
  /** Comparison results for each provider */
  comparisons: ProviderComparison[];
  /** Recommended provider (highest score) */
  recommended?: string;
  /** Error message if failed */
  error?: string;
}
