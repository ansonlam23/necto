---
phase: 02-create-google-adk-agent-with-google-ai-s
plan: 02
subsystem: agent
status: complete
tags: [agent, adk, blockchain, routing]
date: 2026-02-16
duration: 15min
commit_count: 5
---

# Phase 02 Plan 02: Create Google ADK Agent with Google AI Studio Summary

**One-liner:** Google ADK agent with compute job routing, provider ranking, and blockchain transaction signing for the Necto marketplace.

## Overview

Created a complete agent module that routes compute jobs to Akash providers and signs blockchain transactions on the ADI Testnet ComputeRouter contract. The agent uses Google ADK with Google AI Studio (Gemini models) and provides a thinking step UI for transparent decision-making.

## Tasks Completed

### 1. Install Google ADK Dependencies ✓
- **Commit:** c2533d5
- **Package:** `@google/adk@0.3.0`
- **Files:** `package.json`, `package-lock.json`

### 2. Create Agent Types ✓
- **Commit:** 10d80d0
- **File:** `src/lib/agent/types.ts`
- **Exports:** `AgentConfig`, `JobRequirements`, `RoutingRequest`, `RoutingResult`, `ThinkingStep`, `TransactionResult`

### 3. Create Wallet Tool ✓
- **Commit:** bfd3d0a
- **File:** `src/lib/agent/wallet-tool.ts`
- **Exports:** `WalletTool`, `submitJobTransaction`, `recordRoutingDecision`, `hashJobDetails`, `hashRoutingDecision`

### 4. Create Main Agent ✓
- **Commit:** 4f1eb37
- **File:** `src/lib/agent/agent.ts`
- **Exports:** `createRoutingAgent`, `routeComputeJob`, `quickRoute`

### 5. Environment Configuration ✓
- **Commit:** 2dab76e
- **File:** `.env.example`
- **Variables:** `GOOGLE_AI_STUDIO_API_KEY`, `AGENT_PRIVATE_KEY`, `AGENT_MODEL`, `AGENT_NAME`

## Artifacts Created

| File | Description | Key Exports |
|------|-------------|-------------|
| `src/lib/agent/types.ts` | TypeScript type definitions | AgentConfig, RoutingRequest, RoutingResult, TransactionResult |
| `src/lib/agent/wallet-tool.ts` | Blockchain transaction tool | WalletTool, submitJobTransaction, hashJobDetails |
| `src/lib/agent/agent.ts` | Main agent implementation | createRoutingAgent, routeComputeJob, quickRoute |
| `.env.example` | Environment template | GOOGLE_AI_STUDIO_API_KEY, AGENT_PRIVATE_KEY |

## Key Features

### Provider Routing Algorithm
- **Step 1:** Fetch providers from Akash Network API
- **Step 2:** Filter by requirements (GPU model, count, price, region)
- **Step 3:** Rank by weighted score: 70% price + 30% uptime
- **Step 4:** Return best provider with reasoning

### Blockchain Integration
- **submitJobTransaction:** Creates job on ComputeRouter contract
- **recordRoutingDecision:** Records provider selection on-chain
- **Hash Generation:** Keccak256 hashes for content verification

### Agent Thinking Steps (UI Support)
The agent exposes thinking steps via callback for UI toast/record:
1. "Fetching providers from Akash Network..."
2. "Normalizing pricing across providers..."
3. "Ranking providers by cost-performance..."
4. "Routing decision ready"
5. "Submitting job to blockchain..." (if tracked)

## Architecture

```
routeComputeJob(request, config, onThinking)
  ├── fetchAkashProviders()
  ├── filterProviders(requirements)
  ├── rankProviders()
  ├── submitJobTransaction() [if tracked]
  └── recordRoutingDecision() [if jobId available]
```

## Dependencies

- `@google/adk@0.3.0` - Google Agent Development Kit
- `viem@^2.45.3` - Blockchain interactions
- `@/lib/contracts/compute-router` - Contract ABI and address
- `@/lib/providers/akash-fetcher` - Provider data source

## Integration Points

### To ComputeRouter Contract
- Uses `submitJob(user, detailsHash, isTracked)` function
- Uses `recordRoutingDecision(jobId, provider, amount, routingHash)` function
- Contract address: `0x369CbbB21c7b85e3BB0f29DE5dCC92B2583E09Dd`

### To Akash Providers
- Fetches from `https://console-api.akash.network/v1/providers`
- Fallback to `https://api.cloudmos.io/v1/providers`
- Filters for online GPU providers only

## Verification

All TypeScript files compile without errors:
```bash
npx tsc --noEmit src/lib/agent/types.ts      # ✓ Pass
npx tsc --noEmit src/lib/agent/wallet-tool.ts # ✓ Pass
npx tsc --noEmit src/lib/agent/agent.ts       # ✓ Pass
```

## Deviations from Plan

### [Rule 1 - Bug] Google ADK Package Name
- **Issue:** The plan specified `google-adk` but the actual package is `@google/adk`
- **Resolution:** Installed correct package `@google/adk@0.3.0`
- **Impact:** None - correct package installed

### [Rule 1 - Bug] ADK Tool Interface
- **Issue:** Plan specified simple object-based tool, but ADK requires `BaseTool` subclass
- **Resolution:** Created `WalletTool` class extending `BaseTool` with `runAsync` method
- **Impact:** Better type safety and ADK integration

### [Rule 1 - Bug] Viem writeContract Types
- **Issue:** TypeScript errors when calling `writeContract` without explicit account
- **Resolution:** Added `account` parameter to writeContract calls
- **Impact:** Type-safe blockchain interactions

## User Setup Required

Before using the agent, users must:

1. **Get Google AI Studio API Key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Set `GOOGLE_AI_STUDIO_API_KEY` in `.env`

2. **Fund Agent Wallet:**
   - Create wallet and fund with ADI testnet tokens
   - Set `AGENT_PRIVATE_KEY` in `.env`

3. **Optional Configuration:**
   - `AGENT_MODEL`: Defaults to `gemini-2.0-flash`
   - `AGENT_NAME`: Defaults to `NectoRoutingAgent`

## Usage Example

```typescript
import { routeComputeJob } from '@/lib/agent/agent'
import type { AgentConfig, RoutingRequest } from '@/lib/agent/types'

const config: AgentConfig = {
  apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY!,
  model: 'gemini-2.0-flash',
  name: 'NectoRoutingAgent'
}

const request: RoutingRequest = {
  description: 'Train ML model',
  requirements: {
    gpuModel: 'A100',
    minGpuCount: 1,
    maxPricePerHour: 3.0
  },
  isTracked: true,
  userAddress: '0x1234...'
}

const { result, transaction } = await routeComputeJob(
  request,
  config,
  (step) => console.log(step.message) // UI callback
)
```

## Success Criteria

- [x] Agent module exports: `createRoutingAgent`, `routeComputeJob`, `quickRoute`
- [x] Wallet tool exports: `submitJobTransaction`, `recordRoutingDecision`, `walletTool`
- [x] All TypeScript compiles without errors
- [x] Environment variables documented for setup

## Commits

| Hash | Type | Description |
|------|------|-------------|
| c2533d5 | chore | Install @google/adk package |
| 10d80d0 | feat | Add agent type definitions |
| bfd3d0a | feat | Add wallet tool for blockchain transactions |
| 4f1eb37 | feat | Add main agent implementation |
| 2dab76e | chore | Add environment configuration template |

## Self-Check: PASSED

✅ All files created and committed
✅ All TypeScript compiles without errors
✅ All exports available as specified
✅ Environment variables documented
✅ Deviations documented

## Next Steps

1. Deploy ComputeRouter to ADI Testnet (if not already done)
2. Update `COMPUTE_ROUTER_ADDRESS` in `compute-router.ts`
3. Create UI components for agent thinking steps
4. Implement auto-sign toggle component
5. Add provider refresh mechanism

---
*Created: 2026-02-16*
*Duration: ~15 minutes*
*Status: Complete*
