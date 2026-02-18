---
phase: 02-akash-webapp-deploy
plan: 05
subsystem: agent
tags: [google-adk, adk-tools, agent-development-kit, multi-provider, akash, tool-architecture]

requires:
  - phase: 02-akash-webapp-deploy
    provides: "Akash router (akash-router.ts), provider selection, SDL generation"

provides:
  - Google ADK tool-based agent architecture
  - routeToAkashTool for LLM-driven Akash routing
  - compareProvidersTool for multi-provider evaluation
  - Tool registry pattern for adding new providers
  - Agent refactored to use tools instead of hardcoded logic

affects:
  - Phase 2 agent implementation
  - Future provider integrations (io.net, Lambda Labs)
  - Agent extensibility and maintainability

tech-stack:
  added:
    - "@google/adk - Agent Development Kit for tool-based LLM agents"
  patterns:
    - "ADK Tool Pattern - Each provider as a BaseTool extension"
    - "Tool Registry - Centralized tool exports and lookup"
    - "Tool-based Delegation - Agent delegates to tools rather than hardcoded logic"

key-files:
  created:
    - offchain/src/lib/agent/tools/route-to-akash-tool.ts
    - offchain/src/lib/agent/tools/compare-providers-tool.ts
    - offchain/src/lib/agent/tools/index.ts
    - offchain/src/lib/agent/index.ts
  modified:
    - offchain/src/lib/agent/agent.ts
    - .planning/phases/02-akash-webapp-deploy/02-VERIFICATION.md

key-decisions:
  - "Used ADK BaseTool pattern for all provider integrations"
  - "Created tool-based architecture to enable trivial provider addition"
  - "Exported tools both as classes (for extension) and singletons (for use)"
  - "Maintained backward compatibility with existing agent API"
  - "Documented pattern: 'Adding a new provider = create tool + export + add to array'"

patterns-established:
  - "Tool Architecture: Each provider gets an ADK BaseTool implementation"
  - "Tool Registry: Centralized exports via tools/index.ts with allTools array"
  - "Type Conversion: Helper functions to convert between agent and SDL types"
  - "Tool Helper Pattern: Export executeXxx functions for direct programmatic use"

requirements-completed:
  - SYS-06

duration: 21min
completed: 2026-02-18
---

# Phase 02 Plan 05: ADK Tool Architecture (Gap Closure) Summary

**Google ADK tool-based agent architecture enabling multi-provider scalability. Adding io.net = create tool + add to array.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-02-18T00:43:34Z
- **Completed:** 2026-02-18T01:04:37Z
- **Tasks:** 6
- **Files created:** 4
- **Files modified:** 3

## Accomplishments

- Created `routeToAkashTool` - ADK BaseTool wrapping Akash router for LLM use
- Created `compareProvidersTool` - ADK BaseTool for multi-provider comparison
- Built tools index with centralized exports and registry pattern
- Refactored agent.ts to use tool-based architecture (no hardcoded provider logic)
- Created agent index.ts with full tool exports for clean imports
- Updated VERIFICATION.md - SYS-06 gap marked as RESOLVED
- Fixed pre-existing build errors (JSX.Element type, duplicate export)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create routeToAkashTool** - `0620588` (feat)
2. **Task 2: Create compareProvidersTool** - `ad36621` (feat)
3. **Task 3: Create tools index** - `1e23594` (feat)
4. **Task 4: Refactor agent.ts** - `057f2bd` (feat)
5. **Task 5: Create agent index** - `9056058` (feat)
6. **Task 6: Update VERIFICATION.md** - `1df1760` (docs)

**Plan metadata:** Commit series above completes plan 02-05

## Files Created/Modified

**Created:**
- `offchain/src/lib/agent/tools/route-to-akash-tool.ts` (212 lines) - ADK tool for Akash routing with executeRouteToAkash helper
- `offchain/src/lib/agent/tools/compare-providers-tool.ts` (418 lines) - ADK tool for provider comparison with pros/cons/assessment
- `offchain/src/lib/agent/tools/index.ts` (110 lines) - Tool exports, allTools array, toolRegistry
- `offchain/src/lib/agent/index.ts` (80 lines) - Centralized agent module exports including all tools

**Modified:**
- `offchain/src/lib/agent/agent.ts` - Refactored from hardcoded logic to tool-based delegation
- `offchain/src/app/buyer/dashboard/page.tsx` - Fixed pre-existing JSX.Element type error (Rule 1)
- `offchain/src/components/akash/deployment-list.tsx` - Fixed pre-existing duplicate export error (Rule 1)
- `.planning/phases/02-akash-webapp-deploy/02-VERIFICATION.md` - Marked SYS-06 as resolved

## Decisions Made

1. **ADK BaseTool Pattern** - All provider integrations extend BaseTool for consistency
2. **Tool Registry Pattern** - Centralized exports enable clean agent initialization
3. **Helper Function Exports** - Export executeXxx functions for direct use outside LLM context
4. **Type Conversion Helpers** - Created toSdlRequirements() to bridge agent and SDL types
5. **Backward Compatibility** - Kept existing agent API (createRoutingAgent, routeComputeJob) unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed JSX.Element type error in buyer dashboard**
- **Found during:** Build verification after Task 1
- **Issue:** `export default function BuyerDashboardPage(): JSX.Element` - JSX namespace not found
- **Fix:** Changed to `React.JSX.Element`
- **Files modified:** offchain/src/app/buyer/dashboard/page.tsx
- **Verification:** Build passes
- **Committed in:** 0620588 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed duplicate DeploymentItem export**
- **Found during:** Build verification after Task 1
- **Issue:** Line 38 had `export interface DeploymentItem` and line 340 had `export type { DeploymentItem }` causing conflict
- **Fix:** Removed duplicate export on line 340
- **Files modified:** offchain/src/components/akash/deployment-list.tsx
- **Verification:** Build passes
- **Committed in:** 0620588 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed TypeScript type mismatches in agent.ts**
- **Found during:** Build verification after Task 4
- **Issue:** Multiple type mismatches between agent types and SDL types
- **Fix:** Added toSdlRequirements() helper, fixed SynapseProvider hardware fields
- **Files modified:** offchain/src/lib/agent/agent.ts
- **Verification:** Build passes
- **Committed in:** 057f2bd (Task 4 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - bugs that blocked completion)
**Impact on plan:** All auto-fixes necessary for build success. No scope creep.

## Issues Encountered

None - all pre-existing build errors were auto-fixed per deviation rules.

## User Setup Required

None - no new external service configuration required. ADK uses existing Google AI Studio API key.

## Architecture Highlights

### Tool-Based Agent Architecture

```
Agent (agent.ts)
  └── tools: [routeToAkashTool, compareProvidersTool, walletTool]
      
routeToAkashTool
  └── executeRouteToAkash()
      └── routeToAkash() from akash-router.ts

compareProvidersTool
  └── executeCompareProviders()
      └── isAkashSuitable(), filterProviders(), rankProviders()
```

### Adding a New Provider

To add io.net support:

1. Create `offchain/src/lib/agent/tools/route-to-ionet-tool.ts`
2. Extend `BaseTool` from `@google/adk`
3. Export tool class and singleton instance
4. Add to `tools/index.ts` exports and `allTools` array
5. Import and add to agent's tools array in `agent.ts`

**Pattern:** "Create tool → Export → Add to array" = 3 steps

## Next Phase Readiness

- ✅ Google ADK integration complete with tool architecture
- ✅ Multi-provider foundation established
- ✅ All agent functionality preserved with cleaner architecture
- 🎯 Ready for: io.net integration, Lambda Labs, or other providers
- 🎯 Ready for: Real Console API connectivity testing

## Gap Closure Status

| Gap | Status | Resolution |
|-----|--------|------------|
| SYS-06 (Google ADK) | ✅ RESOLVED | Full ADK tool-based architecture |
| AGT-03 (CoinGecko) | ⚠️ PENDING | Still needs AKT/USD price feed |
| Awesome-akash | ⚠️ PENDING | Still needs GitHub API fetching |

**VERIFICATION.md Updated:** SYS-06 marked resolved with re_verification details

---
*Phase: 02-akash-webapp-deploy*  
*Plan: 05 - ADK Tool Architecture (Gap Closure)*  
*Completed: 2026-02-18*
