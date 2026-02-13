/**
 * File upload functionality for 0G Storage
 */

import { ZgFile } from '@0glabs/0g-ts-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { StorageService, StorageError, StorageErrorCode } from './index';
import { withRetry } from './retry';

/** Maximum file size warning threshold (10MB) */
const MAX_FILE_SIZE_WARNING = 10 * 1024 * 1024; // 10MB

/** Upload result with content hash */
export interface UploadResult {
  /** Merkle root hash (content hash) */
  rootHash: string;
  /** Transaction hash */
  txHash: string;
  /** File size in bytes */
  size: number;
  /** Upload timestamp */
  uploadedAt: Date;
}

/** Uploader class for 0G Storage */
export class Uploader {
  constructor(private storageService: StorageService) {}

  /**
   * Upload JSON data to 0G Storage
   * @param data - The data object to upload
   * @param filename - Optional filename for metadata
   * @returns Upload result with content hash
   */
  async uploadJson(
    data: object,
    filename: string = 'data.json'
  ): Promise<UploadResult> {
    // Convert to JSON string
    const jsonStr = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');

    // Check size
    if (buffer.length > MAX_FILE_SIZE_WARNING) {
      console.warn(
        `[Uploader] Warning: File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds 10MB. ` +
          'Large files may timeout. Consider chunking or compression.'
      );
    }

    // Create temp file for ZgFile
    const tempDir = process.env.TEMP || '/tmp';
    const tempFilePath = path.join(tempDir, `0g-upload-${Date.now()}-${filename}`);

    try {
      // Write to temp file
      await fs.promises.writeFile(tempFilePath, buffer);

      // Upload the file
      const result = await this.uploadFile(tempFilePath);

      return result;
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
   * Upload a file from disk to 0G Storage
   * @param filePath - Path to the file to upload
   * @returns Upload result with content hash
   */
  async uploadFile(filePath: string): Promise<UploadResult> {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new StorageError(
        'UPLOAD_FAILED' as StorageErrorCode,
        `File not found: ${filePath}`
      );
    }

    // Get file stats
    const stats = await fs.promises.stat(filePath);

    if (stats.size === 0) {
      throw new StorageError(
        'UPLOAD_FAILED' as StorageErrorCode,
        'Cannot upload empty file'
      );
    }

    // Check size
    if (stats.size > MAX_FILE_SIZE_WARNING) {
      console.warn(
        `[Uploader] Warning: File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB. ` +
          'Large files may timeout. Consider chunking or compression.'
      );
    }

    console.log(`[Uploader] Starting upload for ${filePath} (${stats.size} bytes)`);

    let zgFile: ZgFile | null = null;

    try {
      // Create ZgFile from path
      zgFile = await ZgFile.fromFilePath(filePath);

      // Calculate Merkle tree (returns tuple [tree, error])
      console.log('[Uploader] Calculating Merkle tree...');
      const [merkleTree, merkleError] = await zgFile.merkleTree();

      if (merkleError || !merkleTree) {
        throw new StorageError(
          'UPLOAD_FAILED' as StorageErrorCode,
          `Failed to calculate Merkle tree: ${merkleError?.message || 'Unknown error'}`
        );
      }

      const calculatedRootHash = merkleTree.rootHash();
      if (!calculatedRootHash) {
        throw new StorageError(
          'UPLOAD_FAILED' as StorageErrorCode,
          'Failed to get root hash from Merkle tree'
        );
      }
      console.log(`[Uploader] Calculated Merkle root: ${calculatedRootHash}`);

      // Get config for upload
      const indexer = this.storageService.getIndexer();
      const signer = this.storageService.getSigner();
      const config = this.storageService['config'] as {
        rpcUrl: string;
      };

      // Upload via indexer with retry
      console.log('[Uploader] Uploading to 0G network...');
      const [uploadResult, uploadError] = await withRetry(
        async () => {
          // ZgFile extends AbstractFile, so this should work
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await indexer.upload(
            zgFile as unknown as Parameters<typeof indexer.upload>[0],
            config.rpcUrl,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            signer as any
          );
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
        }
      );

      if (uploadError || !uploadResult) {
        throw new StorageError(
          'UPLOAD_FAILED' as StorageErrorCode,
          `Upload failed: ${uploadError?.message || 'Unknown error'}`
        );
      }

      console.log(`[Uploader] Upload complete. Tx: ${uploadResult.txHash}`);
      console.log(`[Uploader] Root hash: ${uploadResult.rootHash}`);

      // Return result
      return {
        rootHash: uploadResult.rootHash,
        txHash: uploadResult.txHash,
        size: stats.size,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('[Uploader] Upload failed:', error);

      // Classify error
      const errorMessage = String(error);
      let errorCode: StorageErrorCode = 'UPLOAD_FAILED';

      if (errorMessage.toLowerCase().includes('timeout')) {
        errorCode = 'NETWORK_ERROR' as StorageErrorCode;
      } else if (stats.size > MAX_FILE_SIZE_WARNING) {
        errorCode = 'FILE_TOO_LARGE' as StorageErrorCode;
      }

      throw new StorageError(
        errorCode,
        `Upload failed: ${errorMessage}`,
        error
      );
    } finally {
      // Close the ZgFile
      if (zgFile) {
        try {
          await zgFile.close();
        } catch {
          // Ignore close errors
        }
      }
    }
  }

  /**
   * Upload raw buffer data to 0G Storage
   * @param buffer - The buffer to upload
   * @param filename - Filename for metadata
   * @returns Upload result with content hash
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string = 'data.bin'
  ): Promise<UploadResult> {
    // Check size
    if (buffer.length === 0) {
      throw new StorageError(
        'UPLOAD_FAILED' as StorageErrorCode,
        'Cannot upload empty buffer'
      );
    }

    if (buffer.length > MAX_FILE_SIZE_WARNING) {
      console.warn(
        `[Uploader] Warning: Buffer size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds 10MB. ` +
          'Large files may timeout. Consider chunking or compression.'
      );
    }

    // Create temp file
    const tempDir = process.env.TEMP || '/tmp';
    const tempFilePath = path.join(tempDir, `0g-upload-${Date.now()}-${filename}`);

    try {
      // Write buffer to temp file
      await fs.promises.writeFile(tempFilePath, buffer);

      // Upload the file
      const result = await this.uploadFile(tempFilePath);

      return result;
    } finally {
      // Cleanup temp file
      try {
        await fs.promises.unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
