# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Hybrid application with Next.js frontend and Hardhat smart contracts

**Key Characteristics:**
- Tool-based agent architecture for compute job routing
- Separation of offchain UI/agent logic and on-chain tracking
- Multi-provider abstraction via standardized interfaces
- Zustand for global state, React hooks for component state

## Layers

**UI Layer:**
- Purpose: User interface for compute marketplace interaction
- Location: `offchain/src/app/` (pages), `offchain/src/components/` (UI components)
- Contains: Next.js App Router pages, React components, layout shells
- Depends on: State layer (Zustand stores), wagmi for Web3
- Used by: End users via browser

**State Layer:**
- Purpose: Global and local state management
- Location: `offchain/src/lib/workflow-store.ts`, `offchain/src/hooks/`
- Contains: Zustand stores, custom React hooks
- Depends on: Zustand library, wagmi hooks
- Used by: UI components, agent integration

**Agent Layer:**
- Purpose: AI-driven compute job routing with provider selection
- Location: `offchain/src/lib/agent/`
- Contains: Google ADK agent, provider tools, wallet tool
- Depends on: @google/adk, provider fetchers, blockchain contracts
- Used by: API routes (`/api/route-job`)

**Integration Layer:**
- Purpose: External service integrations (Akash, other providers)
- Location: `offchain/src/lib/akash/`, `offchain/src/lib/providers/`
- Contains: Akash Console API client, SDL generator, provider fetchers
- Depends on: External APIs (Akash Console, provider APIs)
- Used by: Agent tools, API routes

**Blockchain Layer:**
- Purpose: On-chain job tracking and escrow management
- Location: `hardhat/contracts/`, `offchain/src/lib/contracts/`
- Contains: Solidity contracts, TypeScript ABIs, deployment scripts
- Depends on: Hardhat, viem/wagmi for frontend integration
- Used by: Agent wallet tool, API routes

**API Layer:**
- Purpose: Server-side API endpoints for frontend-backend communication
- Location: `offchain/src/app/api/`
- Contains: Next.js API route handlers
- Depends on: Agent, integration, and blockchain layers
- Used by: Frontend components via fetch

## Data Flow

**Compute Job Routing Flow:**

1. User submits job requirements via form or natural language input
2. Frontend calls `/api/route-job` with job description and requirements
3. API route invokes `routeComputeJob()` from agent layer
4. Agent executes `compare_providers` tool to evaluate available providers
5. Agent selects best provider based on price, reliability, performance scores
6. Agent executes `route_to_akash` tool to create deployment
7. Akash Console API creates SDL, deployment, and waits for bids
8. If tracked mode enabled, agent calls `wallet_tool` to record on-chain
9. Result returned to frontend with thinking steps for UI display

**Provider Discovery Flow:**

1. Frontend calls `/api/providers` endpoint
2. API fetches providers from multiple sources via provider fetchers
3. Each fetcher (`akash-fetcher.ts`, `runpod-fetcher.ts`, `lambda-fetcher.ts`) normalizes to `SynapseProvider` interface
4. Results merged and cached (60-second revalidation)
5. Frontend displays provider cards with comparison capabilities

**Wallet Transaction Flow:**

1. User initiates tracked job submission
2. `useWallet` hook prepares transaction via wagmi
3. User signs transaction via injected wallet (MetaMask, etc.)
4. Transaction submitted to ComputeRouter contract on ADI Testnet
5. Transaction hash returned for monitoring

**State Management:**
- Global workflow state: Zustand store (`useWorkflowStore`)
- Web3 connection state: wagmi hooks (`useConnection`, `useAccount`)
- Local component state: React `useState`/`useCallback`
- Server state: React Query via `@tanstack/react-query`

## Key Abstractions

**Tool-Based Agent Architecture:**
- Purpose: Extensible compute routing via pluggable tools
- Examples: `offchain/src/lib/agent/tools/route-to-akash-tool.ts`, `offchain/src/lib/agent/tools/compare-providers-tool.ts`
- Pattern: Each provider/capability is an ADK tool extending `BaseTool`
- Tools expose `runAsync()` method for execution
- Registry pattern (`toolRegistry`) for tool lookup

**Provider Interface (SynapseProvider):**
- Purpose: Standardized provider representation across sources
- Examples: `offchain/src/lib/providers/akash-fetcher.ts`
- Pattern: All provider fetchers return `SynapseProvider[]`
- Includes: hardware specs, pricing, uptime, region, source

**SDL (Stack Definition Language):**
- Purpose: Akash deployment specification
- Examples: `offchain/src/lib/akash/sdl-generator.ts`
- Pattern: TypeScript interfaces → YAML generation → Console API

**Contract ABIs:**
- Purpose: Type-safe blockchain interactions
- Examples: `offchain/src/lib/contracts/compute-router.ts`
- Pattern: Manual ABI definition matching Solidity interfaces
- Addresses hardcoded after deployment

## Entry Points

**Frontend Entry:**
- Location: `offchain/src/app/layout.tsx`
- Triggers: Browser navigation
- Responsibilities: Root layout, provider setup (Web3Provider, AppShell)

**API Routes:**
- Location: `offchain/src/app/api/*/route.ts`
- Triggers: HTTP requests from frontend
- Responsibilities: Request validation, agent invocation, response formatting

**Smart Contract Entry:**
- Location: `hardhat/contracts/ComputeRouter.sol`
- Triggers: Transaction submission from agent wallet
- Responsibilities: Job creation, routing decision recording

## Error Handling

**Strategy:** Layered error handling with user-friendly messages

**Patterns:**
- API routes: try-catch with JSON error responses
- Agent tools: Result objects with `success` boolean and `error` field
- Provider fetchers: Fallback to mock data on API failure
- Components: Error boundaries and loading states

## Cross-Cutting Concerns

**Logging:** 
- Console-based logging with descriptive prefixes
- Agent thinking steps exposed to UI for transparency
- Error logging with `console.error()` for debugging

**Validation:**
- API request validation (required fields, types)
- SDL validation before Akash submission
- Contract parameter validation via TypeScript types

**Authentication:**
- Web3 wallet-based authentication
- No traditional user accounts
- Agent wallet for on-chain operations (admin role in contracts)
