# Codebase Concerns

**Analysis Date:** 2026-02-14

## Tech Debt

### Workflow Canvas - Node Type Override
- **Issue:** Custom node types are overridden to 'default' in `workflow-canvas.tsx` (lines 83-95), bypassing the custom node rendering system
- **Files:** `offchain/src/components/workflow/workflow-canvas.tsx`
- **Impact:** Custom node styling from `custom-nodes.tsx` is ignored; all nodes display with hardcoded inline styles
- **Fix approach:** Remove the `displayNodes` mapping override and properly register node types with ReactFlow

### TODO Comments for Core Functionality
- **Issue:** Save and Deploy functionality are stubbed with TODO comments
- **Files:** `offchain/src/app/builder/page.tsx` (lines 17, 22)
- **Impact:** Workflow builder cannot persist or execute workflows - breaks core product functionality
- **Fix approach:** Implement workflow serialization to JSON/localStorage and create deployment service

### Excessive Debug Logging
- **Issue:** 30+ console.log statements across workflow components for debugging
- **Files:** `offchain/src/components/workflow/workflow-canvas.tsx`, `offchain/src/components/workflow/node-palette.tsx`, `offchain/src/lib/workflow-store.ts`
- **Impact:** Console pollution in production, potential performance overhead, information leakage
- **Fix approach:** Remove or guard with `process.env.NODE_ENV !== 'production'` checks

### Dynamic Require in State Management
- **Issue:** Zustand store uses dynamic `require()` for React Flow utilities
- **Files:** `offchain/src/lib/workflow-store.ts` (lines 34, 39)
- **Impact:** Prevents tree-shaking, may cause issues with SSR/bundling
- **Fix approach:** Use static imports at top of file

## Known Bugs

### Node Position Randomization on Click
- **Issue:** Clicking palette nodes adds them at random positions (Math.random()) causing nodes to overlap
- **Files:** `offchain/src/components/workflow/node-palette.tsx` (lines 18-21)
- **Trigger:** Click any node in the palette
- **Workaround:** Use drag-and-drop instead

### Workflow Canvas Node Type Fallback
- **Issue:** Node type forced to 'default' overrides category-specific styling
- **Files:** `offchain/src/components/workflow/workflow-canvas.tsx` (line 86)
- **Impact:** All nodes appear identical regardless of category (trigger/logic/provider/settlement)
- **Workaround:** None - requires code fix

### Missing Wallet Error Handling UI
- **Issue:** Wallet connection errors logged but no user-facing error states
- **Files:** `offchain/src/components/wallet-connect.tsx`, `offchain/src/hooks/use-wallet.ts`
- **Impact:** Users see no feedback when wallet connection fails

## Security Considerations

### No Input Validation on Node Configuration
- **Risk:** Config panel inputs accept arbitrary values without validation
- **Files:** `offchain/src/components/workflow/config-panel.tsx`
- **Current mitigation:** None
- **Recommendations:** Add Zod validation for config values, sanitize inputs before storage

### Wallet Address Exposure in Console
- **Risk:** No concern currently, but verify no sensitive data logging in production
- **Files:** Audit all `console.log` statements
- **Current mitigation:** None needed currently
- **Recommendations:** Ensure wallet addresses and transaction data not logged

### No Rate Limiting on Provider Fetch
- **Risk:** `fetchAkashProviders()` could be called excessively
- **Files:** `offchain/src/lib/providers/akash-fetcher.ts`
- **Current mitigation:** Next.js fetch caching (60s)
- **Recommendations:** Add deduplication and request throttling

## Performance Bottlenecks

### React Flow Re-renders
- **Problem:** Workflow canvas logs on every render (lines 28-29) indicating potential excessive re-rendering
- **Files:** `offchain/src/components/workflow/workflow-canvas.tsx`
- **Cause:** Zustand store subscriptions may not be optimized
- **Improvement path:** Use selector patterns in `useWorkflowStore`, add React.memo to node components

### Large Static Data Structures
- **Problem:** `nodeTemplates` object recreated on every import
- **Files:** `offchain/src/components/workflow/custom-nodes.tsx` (lines 108-128)
- **Cause:** Object defined at module level but not frozen/optimized
- **Improvement path:** Use `Object.freeze()` or move to separate JSON file

### No Memoization in Provider Grid
- **Problem:** `ProviderCard` components re-render on every parent update
- **Files:** `offchain/src/app/providers/page.tsx`
- **Improvement path:** Wrap with React.memo, use useMemo for computed values

## Fragile Areas

### Workflow Store State Shape
- **Files:** `offchain/src/lib/workflow-store.ts`
- **Why fragile:** `any[]` types for changes (lines 17-18), `Record<string, any>` for config (lines 8, 22)
- **Safe modification:** Add explicit types before extending functionality
- **Test coverage:** None

### Icon Resolution in Custom Nodes
- **Files:** `offchain/src/components/workflow/custom-nodes.tsx` (lines 60-67)
- **Why fragile:** Multiple fallback chains (icon prop → iconName → default) with runtime iconMap lookup
- **Safe modification:** Ensure all node templates include both icon and iconName
- **Test coverage:** None

### Akash Provider API Resilience
- **Files:** `offchain/src/lib/providers/akash-fetcher.ts`
- **Why fragile:** Relies on two hardcoded endpoints with no circuit breaker pattern
- **Safe modification:** Add exponential backoff and health checks
- **Test coverage:** None

## Scaling Limits

### Workflow State Management
- **Current capacity:** In-memory Zustand store only
- **Limit:** No persistence, state lost on refresh
- **Scaling path:** Add localStorage persistence, then backend storage

### Provider Data Fetching
- **Current capacity:** Client-side fetch with 60s cache
- **Limit:** No pagination, all providers loaded at once
- **Scaling path:** Implement virtual scrolling, server-side pagination

### Node Canvas Performance
- **Current capacity:** ReactFlow handles ~100 nodes well
- **Limit:** No virtualization for large workflows
- **Scaling path:** Implement node virtualization, lazy loading

## Dependencies at Risk

### React 19 Compatibility
- **Risk:** Project uses React 19.2.3, some dependencies may not fully support it yet
- **Impact:** Potential runtime errors with `@xyflow/react`, `wagmi`
- **Migration plan:** Monitor for updates, test thoroughly before production

### Wagmi v3 API Changes
- **Risk:** Using wagmi v3.4.3 with hooks that may change in v4
- **Impact:** `useConnection`, `useChainId` hook patterns
- **Migration plan:** Review wagmi v4 migration guide, prepare for hook renames

### Tailwind CSS v4 Beta
- **Risk:** Using Tailwind CSS v4 which may have breaking changes before stable
- **Impact:** Styling may break on updates
- **Migration plan:** Pin version until v4 stable release

## Missing Critical Features

### Workflow Persistence
- **Problem:** No save/load functionality implemented
- **Blocks:** Users cannot create reusable workflows
- **Files:** `offchain/src/app/builder/page.tsx` TODO comments

### Workflow Execution Engine
- **Problem:** Deploy button has no implementation
- **Blocks:** Cannot execute workflows against real providers
- **Files:** `offchain/src/app/builder/page.tsx` TODO comments

### Error Boundaries
- **Problem:** No React error boundaries for workflow builder
- **Blocks:** Single component error crashes entire app
- **Recommendation:** Add ErrorBoundary around ReactFlowProvider

### Form Validation
- **Problem:** Config panel accepts any input values
- **Blocks:** Invalid configurations can be "saved" (in memory only)
- **Files:** `offchain/src/components/workflow/config-panel.tsx`

## Test Coverage Gaps

### No Test Framework Configured
- **What's not tested:** Everything
- **Files:** All files in `offchain/src/`
- **Risk:** Refactors may break functionality without detection
- **Priority:** HIGH

### Wallet Integration Untested
- **What's not tested:** Connection, disconnection, chain switching
- **Files:** `offchain/src/hooks/use-wallet.ts`, `offchain/src/components/wallet-connect.tsx`
- **Risk:** Web3 integration bugs only caught manually
- **Priority:** HIGH

### Workflow Logic Untested
- **What's not tested:** Node add/remove, edge connections, state updates
- **Files:** `offchain/src/lib/workflow-store.ts`
- **Risk:** Store logic changes may break workflow functionality
- **Priority:** MEDIUM

### API Integration Untested
- **What's not tested:** Akash provider fetching, error handling, fallbacks
- **Files:** `offchain/src/lib/providers/akash-fetcher.ts`
- **Risk:** API changes break provider discovery
- **Priority:** MEDIUM

---

*Concerns audit: 2026-02-14*
