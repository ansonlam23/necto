/**
 * Identity Type Definitions
 * 
 * Core type definitions for Tracked/Untracked identity modes.
 * Supports both compliance tracking and privacy-preserving compute.
 * 
 * @see src/lib/identity/hashing.ts for cryptographic utilities
 * @see src/lib/identity/tracked.ts for TRACKED mode implementation
 * @see src/lib/identity/untracked.ts for UNTRACKED mode implementation
 */

import { IdentityMode } from './job';

export { IdentityMode };

/**
 * Identity context used when creating identity records
 * Passed from job creation to identity service
 */
export interface IdentityContext {
  /** Full wallet address (Ethereum format: 0x...) */
  walletAddress: string;
  /** Organization identifier (for team tracking) */
  organizationId?: string;
  /** Team member identifier (for accountability) */
  teamMemberId?: string;
  /** Selected identity mode */
  mode: IdentityMode;
}

/**
 * Base interface for all identity records
 */
export interface BaseIdentityRecord {
  /** Identity mode discriminator */
  mode: IdentityMode;
  /** Unique anonymous audit identifier */
  auditId: string;
  /** Record timestamps */
  timestamps: {
    createdAt: Date;
    lastActivityAt: Date;
  };
  /** Optional metadata (mode-specific) */
  metadata?: Record<string, any>;
}

/**
 * Tracked identity record
 * Stores full identity for compliance and team accountability
 */
export interface TrackedIdentity extends BaseIdentityRecord {
  mode: IdentityMode.TRACKED;
  /** Full Ethereum wallet address */
  walletAddress: string;
  /** Organization identifier */
  organizationId?: string;
  /** Team member identifier */
  teamMemberId?: string;
  /** Activity log for audit trail */
  activityLog: ActivityEntry[];
}

/**
 * Untracked identity record
 * Stores only hashed identifiers for privacy
 */
export interface UntrackedIdentity extends BaseIdentityRecord {
  mode: IdentityMode.UNTRACKED;
  /** keccak256 hash of wallet address */
  walletHash: string;
  /** keccak256 hash of organization ID (if provided) */
  orgHash?: string;
  /** Anonymous activity log */
  activityLog: AnonymousActivityEntry[];
}

/**
 * Union type for identity records
 * Use type guards to discriminate between modes
 */
export type IdentityRecord = TrackedIdentity | UntrackedIdentity;

/**
 * Activity entry for tracked mode
 * Links to real identity for audit purposes
 */
export interface ActivityEntry {
  /** Action performed */
  action: 'job_created' | 'job_completed' | 'payment_made' | 'job_cancelled';
  /** Associated job ID */
  jobId?: string;
  /** When action occurred */
  timestamp: Date;
  /** Additional context */
  metadata?: Record<string, any>;
}

/**
 * Anonymous activity entry for untracked mode
 * No PII should be stored in metadata
 */
export interface AnonymousActivityEntry {
  /** Action performed */
  action: 'job_created' | 'job_completed' | 'payment_made' | 'job_cancelled';
  /** Associated job ID */
  jobId?: string;
  /** When action occurred */
  timestamp: Date;
  /** Additional context (NO PII allowed) */
  metadata: Record<string, any>;
}

/**
 * Team spending breakdown
 * For tracked mode cost accounting
 */
export interface TeamSpending {
  /** Organization ID */
  organizationId: string;
  /** Per-member spending totals */
  perMember: Record<string, MemberSpending>;
  /** Total across all members */
  total: number;
  /** Time period */
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Individual member spending info
 */
export interface MemberSpending {
  /** Team member ID */
  memberId: string;
  /** Member name/email (if tracked) */
  memberName?: string;
  /** Total USD spent */
  totalSpent: number;
  /** Number of jobs */
  jobCount: number;
  /** Average job cost */
  averageJobCost: number;
}

/**
 * Audit format for tracked identity
 * Full disclosure for compliance audits
 */
export interface TrackedAuditRecord {
  auditId: string;
  mode: IdentityMode.TRACKED;
  walletAddress: string;
  organizationId?: string;
  teamMemberId?: string;
  timestamps: {
    createdAt: string;
    lastActivityAt: string;
  };
  activityLog: ActivityEntry[];
}

/**
 * Audit format for untracked identity
 * Anonymous but verifiable
 */
export interface UntrackedAuditRecord {
  auditId: string;
  mode: IdentityMode.UNTRACKED;
  walletHash: string;
  orgHash?: string;
  timestamps: {
    createdAt: string;
    lastActivityAt: string;
  };
  activityLog: AnonymousActivityEntry[];
}

/**
 * Union type for audit records
 */
export type AuditRecord = TrackedAuditRecord | UntrackedAuditRecord;
