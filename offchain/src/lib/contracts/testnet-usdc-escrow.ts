/**
 * Testnet USDC Escrow Contract
 * Holds fake/test USDC on-chain, releases on deployment
 * NOT real money - for testing and demo only
 */

import { parseUnits } from 'viem';

// Escrow contract ABI
export const ESCROW_ABI = [
  {
    inputs: [
      { name: '_usdcToken', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [
      { name: 'jobId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'jobId', type: 'bytes32' }
    ],
    name: 'release',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'jobId', type: 'bytes32' }
    ],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'jobId', type: 'bytes32' }
    ],
    name: 'getEscrow',
    outputs: [{
      components: [
        { name: 'depositor', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'status', type: 'uint8' },
        { name: 'createdAt', type: 'uint256' }
      ],
      name: '',
      type: 'tuple'
    }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'jobId', type: 'bytes32' }
    ],
    name: 'escrows',
    outputs: [
      { name: 'depositor', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'jobId', type: 'bytes32' },
      { indexed: true, name: 'depositor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'Deposited',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'jobId', type: 'bytes32' }
    ],
    name: 'Released',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'jobId', type: 'bytes32' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'Refunded',
    type: 'event'
  }
] as const;

export const ESCROW_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

export enum EscrowStatus {
  Active = 0,
  Released = 1,
  Refunded = 2
}

export interface Escrow {
  depositor: string;
  amount: bigint;
  status: EscrowStatus;
  createdAt: bigint;
}

/**
 * Deposit USDC into escrow for a job
 */
export function depositEscrow(
  jobId: string,
  amount: bigint
): {
  address: string;
  abi: typeof ESCROW_ABI;
  functionName: 'deposit';
  args: [string, bigint];
} {
  return {
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'deposit',
    args: [jobId, amount]
  };
}

/**
 * Release escrowed funds to provider
 */
export function releaseEscrow(
  jobId: string
): {
  address: string;
  abi: typeof ESCROW_ABI;
  functionName: 'release';
  args: [string];
} {
  return {
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'release',
    args: [jobId]
  };
}

/**
 * Refund escrowed funds to buyer
 */
export function refundEscrow(
  jobId: string
): {
  address: string;
  abi: typeof ESCROW_ABI;
  functionName: 'refund';
  args: [string];
} {
  return {
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'refund',
    args: [jobId]
  };
}

/**
 * Get escrow details configuration
 */
export function getEscrowConfig(jobId: string) {
  return {
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getEscrow',
    args: [jobId]
  };
}

/**
 * Calculate required deposit based on estimated duration
 * @param hourlyRate Hourly rate in USDC
 * @param hours Number of hours to pre-fund
 */
export function calculateDepositAmount(hourlyRate: number, hours: number = 24): bigint {
  const total = hourlyRate * hours;
  return parseUnits(total.toString(), 6); // USDC has 6 decimals
}

/**
 * Check if escrow contract is configured
 */
export function isEscrowConfigured(): boolean {
  return ESCROW_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

/**
 * Format escrow status for display
 */
export function formatEscrowStatus(status: EscrowStatus): string {
  switch (status) {
    case EscrowStatus.Active:
      return 'Active';
    case EscrowStatus.Released:
      return 'Released';
    case EscrowStatus.Refunded:
      return 'Refunded';
    default:
      return 'Unknown';
  }
}
