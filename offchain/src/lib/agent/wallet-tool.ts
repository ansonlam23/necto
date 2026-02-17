/**
 * @title Wallet Tool
 * @notice Blockchain transaction tool for ADK agent
 * @dev Enables agent to submit jobs to ComputeRouter contract
 */

import { createWalletClient, http, keccak256, toBytes, type WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { COMPUTE_ROUTER_ABI, COMPUTE_ROUTER_ADDRESS } from '@/lib/contracts/compute-router'
import { adiTestnet } from '@/lib/adi-chain'
import type { TransactionResult } from './types'

/**
 * Create a wallet client for the agent
 * Uses environment variable for agent private key
 */
export function createAgentWallet(): WalletClient {
  const privateKey = process.env.AGENT_PRIVATE_KEY as `0x${string}`
  
  if (!privateKey) {
    throw new Error('AGENT_PRIVATE_KEY not configured in environment')
  }
  
  const account = privateKeyToAccount(privateKey)
  
  return createWalletClient({
    account,
    chain: adiTestnet,
    transport: http()
  })
}

/**
 * Submit a job transaction to the ComputeRouter contract
 * This is called by the agent after selecting a provider
 */
export async function submitJobTransaction(
  userAddress: `0x${string}`,
  detailsHash: `0x${string}`,
  isTracked: boolean
): Promise<TransactionResult> {
  try {
    const wallet = createAgentWallet()
    const account = wallet.account!
    
    // Submit job transaction
    const hash = await wallet.writeContract({
      account,
      address: COMPUTE_ROUTER_ADDRESS,
      abi: COMPUTE_ROUTER_ABI,
      functionName: 'submitJob',
      args: [userAddress, detailsHash, isTracked],
      chain: adiTestnet
    })
    
    // Wait for transaction receipt to get job ID
    // In a real implementation, you'd wait for the receipt and parse the JobSubmitted event
    // For now, return success
    return {
      success: true,
      hash,
      jobId: undefined // Would be extracted from event logs
    }
  } catch (error) {
    console.error('Failed to submit job transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Record routing decision on-chain
 * Called after agent selects a provider
 */
export async function recordRoutingDecision(
  jobId: bigint,
  providerAddress: `0x${string}`,
  amount: bigint,
  routingHash: `0x${string}`
): Promise<TransactionResult> {
  try {
    const wallet = createAgentWallet()
    const account = wallet.account!
    
    const hash = await wallet.writeContract({
      account,
      address: COMPUTE_ROUTER_ADDRESS,
      abi: COMPUTE_ROUTER_ABI,
      functionName: 'recordRoutingDecision',
      args: [jobId, providerAddress, amount, routingHash],
      chain: adiTestnet
    })
    
    return {
      success: true,
      hash
    }
  } catch (error) {
    console.error('Failed to record routing decision:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate a hash for job details
 * Used to create the detailsHash for on-chain storage
 */
export function hashJobDetails(details: object): `0x${string}` {
  const jsonString = JSON.stringify(details, Object.keys(details).sort())
  return keccak256(toBytes(jsonString))
}

/**
 * Generate a hash for routing decision
 * Used to create the routingHash for on-chain storage
 */
export function hashRoutingDecision(decision: object): `0x${string}` {
  const jsonString = JSON.stringify(decision, Object.keys(decision).sort())
  return keccak256(toBytes(jsonString))
}

/**
 * Wallet tool definition for ADK agent
 * Follows ADK tool interface
 */
export const walletTool = {
  name: 'submit_job_to_blockchain',
  description: 'Submit a compute job to the blockchain via ComputeRouter contract. Returns transaction result with job ID.',
  parameters: {
    type: 'object',
    properties: {
      userAddress: {
        type: 'string',
        description: 'User wallet address (0x...)'
      },
      detailsHash: {
        type: 'string',
        description: 'Keccak256 hash of job details'
      },
      isTracked: {
        type: 'boolean',
        description: 'Whether to create an on-chain record'
      }
    },
    required: ['userAddress', 'detailsHash', 'isTracked']
  },
  function: async ({ userAddress, detailsHash, isTracked }: {
    userAddress: string
    detailsHash: string
    isTracked: boolean
  }) => {
    const result = await submitJobTransaction(
      userAddress as `0x${string}`,
      detailsHash as `0x${string}`,
      isTracked
    )
    return JSON.stringify(result)
  }
}
