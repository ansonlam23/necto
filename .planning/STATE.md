# Project State: Necto - Two-Sided Compute Marketplace

**Created:** February 11, 2026
**Last Updated:** February 17, 2026

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
**Phase 01-foundation-core-agent, Plan 01: COMPLETE** ✓
- ComputeRouter.sol implemented with full test coverage (26 tests passing)
- Ignition deployment module ready
- TypeScript integration complete
- ADI Testnet chain configured in wagmi

**Quick Task 02: COMPLETE** ✓
- Google ADK agent with @google/adk@0.3.0
- Agent types, wallet tool, and main agent implementation
- Blockchain transaction signing via wallet-tool.ts
- Provider routing with thinking step callbacks
- Environment configuration template (.env.example)

**Next Action:** Deploy ComputeRouter to ADI Testnet and integrate with agent UI

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
- **Plans Executed:** 2
- **Phases Completed:** 0
- **Quick Tasks Completed:** 1
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
10. **Hackathon Scope:** Akash-only providers (others require paid APIs), Google ADK agent, thinking UI, auto-sign toggle
11. **Agent Framework:** Google ADK (Agent Development Kit) with Google AI Studio API keys; use context7 for ADK documentation
12. **Demo Flair:** Agent thinking process visible via UI toast/record for hackathon presentation impact

### Development Approach
- **Offchain Developer:** Frontend (Next.js/React), agent logic, API routes, real-time UX
- **Onchain Developer:** Smart contracts (Solidity), ADI Chain integration, 0G Storage, wallet connections
- **Integration:** Both work in parallel, integrate at phase end
- **Goal:** Each phase is demo-ready without gaps

### Active Todos
- [x] Plan 01-01: Implement ComputeRouter.sol with tests and deployment module
- [x] Plan 01-02: Offchain implementation with Google ADK agent, thinking UI, auto-sign
- [x] Quick Task 02: Google ADK agent with Google AI Studio API for Akash provider routing
- [ ] Deploy ComputeRouter to ADI Testnet and configure environment
- [ ] Execute Phase 1 planning and implementation (Buyer Discovery)
- [ ] Create agent UI components (thinking steps toast, auto-sign toggle)
- [ ] Implement price normalization for AKT token pricing
- [ ] Create mock Akash provider data (4-6 providers)

### Resolved Blockers
- Roadmap reorganization complete — now optimized for parallel team development

### Open Blockers
None identified — ready to proceed with Phase 1.

## Session Continuity

### Last Session Summary
- **Action:** Execute quick task 02 - Create Google ADK agent with Google AI Studio
- **Outcome:** Complete agent module with routing logic, wallet integration, and TypeScript types
- **Key Insight:** Google ADK package is `@google/adk` (not `google-adk`), requires BaseTool subclass for tools
- **Files Created:** types.ts (82 lines), wallet-tool.ts (164 lines), agent.ts (273 lines), .env.example

### Context for Next Session
Agent implementation complete alongside ComputeRouter:
- **Agent:** Google ADK agent with routing, provider ranking, blockchain signing
- **Files:** types.ts, wallet-tool.ts, agent.ts in src/lib/agent/
- **Features:** Provider filtering/ranking, thinking step callbacks, transaction submission
- **Contract:** submitJob, recordRoutingDecision, getJob, updateAgent with full access control

**Agent Module Exports:**
- `createRoutingAgent(config)` - Create LlmAgent with wallet tool
- `routeComputeJob(request, config, onThinking)` - Main routing with UI callbacks
- `quickRoute(request, config)` - Auto-sign mode without UI
- `walletTool` - ADK-compatible BaseTool for blockchain

**Ready for:**
- Deploy ComputeRouter to ADI Testnet
- Create UI components for agent thinking steps
- Implement auto-sign toggle component
- Integrate agent with frontend job submission flow

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
*Hackathon scope update: February 16, 2026 - Akash-only, Google ADK, thinking UI, auto-sign*
