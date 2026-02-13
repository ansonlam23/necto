/**
 * Contract Type Definitions
 * 
 * TypeScript interfaces matching the Solidity contract structs
 * and enums for type-safe frontend integration.
 */

import { CONTRACT_ADDRESSES, SupportedNetwork } from "./contract-addresses";

export { CONTRACT_ADDRESSES, SupportedNetwork };

// ==================== Enums ====================

export enum JobStatus {
  Pending = 0,
  Active = 1,
  Completed = 2,
  Failed = 3,
  Settled = 4
}

export enum EscrowStatus {
  Locked = 0,
  Released = 1,
  Refunded = 2
}

// ==================== Structs ====================

export interface Provider {
  owner: string;        // address
  metadataURI: string;
  isActive: boolean;
  registeredAt: number; // uint256 as number
  hourlyRate: bigint;   // uint256 as bigint
}

export interface Job {
  id: string;           // bytes32 as hex string
  buyer: string;        // address
  provider: string;     // address
  amount: bigint;       // uint256 as bigint
  status: JobStatus;
  tracked: boolean;
  createdAt: number;    // uint256 as number
  completedAt: number;  // uint256 as number
  reasoningHash: string;
}

export interface EscrowData {
  jobId: string;        // bytes32 as hex string
  buyer: string;        // address
  provider: string;     // address
  amount: bigint;       // uint256 as bigint
  status: EscrowStatus;
  createdAt: number;    // uint256 as number
  timeoutAt: number;    // uint256 as number
}

// ==================== Role Constants ====================

export const ROLES = {
  ADMIN_ROLE: "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775", // keccak256("ADMIN_ROLE")
  VIEWER_ROLE: "0x217e373d5b33a6060e4a4e249fde7e8cafad1dd6eaa3c4e49cc2123a562234e1", // keccak256("VIEWER_ROLE")
  USER_ROLE: "0x8a3ec7cc3c5e30a8e3b7241f06f19e1ee4ad74e3829e93af8c8dc58f2f3a6ff4", // keccak256("USER_ROLE")
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000"
} as const;

// ==================== Contract ABIs (Type-only) ====================

// Re-export typechain types when available
export type {
  ComputeRouter,
  ProviderRegistry,
  JobRegistry,
  Escrow,
  MockUSDC
} from "../../typechain-types";

// ==================== Helper Types ====================

export interface CreateJobParams {
  provider: string;
  amount: bigint;
  tracked: boolean;
  reasoningHash: string;
}

export interface RegisterProviderParams {
  metadataURI: string;
  hourlyRate: bigint;
}

export interface JobWithDetails {
  job: Job;
  escrow: EscrowData;
  provider: Provider | null;
}

// ==================== Network Configuration ====================

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
}

export const NETWORKS: Record<SupportedNetwork, NetworkConfig> = {
  "0g-testnet": {
    chainId: 16602,
    name: "0G Testnet",
    rpcUrl: "https://evmrpc-testnet.0g.ai",
    explorerUrl: "https://explorer-testnet.0g.ai"
  },
  hardhat: {
    chainId: 31337,
    name: "Hardhat Local",
    rpcUrl: "http://localhost:8545",
    explorerUrl: ""
  }
};

// ==================== Constants ====================

export const CONSTANTS = {
  // Time constants
  REFUND_TIMEOUT: 7 * 24 * 60 * 60, // 7 days in seconds
  MAX_JOB_DURATION: 30 * 24 * 60 * 60, // 30 days in seconds
  
  // USDC decimals
  USDC_DECIMALS: 6,
  
  // Gas limits (approximate)
  GAS_LIMITS: {
    CREATE_JOB: 300000,
    COMPLETE_JOB: 200000,
    REGISTER_PROVIDER: 200000
  }
} as const;

// ==================== Utility Functions ====================

export function formatUSDC(amount: bigint): string {
  const divisor = BigInt(10 ** CONSTANTS.USDC_DECIMALS);
  const integer = amount / divisor;
  const fractional = amount % divisor;
  return `${integer}.${fractional.toString().padStart(6, "0")}`;
}

export function parseUSDC(amount: string): bigint {
  const [integer, fractional = ""] = amount.split(".");
  const fractionalPadded = fractional.padEnd(6, "0").slice(0, 6);
  return BigInt(integer) * BigInt(10 ** CONSTANTS.USDC_DECIMALS) + BigInt(fractionalPadded);
}

export function jobStatusToString(status: JobStatus): string {
  return JobStatus[status];
}

export function escrowStatusToString(status: EscrowStatus): string {
  return EscrowStatus[status];
}

export function isJobActive(status: JobStatus): boolean {
  return status === JobStatus.Pending || status === JobStatus.Active;
}

export function isJobFinalized(status: JobStatus): boolean {
  return status === JobStatus.Settled || status === JobStatus.Failed;
}
