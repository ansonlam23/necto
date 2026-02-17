/**
 * @title ComputeRouter Contract Types and ABI
 * @notice TypeScript types and ABI for the ComputeRouter smart contract
 * @dev Generated from hardhat/contracts/ComputeRouter.sol
 * 
 * After deployment to ADI Testnet:
 * 1. Update COMPUTE_ROUTER_ADDRESS with the deployed contract address
 * 2. Verify ABI matches the deployed contract
 */

import { type Abi } from 'viem'

/**
 * ComputeRouter contract ABI
 * Matches the interface defined in ComputeRouter.sol
 */
export const COMPUTE_ROUTER_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_agent', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_jobId', type: 'uint256' }],
    name: 'getJob',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'user', type: 'address' },
          { internalType: 'bytes32', name: 'detailsHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'routingHash', type: 'bytes32' },
          { internalType: 'address', name: 'provider', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'bool', name: 'isTracked', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'routedAt', type: 'uint256' },
        ],
        internalType: 'struct ComputeRouter.Job',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'agent',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'jobCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_user', type: 'address' },
      { internalType: 'bytes32', name: '_detailsHash', type: 'bytes32' },
      { internalType: 'bool', name: '_isTracked', type: 'bool' },
    ],
    name: 'submitJob',
    outputs: [{ internalType: 'uint256', name: 'jobId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_jobId', type: 'uint256' },
      { internalType: 'address', name: '_provider', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' },
      { internalType: 'bytes32', name: '_routingHash', type: 'bytes32' },
    ],
    name: 'recordRoutingDecision',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_newAgent', type: 'address' }],
    name: 'updateAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'bytes32', name: 'detailsHash', type: 'bytes32' },
      { indexed: false, internalType: 'bool', name: 'isTracked', type: 'bool' },
    ],
    name: 'JobSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'provider', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'routingHash', type: 'bytes32' },
    ],
    name: 'RoutingDecision',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'oldAgent', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newAgent', type: 'address' },
    ],
    name: 'AgentUpdated',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_jobId', type: 'uint256' }],
    name: 'getJob',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'user', type: 'address' },
          { internalType: 'bytes32', name: 'detailsHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'routingHash', type: 'bytes32' },
          { internalType: 'address', name: 'provider', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'bool', name: 'isTracked', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'routedAt', type: 'uint256' },
        ],
        internalType: 'struct ComputeRouter.Job',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const satisfies Abi

/**
 * Job struct type
 * Matches the Job struct in ComputeRouter.sol
 */
export interface Job {
  id: bigint
  user: `0x${string}`
  detailsHash: `0x${string}`
  routingHash: `0x${string}`
  provider: `0x${string}`
  amount: bigint
  isTracked: boolean
  createdAt: bigint
  routedAt: bigint
}

/**
 * JobSubmitted event type
 */
export interface JobSubmittedEvent {
  jobId: bigint
  user: `0x${string}`
  detailsHash: `0x${string}`
  isTracked: boolean
}

/**
 * RoutingDecision event type
 */
export interface RoutingDecisionEvent {
  jobId: bigint
  provider: `0x${string}`
  amount: bigint
  routingHash: `0x${string}`
}

/**
 * AgentUpdated event type
 */
export interface AgentUpdatedEvent {
  oldAgent: `0x${string}`
  newAgent: `0x${string}`
}

/**
 * ComputeRouter contract address on ADI Testnet
 * UPDATE THIS AFTER DEPLOYMENT
 */
export const COMPUTE_ROUTER_ADDRESS = '0x369CbbB21c7b85e3BB0f29DE5dCC92B2583E09Dd' as `0x${string}`

/**
 * Helper to check if contract address is configured
 */
export function isContractConfigured(): boolean {
  return COMPUTE_ROUTER_ADDRESS !== '0x0000000000000000000000000000000000000000'
}
