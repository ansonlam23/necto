/**
 * 0G Storage Service - Decentralized storage integration
 * Handles upload/download of reasoning traces to 0G Galileo Testnet
 */

import { Indexer, ZgFile, getFlowContract } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { ReasoningTrace } from '@/types/agent';
import { Uploader, UploadResult } from './uploader';
import { Retriever } from './retrieval';
import { withRetry, RetryConfig } from './retry';

/** 0G Chain configuration */
export interface ZeroGConfig {
  /** Chain ID - 16602 for 0G Galileo Testnet */
  chainId: number;
  /** RPC URL for 0G Testnet */
  rpcUrl: string;
  /** Indexer URL for storage operations */
  indexerUrl: string;
  /** Flow contract address */
  flowContractAddress: string;
  /** Private key for signing transactions */
  privateKey: string;
}

/** Storage error codes */
export type StorageErrorCode =
  | 'UPLOAD_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'FILE_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'INVALID_HASH'
  | 'NOT_FOUND'
  | 'CONFIG_ERROR'
  | 'INIT_FAILED';

/** Custom storage error */
export class StorageError extends Error {
  constructor(
    public code: StorageErrorCode,
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/** Main storage service class */
export class StorageService {
  private indexer: Indexer | null = null;
  private signer: ethers.Wallet | null = null;
  private flowContract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private uploader: Uploader | null = null;
  private retriever: Retriever | null = null;
  private initialized = false;

  constructor(public readonly config: ZeroGConfig) {}

  /**
   * Initialize the storage service
   * Sets up connection to 0G network
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Validate config
    if (!this.config.privateKey) {
      throw new StorageError(
        'CONFIG_ERROR',
        'OG_PRIVATE_KEY is required but not set'
      );
    }

    try {
      // Setup provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

      // Setup signer
      this.signer = new ethers.Wallet(this.config.privateKey, this.provider);

      // Setup flow contract
      // Note: getFlowContract expects ethers v6.13.1 Signer, we have v6.16.0
      // Using type assertion to bridge the gap
      this.flowContract = getFlowContract(
        this.config.flowContractAddress,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.signer as any
      ) as unknown as ethers.Contract;

      // Setup indexer
      this.indexer = new Indexer(this.config.indexerUrl);

      // Create uploader and retriever
      this.uploader = new Uploader(this);
      this.retriever = new Retriever(this);

      // Verify connection
      const network = await this.provider.getNetwork();
      console.log(`[StorageService] Connected to chain ${network.chainId}`);

      if (network.chainId !== BigInt(this.config.chainId)) {
        console.warn(
          `[StorageService] Warning: Connected to chain ${network.chainId}, expected ${this.config.chainId}`
        );
      }

      if (this.config.rpcUrl.includes('evmrpc-testnet.0g.ai')) {
        console.warn(
          '[StorageService] Warning: Using public RPC (rate limits may apply). Consider using a dedicated RPC endpoint.'
        );
      }

      this.initialized = true;
    } catch (error) {
      throw new StorageError(
        'INIT_FAILED',
        'Failed to initialize storage service',
        error
      );
    }
  }

  /** Check if service is initialized */
  isInitialized(): boolean {
    return this.initialized;
  }

  /** Get the indexer instance */
  getIndexer(): Indexer {
    if (!this.indexer) {
      throw new StorageError('INIT_FAILED', 'Storage service not initialized');
    }
    return this.indexer;
  }

  /** Get the signer instance */
  getSigner(): ethers.Wallet {
    if (!this.signer) {
      throw new StorageError('INIT_FAILED', 'Storage service not initialized');
    }
    return this.signer;
  }

  /** Get the flow contract instance */
  getFlowContract(): ethers.Contract {
    if (!this.flowContract) {
      throw new StorageError('INIT_FAILED', 'Storage service not initialized');
    }
    return this.flowContract;
  }

  /** Get the provider instance */
  getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new StorageError('INIT_FAILED', 'Storage service not initialized');
    }
    return this.provider;
  }

  /** Get the uploader instance */
  getUploader(): Uploader {
    if (!this.uploader) {
      throw new StorageError('INIT_FAILED', 'Storage service not initialized');
    }
    return this.uploader;
  }

  /** Get the retriever instance */
  getRetriever(): Retriever {
    if (!this.retriever) {
      throw new StorageError('INIT_FAILED', 'Storage service not initialized');
    }
    return this.retriever;
  }

  /** Validate that service is initialized */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new StorageError('INIT_FAILED', 'Storage service not initialized. Call initialize() first.');
    }
  }
}

/** Default configuration from environment variables */
export const storageConfig: ZeroGConfig = {
  chainId: 16602,
  rpcUrl: process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  indexerUrl:
    process.env.OG_INDEXER_URL ||
    'https://indexer-storage-testnet-turbo.0g.ai',
  flowContractAddress:
    process.env.OG_FLOW_CONTRACT ||
    '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296',
  privateKey: process.env.OG_PRIVATE_KEY || '',
};

/** Global storage service instance */
export const storageService = new StorageService(storageConfig);

/**
 * Upload a reasoning trace to 0G Storage
 * @param trace - The reasoning trace to upload
 * @returns Content hash (root hash) for retrieval
 */
export async function uploadReasoningTrace(trace: ReasoningTrace): Promise<string> {
  // Ensure service is initialized
  if (!storageService.isInitialized()) {
    await storageService.initialize();
  }

  // Validate trace has required fields
  if (!trace.jobId) {
    throw new StorageError('CONFIG_ERROR', 'Reasoning trace must have a jobId');
  }
  if (!trace.timestamp) {
    throw new StorageError('CONFIG_ERROR', 'Reasoning trace must have a timestamp');
  }

  // Generate filename
  const timestamp = Date.now();
  const filename = `trace-${trace.jobId}-${timestamp}.json`;

  // Upload with retry
  const result = await withRetry(
    () => storageService.getUploader().uploadJson(trace, filename),
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
    }
  );

  console.log(`[uploadReasoningTrace] Uploaded trace for job ${trace.jobId}, hash: ${result.rootHash}`);

  return result.rootHash;
}

/**
 * Retrieve a reasoning trace by its content hash
 * @param rootHash - The content hash from upload
 * @returns The reasoning trace object
 */
export async function retrieveTrace(rootHash: string): Promise<ReasoningTrace> {
  // Ensure service is initialized
  if (!storageService.isInitialized()) {
    await storageService.initialize();
  }

  // Validate hash format
  if (!rootHash || !/^0x[0-9a-fA-F]{64}$/.test(rootHash)) {
    throw new StorageError('INVALID_HASH', 'Invalid content hash format. Expected 0x-prefixed 64-character hex string.');
  }

  // Download with retry
  const buffer = await withRetry(
    () => storageService.getRetriever().downloadByHash(rootHash),
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
    }
  );

  if (!buffer) {
    throw new StorageError('NOT_FOUND', `No trace found for hash: ${rootHash}`);
  }

  // Parse JSON
  let trace: ReasoningTrace;
  try {
    const jsonStr = buffer.toString('utf-8');
    trace = JSON.parse(jsonStr) as ReasoningTrace;
  } catch (error) {
    throw new StorageError(
      'DOWNLOAD_FAILED',
      'Failed to parse retrieved trace as JSON',
      error
    );
  }

  // Validate trace structure
  if (!trace.jobId || !trace.timestamp) {
    throw new StorageError(
      'DOWNLOAD_FAILED',
      'Retrieved data does not match ReasoningTrace schema'
    );
  }

  return trace;
}

// Re-export types and classes
export type { Uploader, UploadResult } from './uploader';
export { Retriever } from './retrieval';
export type { withRetry, RetryConfig } from './retry';
