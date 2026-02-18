---
phase: 02-akash-webapp-deploy
plan: 01
type: execute
subsystem: infra
tags: [akash, console-api, sdl, usdc, escrow, viem]

# Dependency graph
requires:
  - phase: 01-foundation-core-agent
    provides: TypeScript project structure and base dependencies
provides:
  - Akash Console API client with full deployment lifecycle management
  - SDL generator with 6 built-in templates for AI/ML workloads
  - Testnet USDC token and escrow contract interfaces
  - TypeScript type definitions for all Akash integration types
affects:
  - 02-akash-webapp-deploy-02
  - 02-akash-webapp-deploy-03

tech-stack:
  added:
    - Akash Console API integration
    - SDL (Stack Definition Language) generation
    - ERC20 token contract interface via viem
    - Escrow contract interface for on-chain payments
  patterns:
    - Singleton pattern for API client with environment configuration
    - Template-based SDL generation for common workloads
    - viem contract configuration objects for type-safe blockchain interactions

key-files:
  created:
    - offchain/src/types/akash.ts - TypeScript type definitions for Akash deployments
    - offchain/src/lib/akash/console-api.ts - Console API client with CRUD operations
    - offchain/src/lib/akash/sdl-generator.ts - SDL generator with templates and parser
    - offchain/src/lib/contracts/testnet-usdc-token.ts - USDC token contract interface
    - offchain/src/lib/contracts/testnet-usdc-escrow.ts - Escrow contract interface
  modified: []

key-decisions:
  - "Use singleton pattern for AkashConsoleClient to share API key across the app"
  - "Template-based SDL generation lowers barrier for common AI/ML workloads"
  - "viem contract config objects provide type-safe blockchain interactions without needing full contract instances"
  - "Environment variables for contract addresses allow flexible deployment targets"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 02 Plan 01: Akash Infrastructure Foundation Summary

**Akash Console API client with SDL generation, 6 built-in templates, and testnet USDC escrow contracts for real deployments with fake payments.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T17:10:10Z
- **Completed:** 2026-02-17T17:13:07Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments

- **Akash Console API client** with full deployment lifecycle (create, get, list, close, bids, leases)
- **SDL generator** with 6 built-in templates (PyTorch, Jupyter, Stable Diffusion, Ollama, NGINX, PostgreSQL)
- **Testnet USDC escrow** contract interfaces for deposit, release, and refund operations
- **Complete TypeScript types** for all Akash integration entities (Deployment, SDL spec, ProviderBid, Lease)
- **Natural language parser** for extracting job requirements from user input

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Akash Console API client** - `6a4d665` (feat)
2. **Task 2: Implement SDL generator for job requirements** - `a2de7a6` (feat)
3. **Task 3: Create testnet USDC escrow contracts** - `5a33d4f` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `offchain/src/types/akash.ts` - TypeScript interfaces for AkashDeployment, SdlSpec, ProviderBid, Lease, and related types
- `offchain/src/lib/akash/console-api.ts` - AkashConsoleClient class with deployment CRUD, bidding, and log streaming
- `offchain/src/lib/akash/sdl-generator.ts` - SDL generation from JobRequirements, 6 built-in templates, validation, and YAML export
- `offchain/src/lib/contracts/testnet-usdc-token.ts` - USDC ERC20 ABI and helper functions for token interactions
- `offchain/src/lib/contracts/testnet-usdc-escrow.ts` - Escrow contract ABI with deposit, release, refund, and status utilities

## Decisions Made

- **Singleton pattern for API client**: Allows shared API key configuration across the app via environment variables
- **Template-based SDL generation**: 6 common templates lower the barrier for AI/ML workloads (PyTorch, Jupyter, Stable Diffusion, Ollama)
- **viem contract configuration objects**: Returns config objects instead of contract instances for better Next.js/Viem integration
- **Environment-based contract addresses**: ADI_TESTNET_USDC_ADDRESS and ESCROW_CONTRACT_ADDRESS allow flexible deployments

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See [02-akash-webapp-deploy-USER-SETUP.md](./02-akash-webapp-deploy-USER-SETUP.md) for:

- **Akash Console API Key**: Required for real deployments via `AKASH_CONSOLE_API_KEY` env var
- **ADI Testnet Contracts**: Deploy TestnetUSDC.sol and AkashEscrow.sol on ADI Testnet (chain 99999)
- **Environment variables**: Add contract addresses to `.env.local`

## Next Phase Readiness

✅ **Ready for Plan 02**: Build deployment UI components
✅ **Ready for Plan 03**: Integrate Console API into agent routing
✅ **Foundation complete**: All infrastructure in place for Akash deployment workflow

**Blockers:** None - infrastructure complete

---
*Phase: 02-akash-webapp-deploy*
*Completed: 2026-02-17*
