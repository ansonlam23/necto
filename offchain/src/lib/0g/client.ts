/**
 * @title 0G Storage Client
 * @notice Client wrapper for 0G Storage SDK with retry logic
 * @dev Handles upload/download of reasoning logs to 0G testnet
 */

import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  ReasoningLog,
  ReasoningLogUpload,
  UploadResult,
  ZgClientConfig,
  UploadOptions,
  FetchOptions,
  ZgStorageError,
  ZgStorageErrorType,
} from './types';

// Default configuration for 0G testnet
const DEFAULT_INDEXER_URL = 'https://indexer-storage-testnet-turbo.0g.ai';
const DEFAULT_RPC_URL = 'https://evmrpc-testnet.0g.ai';

// Default retry configuration
const DEFAULT_UPLOAD_OPTIONS: Required<UploadOptions> = {
  maxRetries: 3,
  retryDelayMs: 1000,
  segmentSize: 256 * 1024, // 256KB segments
};

const DEFAULT_FETCH_OPTIONS: Required<FetchOptions> = {
  maxRetries: 3,
  retryDelayMs: 1000,
};

/**
 * Get 0G Storage configuration from environment variables
 */
function getConfig(): ZgClientConfig {
  const rpcUrl = process.env.NEXT_PUBLIC_0G_STORAGE_RPC || DEFAULT_RPC_URL;
  const privateKey = process.env.OG_STORAGE_PRIVATE_KEY;

  if (!privateKey) {
    throw new ZgStorageError(
      ZgStorageErrorType.CONFIG_ERROR,
      'OG_STORAGE_PRIVATE_KEY environment variable is required for 0G Storage uploads'
    );
  }

  return { rpcUrl, privateKey };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a temporary file from data for 0G upload
 */
async function createTempFile(data: string): Promise<string> {
  const tempDir = join(tmpdir(), 'necto-0g-uploads');
  await mkdir(tempDir, { recursive: true });
  
  const fileName = `reasoning-${Date.now()}-${randomBytes(4).toString('hex')}.json`;
  const filePath = join(tempDir, fileName);
  
  await writeFile(filePath, data, 'utf-8');
  return filePath;
}

/**
 * Retry wrapper for async operations
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries: number; retryDelayMs: number },
  errorType: ZgStorageErrorType,
  errorMessage: string
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`[0G Client] Attempt ${attempt}/${options.maxRetries} failed:`, error);
      
      if (attempt < options.maxRetries) {
        await sleep(options.retryDelayMs * attempt); // Exponential backoff
      }
    }
  }
  
  throw new ZgStorageError(
    errorType,
    `${errorMessage} after ${options.maxRetries} attempts: ${lastError}`,
    lastError
  );
}

/**
 * Initialize 0G Storage indexer client
 */
function getIndexer(): Indexer {
  const indexerUrl = process.env.NEXT_PUBLIC_0G_INDEXER_URL || DEFAULT_INDEXER_URL;
  return new Indexer(indexerUrl);
}

/**
 * Initialize ethers signer for 0G transactions
 */
function getSigner(config: ZgClientConfig): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  return new ethers.Wallet(config.privateKey, provider);
}

/**
 * Upload a reasoning log to 0G Storage
 * 
 * @param upload - The reasoning log upload data
 * @param options - Optional upload configuration
 * @returns UploadResult containing root hash and transaction hash
 */
export async function uploadReasoningLog(
  upload: ReasoningLogUpload,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const config = getConfig();
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options };
  
  const jsonData = JSON.stringify(upload.log, null, 2);
  let tempFilePath: string | null = null;
  
  try {
    // Create temporary file for upload
    tempFilePath = await createTempFile(jsonData);
    
    return await withRetry(
      async () => {
        const indexer = getIndexer();
        const signer = getSigner(config);
        
        // Create ZgFile from temp file
        const file = await ZgFile.fromFilePath(tempFilePath!);
        
        try {
          // Generate Merkle tree for verification
          const [tree, treeErr] = await file.merkleTree();
          if (treeErr !== null) {
            throw new ZgStorageError(
              ZgStorageErrorType.UPLOAD_FAILED,
              `Failed to generate Merkle tree: ${treeErr}`
            );
          }
          
          const rootHash = tree?.rootHash();
          if (!rootHash) {
            throw new ZgStorageError(
              ZgStorageErrorType.UPLOAD_FAILED,
              'Failed to get root hash from Merkle tree'
            );
          }
          
          // Upload to 0G network
          const [txHash, uploadErr] = await indexer.upload(
            file,
            config.rpcUrl,
            signer
          );
          
          if (uploadErr !== null) {
            throw new ZgStorageError(
              ZgStorageErrorType.UPLOAD_FAILED,
              `Upload failed: ${uploadErr}`
            );
          }
          
          console.log('[0G Client] Upload successful:', { rootHash, txHash });
          
          return { root: rootHash, txHash };
        } finally {
          // Always close the file
          await file.close();
        }
      },
      opts,
      ZgStorageErrorType.UPLOAD_FAILED,
      'Failed to upload reasoning log to 0G Storage'
    );
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Fetch a reasoning log from 0G Storage by root hash
 * 
 * @param root - The Merkle root hash of the stored data
 * @param options - Optional fetch configuration
 * @returns The retrieved ReasoningLog
 */
export async function fetchReasoningLog(
  root: string,
  options: FetchOptions = {}
): Promise<ReasoningLog> {
  const opts = { ...DEFAULT_FETCH_OPTIONS, ...options };
  
  let tempFilePath: string | null = null;
  
  try {
    return await withRetry(
      async () => {
        const indexer = getIndexer();
        
        // Create temp file for download
        const tempDir = join(tmpdir(), 'necto-0g-downloads');
        await mkdir(tempDir, { recursive: true });
        
        const fileName = `download-${Date.now()}-${randomBytes(4).toString('hex')}.json`;
        tempFilePath = join(tempDir, fileName);
        
        // Download from 0G with proof verification
        const downloadErr = await indexer.download(root, tempFilePath, true);
        
        if (downloadErr !== null) {
          throw new ZgStorageError(
            ZgStorageErrorType.FETCH_FAILED,
            `Download failed: ${downloadErr}`
          );
        }
        
        // Read and parse the downloaded file
        const fileContent = await import('fs/promises').then(fs => fs.readFile(tempFilePath!, 'utf-8'));
        const parsed = JSON.parse(fileContent);
        
        // Validate the structure matches ReasoningLog
        if (!isValidReasoningLog(parsed)) {
          throw new ZgStorageError(
            ZgStorageErrorType.INVALID_DATA,
            'Downloaded data does not match ReasoningLog schema'
          );
        }
        
        console.log('[0G Client] Fetch successful for root:', root);
        
        return parsed as ReasoningLog;
      },
      opts,
      ZgStorageErrorType.FETCH_FAILED,
      'Failed to fetch reasoning log from 0G Storage'
    );
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Type guard to validate ReasoningLog structure
 */
function isValidReasoningLog(data: unknown): data is ReasoningLog {
  if (typeof data !== 'object' || data === null) return false;
  
  const log = data as Record<string, unknown>;
  
  return (
    typeof log.id === 'string' &&
    typeof log.timestamp === 'number' &&
    typeof log.query === 'string' &&
    typeof log.selectedProvider === 'string' &&
    Array.isArray(log.reasoning) &&
    log.reasoning.every(r => typeof r === 'string') &&
    typeof log.confidence === 'number'
  );
}

/**
 * Check if 0G Storage is properly configured
 * @returns boolean indicating if the client can be used
 */
export function is0gConfigured(): boolean {
  return !!process.env.OG_STORAGE_PRIVATE_KEY;
}

/**
 * 0G client singleton for convenience
 */
export const zgClient = {
  upload: uploadReasoningLog,
  fetch: fetchReasoningLog,
  isConfigured: is0gConfigured,
};

export default zgClient;
