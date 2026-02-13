/**
 * Job and Identity Type Definitions
 * 
 * Core type definitions for job lifecycle, identity modes, and job constraints.
 * Supports both TRACKED (compliance) and UNTRACKED (privacy) identity modes.
 */

import { GpuType, PricingModel, RegionCode } from './provider';
import { NormalizedPrice } from './pricing';

/**
 * Identity mode for job execution
 * - TRACKED: Full identity recorded for compliance and audit trails
 * - UNTRACKED: Identity hashed/anonymized for privacy-preserving compute
 */
export enum IdentityMode {
  /** Full identity tracking with wallet, org, and team member IDs */
  TRACKED = 'TRACKED',
  /** Anonymous execution with hashed identifiers */
  UNTRACKED = 'UNTRACKED'
}

/**
 * Job lifecycle status
 * Tracks a job from submission through completion
 */
export enum JobStatus {
  /** Job created but not yet confirmed on-chain */
  PENDING = 'PENDING',
  /** Job confirmed, awaiting provider selection */
  CONFIRMED = 'CONFIRMED',
  /** Job actively running on selected provider */
  RUNNING = 'RUNNING',
  /** Job completed successfully */
  COMPLETED = 'COMPLETED',
  /** Job failed during execution */
  FAILED = 'FAILED',
  /** Job cancelled by buyer or system */
  CANCELLED = 'CANCELLED',
}

/**
 * Job constraints define requirements that providers must meet
 * Used for filtering and ranking eligible providers
 */
export interface JobConstraints {
  /** Maximum acceptable price per GPU hour (USD) */
  maxPricePerHour?: number;
  /** Preferred geographic regions (ordered by preference) */
  preferredRegions?: RegionCode[];
  /** Required GPU type (if not specified, any supported type) */
  requiredGpuType?: GpuType;
  /** Minimum number of GPUs required */
  minGpuCount?: number;
  /** Maximum duration in hours */
  maxDurationHours?: number;
  /** Pricing models to exclude (e.g., exclude SPOT for critical workloads) */
  excludePricingModels?: PricingModel[];
  /** Identity mode for this job */
  identityMode: IdentityMode;
  /** Minimum reputation score (0-100) */
  minReputationScore?: number;
  /** Whether spot instances are acceptable */
  allowSpot?: boolean;
}

/**
 * Job request from a buyer
 * Represents a compute purchase intent
 */
export interface JobRequest {
  /** Unique job identifier (UUID) */
  id: string;
  /** Buyer's wallet address */
  buyerAddress: string;
  /** Job requirements and constraints */
  constraints: JobConstraints;
  /** Requested duration in hours */
  durationHours: number;
  /** Number of GPUs required */
  gpuCount: number;
  /** When job was created */
  createdAt: Date;
  /** Team member ID for tracked mode (for internal organization tracking) */
  teamMemberId?: string;
  /** Organization ID for tracked mode */
  organizationId?: string;
  /** Optional job name/description */
  name?: string;
}

/**
 * Job result after provider selection and execution
 * Contains the outcome of the routing decision
 */
export interface JobResult {
  /** Reference to original job */
  jobId: string;
  /** Selected provider ID */
  selectedProviderId: string;
  /** Selected provider name */
  selectedProviderName: string;
  /** Selected provider type */
  selectedProviderType: string;
  /** Normalized price for comparison */
  normalizedPrice: NormalizedPrice;
  /** Total cost in USD */
  totalCost: number;
  /** Current job status */
  status: JobStatus;
  /** 0G Storage content hash for reasoning trace */
  reasoningHash: string;
  /** When result was recorded */
  createdAt: Date;
  /** When job completed (if applicable) */
  completedAt?: Date;
  /** Transaction hash on ADI Chain (if settled) */
  settlementTxHash?: string;
  /** Error message (if failed) */
  errorMessage?: string;
}

/**
 * Identity record for TRACKED mode
 * Stores full identity for compliance and audit purposes
 */
export interface IdentityRecord {
  /** Wallet address */
  walletAddress: string;
  /** Organization identifier */
  organizationId?: string;
  /** Team member identifier */
  teamMemberId?: string;
  /** Organization name (if available) */
  organizationName?: string;
  /** Team member name/email (if available) */
  teamMemberName?: string;
  /** Timestamps */
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Anonymized identity for UNTRACKED mode
 * Uses keccak256 hashes and audit IDs for privacy
 */
export interface AnonymizedIdentity {
  /** keccak256 hash of wallet address */
  walletHash: string;
  /** keccak256 hash of organization ID (if applicable) */
  orgHash?: string;
  /** Unique anonymous identifier for audit purposes */
  auditId: string;
  /** Timestamp of anonymization */
  anonymizedAt: Date;
}

/**
 * Payload for creating a new job
 * Used by the API/UI to submit job requests
 */
export interface CreateJobPayload {
  /** Job name/description */
  name?: string;
  /** Number of GPUs */
  gpuCount: number;
  /** Duration in hours */
  durationHours: number;
  /** Constraints (without identityMode - set separately) */
  constraints: Omit<JobConstraints, 'identityMode'>;
  /** Identity mode preference */
  identityMode: IdentityMode;
  /** Organization info (for tracked mode) */
  organizationId?: string;
  teamMemberId?: string;
}

/**
 * Filters for querying jobs
 * Used in job listing and history views
 */
export interface JobFilters {
  /** Filter by status */
  status?: JobStatus | JobStatus[];
  /** Filter by buyer address */
  buyerAddress?: string;
  /** Filter by date range */
  createdAfter?: Date;
  createdBefore?: Date;
  /** Filter by GPU type */
  gpuType?: GpuType;
  /** Filter by identity mode */
  identityMode?: IdentityMode;
  /** Filter by organization */
  organizationId?: string;
  /** Search by job name */
  searchQuery?: string;
  /** Pagination */
  limit?: number;
  offset?: number;
}

/**
 * Job summary for list views
 * Lightweight version of full job data
 */
export interface JobSummary {
  id: string;
  name?: string;
  status: JobStatus;
  gpuCount: number;
  durationHours: number;
  totalCost: number;
  providerName: string;
  createdAt: Date;
  identityMode: IdentityMode;
}
