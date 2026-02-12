'use client'

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

export interface WalletState {
  address: `0x${string}` | undefined
  isConnected: boolean
  isConnecting: boolean
  isDisconnected: boolean
  chainId: number | undefined
}

export interface WalletActions {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  switchChain: (chainId: number) => Promise<void>
}

export function useWallet(): WalletState & WalletActions {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount()
  const chainId = useChainId()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()

  const connect = async () => {
    try {
      const connector = connectors.find((c) => c.id === 'injected')
      if (connector) {
        await connectAsync({ connector })
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  const disconnect = async () => {
    try {
      await disconnectAsync()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }

  const switchChain = async (targetChainId: number) => {
    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: targetChainId })
      }
    } catch (error) {
      console.error('Failed to switch chain:', error)
      throw error
    }
  }

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
    connect,
    disconnect,
    switchChain,
  }
}

export { mainnet, sepolia }
