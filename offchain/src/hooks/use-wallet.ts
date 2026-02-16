'use client'

import { useCallback } from 'react'
import {
  useConnection,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useConnectors,
  useWriteContract,
} from 'wagmi'
import { readContract as wagmiReadContract } from '@wagmi/core'
import {
  COMPUTE_ROUTER_ABI,
  COMPUTE_ROUTER_ADDRESS,
} from '@/lib/contracts/compute-router'
import { adiTestnet } from '@/lib/adi-chain'
import { config } from '@/lib/wagmi'
import type { WaitForTransactionReceiptReturnType } from '@wagmi/core'

interface WalletState {
  address: `0x${string}` | undefined
  isConnected: boolean
  isConnecting: boolean
  isDisconnected: boolean
  chainId: number | undefined
}

interface WalletActions {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  switchChain: (chainId: number) => Promise<void>
  /**
   * Sign and submit a transaction to the ComputeRouter contract.
   * Returns the transaction hash immediately (does not wait for confirmation).
   * @param functionName - The contract function to call
   * @param args - The function arguments
   * @returns Transaction hash
   * @note COMPUTE_ROUTER_ADDRESS must be set for this to work
   */
  signTransaction: (functionName: string, args: unknown[]) => Promise<`0x${string}`>
  /**
   * Sign, submit, and wait for transaction confirmation.
   * Returns the full transaction receipt.
   * @param functionName - The contract function to call
   * @param args - The function arguments
   * @returns Transaction receipt with full details
   * @note COMPUTE_ROUTER_ADDRESS must be set for this to work
   */
  signAndSubmit: (functionName: string, args: unknown[]) => Promise<WaitForTransactionReceiptReturnType>
  /**
   * Read from the ComputeRouter contract.
   * @param functionName - The contract function to call
   * @param args - The function arguments
   * @returns The function result
   * @note COMPUTE_ROUTER_ADDRESS must be set for this to work
   */
  readContract: (functionName: string, args: unknown[]) => Promise<unknown>
}

export function useWallet(): WalletState & WalletActions {
  const { address, isConnected, isConnecting, isDisconnected } = useConnection()
  const chainId = useChainId()
  const connectors = useConnectors()
  const { mutateAsync: connectAsync } = useConnect()
  const { mutateAsync: disconnectAsync } = useDisconnect()
  const { mutateAsync: switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  const connect = useCallback(async () => {
    try {
      const connector = connectors.find((c) => c.id === 'injected')
      if (connector) {
        await connectAsync({ connector })
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }, [connectors, connectAsync])

  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }, [disconnectAsync])

  const switchChain = useCallback(async (targetChainId: number) => {
    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: targetChainId })
      }
    } catch (error) {
      console.error('Failed to switch chain:', error)
      throw error
    }
  }, [switchChainAsync])

  const signTransaction = useCallback(async (
    functionName: string,
    args: unknown[]
  ): Promise<`0x${string}`> => {
    if (!COMPUTE_ROUTER_ADDRESS) {
      throw new Error('COMPUTE_ROUTER_ADDRESS not configured. Contract not deployed yet.')
    }

    try {
      const hash = await writeContractAsync({
        address: COMPUTE_ROUTER_ADDRESS,
        abi: COMPUTE_ROUTER_ABI,
        functionName: functionName as never,
        args: args as never,
        chainId: adiTestnet.id,
      })
      return hash
    } catch (error) {
      console.error('Transaction signing failed:', error)
      throw error
    }
  }, [writeContractAsync])

  const signAndSubmit = useCallback(async (
    functionName: string,
    args: unknown[]
  ): Promise<WaitForTransactionReceiptReturnType> => {
    const hash = await signTransaction(functionName, args)
    
    // Wait for transaction receipt
    const receipt = await new Promise<WaitForTransactionReceiptReturnType>((resolve, reject) => {
      // Use a simple polling approach
      let attempts = 0
      const maxAttempts = 60 // 60 seconds timeout
      
      const checkReceipt = async () => {
        try {
          // Import viem's waitForTransactionReceipt dynamically
          const { waitForTransactionReceipt } = await import('@wagmi/core')
          const result = await waitForTransactionReceipt(config, {
            hash,
            chainId: adiTestnet.id,
          })
          resolve(result)
        } catch {
          attempts++
          if (attempts >= maxAttempts) {
            reject(new Error('Transaction confirmation timeout'))
          } else {
            setTimeout(checkReceipt, 1000)
          }
        }
      }
      
      checkReceipt()
    })
    
    return receipt
  }, [signTransaction])

  const readContract = useCallback(async (
    functionName: string,
    args: unknown[]
  ): Promise<unknown> => {
    if (!COMPUTE_ROUTER_ADDRESS) {
      throw new Error('COMPUTE_ROUTER_ADDRESS not configured. Contract not deployed yet.')
    }

    try {
      const result = await wagmiReadContract(config, {
        address: COMPUTE_ROUTER_ADDRESS,
        abi: COMPUTE_ROUTER_ABI,
        functionName: functionName as never,
        args: args as never,
        chainId: adiTestnet.id,
      })
      return result
    } catch (error) {
      console.error('Contract read failed:', error)
      throw new Error('Contract read failed. Contract may not be deployed on this network.')
    }
  }, [])

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
    connect,
    disconnect,
    switchChain,
    signTransaction,
    signAndSubmit,
    readContract,
  }
}
