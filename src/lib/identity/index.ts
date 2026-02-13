/**
 * Unified Identity Service
 * 
 * Provides a single interface for both Tracked and Untracked identity modes.
 * Automatically delegates to appropriate implementation based on mode.
 * 
 * Per requirement AGENT-06: Tracked/Untracked mode toggle with identity stripping.
 * Per user decision: Contract architecture uses flag parameter (mode field).
 * 
 * Usage:
 * ```typescript
 * // Tracked mode - full identity for team accountability
 * const tracked = identityService.createIdentity({
 *   walletAddress: '0x...',
 *   organizationId: 'acme-corp',
 *   teamMemberId: 'user-123',
 *   mode: IdentityMode.TRACKED
 * });
 * 
 * // Untracked mode - privacy with hashed identifiers
 * const untracked = identityService.createIdentity({
 *   walletAddress: '0x...',
 *   mode: IdentityMode.UNTRACKED
 * });
 * ```
 * 
 * @see src/lib/identity/tracked.ts for TRACKED implementation
 * @see src/lib/identity/untracked.ts for UNTRACKED implementation
 */

import { 
  IdentityMode, 
  IdentityContext, 
  IdentityRecord,
  TrackedIdentity,
  UntrackedIdentity,
  ActivityEntry,
  AnonymousActivityEntry
} from '@/types/identity';
import { JobRequest, JobResult } from '@/types/job';
import { createTrackedRecord, updateActivity, getTeamSpending, formatForAudit } from './tracked';
import { 
  createUntrackedRecord, 
  updateAnonymousActivity, 
  formatForAnonymousAudit,
  verifyAnonymousIdentity 
} from './untracked';
import { verifyHash } from './hashing';

export { IdentityMode };
export type { IdentityRecord, TrackedIdentity, UntrackedIdentity };

/**
 * Type guard: Check if identity is in TRACKED mode
 * 
 * @param record - Identity record to check
 * @returns True if tracked mode
 */
export function isTrackedIdentity(record: IdentityRecord): record is TrackedIdentity {
  return record.mode === IdentityMode.TRACKED;
}

/**
 * Type guard: Check if identity is in UNTRACKED mode
 * 
 * @param record - Identity record to check
 * @returns True if untracked mode
 */
export function isUntrackedIdentity(record: IdentityRecord): record is UntrackedIdentity {
  return record.mode === IdentityMode.UNTRACKED;
}

/**
 * Identity Service
 * 
 * Unified interface for managing identities in both modes.
 * Provides mode-transparent operations and mode-specific features.
 */
export class IdentityService {
  /**
   * Create a new identity record
   * 
   * Automatically selects implementation based on mode in context.
   * 
   * @param context - Identity context with mode selection
   * @returns Identity record (TrackedIdentity or UntrackedIdentity)
   * 
   * @example
   * ```typescript
   * const identity = identityService.createIdentity({
   *   walletAddress: '0x1234...',
   *   mode: IdentityMode.TRACKED
   * });
   * ```
   */
  createIdentity(context: IdentityContext): IdentityRecord {
    switch (context.mode) {
      case IdentityMode.TRACKED:
        return createTrackedRecord(context);
      case IdentityMode.UNTRACKED:
        return createUntrackedRecord(context);
      default:
        // Exhaustive check - TypeScript will error if new modes added
        const _exhaustive: never = context.mode;
        throw new Error(`Unknown identity mode: ${context.mode}`);
    }
  }

  /**
   * Check if record is in tracked mode
   * 
   * @param record - Identity record
   * @returns True if tracked
   */
  isTracked(record: IdentityRecord): boolean {
    return record.mode === IdentityMode.TRACKED;
  }

  /**
   * Check if record is in untracked mode
   * 
   * @param record - Identity record
   * @returns True if untracked
   */
  isUntracked(record: IdentityRecord): boolean {
    return record.mode === IdentityMode.UNTRACKED;
  }

  /**
   * Get audit ID from any identity record
   * 
   * Works for both modes - audit ID is always present.
   * 
   * @param record - Identity record
   * @returns Audit identifier
   */
  getAuditId(record: IdentityRecord): string {
    return record.auditId;
  }

  /**
   * Check if spending can be tracked for this identity
   * 
   * Only tracked mode with organization ID supports per-member tracking.
   * 
   * @param record - Identity record
   * @returns True if spending tracking is available
   */
  canTrackSpending(record: IdentityRecord): boolean {
    if (record.mode !== IdentityMode.TRACKED) {
      return false;
    }
    // Need organization ID to track team spending
    return !!(record as TrackedIdentity).organizationId;
  }

  /**
   * Update activity for an identity
   * 
   * Mode-aware activity logging.
   * 
   * @param record - Identity record to update
   * @param entry - Activity entry
   * @returns Updated identity record
   */
  updateActivity(
    record: IdentityRecord,
    entry: ActivityEntry | AnonymousActivityEntry
  ): IdentityRecord {
    if (record.mode === IdentityMode.TRACKED) {
      return updateActivity(record as TrackedIdentity, entry as ActivityEntry);
    } else {
      return updateAnonymousActivity(record as UntrackedIdentity, entry as AnonymousActivityEntry);
    }
  }

  /**
   * Get team spending breakdown
   * 
   * Only available for tracked mode with organization.
   * Returns null for untracked mode.
   * 
   * @param record - Identity record
   * @param jobHistory - Completed jobs
   * @returns Team spending or null if not available
   */
  getTeamSpending(record: IdentityRecord, jobHistory: JobResult[]) {
    if (record.mode !== IdentityMode.TRACKED) {
      return null;
    }
    return getTeamSpending(record as TrackedIdentity, jobHistory);
  }

  /**
   * Format identity for audit
   * 
   * Returns appropriate audit format based on mode.
   * - Tracked: Full identity disclosure
   * - Untracked: Anonymous record with hashes
   * 
   * @param record - Identity record
   * @returns Audit-formatted object
   */
  formatForAudit(record: IdentityRecord): object {
    if (record.mode === IdentityMode.TRACKED) {
      return formatForAudit(record as TrackedIdentity);
    } else {
      return formatForAnonymousAudit(record as UntrackedIdentity);
    }
  }

  /**
   * Verify wallet address ownership
   * 
   * Works for both modes:
   * - Tracked: Direct address comparison
   * - Untracked: Hash comparison
   * 
   * @param walletAddress - Address to verify
   * @param record - Identity record
   * @returns True if address matches identity
   */
  verifyIdentityOwnership(walletAddress: string, record: IdentityRecord): boolean {
    if (record.mode === IdentityMode.TRACKED) {
      return (record as TrackedIdentity).walletAddress.toLowerCase() === walletAddress.toLowerCase();
    } else {
      return verifyAnonymousIdentity(walletAddress, record as UntrackedIdentity);
    }
  }

  /**
   * Get display summary for an identity
   * 
   * Returns mode-appropriate summary without exposing sensitive data.
   * 
   * @param record - Identity record
   * @returns Display-safe summary
   */
  getSummary(record: IdentityRecord): object {
    const base = {
      mode: record.mode,
      auditId: record.auditId,
      createdAt: record.timestamps.createdAt,
      activityCount: record.activityLog.length
    };

    if (record.mode === IdentityMode.TRACKED) {
      const tracked = record as TrackedIdentity;
      return {
        ...base,
        walletAddress: tracked.walletAddress,
        organizationId: tracked.organizationId,
        teamMemberId: tracked.teamMemberId
      };
    } else {
      const untracked = record as UntrackedIdentity;
      return {
        ...base,
        walletHash: untracked.walletHash,
        hasOrgHash: !!untracked.orgHash
      };
    }
  }
}

/**
 * Create a job request with identity integration
 * 
 * Enhances a job request with identity record and audit tracking.
 * 
 * @param jobRequest - Base job request
 * @param identityContext - Identity context for this job
 * @returns Enhanced job request with identity info
 * 
 * @example
 * ```typescript
 * const enhancedJob = createJobWithIdentity(
 *   { id: 'job-123', gpuCount: 2, ... },
 *   { walletAddress: '0x...', mode: IdentityMode.TRACKED }
 * );
 * ```
 */
export function createJobWithIdentity(
  jobRequest: JobRequest,
  identityContext: IdentityContext
): JobRequest {
  const identity = new IdentityService().createIdentity(identityContext);
  
  return {
    ...jobRequest,
    constraints: {
      ...jobRequest.constraints,
      identityMode: identity.mode
    },
    // Attach audit ID to request metadata (not part of interface, but useful)
    // In real implementation, might store in separate metadata field
  };
}

/**
 * Format identity record for storage
 * 
 * Serializes identity for persistence (e.g., 0G Storage, database).
 * Excludes activity log (too large) - store separately.
 * 
 * @param record - Identity record
 * @returns Serialized storage format
 */
export function formatForStorage(record: IdentityRecord): object {
  const base = {
    mode: record.mode,
    auditId: record.auditId,
    timestamps: {
      createdAt: record.timestamps.createdAt.toISOString(),
      lastActivityAt: record.timestamps.lastActivityAt.toISOString()
    }
  };

  if (record.mode === IdentityMode.TRACKED) {
    const tracked = record as TrackedIdentity;
    return {
      ...base,
      walletAddress: tracked.walletAddress,
      organizationId: tracked.organizationId,
      teamMemberId: tracked.teamMemberId
      // activityLog excluded - stored separately
    };
  } else {
    const untracked = record as UntrackedIdentity;
    return {
      ...base,
      walletHash: untracked.walletHash,
      orgHash: untracked.orgHash
      // activityLog excluded - stored separately
    };
  }
}

/**
 * Singleton instance of IdentityService
 * 
 * Use this for most operations unless you need a separate instance.
 */
export const identityService = new IdentityService();

// Re-export all submodules for convenience
export * from './hashing';
export type * from './tracked';
export type * from './untracked';
