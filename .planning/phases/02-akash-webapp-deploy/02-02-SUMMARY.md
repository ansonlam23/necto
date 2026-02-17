---
phase: 02-akash-webapp-deploy
plan: 02
type: execute
subsystem: agent
tags: [akash, agent, routing, provider-selection, react-hooks, ui-components]

# Dependency graph
requires:
  - phase: 02-akash-webapp-deploy-01
    provides: Akash Console API client, SDL generator, TypeScript types
provides:
  - Multi-factor provider selection algorithm with configurable weights
  - Agent routing logic for Akash deployments with suitability checking
  - React hooks for provider discovery and deployment lifecycle
  - UI components for provider cards, filtering, and deployment status
affects:
  - 02-akash-webapp-deploy-03
  - 02-akash-webapp-deploy-04

tech-stack:
  added:
    - Provider selection algorithm with weighted scoring
    - RouteToAkash deployment flow with bid polling
    - useProviderDiscovery hook with filtering
    - useAkashDeployment hook with state machine
  patterns:
    - Multi-factor scoring with configurable weights (price 35%, reliability 25%, performance 25%, latency 15%)
    - State machine pattern for deployment lifecycle (11 states)
    - Real-time progress tracking via callbacks
    - Mock data pattern for development

key-files:
  created:
    - offchain/src/lib/agent/provider-selection.ts - Multi-factor provider ranking algorithm
    - offchain/src/lib/agent/akash-router.ts - Agent routing logic with suitability checking
    - offchain/src/hooks/use-provider-discovery.ts - Provider discovery hook with filtering
    - offchain/src/hooks/use-akash-deployment.ts - Deployment lifecycle hook with state machine
    - offchain/src/components/akash/provider-card.tsx - Provider display card with scoring
    - offchain/src/components/akash/provider-list.tsx - Provider list with filtering UI
    - offchain/src/components/akash/deployment-status.tsx - Deployment status dashboard
    - offchain/src/components/ui/progress.tsx - shadcn Progress component
    - offchain/src/components/ui/scroll-area.tsx - shadcn ScrollArea component
    - offchain/src/components/ui/slider.tsx - shadcn Slider component
  modified: []

key-decisions:
  - "Weighted scoring with default weights: price 35%, reliability 25%, performance 25%, latency 15%"
  - "5-minute bid polling timeout with 10-second intervals for real-time feedback"
  - "Mock providers pattern for development before Console API provider discovery"
  - "State machine with 11 deployment states for granular progress tracking"
  - "ProviderCard shows score breakdown only when score data available"

patterns-established:
  - "Multi-factor ranking: normalize values to 0-1, apply weights, sort descending"
  - "Hook pattern: state + loading + error + callbacks for async operations"
  - "Component pattern: accept optional score prop for flexibility in display"
  - "Mock data at module level for easy replacement with real API"

requirements-completed: []

# Metrics
duration: 14min
completed: 2026-02-17
---

# Phase 02 Plan 02: Agent Routing & Provider Discovery Summary

**Agent routing logic with multi-factor provider selection, real-time deployment monitoring, and provider discovery UI components connecting to Akash Console API.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-02-17T17:28:19Z
- **Completed:** 2026-02-17T17:42:52Z
- **Tasks:** 4
- **Files created:** 10

## Accomplishments

- **Multi-factor provider selection** with configurable weights (price, reliability, performance, latency)
- **Agent routing logic** with workload suitability checking and 6-step deployment flow
- **Provider discovery hook** with filtering by GPU type, region, price, and availability
- **Deployment lifecycle hook** with 11-state machine and progress tracking (0-100%)
- **UI components** for provider cards, provider list, and deployment status dashboard
- **shadcn components** added: Progress, ScrollArea, Slider

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement multi-factor provider selection** - `fc4bdc4` (feat)
2. **Task 2: Create agent routing logic for Akash** - `6c1dbaf` (feat)
3. **Task 3: Create provider discovery hooks** - `e8b9fc7` (feat)
4. **Task 4: Create provider and deployment UI components** - `c26f73f` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `offchain/src/lib/agent/provider-selection.ts` - Provider interface, ProviderScore, rankProviders, filterProviders, getProviderRecommendations
- `offchain/src/lib/agent/akash-router.ts` - routeToAkash, isAkashSuitable, pollForBids, cancelRoute, formatRouteLogs
- `offchain/src/hooks/use-provider-discovery.ts` - useProviderDiscovery hook with DiscoveryFilters
- `offchain/src/hooks/use-akash-deployment.ts` - useAkashDeployment hook with DeploymentState enum
- `offchain/src/components/akash/provider-card.tsx` - ProviderCard and CompactProviderCard components
- `offchain/src/components/akash/provider-list.tsx` - ProviderList with filtering UI
- `offchain/src/components/akash/deployment-status.tsx` - DeploymentStatus and DeploymentTimeline components
- `offchain/src/components/ui/progress.tsx` - shadcn Progress component
- `offchain/src/components/ui/scroll-area.tsx` - shadcn ScrollArea component
- `offchain/src/components/ui/slider.tsx` - shadcn Slider component

## Decisions Made

- **Default scoring weights**: Price 35%, reliability 25%, performance 25%, latency 15% - balanced for cost-conscious but reliable deployments
- **5-minute bid timeout**: Long enough for providers to respond, short enough for reasonable UX
- **10-second polling interval**: Balance between responsiveness and API load
- **11-state deployment machine**: Granular states for each phase (idle → checking → generating → selecting → creating → waiting → accepting → active/closing/completed/error)
- **Mock providers at module level**: Easy to replace with Console API provider discovery later
- **Auto-select top provider**: Initial UX optimization for quick starts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- ESLint configuration issue with react/display-name rule - worked around by using TypeScript build verification instead
- shadcn components (progress, scroll-area, slider) not installed - auto-installed via `npx shadcn add`

## User Setup Required

**External services require manual configuration.** See 02-USER-SETUP.md for:
- AKASH_CONSOLE_API_KEY environment variable from Akash Console dashboard
- Verification commands for API connectivity

## Next Phase Readiness

- Agent routing system complete and ready for integration
- Provider discovery UI functional with mock data
- Ready for Plan 03: Connect to real Console API provider discovery
- Ready for Plan 04: Full deployment workflow with Keplr signing

---
*Phase: 02-akash-webapp-deploy*
*Completed: 2026-02-17*

## Self-Check: PASSED

- All 7 key files exist on disk
- All 4 task commits present in git history
