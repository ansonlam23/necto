// Contract addresses and ABIs for frontend
// Auto-generated from deployment - update after deploying to testnet

import ComputeRouterABI from '../../artifacts/contracts/ComputeRouter.sol/ComputeRouter.json'
import MockUSDCABI from '../../artifacts/contracts/MockUSDC.sol/MockUSDC.json'

export interface ContractConfig {
  address: string
  abi: any
  chainId: number
}

// Contract addresses by network
// After deployment, copy addresses from deployments/0g-testnet.json
export const CONTRACT_ADDRESSES: Record<number, {
  computeRouter: string
  mockUSDC: string
  providerRegistry: string
  jobRegistry: string
  escrow: string
}> = {
  // 0G Testnet (Galileo) - Chain ID 16602
  16602: {
    computeRouter: process.env.NEXT_PUBLIC_COMPUTE_ROUTER || '',
    mockUSDC: process.env.NEXT_PUBLIC_MOCK_USDC || '',
    providerRegistry: process.env.NEXT_PUBLIC_PROVIDER_REGISTRY || '',
    jobRegistry: process.env.NEXT_PUBLIC_JOB_REGISTRY || '',
    escrow: process.env.NEXT_PUBLIC_ESCROW || ''
  },
  // Local Hardhat - Chain ID 31337
  31337: {
    computeRouter: process.env.NEXT_PUBLIC_COMPUTE_ROUTER || '',
    mockUSDC: process.env.NEXT_PUBLIC_MOCK_USDC || '',
    providerRegistry: process.env.NEXT_PUBLIC_PROVIDER_REGISTRY || '',
    jobRegistry: process.env.NEXT_PUBLIC_JOB_REGISTRY || '',
    escrow: process.env.NEXT_PUBLIC_ESCROW || ''
  }
}

// Export ABIs for use with ethers/viem/wagmi
export { ComputeRouterABI, MockUSDCABI }

/**
 * Get contract configuration for a specific chain and contract type
 * @param chainId - The chain ID (16602 for 0G Testnet, 31337 for Hardhat)
 * @param contractType - The type of contract to get config for
 * @returns Contract configuration with address and ABI
 */
export function getContractConfig(
  chainId: number,
  contractType: 'computeRouter' | 'mockUSDC' | 'providerRegistry' | 'jobRegistry' | 'escrow'
): ContractConfig {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) {
    throw new Error(`No contracts configured for chain ${chainId}`)
  }

  const address = addresses[contractType]
  if (!address) {
    throw new Error(`No address configured for ${contractType} on chain ${chainId}`)
  }

  // Select appropriate ABI based on contract type
  let abi: any
  switch (contractType) {
    case 'computeRouter':
      abi = ComputeRouterABI.abi
      break
    case 'mockUSDC':
      abi = MockUSDCABI.abi
      break
    default:
      // For other contracts, we can use the ComputeRouter ABI as a fallback
      // or add specific ABIs as needed
      abi = ComputeRouterABI.abi
  }

  return {
    address,
    abi,
    chainId
  }
}

/**
 * Check if contracts are configured for a given chain
 * @param chainId - The chain ID to check
 * @returns True if all required contracts are configured
 */
export function areContractsConfigured(chainId: number): boolean {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return false

  // Check that all required addresses are set
  return !!(
    addresses.computeRouter &&
    addresses.computeRouter.startsWith('0x') &&
    addresses.mockUSDC &&
    addresses.mockUSDC.startsWith('0x')
  )
}

/**
 * Get the supported chain IDs
 * @returns Array of supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(CONTRACT_ADDRESSES).map(Number)
}
