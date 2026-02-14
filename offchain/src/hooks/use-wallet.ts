'use client'

import {
  useConnection,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useConnectors,
} from 'wagmi'

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
}

export function useWallet(): WalletState & WalletActions {
  const { address, isConnected, isConnecting, isDisconnected } = useConnection()
  const chainId = useChainId()
  const connectors = useConnectors()
  const { mutateAsync: connectAsync } = useConnect()
  const { mutateAsync: disconnectAsync } = useDisconnect()
  const { mutateAsync: switchChainAsync } = useSwitchChain()

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


