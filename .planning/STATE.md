# Project State: Necto - Two-Sided Compute Marketplace

**Created:** February 11, 2026
**Last Updated:** February 15, 2026

## Project Reference

**Core Value:** The cheapest GPU always finds its buyer, and idle hardware always finds a job - if the system can't normalize pricing across three fundamentally different models (fixed-rate, spot/auction, token-based), provide verifiable routing decisions, and handle both tracked and untracked modes, the entire marketplace value proposition fails.

**Current Focus:** Milestone v2.0 — Reorganize for 2-person parallel development with complete vertical features rather than horizontal scaffolding layers.

**Success Depends On:** Clear integration points between offchain (frontend + agent) and onchain (smart contracts) developers, with each phase delivering a fully functional feature.

## Current Position

### Active Milestone
**Milestone v2.0: Feature-Complete Marketplace**
- **Goal:** Parallel development with complete features per phase
- **Status:** Planning Complete
- **Team:** 2 developers (offchain + onchain)

### Current Plan
**Phase 01-foundation-core-agent, Plan 01: COMPLETE**
- ComputeRouter.sol implemented with full test coverage
- Ignition deployment module ready
- TypeScript integration complete

**Next Action:** Execute plan 01-02 or proceed to contract deployment on ADI Testnet

### Roadmap Status
- **Total Phases:** 4
- **Phases Complete:** 0/4
- **Requirements Mapped:** 26/26 ✓
- **Coverage:** 100%

**Phase Structure:**
1. Buyer Discovery — Complete job submission → routing → on-chain recording
2. Dynamic Routing — Constraints + real-time activity + enhanced contracts
3. Provider Platform — Full onboarding + registry + capacity management
4. Settlement & Verification — Escrow + 0G integration + dashboards

## Performance Metrics

### Development Velocity
- **Plans Executed:** 1
- **Phases Completed:** 0
- **Avg Plan Duration:** 6 min
- **On-Track Percentage:** 100%

### Quality Indicators
- **Requirements Coverage:** 100% ✓
- **Success Criteria per Phase:** 4-5 (well-scoped)
- **Phase Dependencies:** Clear vertical slices
- **Team Structure:** Offchain + Onchain parallel development

### Risk Assessment
- **Technical Risk:** Medium (integration between offchain/onchain)
- **Pricing Risk:** High (normalizing three different pricing models)
- **Market Risk:** Medium (DePIN network reliability and token volatility)
- **Execution Risk:** Low (clear phase structure with parallel ownership)

## Accumulated Context

### Key Decisions Made
1. **Phase Structure:** 4 complete vertical features instead of horizontal layers
2. **Team Split:** Offchain owns frontend + agent, onchain owns contracts
3. **Integration Points:** Defined at each phase for parallel development
4. **Feature-First:** No scaffolding phases — every phase delivers complete functionality
5. **Hybrid Architecture:** Off-chain for metadata (cheap), on-chain for commitments + settlement (trustless)
6. **Immutable Contracts:** No proxy pattern for hackathon timeline; redeployment is cheap on testnet
7. **Single Agent:** Multi-agent support deferred to Phase 3; updateAgent allows rotation
8. **Minimal On-Chain Data:** Job ID + hashes only; full metadata stored on 0G Storage
9. **Privacy by Design:** Tracked/untracked mode built in from day 1

### Development Approach
- **Offchain Developer:** Frontend (Next.js/React), agent logic, API routes, real-time UX
- **Onchain Developer:** Smart contracts (Solidity), ADI Chain integration, 0G Storage, wallet connections
- **Integration:** Both work in parallel, integrate at phase end
- **Goal:** Each phase is demo-ready without gaps

### Active Todos
- [x] Plan 01-01: Implement ComputeRouter.sol with tests and deployment module
- [ ] Plan 01-02: Deploy ComputeRouter to ADI Testnet and configure environment
- [ ] Execute Phase 1 planning and implementation (Buyer Discovery)
- [ ] Define integration interface between agent and ComputeRouter
- [ ] Implement price normalization for 3 pricing models
- [ ] Create mock provider data covering 6-8 providers

### Resolved Blockers
- Roadmap reorganization complete — now optimized for parallel team development

### Open Blockers
None identified — ready to proceed with Phase 1.

## Session Continuity

### Last Session Summary
- **Action:** Execute plan 01-01 - Implement ComputeRouter smart contract
- **Outcome:** ComputeRouter.sol with 26 passing tests, Ignition deployment module, TypeScript integration complete
- **Key Insight:** Address case sensitivity in tests requires normalization using viem's getAddress helper
- **Files Updated:** ComputeRouter.sol, ComputeRouter.ts (tests), ComputeRouter.ts (Ignition), interact-router.ts, compute-router.ts (ABI), adi-chain.ts, wagmi.ts

### Context for Next Session
ComputeRouter contract foundation complete:
- **Contract:** submitJob, recordRoutingDecision, getJob, updateAgent with full access control
- **Tests:** 26 tests covering deployment, job submission, routing, access control, integration
- **Deployment:** Ignition module ready with parameterized agent address
- **Integration:** TypeScript ABI/types exported, ADI Testnet (chain 99999) configured in wagmi

**Ready for:** Deploy to ADI Testnet and proceed with Phase 1 Buyer Discovery implementation

### Continuity Artifacts
- **ROADMAP.md:** Feature-complete phases with team split and integration points
- **REQUIREMENTS.md:** 26 marketplace requirements (same content, mapped to new phases)
- **PROJECT.md:** Updated with Current Milestone v2.0 section
- **research/*.md:** Comprehensive domain research for implementation guidance

---
*State tracking for project: Necto*
*Project initiated: February 11, 2026*
*Major pivot completed: February 13, 2026*
*Roadmap reorganization: February 14, 2026*
