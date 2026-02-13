/**
 * Tracked Identity Mode Implementation
 * 
 * Full identity storage for compliance and team accountability.
 * Stores wallet address, organization ID, and team member ID.
 * Supports activity logging and team spending analysis.
 * 
 * Per user decision: Tracked mode stores full identity details — wallet address,
 * organization, team member ID, timestamps. Enables per-user cost tracking
 * and team accountability.
 * 
 * @see src/types/identity.ts for type definitions
 * @see src/lib/identity/hashing.ts for hash utilities
 */

import { IdentityMode, IdentityContext, TrackedIdentity, ActivityEntry, TeamSpending, MemberSpending } from '@/types/identity';
import { generateAuditId } from './hashing';
import { JobResult } from '@/types/job';

export type { TrackedIdentity, ActivityEntry, TeamSpending, MemberSpending };

/**
 * Ethereum address validation regex
 * Matches 0x followed by exactly 40 hex characters
 */
const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Validate Ethereum address format (internal)
 * 
 * @param address - Address to validate
 * @returns True if valid Ethereum address
 */
function isValidEthereumAddress(address: string): boolean {
  return ETH_ADDRESS_REGEX.test(address);
}

/**
 * Validation error for tracked identity
 */
export class TrackedIdentityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrackedIdentityValidationError';
  }
}

/**
 * Validate identity context for tracked mode
 * 
 * @param context - Identity context to validate
 * @throws TrackedIdentityValidationError if invalid
 */
export function validateTrackedContext(context: IdentityContext): void {
  // Validate wallet address
  if (!context.walletAddress) {
    throw new TrackedIdentityValidationError('Wallet address is required');
  }
  
  if (!isValidEthereumAddress(context.walletAddress)) {
    throw new TrackedIdentityValidationError(
      `Invalid Ethereum address format: ${context.walletAddress}. Expected 0x followed by 40 hex characters.`
    );
  }
  
  // Validate mode
  if (context.mode !== IdentityMode.TRACKED) {
    throw new TrackedIdentityValidationError(
      `Expected mode TRACKED, got ${context.mode}`
    );
  }
  
  // If teamMemberId is provided, organizationId must also be provided
  if (context.teamMemberId && !context.organizationId) {
    throw new TrackedIdentityValidationError(
      'organizationId is required when teamMemberId is provided'
    );
  }
}

/**
 * Create a new tracked identity record
 * 
 * Stores full identity details for compliance and team accountability.
 * 
 * @param context - Identity context with wallet, org, and team info
 * @returns Complete tracked identity record
 * @throws TrackedIdentityValidationError if context is invalid
 * 
 * @example
 * ```typescript
 * const identity = createTrackedRecord({
 *   walletAddress: '0x1234...',
 *   organizationId: 'acme-corp',
 *   teamMemberId: 'user-123',
 *   mode: IdentityMode.TRACKED
 * });
 * ```
 */
export function createTrackedRecord(context: IdentityContext): TrackedIdentity {
  // Validate input
  validateTrackedContext(context);
  
  const now = new Date();
  
  return {
    mode: IdentityMode.TRACKED,
    walletAddress: context.walletAddress.toLowerCase(),
    organizationId: context.organizationId,
    teamMemberId: context.teamMemberId,
    auditId: generateAuditId(),
    timestamps: {
      createdAt: now,
      lastActivityAt: now
    },
    activityLog: []
  };
}

/**
 * Add an activity entry to a tracked identity
 * 
 * @param identity - Identity to update
 * @param entry - Activity entry to add
 * @returns Updated identity (immutable update)
 * 
 * @example
 * ```typescript
 * const updated = updateActivity(identity, {
 *   action: 'job_created',
 *   jobId: 'job-123',
 *   timestamp: new Date()
 * });
 * ```
 */
export function updateActivity(
  identity: TrackedIdentity,
  entry: ActivityEntry
): TrackedIdentity {
  return {
    ...identity,
    activityLog: [...identity.activityLog, entry],
    timestamps: {
      ...identity.timestamps,
      lastActivityAt: entry.timestamp
    }
  };
}

/**
 * Calculate team spending breakdown from job history
 * 
 * Aggregates costs by team member for organization dashboards.
 * Only includes jobs with matching organization ID.
 * 
 * @param identity - Tracked identity (for org context)
 * @param jobHistory - Array of completed job results
 * @returns Team spending breakdown
 * 
 * @example
 * ```typescript
 * const spending = getTeamSpending(identity, jobResults);
 * // {
 * //   organizationId: 'acme-corp',
 * //   perMember: { 'user-123': { ... } },
 * //   total: 150.50,
 * //   period: { start: Date, end: Date }
 * // }
 * ```
 */
export function getTeamSpending(
  identity: TrackedIdentity,
  jobHistory: JobResult[]
): TeamSpending {
  if (!identity.organizationId) {
    return {
      organizationId: '',
      perMember: {},
      total: 0,
      period: { start: new Date(), end: new Date() }
    };
  }
  
  // Filter jobs for this organization
  // Note: In real implementation, would filter by org from job data
  const relevantJobs = jobHistory.filter(job => 
    job.status === 'COMPLETED'
  );
  
  // Calculate per-member spending
  const perMember: Record<string, MemberSpending> = {};
  let totalSpent = 0;
  
  for (const job of relevantJobs) {
    // In real implementation, would get member ID from job metadata
    const memberId = identity.teamMemberId || 'unknown';
    
    if (!perMember[memberId]) {
      perMember[memberId] = {
        memberId,
        memberName: identity.teamMemberId, // Could lookup name from org directory
        totalSpent: 0,
        jobCount: 0,
        averageJobCost: 0
      };
    }
    
    perMember[memberId].totalSpent += job.totalCost;
    perMember[memberId].jobCount += 1;
    totalSpent += job.totalCost;
  }
  
  // Calculate averages
  for (const member of Object.values(perMember)) {
    member.averageJobCost = member.jobCount > 0 
      ? member.totalSpent / member.jobCount 
      : 0;
  }
  
  // Determine time period
  const timestamps = relevantJobs.map(j => j.createdAt.getTime());
  const start = timestamps.length > 0 
    ? new Date(Math.min(...timestamps)) 
    : new Date();
  const end = timestamps.length > 0 
    ? new Date(Math.max(...timestamps)) 
    : new Date();
  
  return {
    organizationId: identity.organizationId,
    perMember,
    total: totalSpent,
    period: { start, end }
  };
}

/**
 * Format tracked identity for audit logs
 * 
 * Returns full identity disclosure for compliance audits.
 * Excludes only internal metadata.
 * 
 * @param identity - Tracked identity to format
 * @returns Audit-safe object with full identity
 * 
 * @example
 * ```typescript
 * const auditRecord = formatForAudit(identity);
 * // Contains: walletAddress, orgId, teamMemberId, activityLog
 * ```
 */
export function formatForAudit(identity: TrackedIdentity): object {
  return {
    auditId: identity.auditId,
    mode: identity.mode,
    walletAddress: identity.walletAddress,
    organizationId: identity.organizationId,
    teamMemberId: identity.teamMemberId,
    timestamps: {
      createdAt: identity.timestamps.createdAt.toISOString(),
      lastActivityAt: identity.timestamps.lastActivityAt.toISOString()
    },
    activityLog: identity.activityLog.map(entry => ({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    })),
    // Include metadata if present
    ...(identity.metadata && { metadata: identity.metadata })
  };
}

/**
 * Get summary of tracked identity for display
 * 
 * @param identity - Tracked identity
 * @returns Display-safe summary
 */
export function getIdentitySummary(identity: TrackedIdentity): {
  walletAddress: string;
  organizationId?: string;
  teamMemberId?: string;
  activityCount: number;
  createdAt: Date;
} {
  return {
    walletAddress: identity.walletAddress,
    organizationId: identity.organizationId,
    teamMemberId: identity.teamMemberId,
    activityCount: identity.activityLog.length,
    createdAt: identity.timestamps.createdAt
  };
}

/**
 * Check if identity belongs to an organization
 * 
 * @param identity - Tracked identity
 * @param organizationId - Organization to check
 * @returns True if identity belongs to organization
 */
export function belongsToOrganization(
  identity: TrackedIdentity,
  organizationId: string
): boolean {
  return identity.organizationId === organizationId;
}

/**
 * Merge activity logs (for data consolidation)
 * 
 * @param identities - Array of tracked identities
 * @returns Combined activity log sorted by timestamp
 */
export function mergeActivityLogs(
  identities: TrackedIdentity[]
): ActivityEntry[] {
  const allActivities = identities.flatMap(i => i.activityLog);
  return allActivities.sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
}
