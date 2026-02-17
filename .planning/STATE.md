# Project State: Necto - Two-Sided Compute Marketplace

**Created:** February 11, 2026  
**Last Updated:** February 17, 2026  
**Current Focus:** Milestone v2.0 — Akash Integration for compute routing

## Project Reference

**Core Value:** The cheapest GPU always finds its buyer, and idle hardware always finds a job.

**Current Focus:** Milestone v2.0 — Build functionality to route compute jobs to Akash Network providers

**Success Depends On:** Seamless Akash API integration, SDL generation for deployments, and real-time deployment monitoring.

---

## Reorganization Summary

**February 17, 2026:** Project cleanup and refocus on Akash integration

**Important Clarification:** Necto remains a two-sided compute marketplace. The v2.0 milestone specifically adds the capability to route compute jobs to Akash Network providers. This is not a pivot away from the marketplace vision - it's the first provider integration.

**Changes Made:**
1. ✅ Archived v1.0 milestone (ComputeRouter contract foundation)
2. ✅ Cleaned up quick task directories (2 completed tasks removed)
3. ✅ Updated PROJECT.md with Akash integration requirements
4. ✅ Reorganized ROADMAP.md - Akash as Phase 1 extension
5. ✅ Created Phase 2.1 for Akash deployment work

---

## Current Position

### Active Milestone
**Milestone v2.0: Akash Integration**  
- **Goal:** Build functionality that allows buyers to route their compute to Akash Network  
- **Status:** In Progress  
- **Team:** Single developer

### Completed Work (v1.0 Foundation)
**Phase 01-01: COMPLETE** ✅  
- ComputeRouter.sol implemented with full test coverage (26 tests passing)
- Ignition deployment module ready
- TypeScript integration complete
- ADI Testnet chain configured in wagmi

**Quick Tasks: COMPLETE** ✅  
- Google ADK agent with @google/adk@0.3.0
- Agent types, wallet tool, and main agent implementation
- /api/route-job API route + /verify-agent demo UI

### Current Plan
**Phase 2: Akash Integration**  
- Akash API client for provider discovery ✅
- SDL generator for deployments ✅
- Template gallery for web apps ✅
- Agent routing logic for Akash ✅
- Provider discovery UI components ✅
- Deployment monitoring hooks ✅
- Job submission page with multi-step wizard ✅
- Console API funding integration (pending)
- Full deployment workflow (pending)
- Testnet USDC escrow for demo payment flow (pending)
- Sponsored hosting model for hackathon (Necto pays Akash costs)

**Next Action:** Execute Plan 04 - Full deployment workflow with Console API

---

## Roadmap Status

- **Total Phases:** 4
- **Phases Complete:** 0/4 (active development)
- **v1.0 Phases Archived:** 1 (01-01 ComputeRouter)
- **Requirements Mapped:** 26/26 ✓

**Phase Structure:**
1. **Buyer Discovery + Akash Routing** — Job submission → agent routing → Akash deployment
2. **Provider Platform** — Full provider onboarding and registry
3. **Dynamic Routing** — Constraints + multi-provider support
4. **Settlement & Verification** — Escrow + 0G + dashboards

---

## Performance Metrics

### Development Velocity
- **Plans Executed:** 5 (v1.0 + Phase 2)
- **v1.0 Phases Completed:** 1 (archived)
- **Quick Tasks Completed:** 2 (cleaned up)
- **Reorganizations:** 1 (cleanup)

### Quality Indicators
- **v1.0 Requirements Coverage:** 100% ✅
- **Test Coverage:** 26 tests passing
- **Code Quality:** TypeScript strict mode, linting enabled
- **Documentation:** Updated for Akash integration

### Risk Assessment
- **Technical Risk:** Medium (Akash API complexity)
- **Integration Risk:** Low (Console API funding, no wallet dependency)
- **Timeline Risk:** Low (focused scope)
- **Execution Risk:** Low (clear phase structure)

---

## Directory Structure

```
.planning/
├── MILESTONES.md              # Milestone tracking
├── PROJECT.md                  # Akash integration requirements
├── ROADMAP.md                  # 4-phase marketplace roadmap
├── REQUIREMENTS.md             # Full requirements (v1.0)
├── STATE.md                    # This file
├── config.json                 # GSD config
├── codebase/                   # Research docs
├── milestones/                 # Archive directory
│   └── v1.0-phases/           # Archived v1.0 work
│       └── 01-01/             # ComputeRouter contract
├── phases/                     # Active phases
│   ├── 01-foundation-core-agent/  # Reduced (01-02 remaining)
│   └── 02-akash-webapp-deploy/    # Phase 1 extension
└── quick/                      # CLEANED
```

---

## Key Decisions Made

### From v1.0 (Retained)
1. **TypeScript monorepo** — Single language throughout
2. **Next.js 16 + Tailwind v4** — Modern stack
3. **viem/wagmi** — Blockchain interactions
4. **shadcn/ui** — Component library
5. **Two-sided marketplace** — Buyer + provider platform

### For v2.0 Akash Integration
6. **Akash-first provider** — Deep integration before adding others
7. **SDL generation** — Abstract Akash deployment complexity
8. **Akash Console API** — Use Console API for funding (USD via credit card), avoiding Keplr wallet dependency for hackathon/demo simplicity
9. **Template gallery** — Lower barrier for common workloads
10. **Route to Akash** — Agent can route suitable jobs to Akash providers
11. **Weighted provider scoring** — Default weights: price 35%, reliability 25%, performance 25%, latency 15%
12. **5-minute bid timeout** — Balance between responsiveness and provider response time
13. **USDC test token escrow** — Use testnet USDC for escrow contracts, enabling demo without real funds
14. **Sponsored hosting** — Necto covers Akash hosting fees for hackathon/demo; users interact with testnet USDC escrow to demonstrate marketplace payment flow
15. **Multi-step wizard pattern** — 5 steps (Input → Configure → SDL → Review → Deploy) for job submission

---

## Active Todos

### Phase 2 (Akash) - Completed
- [x] Set up Akash API client module
- [x] Research Akash SDL format and requirements
- [x] Implement SDL generator with templates
- [x] Create multi-factor provider selection algorithm
- [x] Build agent routing logic for Akash
- [x] Create provider discovery hooks
- [x] Create provider and deployment UI components
- [x] Design template gallery UI

### Phase 2 (Akash) - Remaining
- [ ] Connect to real Console API provider discovery
- [ ] Integrate Console API funding (Necto-sponsored Akash costs)
- [ ] Create deployment service architecture
- [ ] Integrate Akash routing into agent UI
- [ ] Set up testnet USDC escrow contracts (demo payment flow)

### Phase 1 Core (Ongoing)
- [ ] Complete 01-02 plan implementation
- [ ] Deploy ComputeRouter to ADI Testnet
- [ ] Create agent UI components
- [ ] Implement price normalization for AKT

### Completed (v1.0)
- [x] Plan 01-01: Implement ComputeRouter.sol
- [x] Quick Task 02: Google ADK agent
- [x] Quick Task 02 Plan 03: Frontend integration
- [x] Archive v1.0 milestone
- [x] Clean up quick folder

---

## Resolved Blockers
- Project reorganized for Akash integration ✅
- Directory structure cleaned up ✅
- Clarified: Akash is first provider integration, not a pivot ✅

### Open Blockers
- None identified — ready to proceed with Akash integration

---

## Session Continuity

### Last Session Summary
- **Action:** Execute plan 02-03 (Job Submission Interface)
- **Outcome:** 
  - Created template gallery with 6 templates across 4 categories
  - Built natural language input component with parsing
  - Implemented SDL editor with YAML preview and validation
  - Developed complete job submission page with 5-step wizard
  - Added shadcn tabs and textarea components
- **Key Insight:** Multi-step wizard pattern provides clear progression for job submission
- **Decision Update:** Auto-sign toggle for streamlined hackathon demo flow

### Context for Next Session
Ready to continue Phase 2 with Akash integration:
- Plan 02-03 complete (job submission UI)
- Plan 02-04 pending (full deployment workflow)
- UI components ready for Console API integration

**Ready for:**
- Execute Plan 04 - Full deployment workflow
- Integrate Console API funding (Necto-sponsored)
- Set up testnet USDC escrow (demo payment flow)

### Continuity Artifacts
- **MILESTONES.md:** Archive structure and milestone tracking
- **PROJECT.md:** Marketplace with Akash integration requirements
- **ROADMAP.md:** 4-phase marketplace roadmap
- **milestones/v1.0-phases/:** Archived v1.0 ComputeRouter work
- **phases/02-akash-webapp-deploy/:** Akash integration plans and summaries

---

*State tracking for project: Necto*  
*Project initiated: February 11, 2026*  
*Major pivot completed: February 13, 2026*  
*Roadmap reorganization: February 14, 2026*  
*Hackathon scope update: February 16, 2026*  
**Akash integration focus: February 17, 2026**
