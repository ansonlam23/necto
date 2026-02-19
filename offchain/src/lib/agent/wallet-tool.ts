/**
 * @title Wallet Tool
 * @notice Blockchain transaction FunctionTool for ADK agent
 * @dev Enables agent to submit jobs to ComputeRouter contract
 */

import { createWalletClient, http, keccak256, toBytes, type WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { COMPUTE_ROUTER_ABI, COMPUTE_ROUTER_ADDRESS } from '@/lib/contracts/compute-router'
import { adiTestnet } from '@/lib/adi-chain'
import type { TransactionResult } from './types'
import { FunctionTool } from '@google/adk'
import { z } from 'zod'

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

export async function submitJobTransaction(
  userAddress: `0x${string}`,
  detailsHash: `0x${string}`,
  isTracked: boolean
): Promise<TransactionResult> {
  try {
    const wallet = createAgentWallet()
    const account = wallet.account!
    const hash = await wallet.writeContract({
      account,
      address: COMPUTE_ROUTER_ADDRESS,
      abi: COMPUTE_ROUTER_ABI,
      functionName: 'submitJob',
      args: [userAddress, detailsHash, isTracked],
      chain: adiTestnet
    })
    return { success: true, hash, jobId: undefined }
  } catch (error) {
    console.error('Failed to submit job transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

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
    return { success: true, hash }
  } catch (error) {
    console.error('Failed to record routing decision:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function hashJobDetails(details: object): `0x${string}` {
  const jsonString = JSON.stringify(details, Object.keys(details).sort())
  return keccak256(toBytes(jsonString))
}

export function hashRoutingDecision(decision: object): `0x${string}` {
  const jsonString = JSON.stringify(decision, Object.keys(decision).sort())
  return keccak256(toBytes(jsonString))
}

const walletToolSchema = z.object({
  userAddress: z.string().describe('The user wallet address (0x...)'),
  detailsHash: z.string().describe('Keccak256 hash of the job details'),
  isTracked: z.boolean().describe('Whether to track this job on-chain'),
})

export const walletTool = new FunctionTool({
  name: 'submit_job_to_blockchain',
  description: 'Submit a compute job to the blockchain via ComputeRouter contract. Returns transaction hash and job ID.',
  parameters: walletToolSchema,
  execute: async ({ userAddress, detailsHash, isTracked }) => {
    console.log('[TOOL] submit_job_to_blockchain called with:', { userAddress, isTracked })
    const result = await submitJobTransaction(
      userAddress as `0x${string}`,
      detailsHash as `0x${string}`,
      isTracked
    )
    return result
  }
})

// Legacy class name kept as alias
export const WalletTool = walletTool
