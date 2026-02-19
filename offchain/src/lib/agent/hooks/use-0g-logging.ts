"use client";

/**
 * @title use0gLog Hook
 * @notice React hook for fetching and caching reasoning logs from 0G Storage
 * @dev Used in dashboard "View Reasoning" feature with 30-second memory cache
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchReasoningLog, is0gConfigured } from '@/lib/0g/client';
import { ReasoningLog } from '@/lib/0g/types';

/**
 * Cache entry with expiration
 */
interface CacheEntry {
  log: ReasoningLog;
  expiresAt: number;
}

/**
 * In-memory cache for reasoning logs (30 second TTL)
 */
const logCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Result type for use0gLog hook
 */
export interface Use0gLogResult {
  /** The retrieved reasoning log, or null if not loaded */
  log: ReasoningLog | null;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Any error that occurred during fetch */
  error: Error | null;
  /** Function to manually refresh the log */
  refetch: () => void;
}

/**
 * React hook for fetching a reasoning log from 0G Storage by root hash
 * 
 * Features:
 * - Automatic fetch on mount or root hash change
 * - 30-second in-memory caching
 * - Manual refetch capability
 * - Error handling with graceful degradation
 * 
 * @param root - The Merkle root hash of the stored reasoning log
 * @returns Object containing log data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * function ReasoningViewer({ root }: { root: string }) {
 *   const { log, loading, error } = use0gLog(root);
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!log) return <NotFound />;
 *   
 *   return (
 *     <div>
 *       <h3>Provider: {log.selectedProvider}</h3>
 *       <p>Confidence: {(log.confidence * 100).toFixed(0)}%</p>
 *       <ul>
 *         {log.reasoning.map((step, i) => (
 *           <li key={i}>{step}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function use0gLog(root: string | null | undefined): Use0gLogResult {
  const [log, setLog] = useState<ReasoningLog | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchLog = useCallback(async () => {
    // Don't fetch if no root provided
    if (!root) {
      setLog(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cached = logCache.get(root);
    if (cached && cached.expiresAt > Date.now()) {
      console.log('[use0gLog] Cache hit for root:', root);
      setLog(cached.log);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if 0G is configured
      if (!is0gConfigured()) {
        console.warn('[use0gLog] 0G Storage not configured - returning mock data');
        
        // Return mock data for development/testing
        const mockLog: ReasoningLog = {
          id: `mock-${root.slice(0, 8)}`,
          timestamp: Date.now(),
          query: 'Mock query (0G not configured)',
          selectedProvider: 'akash',
          reasoning: ['Mock reasoning step 1', 'Mock reasoning step 2'],
          confidence: 0.85,
          txHash: undefined,
        };

        if (isMountedRef.current) {
          setLog(mockLog);
          logCache.set(root, { log: mockLog, expiresAt: Date.now() + CACHE_TTL_MS });
        }
        return;
      }

      console.log('[use0gLog] Fetching log from 0G:', root);
      
      // Fetch from 0G Storage
      const fetchedLog = await fetchReasoningLog(root);

      if (isMountedRef.current) {
        setLog(fetchedLog);
        // Update cache
        logCache.set(root, { log: fetchedLog, expiresAt: Date.now() + CACHE_TTL_MS });
      }
    } catch (err) {
      console.error('[use0gLog] Failed to fetch log:', err);
      
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch reasoning log'));
        setLog(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [root]);

  // Fetch on mount and when root changes
  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  return {
    log,
    loading,
    error,
    refetch: fetchLog,
  };
}

/**
 * Hook for fetching multiple reasoning logs
 * 
 * @param roots - Array of Merkle root hashes
 * @returns Object containing logs map, loading state, and errors
 */
export function use0gLogs(roots: string[]): {
  logs: Map<string, ReasoningLog>;
  loading: boolean;
  errors: Map<string, Error>;
  refetch: () => void;
} {
  const [logs, setLogs] = useState<Map<string, ReasoningLog>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchLogs = useCallback(async () => {
    if (roots.length === 0) {
      setLogs(new Map());
      setErrors(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrors(new Map());

    const newLogs = new Map<string, ReasoningLog>();
    const newErrors = new Map<string, Error>();

    await Promise.all(
      roots.map(async (root) => {
        try {
          // Check cache
          const cached = logCache.get(root);
          if (cached && cached.expiresAt > Date.now()) {
            newLogs.set(root, cached.log);
            return;
          }

          if (!is0gConfigured()) {
            // Mock data for development
            const mockLog: ReasoningLog = {
              id: `mock-${root.slice(0, 8)}`,
              timestamp: Date.now(),
              query: 'Mock query',
              selectedProvider: 'akash',
              reasoning: ['Mock reasoning'],
              confidence: 0.85,
            };
            newLogs.set(root, mockLog);
            logCache.set(root, { log: mockLog, expiresAt: Date.now() + CACHE_TTL_MS });
            return;
          }

          const log = await fetchReasoningLog(root);
          newLogs.set(root, log);
          logCache.set(root, { log, expiresAt: Date.now() + CACHE_TTL_MS });
        } catch (err) {
          newErrors.set(
            root,
            err instanceof Error ? err : new Error(`Failed to fetch log ${root}`)
          );
        }
      })
    );

    if (isMountedRef.current) {
      setLogs(newLogs);
      setErrors(newErrors);
      setLoading(false);
    }
  }, [roots]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    errors,
    refetch: fetchLogs,
  };
}

/**
 * Clear the reasoning log cache
 * Useful for testing or when cache invalidation is needed
 */
export function clearLogCache(): void {
  logCache.clear();
  console.log('[use0gLog] Cache cleared');
}

/**
 * Get cache statistics for debugging
 */
export function getLogCacheStats(): { size: number; entries: string[] } {
  return {
    size: logCache.size,
    entries: Array.from(logCache.keys()),
  };
}

export default use0gLog;
