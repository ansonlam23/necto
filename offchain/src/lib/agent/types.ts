/**
 * @title Agent Types
 * @notice Type definitions for Google ADK agent integration
 */

import type { SynapseProvider } from '@/lib/providers/akash-fetcher'

/**
 * Agent configuration for Google AI Studio
 */
export interface AgentConfig {
  /** Google AI Studio API key */
  apiKey: string
  /** Model to use (e.g., 'gemini-2.0-flash') */
  model: string
  /** Agent name for logging */
  name: string
}

/**
 * Job requirements for routing
 */
export interface JobRequirements {
  /** Minimum GPU memory in GB */
  minGpuMemoryGB?: number
  /** Required GPU model (e.g., 'A100', 'H100') */
  gpuModel?: string
  /** Minimum number of GPUs */
  minGpuCount?: number
  /** Maximum price per hour in USD */
  maxPricePerHour?: number
  /** Preferred region */
  region?: string
}

/**
 * Routing request from user
 */
export interface RoutingRequest {
  /** Job description/prompt */
  description: string
  /** Hardware requirements */
  requirements: JobRequirements
  /** Whether this is a tracked job (on-chain record) */
  isTracked: boolean
  /** User wallet address */
  userAddress: `0x${string}`
}

/**
 * Routing result from agent
 */
export interface RoutingResult {
  /** Selected provider */
  provider: SynapseProvider
  /** Reasoning for selection */
  reasoning: string
  /** Estimated cost in USD */
  estimatedCost: number
  /** Confidence score (0-1) */
  confidence: number
}

/**
 * Agent thinking step for UI display
 */
export interface ThinkingStep {
  id: string
  message: string
  status: 'pending' | 'active' | 'complete' | 'error'
  timestamp: number
}

/**
 * Transaction result from agent
 */
export interface TransactionResult {
  success: boolean
  jobId?: bigint
  hash?: `0x${string}`
  error?: string
}
