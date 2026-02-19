# Codebase Concerns

**Analysis Date:** 2026-02-19

## Tech Debt

**In-Memory Escrow Storage:**
- Issue: Escrow API uses in-memory Map instead of blockchain persistence
- Files: `offchain/src/app/api/escrow/route.ts`
- Impact: Data lost on server restart; no audit trail; non-production ready
- Fix approach: Integrate with deployed USDCEscrow contract using viem

**Duplicate Mock Provider Data:**
- Issue: MOCK_PROVIDERS defined in multiple files with different formats
- Files: `offchain/src/lib/providers/akash-fetcher.ts`, `offchain/src/lib/providers/runpod-fetcher.ts`, `offchain/src/lib/providers/lambda-fetcher.ts`, `offchain/src/lib/agent/akash-router.ts`, `offchain/src/lib/agent/tools/compare-providers-tool.ts`
- Impact: Inconsistent data; maintenance burden; demo data mixed with production code
- Fix approach: Centralize mock data in single file under `offchain/src/lib/providers/mocks.ts`

**Placeholder Calldata Generation:**
- Issue: Escrow API generates fake calldata using JSON.stringify instead of ABI encoding
- Files: `offchain/src/app/api/escrow/route.ts:298-310`
- Impact: Transactions will fail on-chain;误导ing frontend behavior
- Fix approach: Use viem's encodeFunctionData with proper contract ABI

**Unimplemented TODOs:**
- Issue: Multiple TODOs for critical features left as placeholders
- Files:
  - `offchain/src/app/builder/page.tsx:17` - Save functionality
  - `offchain/src/app/builder/page.tsx:22` - Deploy functionality
  - `offchain/src/app/buyer/dashboard/page.tsx:101` - Real API call
  - `offchain/src/app/buyer/dashboard/page.tsx:125` - Fetch from escrow contract
  - `offchain/src/app/buyer/dashboard/page.tsx:170` - SSE endpoint
  - `offchain/src/app/buyer/dashboard/page.tsx:194` - Close deployment API
  - `offchain/src/app/api/deployments/route.ts:11` - Authenticated user from session
  - `offchain/src/hooks/use-provider-discovery.ts:102` - Real Console API call
- Impact: Features not production-ready; demo-only state
- Fix approach: Prioritize and implement based on roadmap

**Mock Transaction Hash in Agent:**
- Issue: Blockchain submission generates fake transaction hash
- Files: `offchain/src/lib/agent/agent.ts:222-227`
- Impact: Tracking mode appears to work but doesn't record on-chain
- Fix approach: Use walletTool properly or remove isTracked feature until implemented

## Security Considerations

**Environment Variable Access in Client Code:**
- Risk: API keys accessed via process.env may leak to client bundle
- Files: `offchain/src/lib/providers/runpod-fetcher.ts:35`, `offchain/src/lib/providers/lambda-fetcher.ts:34`, `offchain/src/lib/akash/console-api.ts:210`
- Current mitigation: Files appear to be server-only (API routes, lib used by API routes)
- Recommendations: Verify Next.js marks these as server-only; consider adding `'server-only'` import

**Header-Based Authentication:**
- Risk: Authentication relies on `x-user-address` header; no JWT or session validation
- Files: `offchain/src/app/api/escrow/route.ts`, `offchain/src/app/api/deployments/route.ts`
- Current mitigation: None - user can spoof any address
- Recommendations: Implement SIWE (Sign-In with Ethereum) for wallet authentication

**Agent Private Key Handling:**
- Risk: Private key loaded from environment for blockchain transactions
- Files: `offchain/src/lib/agent/wallet-tool.ts:19`
- Current mitigation: Environment variable (not hardcoded)
- Recommendations: Consider using hardware wallet or HSM for production; add key rotation mechanism

**Zero Address Defaults:**
- Risk: Contract addresses default to zero address when not configured
- Files: `offchain/src/lib/contracts/testnet-usdc-escrow.ts:139`, `offchain/src/lib/contracts/testnet-usdc-token.ts:130`, `offchain/src/app/api/escrow/route.ts:4`
- Current mitigation: `isContractConfigured()` helper checks for zero address
- Recommendations: Throw error at startup if critical addresses not configured

**Missing Rate Limiting:**
- Risk: API routes have no rate limiting
- Files: All files in `offchain/src/app/api/`
- Current mitigation: None
- Recommendations: Add rate limiting middleware for production

## Performance Bottlenecks

**Large UI Components:**
- Problem: Sidebar component is 726 lines
- Files: `offchain/src/components/ui/sidebar.tsx`
- Cause: Likely auto-generated from shadcn; includes many variants
- Improvement path: Accept as library code; focus optimization elsewhere

**Console Logging Proliferation:**
- Problem: 141 console.log/error/warn statements throughout codebase
- Files: Widespread across `offchain/src/`
- Cause: Debugging and error reporting without structured logging
- Improvement path: Replace with structured logging library (pino, winston); remove debug logs for production

**API Fallback to Mock Data:**
- Problem: Provider fetchers silently fall back to mock data on API failure
- Files: `offchain/src/lib/providers/akash-fetcher.ts:267-278`, `offchain/src/lib/providers/runpod-fetcher.ts:37-126`
- Cause: Designed for demo resilience
- Improvement path: Add explicit mock mode flag; return error in production when APIs unavailable

**Dashboard Polling:**
- Problem: Polls every 30 seconds regardless of activity
- Files: `offchain/src/app/buyer/dashboard/page.tsx:140-143`
- Cause: Simple implementation without WebSocket/SSE
- Improvement path: Use SSE for real-time updates or increase polling interval

## Fragile Areas

**Workflow Canvas Type Safety:**
- Files: `offchain/src/lib/workflow-store.ts:17-18`, `offchain/src/components/workflow/node-palette.tsx:10`, `offchain/src/components/workflow/workflow-canvas.tsx:75`
- Why fragile: Uses `any[]` and `any` for node/edge types; ReactFlow integration loosely typed
- Safe modification: Define proper types extending ReactFlow's Node/Edge types
- Test coverage: None

**Provider Comparison Tool:**
- Files: `offchain/src/lib/agent/tools/compare-providers-tool.ts`, `offchain/src/lib/agent/akash-router.ts`
- Why fragile: Both files define similar MOCK_PROVIDERS and Provider interfaces; changes must be synced
- Safe modification: Consolidate types and mock data into shared module
- Test coverage: None

**Escrow API State Management:**
- Files: `offchain/src/app/api/escrow/route.ts:18`
- Why fragile: Global Map variable shared across requests; race conditions possible
- Safe modification: Replace with blockchain calls or database
- Test coverage: None for offchain

**Environment Configuration:**
- Files: Multiple files reading `process.env.*`
- Why fragile: No validation at startup; defaults may hide configuration errors
- Safe modification: Add config validation module that runs at server startup
- Test coverage: None

## Scaling Limits

**In-Memory Escrow Storage:**
- Current capacity: Limited by Node.js memory
- Limit: Data lost on restart; horizontal scaling impossible
- Scaling path: Migrate to USDCEscrow contract calls or database

**Single-Instance Agent Wallet:**
- Current capacity: One wallet instance per process
- Limit: Cannot scale agent horizontally without nonce conflicts
- Scaling path: Implement transaction queue with nonce management

**No Caching Layer:**
- Current capacity: Every request hits external APIs
- Limit: Rate limits from Akash/RunPod/Lambda APIs
- Scaling path: Add Redis for provider data caching; increase revalidate time

## Dependencies at Risk

**@google/adk:**
- Risk: Early version (0.3.0); API may change; limited community support
- Impact: Breaking changes could require significant refactoring
- Migration plan: Monitor ADK releases; abstract agent interface to allow switching LLM frameworks

**adiTestnet Chain:**
- Risk: Custom chain with ID 99999; not in viem default chains
- Impact: Must maintain custom chain config; RPC stability unknown
- Migration plan: Production deployment may require different chain; keep chain config abstracted

## Missing Critical Features

**Test Framework for Offchain:**
- Problem: No Jest, Vitest, or other test framework configured
- Blocks: Cannot add unit tests for offchain logic; only hardhat contracts have tests
- Files: Missing in `offchain/`

**Authentication System:**
- Problem: No real auth; wallet address passed via header
- Blocks: Production deployment; user account management
- Files: Missing

**Error Monitoring:**
- Problem: No Sentry, LogSnag, or similar error tracking
- Blocks: Production debugging; alerting on errors
- Files: Missing

**Database/Persistence Layer:**
- Problem: No database for user data, job history, preferences
- Blocks: User-specific features; analytics; audit trail
- Files: Missing

## Test Coverage Gaps

**Offchain Unit Tests:**
- What's not tested: All React components, hooks, API routes, agent logic, provider fetchers
- Files: Entire `offchain/src/` directory
- Risk: Refactoring may break functionality without detection
- Priority: High

**Smart Contract Integration Tests:**
- What's not tested: Offchain-to-contract interactions
- Files: `offchain/src/lib/contracts/*.ts`, `offchain/src/lib/agent/wallet-tool.ts`
- Risk: ABI mismatches; incorrect function signatures
- Priority: Medium

**End-to-End Tests:**
- What's not tested: Full user flows (deploy -> escrow -> release)
- Files: All
- Risk: Integration bugs not caught until production
- Priority: Medium

---

*Concerns audit: 2026-02-19*
