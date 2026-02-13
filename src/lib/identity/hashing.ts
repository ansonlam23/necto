/**
 * Identity Hashing Utilities
 * 
 * Cryptographic hashing functions for Untracked identity mode.
 * Uses keccak256 for Ethereum blockchain compatibility.
 * 
 * Security properties:
 * - Deterministic: Same input always produces same hash
 * - Irreversible: Cannot derive original identifier from hash
 * - Salted: Uses constant salt to prevent rainbow table attacks
 * - Verifiable: Can verify ownership without revealing identity
 * 
 * @see src/types/identity.ts for identity type definitions
 */

import { keccak256, toUtf8Bytes, hexlify } from 'ethers';

/**
 * Hardcoded salt for identity hashing
 * Prevents rainbow table attacks while maintaining determinism
 * Change this to invalidate all existing hashes (careful!)
 */
export const SALT_CONSTANT = 'synapse-identity-v1';

/**
 * Hash an identifier using keccak256 with salt
 * 
 * Uses Ethereum's keccak256 for blockchain compatibility.
 * The salt prevents precomputed rainbow table attacks.
 * 
 * @param identifier - The string to hash (e.g., wallet address, org ID)
 * @param salt - Optional custom salt (defaults to SALT_CONSTANT)
 * @returns Hex string hash (0x...)
 * 
 * @example
 * ```typescript
 * const hash = hashIdentifier('0x1234...');
 * // Returns: '0xabc123...' (66 character hex string)
 * ```
 */
export function hashIdentifier(identifier: string, salt?: string): string {
  const effectiveSalt = salt ?? SALT_CONSTANT;
  const input = identifier + effectiveSalt;
  const bytes = toUtf8Bytes(input);
  return keccak256(bytes);
}

/**
 * Generate a unique audit ID for anonymous tracking
 * 
 * Creates a unique identifier that can be used to correlate
 * audit events without revealing the underlying identity.
 * Format: audit-${timestamp}-${random}
 * 
 * @returns Unique audit identifier string
 * 
 * @example
 * ```typescript
 * const auditId = generateAuditId();
 * // Returns: 'audit-1707845123456-a3f9b2'
 * ```
 */
export function generateAuditId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `audit-${timestamp}-${random}`;
}

/**
 * Verify that an identifier matches a given hash
 * 
 * Used for ownership verification without revealing the
 * original identifier in untracked mode.
 * 
 * @param identifier - The original identifier to check
 * @param hash - The stored hash to compare against
 * @param salt - Optional custom salt (defaults to SALT_CONSTANT)
 * @returns True if hashIdentifier(identifier) === hash
 * 
 * @example
 * ```typescript
 * const isOwner = verifyHash('0x1234...', storedWalletHash);
 * // Returns: true if the address matches the hash
 * ```
 */
export function verifyHash(identifier: string, hash: string, salt?: string): boolean {
  const computed = hashIdentifier(identifier, salt);
  // Constant-time comparison to prevent timing attacks
  if (computed.length !== hash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Hash an Ethereum address specifically
 * 
 * Normalizes the address to lowercase before hashing to ensure
 * consistent results regardless of checksum casing.
 * 
 * @param address - Ethereum address (0x...)
 * @param salt - Optional custom salt
 * @returns Hex string hash
 * 
 * @example
 * ```typescript
 * const hash = hashAddress('0xAbCdEf...');
 * // Same result as hashAddress('0xabcdef...')
 * ```
 */
export function hashAddress(address: string, salt?: string): string {
  // Normalize to lowercase for consistent hashing
  const normalized = address.toLowerCase();
  return hashIdentifier(normalized, salt);
}

/**
 * Format a hash for storage or display
 * 
 * Ensures consistent 0x prefix format.
 * 
 * @param hash - Raw hash string
 * @returns Normalized hex string
 */
export function formatHash(hash: string): string {
  if (hash.startsWith('0x')) {
    return hash.toLowerCase();
  }
  return '0x' + hash.toLowerCase();
}

/**
 * Validate that a string looks like a keccak256 hash
 * 
 * @param hash - String to validate
 * @returns True if valid keccak256 hash format
 */
export function isValidHash(hash: string): boolean {
  // Must be 66 characters: 0x + 64 hex characters
  if (!hash.startsWith('0x') || hash.length !== 66) {
    return false;
  }
  // Check all characters are valid hex
  const hexPart = hash.slice(2);
  return /^[0-9a-fA-F]{64}$/.test(hexPart);
}

/**
 * Validate Ethereum address format
 * 
 * @param address - String to validate
 * @returns True if valid Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  // Must be 42 characters: 0x + 40 hex characters
  if (!address.startsWith('0x') || address.length !== 42) {
    return false;
  }
  // Check all characters are valid hex
  const hexPart = address.slice(2);
  return /^[0-9a-fA-F]{40}$/.test(hexPart);
}
