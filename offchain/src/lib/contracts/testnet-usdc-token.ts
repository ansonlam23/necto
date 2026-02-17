/**
 * Testnet USDC Token Integration
 * Uses fake/test USDC - NOT real money
 * For testing and demo purposes only
 */

import { parseUnits, formatUnits } from 'viem';

// Standard ERC20 ABI for USDC
export const USDC_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  }
] as const;

export const USDC_ADDRESS = process.env.ADI_TESTNET_USDC_ADDRESS || '0x0000000000000000000000000000000000000000';

export const USDC_DECIMALS = 6;

/**
 * Format USDC amount for display
 */
export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS);
}

/**
 * Parse USDC amount from string
 */
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}

/**
 * Approve USDC spending
 * Returns the contract write configuration
 */
export function approveUSDC(
  spender: string,
  amount: bigint
): {
  address: string;
  abi: typeof USDC_ABI;
  functionName: 'approve';
  args: [string, bigint];
} {
  return {
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [spender, amount]
  };
}

/**
 * Get USDC balance configuration for reading
 */
export function getUSDCBalanceConfig(address: string) {
  return {
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address]
  };
}

/**
 * Get USDC allowance configuration for reading
 */
export function getUSDCAllowanceConfig(owner: string, spender: string) {
  return {
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [owner, spender]
  };
}

/**
 * Transfer USDC configuration
 */
export function transferUSDC(
  recipient: string,
  amount: bigint
): {
  address: string;
  abi: typeof USDC_ABI;
  functionName: 'transfer';
  args: [string, bigint];
} {
  return {
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'transfer',
    args: [recipient, amount]
  };
}

/**
 * Check if USDC is properly configured
 */
export function isUSDCConfigured(): boolean {
  return USDC_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get faucet URL for testnet USDC
 */
export function getUSDCFaucetUrl(): string {
  // ADI Testnet faucet (https://faucet.ab.testnet.adifoundation.ai/)
  return 'https://faucet.circle.com/';
}
