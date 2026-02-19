/**
 * @title 0G Storage Types
 * @notice TypeScript types for 0G Storage reasoning logs
 * @dev Types for immutable agent reasoning logs stored on 0G
 */

/**
 * ReasoningLog represents an immutable record of an agent's routing decision
 * Stored on 0G Storage for transparency and verifiability
 */
export interface ReasoningLog {
  /** Unique identifier for this reasoning log */
  id: string;
  /** Unix timestamp when the log was created */
  timestamp: number;
  /** The user's query or job request */
  query: string;
  /** The provider selected by the agent */
  selectedProvider: string;
  /** Array of reasoning steps explaining the decision */
  reasoning: string[];
  /** Confidence score (0-1) of the selection */
  confidence: number;
  /** Optional transaction hash for on-chain verification */
  txHash?: string;
}

/**
 * ReasoningLogUpload wraps a ReasoningLog with optional metadata for upload
 */
export interface ReasoningLogUpload {
  /** The reasoning log to upload */
  log: ReasoningLog;
  /** Optional tags for categorizing the log */
  tags?: string[];
}

/**
 * Upload result returned from 0G Storage
 */
export interface UploadResult {
  /** Merkle root of the uploaded data (used for retrieval) */
  root: string;
  /** Transaction hash of the upload operation */
  txHash: string;
}

/**
 * 0G Storage client configuration
 */
export interface ZgClientConfig {
  /** RPC endpoint for 0G Storage */
  rpcUrl: string;
  /** Private key for signing uploads */
  privateKey: string;
  /** Optional contract address override */
  contractAddress?: string;
}

/**
 * Options for upload operations
 */
export interface UploadOptions {
  /** Maximum retry attempts for failed uploads */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelayMs?: number;
  /** Expected segment size for chunking */
  segmentSize?: number;
}

/**
 * Options for fetch operations
 */
export interface FetchOptions {
  /** Maximum retry attempts for failed fetches */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelayMs?: number;
}

/**
 * Error types specific to 0G Storage operations
 */
export enum ZgStorageErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  FETCH_FAILED = 'FETCH_FAILED',
  INVALID_DATA = 'INVALID_DATA',
  CONFIG_ERROR = 'CONFIG_ERROR',
}

/**
 * Custom error class for 0G Storage operations
 */
export class ZgStorageError extends Error {
  constructor(
    public readonly type: ZgStorageErrorType,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ZgStorageError';
  }
}
