/**
 * @title ADI Testnet Chain Definition
 * @notice Viem chain definition for ADI Testnet
 * @dev Used by wagmi and viem for connecting to ADI Testnet
 * 
 * Chain details:
 * - Chain ID: 99999
 * - RPC: https://rpc.ab.testnet.adifoundation.ai
 * - Native currency: ADI (18 decimals)
 * 
 * Faucet: Get testnet ADI tokens from the ADI Chain Faucet
 */
import { defineChain } from 'viem'

export const adiTestnet = defineChain({
  id: 99999,
  name: 'ADI Testnet',
  nativeCurrency: {
    name: 'ADI',
    symbol: 'ADI',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ab.testnet.adifoundation.ai'],
    },
  },
  testnet: true,
})
