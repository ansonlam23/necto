---
phase: 01-core-infrastructure
plan: 01
subsystem: smart-contracts
tags: [solidity, hardhat, openzeppelin, erc20, rbac, escrow, adi-testnet, 0g-chain]

requires: []

provides:
  - ComputeRouter.sol - Main orchestration contract with RBAC and USDC payments
  - ProviderRegistry.sol - Provider registration with metadata and rate management
  - JobRegistry.sol - Job lifecycle tracking (Pending → Active → Completed → Settled)
  - Escrow.sol - USDC payment locking with 7-day refund timeout
  - MockUSDC.sol - Test token for local development
  - Hardhat deployment scripts for ADI Testnet
  - TypeScript contract types for frontend integration

affects:
  - 01-02
  - 02-core-agent
  - buyer-interface
  - provider-interface

tech-stack:
  added:
    - Hardhat 2.22.19
    - OpenZeppelin Contracts 5.4.0
    - TypeChain with Ethers v6
    - Solidity 0.8.24
  patterns:
    - Contract composition pattern (Router owns child contracts)
    - RBAC with AccessControl (Admin, Viewer, User roles)
    - ReentrancyGuard on all fund transfers
    - USDC ERC20 transfers instead of native tokens
    - 0G Storage hash references for reasoning logs

key-files:
  created:
    - contracts/ComputeRouter.sol
    - contracts/ProviderRegistry.sol
    - contracts/JobRegistry.sol
    - contracts/Escrow.sol
    - contracts/MockUSDC.sol
    - hardhat.config.js
    - scripts/deploy.js
    - src/types/contracts.ts
    - src/types/contract-addresses.ts
    - .env.example
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used contract composition: ComputeRouter deploys and owns child contracts rather than separate deployment"
  - "USDC only (no native token) for payments to simplify pricing and avoid gas token complexity"
  - "7-day refund timeout allows buyers to reclaim funds if job never completes"
  - "Tracked/Untracked mode stored in Job struct for privacy toggle support"
  - "RBAC roles implemented via OpenZeppelin AccessControl for Tracked mode auditing"
  - "Solidity 0.8.24 with Cancun EVM for 0G Chain compatibility"

patterns-established:
  - "Contract ownership: Router owns registries, only router can call escrow release"
  - "USDC approval pattern: approve router → router transfers to escrow"
  - "Job status enum: Pending=0, Active=1, Completed=2, Failed=3, Settled=4"
  - "Escrow status enum: Locked=0, Released=1, Refunded=2"
  - "Provider metadata stored off-chain (IPFS/0G Storage) with URI reference"

duration: 10min
completed: 2026-02-13T03:12:17Z
---

# Phase 01 Plan 01: Smart Contract Infrastructure Summary

**Foundational smart contracts for compute marketplace with USDC escrow, provider registry, job lifecycle, and RBAC on ADI Testnet (Chain ID 16602)**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-13T03:02:56Z
- **Completed:** 2026-02-13T03:12:17Z
- **Tasks:** 3
- **Files modified:** 21

## Accomplishments

- Four production-ready Solidity contracts with comprehensive functionality
- Hardhat environment configured for ADI Testnet with Cancun EVM support
- USDC-based payment system with proper ERC20 integration
- Role-based access control for Tracked mode auditing
- Deployment scripts with automatic MockUSDC for testing
- Full TypeScript type definitions for frontend integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Set up Hardhat environment and base contracts** - `87cf3f9` (feat)
2. **Task 2: Create ComputeRouter.sol with integration** - `d2a3308` (feat)
3. **Task 3: Create deployment scripts and type definitions** - `0a2f68d` (feat)

## Files Created/Modified

### Contracts
- `contracts/ComputeRouter.sol` - Main orchestration contract integrating all modules with RBAC
- `contracts/ProviderRegistry.sol` - Provider registration, metadata, and rate management
- `contracts/JobRegistry.sol` - Job creation, status tracking, completion workflow
- `contracts/Escrow.sol` - USDC locking, release, and 7-day refund timeout
- `contracts/MockUSDC.sol` - Test ERC20 token with 6 decimals

### Configuration
- `hardhat.config.js` - Hardhat config for ADI Testnet (chainId 16602, Cancun EVM)
- `.env.example` - Environment variable template

### Deployment & Types
- `scripts/deploy.js` - Deployment script with automatic MockUSDC detection
- `src/types/contracts.ts` - TypeScript interfaces, enums, and utilities
- `src/types/contract-addresses.ts` - Network-specific contract addresses
- `typechain-types/` - Auto-generated Ethers v6 contract types

## Decisions Made

1. **Contract Composition Pattern**: ComputeRouter deploys and owns child contracts rather than separate deployments. This ensures atomic initialization and clear ownership hierarchy.

2. **USDC-Only Payments**: Native token payments excluded to simplify pricing (all rates in USDC units) and avoid gas token complexity for users.

3. **7-Day Refund Timeout**: Buyers can reclaim funds if job never completes after 7 days, protecting against zombie jobs.

4. **RBAC via AccessControl**: Using OpenZeppelin's battle-tested implementation instead of custom modifiers for Tracked mode auditing requirements.

5. **Cancun EVM Version**: Required for 0G Chain compatibility per ADI Testnet specifications.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Solidity version compatibility with OpenZeppelin v5**
- **Found during:** Task 1 (Hardhat setup)
- **Issue:** OpenZeppelin Contracts 5.x requires Solidity ^0.8.20, but plan specified ^0.8.19
- **Fix:** Updated all contracts and hardhat.config.js to use Solidity 0.8.24 (latest stable with Cancun support)
- **Files modified:** hardhat.config.js, all .sol files
- **Verification:** Contracts compile successfully
- **Committed in:** 87cf3f9 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed ReentrancyGuard import path for OpenZeppelin v5**
- **Found during:** Task 1 (base contract compilation)
- **Issue:** ReentrancyGuard moved from `@openzeppelin/contracts/security/` to `@openzeppelin/contracts/utils/` in v5
- **Fix:** Updated imports in Escrow.sol and ComputeRouter.sol
- **Files modified:** contracts/Escrow.sol, contracts/ComputeRouter.sol
- **Verification:** Clean compilation
- **Committed in:** 87cf3f9 and d2a3308

**3. [Rule 3 - Blocking] Downgraded Hardhat from v3 to v2 for toolbox compatibility**
- **Found during:** Task 1 (dependency installation)
- **Issue:** Hardhat 3.x had peer dependency conflicts with hardhat-toolbox
- **Fix:** Installed Hardhat 2.22.19 with compatible toolbox version
- **Files modified:** package.json, package-lock.json
- **Verification:** All commands work: compile, test, deploy
- **Committed in:** 87cf3f9

**4. [Rule 3 - Blocking] Manually generated TypeChain types**
- **Found during:** Task 3 (type generation)
- **Issue:** TypeChain auto-generation wasn't working with hardhat-toolbox 5.0
- **Fix:** Used npx typechain CLI directly to generate types for each contract
- **Files modified:** typechain-types/* (generated)
- **Verification:** TypeScript compilation succeeds
- **Committed in:** 0a2f68d

---

**Total deviations:** 4 auto-fixed (4 blocking issues)
**Impact on plan:** All auto-fixes were technical adjustments for dependency compatibility. No scope change.

## Issues Encountered

- **OpenZeppelin v5 breaking changes**: Import paths and Solidity version requirements differ from v4. Required updates to contracts.
- **Hardhat 3.x incompatibility**: Peer dependency resolution failed with toolbox. Required downgrade to v2.x.
- **TypeChain generation**: Auto-generation via hardhat didn't trigger. Worked around with direct CLI invocation.

All issues resolved with minimal impact on timeline.

## User Setup Required

**Contract deployment to ADI Testnet requires:**

1. Set environment variables in `.env`:
   ```
   PRIVATE_KEY=your_private_key_without_0x_prefix
   OG_RPC_URL=https://evmrpc-testnet.0g.ai
   ```

2. Fund wallet with AOG testnet tokens from [0G Faucet](https://faucet.0g.ai)

3. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network 0g-testnet
   ```

4. Update `src/types/contract-addresses.ts` with deployed addresses

## Next Phase Readiness

- **Ready for Phase 01-02**: Agent routing logic can now reference deployed contract ABIs
- **Ready for Phase 02**: Frontend interfaces can import TypeScript types
- **Blockers**: None - contracts are compilable and deployment-ready

---
*Phase: 01-core-infrastructure*  
*Completed: 2026-02-13*
