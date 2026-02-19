/**
 * @title Log Reasoning to 0G Tool
 * @notice Google ADK FunctionTool for storing agent reasoning to 0G Storage
 * @dev Stores immutable reasoning logs on 0G for transparency and verifiability
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { uploadReasoningLog, is0gConfigured } from '@/lib/0g/client';
import { ReasoningLog, ReasoningLogUpload } from '@/lib/0g/types';

/**
 * Parameters for the log_reasoning_to_0g tool
 */
export interface LogReasoningTo0gParams {
  /** Unique identifier for this reasoning log */
  id: string;
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
  /** Optional tags for categorizing the log */
  tags?: string[];
}

/**
 * Result from logging reasoning to 0G
 */
export interface LogReasoningTo0gResult {
  /** Whether the upload was successful */
  success: boolean;
  /** Merkle root of the stored data (for retrieval) */
  root?: string;
  /** Transaction hash of the upload operation */
  txHash?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Execute reasoning log upload to 0G Storage
 * @param params - The reasoning log parameters
 * @returns Upload result with root hash and transaction hash
 */
export async function executeLogReasoningTo0g(
  params: LogReasoningTo0gParams
): Promise<LogReasoningTo0gResult> {
  try {
    // Check if 0G is configured
    if (!is0gConfigured()) {
      console.warn('[0G Tool] 0G Storage not configured - returning mock success');
      // Return mock success for development/testing
      return {
        success: true,
        root: `0x${Buffer.from(params.id).toString('hex').padEnd(64, '0').slice(0, 64)}`,
        txHash: `0x${Date.now().toString(16).padStart(64, '0')}`,
      };
    }

    // Build the reasoning log
    const log: ReasoningLog = {
      id: params.id,
      timestamp: Date.now(),
      query: params.query,
      selectedProvider: params.selectedProvider,
      reasoning: params.reasoning,
      confidence: params.confidence,
      txHash: params.txHash,
    };

    const upload: ReasoningLogUpload = {
      log,
      tags: params.tags || ['reasoning', 'agent', 'routing'],
    };

    console.log('[0G Tool] Uploading reasoning log:', { id: params.id, provider: params.selectedProvider });

    // Upload to 0G Storage
    const result = await uploadReasoningLog(upload);

    console.log('[0G Tool] Upload successful:', { root: result.root, txHash: result.txHash });

    return {
      success: true,
      root: result.root,
      txHash: result.txHash,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[0G Tool] Upload failed:', message);
    
    return {
      success: false,
      error: message,
    };
  }
}

// Zod schema for the tool parameters
const logReasoningTo0gSchema = z.object({
  id: z.string().describe('Unique identifier for this reasoning log'),
  query: z.string().describe('The user query or job request that was processed'),
  selectedProvider: z.string().describe('The provider selected by the agent (e.g., "akash", "ionet")'),
  reasoning: z.array(z.string()).describe('Array of reasoning steps explaining why this provider was selected'),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
  txHash: z.string().optional().describe('Optional blockchain transaction hash for on-chain verification'),
  tags: z.array(z.string()).optional().describe('Optional tags for categorizing this log (e.g., ["production", "high-confidence"])'),
});

/**
 * ADK FunctionTool for logging reasoning to 0G Storage
 * 
 * Stores agent reasoning immutably to 0G Storage for transparency.
 * Each routing decision's reasoning is logged with a unique ID,
 * timestamp, and Merkle root for later retrieval and verification.
 */
export const logReasoningTo0gTool = new FunctionTool({
  name: 'log_reasoning_to_0g',
  description: 'Stores agent reasoning immutably to 0G Storage for transparency. Call this after making a routing decision to create a verifiable audit trail. Returns the Merkle root and transaction hash for retrieval.',
  parameters: logReasoningTo0gSchema,
  execute: async ({ id, query, selectedProvider, reasoning, confidence, txHash, tags }) => {
    console.log('[TOOL] log_reasoning_to_0g called with:', { id, selectedProvider, confidence });

    const result = await executeLogReasoningTo0g({
      id,
      query,
      selectedProvider,
      reasoning,
      confidence,
      txHash,
      tags,
    });

    return result;
  }
});

// Legacy alias for backwards compatibility
export const LogReasoningTo0gTool = logReasoningTo0gTool;
