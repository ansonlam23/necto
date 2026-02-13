/**
 * Content retrieval from 0G Storage
 */

import { StorageService, StorageError, StorageErrorCode } from './index';
import { withRetry } from './retry';
import * as fs from 'fs';
import * as path from 'path';

/** Metadata for stored content */
export interface ContentMetadata {
  /** Content hash (Merkle root) */
  rootHash: string;
  /** File size in bytes */
  size: number;
  /** Upload timestamp (if available) */
  timestamp?: Date;
  /** Additional metadata from 0G */
  extra?: Record<string, unknown>;
}

/** Retriever class for 0G Storage */
export class Retriever {
  constructor(private storageService: StorageService) {}

  /**
   * Download content by its root hash
   * @param rootHash - The Merkle root hash (content hash)
   * @param outputPath - Optional path to save file (returns Buffer if not provided)
   * @returns Buffer containing the downloaded data, or null if not found
   */
  async downloadByHash(rootHash: string, outputPath?: string): Promise<Buffer | null> {
    // Validate hash format
    if (!rootHash || typeof rootHash !== 'string') {
      throw new StorageError(
        'INVALID_HASH' as StorageErrorCode,
        'Invalid hash: must be a non-empty string'
      );
    }

    // Ensure hash has 0x prefix
    const normalizedHash = rootHash.startsWith('0x') ? rootHash : `0x${rootHash}`;

    // Validate hex format
    if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedHash)) {
      throw new StorageError(
        'INVALID_HASH' as StorageErrorCode,
        'Invalid hash format: expected 0x-prefixed 64-character hex string'
      );
    }

    console.log(`[Retriever] Downloading content for hash: ${normalizedHash}`);

    // Create temp file path for download
    const tempDir = process.env.TEMP || '/tmp';
    const tempFilePath = path.join(tempDir, `0g-download-${Date.now()}.bin`);

    try {
      // Download via indexer with retry
      const indexer = this.storageService.getIndexer();

      const downloadError = await withRetry(
        async () => {
          return await indexer.download(normalizedHash, tempFilePath, false);
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
        }
      );

      if (downloadError) {
        // Handle 404/not found gracefully
        const errorMessage = downloadError.message || String(downloadError);
        if (
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.includes('404')
        ) {
          console.log(`[Retriever] Content not found: ${normalizedHash}`);
          return null;
        }

        throw new StorageError(
          'DOWNLOAD_FAILED' as StorageErrorCode,
          `Download failed: ${errorMessage}`,
          downloadError
        );
      }

      // Read the downloaded file
      const buffer = await fs.promises.readFile(tempFilePath);
      console.log(`[Retriever] Downloaded ${buffer.length} bytes`);

      // If output path provided, copy to destination
      if (outputPath) {
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.promises.copyFile(tempFilePath, outputPath);
        console.log(`[Retriever] Saved to: ${outputPath}`);
      }

      return buffer;
    } catch (error) {
      // Handle 404/not found gracefully
      const errorMessage = String(error);
      if (
        errorMessage.toLowerCase().includes('not found') ||
        errorMessage.includes('404') ||
        (error instanceof StorageError && error.code === 'NOT_FOUND')
      ) {
        console.log(`[Retriever] Content not found: ${normalizedHash}`);
        return null;
      }

      console.error('[Retriever] Download failed:', error);

      throw new StorageError(
        'DOWNLOAD_FAILED' as StorageErrorCode,
        `Failed to download content: ${errorMessage}`,
        error
      );
    } finally {
      // Cleanup temp file
      try {
        await fs.promises.unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get metadata for stored content
   * @param rootHash - The content hash
   * @returns Metadata object or null if not found
   */
  async getMetadata(rootHash: string): Promise<ContentMetadata | null> {
    // Validate hash format
    if (!rootHash || typeof rootHash !== 'string') {
      throw new StorageError(
        'INVALID_HASH' as StorageErrorCode,
        'Invalid hash: must be a non-empty string'
      );
    }

    // Ensure hash has 0x prefix
    const normalizedHash = rootHash.startsWith('0x') ? rootHash : `0x${rootHash}`;

    // Validate hex format
    if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedHash)) {
      throw new StorageError(
        'INVALID_HASH' as StorageErrorCode,
        'Invalid hash format: expected 0x-prefixed 64-character hex string'
      );
    }

    console.log(`[Retriever] Fetching metadata for hash: ${normalizedHash}`);

    try {
      // Try to download to get size
      const buffer = await this.downloadByHash(normalizedHash);

      if (!buffer) {
        return null;
      }

      // Build metadata from downloaded content
      const metadata: ContentMetadata = {
        rootHash: normalizedHash,
        size: buffer.length,
      };

      console.log(`[Retriever] Metadata retrieved: ${buffer.length} bytes`);

      return metadata;
    } catch (error) {
      console.error('[Retriever] Failed to fetch metadata:', error);
      return null;
    }
  }

  /**
   * Verify that content exists without downloading
   * @param rootHash - The content hash to check
   * @returns true if content exists
   */
  async exists(rootHash: string): Promise<boolean> {
    try {
      const metadata = await this.getMetadata(rootHash);
      return metadata !== null;
    } catch {
      return false;
    }
  }

  /**
   * Stream download content (for large files)
   * Note: This is a placeholder - 0G SDK may not support true streaming
   * @param rootHash - The content hash
   * @returns Buffer containing the data
   */
  async streamDownload(rootHash: string): Promise<Buffer> {
    // For now, delegate to regular download
    // In the future, this could implement chunked/streaming download
    const result = await this.downloadByHash(rootHash);

    if (!result) {
      throw new StorageError(
        'NOT_FOUND' as StorageErrorCode,
        `Content not found for hash: ${rootHash}`
      );
    }

    return result;
  }
}
