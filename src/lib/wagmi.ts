import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

/**
 * 0G Galileo Testnet Configuration
 * Chain ID: 16602
 * Used for ADI Testnet deployment and testing
 */
export const zeroGTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  nativeCurrency: { name: 'A0G', symbol: 'A0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
    public: { http: ['https://evmrpc-testnet.0g.ai'] }
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan-galileo.0g.ai' }
  },
  testnet: true
})

/**
 * Hardhat Local Network
 * Chain ID: 31337
 * Used for local development and testing
 */
export const hardhatLocal = defineChain({
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] }
  },
  testnet: true
})

/**
 * Wagmi Configuration
 * Supports:
 * - 0G Testnet (primary) - Chain ID 16602
 * - Hardhat Local (development) - Chain ID 31337
 * - Sepolia (fallback testing) - Chain ID 11155111
 */
export const config = createConfig({
  chains: [zeroGTestnet, hardhatLocal, sepolia, mainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [zeroGTestnet.id]: http(),
    [hardhatLocal.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})

export type WagmiConfig = typeof config

/**
 * Default chain for the application
 * Set to 0G Testnet for hackathon development
 */
export const DEFAULT_CHAIN = zeroGTestnet
