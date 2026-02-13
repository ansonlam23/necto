# Smart Contract Deployment

This document describes the deployed smart contracts for the Synapse compute marketplace.

## Overview

The Synapse protocol uses a suite of smart contracts on 0G Chain (ADI Testnet) to enable:
- **Provider registration** - Compute providers can list their services
- **Job creation** - Buyers can create compute jobs with escrow
- **Payment escrow** - USDC payments are held in escrow until job completion
- **Job tracking** - On-chain job lifecycle management

## Network Details

**Primary Network:** 0G Galileo Testnet  
**Chain ID:** 16602  
**RPC:** https://evmrpc-testnet.0g.ai  
**Explorer:** https://chainscan-galileo.0g.ai  
**Currency:** A0G (testnet tokens)

## Deployed Contracts

After deployment, update this table with actual contract addresses:

| Contract | Address | Purpose | Explorer |
|----------|---------|---------|----------|
| **ComputeRouter** | `TBD` | Main orchestration contract for jobs and escrow | [View](https://chainscan-galileo.0g.ai/address/TBD) |
| **ProviderRegistry** | `TBD` | Provider registration and metadata storage | [View](https://chainscan-galileo.0g.ai/address/TBD) |
| **JobRegistry** | `TBD` | Job lifecycle tracking and status management | [View](https://chainscan-galileo.0g.ai/address/TBD) |
| **Escrow** | `TBD` | USDC payment locking and release | [View](https://chainscan-galileo.0g.ai/address/TBD) |
| **MockUSDC** | `TBD` | Test USDC token for development | [View](https://chainscan-galileo.0g.ai/address/TBD) |

*Note: Replace `TBD` with actual addresses after deployment. Addresses are saved in `deployments/0g-testnet.json`.*

## Contract Architecture

### ComputeRouter
The main entry point for the protocol. Coordinates between registries and escrow.

**Key Functions:**
- `registerProvider(string metadataURI)` - Register as a compute provider
- `createJob(address provider, bool tracked, string reasoningHash, uint256 amount)` - Create a new compute job with escrow
- `completeJob(bytes32 jobId)` - Mark job complete and release payment
- `getProvider(address owner)` - Get provider details
- `getJob(bytes32 jobId)` - Get job details
- `getEscrow(bytes32 jobId)` - Get escrow status

**Events:**
- `ProviderRegistered(address indexed provider, string metadataURI)`
- `JobCreated(bytes32 indexed jobId, address indexed buyer, address indexed provider)`
- `JobCompleted(bytes32 indexed jobId, uint256 amount)`

### ProviderRegistry
Manages compute provider listings and their availability.

**Key Functions:**
- `register(string metadataURI)` - Add provider listing
- `updateStatus(bool isActive)` - Toggle availability
- `getProvider(address owner)` - Get provider info

### JobRegistry
Tracks job lifecycle from creation to settlement.

**Job Status Enum:**
- `0: Pending` - Job created, waiting for provider acceptance
- `1: Active` - Provider working on job
- `2: Completed` - Job finished, payment ready for release
- `3: Failed` - Job failed, payment refundable
- `4: Settled` - Payment released or refunded

**Key Functions:**
- `createJob(...)` - Create new job record
- `updateJobStatus(bytes32 jobId, JobStatus status)` - Update job state
- `getJob(bytes32 jobId)` - Get job details

### Escrow
Handles USDC payment locking and release.

**Escrow Status Enum:**
- `0: Locked` - Funds held in escrow
- `1: Released` - Funds released to provider
- `2: Refunded` - Funds returned to buyer

**Key Functions:**
- `lock(bytes32 jobId, address buyer, uint256 amount)` - Lock payment
- `release(bytes32 jobId)` - Release to provider
- `refund(bytes32 jobId)` - Return to buyer (after timeout)
- `getEscrow(bytes32 jobId)` - Get escrow details

### MockUSDC
Test ERC20 token with 6 decimals (like real USDC).

**Key Functions:**
- `mint(address to, uint256 amount)` - Create test tokens (owner only)
- `approve(address spender, uint256 amount)` - Allow spending
- `transfer(address to, uint256 amount)` - Send tokens
- Standard ERC20 functions

## ABI Files

Contract ABIs are available in:
- `artifacts/contracts/ComputeRouter.sol/ComputeRouter.json`
- `artifacts/contracts/ProviderRegistry.sol/ProviderRegistry.json`
- `artifacts/contracts/JobRegistry.sol/JobRegistry.json`
- `artifacts/contracts/Escrow.sol/Escrow.json`
- `artifacts/contracts/MockUSDC.sol/MockUSDC.json`

## Frontend Integration

### Using Wagmi/Viem

```typescript
import { getContractConfig, areContractsConfigured } from '@/config/contracts'
import { zeroGTestnet } from '@/lib/wagmi'

// Check if contracts are configured
if (!areContractsConfigured(zeroGTestnet.id)) {
  console.error('Contracts not deployed for this network')
}

// Get ComputeRouter config
const routerConfig = getContractConfig(zeroGTestnet.id, 'computeRouter')

// Use with wagmi
const { data } = useReadContract({
  ...routerConfig,
  functionName: 'getJob',
  args: [jobId]
})
```

### Using Ethers.js

```typescript
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, ComputeRouterABI } from '@/config/contracts'

const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai')
const router = new ethers.Contract(
  CONTRACT_ADDRESSES[16602].computeRouter,
  ComputeRouterABI.abi,
  provider
)

const job = await router.getJob(jobId)
```

## Payment Flow

### Creating a Job

1. **Approve USDC**: Buyer calls `usdc.approve(routerAddress, amount)`
2. **Create Job**: Buyer calls `router.createJob(provider, tracked, reasoningHash, amount)`
3. **Lock Funds**: Router transfers USDC from buyer to Escrow contract
4. **Job Active**: Job status set to `Active`, escrow status `Locked`

### Completing a Job

1. **Complete Job**: Provider or buyer calls `router.completeJob(jobId)`
2. **Release Payment**: Escrow releases USDC to provider
3. **Job Settled**: Job status set to `Settled`, escrow status `Released`

### Refund Flow

1. **Timeout**: If job not completed within 7 days
2. **Request Refund**: Buyer calls `router.refundJob(jobId)`
3. **Return Funds**: Escrow returns USDC to buyer
4. **Job Failed**: Job status set to `Failed`, escrow status `Refunded`

## Security Considerations

- **Reentrancy Protection**: All fund transfers use ReentrancyGuard
- **Access Control**: Only ComputeRouter can call escrow release
- **Timeout Protection**: 7-day refund window protects buyers
- **Approval Pattern**: USDC uses standard ERC20 approval flow
- **Input Validation**: All functions validate addresses and amounts

## Gas Costs

Estimated gas costs on 0G Testnet:

| Operation | Gas Estimate |
|-----------|--------------|
| Register Provider | ~80,000 |
| Create Job | ~150,000 |
| Complete Job | ~60,000 |
| Refund Job | ~50,000 |

Actual costs may vary based on network conditions.

## Development

### Local Testing

For local development with Hardhat:

```bash
# Start local node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network hardhat

# Run verification
npx hardhat run scripts/verify.ts --network hardhat
```

### Testnet Deployment

See [DEPLOY.md](./DEPLOY.md) for testnet deployment instructions.

## Contract Verification

To verify contracts on 0G Explorer:

```bash
npx hardhat verify --network 0g-testnet \
  <CONTRACT_ADDRESS> \
  <CONSTRUCTOR_ARG_1> \
  <CONSTRUCTOR_ARG_2>
```

## Updates and Maintenance

- Contract addresses are auto-saved to `deployments/0g-testnet.json`
- Frontend config is auto-updated in `src/types/contract-addresses.ts`
- Update `.env` with contract addresses for production builds
