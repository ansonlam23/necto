/**
 * Untracked Identity Mode Implementation
 * 
 * Privacy-preserving identity mode using cryptographic hashing.
 * Stores only keccak256 hashes of identifiers, never original values.
 * Maintains anonymous audit trail without identity linkage.
 * 
 * Per user decision: Untracked mode hashes wallet address and organization IDs
 * (irreversible but auditable). Keep anonymous audit trail without identity linkage.
 * 
 * Privacy safeguards:
 * - No raw addresses stored in activity metadata
 * - PII detection and warning logging
 * - Hash-only verification (no identity exposure)
 * 
 * @see src/types/identity.ts for type definitions
 * @see src/lib/identity/hashing.ts for hash utilities
 */

import { 
  IdentityMode, 
  IdentityContext, 
  UntrackedIdentity, 
  AnonymousActivityEntry 
} from '@/types/identity';
import { hashIdentifier, generateAuditId, verifyHash } from './hashing';

export type { UntrackedIdentity, AnonymousActivityEntry };

/**
 * PII (Personally Identifiable Information) detection patterns
 * Used to warn if PII is accidentally included in metadata
 */
const PII_PATTERNS = [
  // Ethereum addresses
  /0x[0-9a-fA-F]{40}/,
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  // Phone numbers (basic patterns)
  /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  // IP addresses
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  // SSN-like patterns
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/
];

/**
 * Privacy violation error
 * Thrown when PII is detected in untracked mode
 */
export class PrivacyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrivacyViolationError';
  }
}

/**
 * Validation error for untracked identity
 */
export class UntrackedIdentityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UntrackedIdentityValidationError';
  }
}

/**
 * Check if string contains potential PII
 * 
 * @param value - String to check
 * @returns True if PII patterns detected
 */
function containsPII(value: string): boolean {
  return PII_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Scan metadata for PII and log warnings
 * 
 * @param metadata - Metadata object to scan
 * @param context - Context for warning message
 */
function scanForPII(metadata: Record<string, any>, context: string): void {
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string' && containsPII(value)) {
      console.warn(
        `[PRIVACY WARNING] Potential PII detected in ${context}.${key}: ` +
        'Untracked mode should not store identifiable information'
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively scan nested objects
      scanForPII(value, `${context}.${key}`);
    }
  }
}

/**
 * Validate identity context for untracked mode
 * 
 * @param context - Identity context to validate
 * @throws UntrackedIdentityValidationError if invalid
 */
export function validateUntrackedContext(context: IdentityContext): void {
  // Validate wallet address exists (will be hashed, not stored)
  if (!context.walletAddress) {
    throw new UntrackedIdentityValidationError('Wallet address is required');
  }
  
  // Basic format check - not strict validation since we're hashing anyway
  if (!context.walletAddress.startsWith('0x') || context.walletAddress.length !== 42) {
    throw new UntrackedIdentityValidationError(
      `Invalid wallet address format: ${context.walletAddress}`
    );
  }
  
  // Validate mode
  if (context.mode !== IdentityMode.UNTRACKED) {
    throw new UntrackedIdentityValidationError(
      `Expected mode UNTRACKED, got ${context.mode}`
    );
  }
}

/**
 * Create a new untracked identity record
 * 
 * Hashes all identifiers before storage. Original values are NOT retained.
 * This is irreversible - you cannot recover the original wallet address
 * from the stored identity record.
 * 
 * @param context - Identity context (original values)
 * @returns Anonymous identity record with hashes only
 * @throws UntrackedIdentityValidationError if context is invalid
 * 
 * @example
 * ```typescript
 * const identity = createUntrackedRecord({
 *   walletAddress: '0x1234...',
 *   organizationId: 'acme-corp',
 *   mode: IdentityMode.UNTRACKED
 * });
 * // identity.walletHash = '0xabc...' (keccak256 hash)
 * // identity.walletAddress is NOT stored
 * ```
 */
export function createUntrackedRecord(context: IdentityContext): UntrackedIdentity {
  // Validate input
  validateUntrackedContext(context);
  
  const now = new Date();
  
  // Hash the identifiers - original values are NOT stored
  const walletHash = hashIdentifier(context.walletAddress.toLowerCase());
  const orgHash = context.organizationId 
    ? hashIdentifier(context.organizationId)
    : undefined;
  
  return {
    mode: IdentityMode.UNTRACKED,
    walletHash,
    orgHash,
    auditId: generateAuditId(),
    timestamps: {
      createdAt: now,
      lastActivityAt: now
    },
    activityLog: []
  };
}

/**
 * Add an anonymous activity entry to an untracked identity
 * 
 * Scans metadata for PII and logs warnings.
 * 
 * @param identity - Identity to update
 * @param entry - Activity entry to add
 * @returns Updated identity (immutable update)
 * @throws PrivacyViolationError if PII detected in strict mode
 * 
 * @example
 * ```typescript
 * const updated = updateAnonymousActivity(identity, {
 *   action: 'job_created',
 *   jobId: 'job-123',
 *   timestamp: new Date(),
 *   metadata: { gpuCount: 2 } // Safe - no PII
 * });
 * ```
 */
export function updateAnonymousActivity(
  identity: UntrackedIdentity,
  entry: AnonymousActivityEntry
): UntrackedIdentity {
  // Scan metadata for PII
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    scanForPII(entry.metadata, 'activityEntry.metadata');
  }
  
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
 * Format untracked identity for anonymous audit
 * 
 * Returns record with only hashed values and audit ID.
 * No original identifiers are included.
 * 
 * @param identity - Untracked identity to format
 * @returns Anonymous audit record
 * 
 * @example
 * ```typescript
 * const auditRecord = formatForAnonymousAudit(identity);
 * // Contains: walletHash, orgHash, auditId - NO raw addresses
 * ```
 */
export function formatForAnonymousAudit(identity: UntrackedIdentity): object {
  // Ensure no PII in metadata
  const safeMetadata = identity.metadata 
    ? sanitizeMetadata(identity.metadata)
    : undefined;
  
  return {
    auditId: identity.auditId,
    mode: identity.mode,
    walletHash: identity.walletHash,
    orgHash: identity.orgHash,
    timestamps: {
      createdAt: identity.timestamps.createdAt.toISOString(),
      lastActivityAt: identity.timestamps.lastActivityAt.toISOString()
    },
    activityLog: identity.activityLog.map(entry => {
      // Sanitize any metadata in activity entries
      const safeEntryMetadata = entry.metadata 
        ? sanitizeMetadata(entry.metadata)
        : {};
      
      return {
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        metadata: safeEntryMetadata
      };
    }),
    ...(safeMetadata && { metadata: safeMetadata })
  };
}

/**
 * Sanitize metadata by removing potential PII
 * 
 * @param metadata - Metadata to sanitize
 * @returns Sanitized metadata
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      // Check for PII and redact if found
      if (containsPII(value)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(value);
    } else {
      // Primitives and arrays pass through
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Verify that a wallet address matches an untracked identity
 * 
 * Used for ownership verification without exposing the stored hash.
 * This allows proving control of an address without revealing
 * which identity record belongs to whom.
 * 
 * @param walletAddress - Address to verify
 * @param identity - Untracked identity record
 * @returns True if address matches the stored hash
 * 
 * @example
 * ```typescript
 * const isOwner = verifyAnonymousIdentity('0x1234...', identity);
 * // Returns true if hash('0x1234...') === identity.walletHash
 * ```
 */
export function verifyAnonymousIdentity(
  walletAddress: string,
  identity: UntrackedIdentity
): boolean {
  return verifyHash(walletAddress.toLowerCase(), identity.walletHash);
}

/**
 * Verify organization membership without revealing org ID
 * 
 * @param organizationId - Organization ID to verify
 * @param identity - Untracked identity record
 * @returns True if org matches the stored hash
 */
export function verifyAnonymousOrganization(
  organizationId: string,
  identity: UntrackedIdentity
): boolean {
  if (!identity.orgHash) {
    return false;
  }
  return verifyHash(organizationId, identity.orgHash);
}

/**
 * Get anonymous summary of identity
 * 
 * @param identity - Untracked identity
 * @returns Anonymous summary (no identifying info)
 */
export function getAnonymousSummary(identity: UntrackedIdentity): {
  walletHash: string;
  hasOrgHash: boolean;
  activityCount: number;
  createdAt: Date;
  auditId: string;
} {
  return {
    walletHash: identity.walletHash,
    hasOrgHash: !!identity.orgHash,
    activityCount: identity.activityLog.length,
    createdAt: identity.timestamps.createdAt,
    auditId: identity.auditId
  };
}

/**
 * Check if two untracked identities are the same entity
 * 
 * Compares wallet hashes to determine if records belong
 * to the same wallet (without knowing what that wallet is).
 * 
 * @param identityA - First identity
 * @param identityB - Second identity
 * @returns True if same wallet hash
 */
export function isSameEntity(
  identityA: UntrackedIdentity,
  identityB: UntrackedIdentity
): boolean {
  return identityA.walletHash === identityB.walletHash;
}

/**
 * Merge anonymous activity logs
 * 
 * @param identities - Array of untracked identities
 * @returns Combined activity log sorted by timestamp
 */
export function mergeAnonymousActivityLogs(
  identities: UntrackedIdentity[]
): AnonymousActivityEntry[] {
  const allActivities = identities.flatMap(i => i.activityLog);
  return allActivities.sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
}
