/**
 * USDC Escrow Contract Integration
 * Holds testnet USDC in escrow for compute jobs, linked to ComputeRouter
 * NOT real money - for testing and demo only
 * 
 * Contract addr: 0x0Fc569ACAf6196A2dEf11C9363193c89083e6aDA
 *
 * Matches: hardhat/contracts/USDCEscrow.sol
 */

// Escrow contract ABI — linked to ComputeRouter, uint256 jobIds
export const ESCROW_ABI = [
  {
    inputs: [
      { name: '_usdcToken', type: 'address' },
      { name: '_computeRouter', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'usdcToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'computeRouter',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DEFAULT_DEPOSIT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'jobId', type: 'uint256' }
    ],
    name: 'release',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'jobId', type: 'uint256' }
    ],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'jobId', type: 'uint256' }
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
      { name: 'jobId', type: 'uint256' }
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
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: true, name: 'depositor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'Deposited',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'Released',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'Refunded',
    type: 'event'
  }
] as const;

export const ESCROW_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

/** Default deposit: $5 USDC (5 * 10^6) */
export const DEFAULT_DEPOSIT = BigInt(5_000_000);

export enum EscrowStatus {
  Active = 0,
  Released = 1,
  Refunded = 2
}

export interface Escrow {
  depositor: `0x${string}`;
  amount: bigint;
  status: EscrowStatus;
  createdAt: bigint;
}

/**
 * Deposit USDC into escrow for a router job
 * @param jobId Job ID from ComputeRouter (uint256)
 * @param amount Amount of USDC to escrow (default: DEFAULT_DEPOSIT = $5)
 */
export function depositEscrow(
  jobId: bigint,
  amount: bigint = DEFAULT_DEPOSIT
): {
  address: string;
  abi: typeof ESCROW_ABI;
  functionName: 'deposit';
  args: [bigint, bigint];
} {
  return {
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'deposit',
    args: [jobId, amount]
  };
}

/**
 * Release escrowed funds to owner (agent wallet)
 * Requires job to be routed in ComputeRouter
 */
export function releaseEscrow(
  jobId: bigint
): {
  address: string;
  abi: typeof ESCROW_ABI;
  functionName: 'release';
  args: [bigint];
} {
  return {
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'release',
    args: [jobId]
  };
}

/**
 * Refund escrowed funds back to buyer
 */
export function refundEscrow(
  jobId: bigint
): {
  address: string;
  abi: typeof ESCROW_ABI;
  functionName: 'refund';
  args: [bigint];
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
export function getEscrowConfig(jobId: bigint) {
  return {
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getEscrow',
    args: [jobId]
  };
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
