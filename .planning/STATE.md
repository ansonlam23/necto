# Project State: Necto

**Project:** Necto — Two-Sided Compute Marketplace with AI Routing Agent  
**Current Phase:** 0 (Planning complete, ready to start Phase 1)  
**Last Updated:** 2026-02-19
**Last activity:** 2026-02-19 - Completed quick task 3: Implement wallet payments to the escrow contract alongside the /buyer/submit workflow

---

## Project Reference

### Core Value
Connect compute buyers with the cheapest available GPUs across all providers while giving sellers with idle capacity a zero-friction path to monetization — all routing decisions transparent, verifiable, settled on-chain.

### Key Differentiators
1. Three pricing paradigms normalized (fixed, spot/auction, token-based)
2. Privacy-preserving Untracked mode with full verifiability
3. Zero-friction seller onboarding for idle capacity
4. Transparent AI routing with immutable 0G logs

### Target Users
- **Demand Side:** Independent ML researchers, indie developers, hackathon builders, cost-conscious startups
- **Supply Side:** Research labs with idle GPUs, over-provisioned startups, enterprises with off-peak capacity

---

## Current Position

### Phase Status
| Phase | Status | Progress |
|-------|--------|----------|
| 1. Provider Aggregation Foundation | Ready to start | 0% |
| 2. AI Agent & Multi-Provider Routing | Pending | 0% |
| 3. 0G Storage Integration | Pending | 0% |
| 4. Provider Onboarding & Supply Side | Pending | 0% |
| 5. Settlement & Modes | Pending | 0% |

### Current Focus
**Preparing Phase 1:** Provider Aggregation Foundation
- Extend existing 3 providers (Akash, RunPod, Lambda) to 6+ providers
- Add io.net, AWS Spot, Render, Nosana, Necto-listed providers
- Implement unified price normalization to USD/GPU-hr
- Build 60-second caching layer

### Blockers
None. Roadmap approved and ready for planning.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Fix blockchain integration: escrow API, calldata encoding, dashboard contract fetch, agent tx hash | 2026-02-19 | 69f3a4e | [1-fix-blockchain-integration-escrow-api-ca](./quick/1-fix-blockchain-integration-escrow-api-ca/) |
| 2 | build out the 0g storage of llm reasoning | 2026-02-19 | fceab28 | [2-build-out-the-0g-storage-of-llm-reasonin](./quick/2-build-out-the-0g-storage-of-llm-reasonin/) |
| 3 | Implement wallet payments to the escrow contract alongside the /buyer/submit workflow | 2026-02-19 | 3f04970 | [3-implement-wallet-payments-to-the-escrow-](./quick/3-implement-wallet-payments-to-the-escrow-/) |

---

## Performance Metrics

### Technical Debt
- **Current:** Medium — Blockchain integration fixed (escrow API now uses contract calls, proper calldata encoding, real balance fetching, no more fake tx hashes). Remaining:
  - Provider fetcher duplication (extract common adapter pattern)
  - Price normalization scattered (centralize in Phase 1)
  - Unimplemented dashboard features (save, deploy, real API calls)

### Velocity Indicators
- **Codebase Health:** Good — TypeScript strict, consistent patterns, shadcn/ui components
- **Test Coverage:** Minimal — no test framework configured (consider Vitest for Phase 2+)
- **Documentation:** Good — PROJECT.md, REQUIREMENTS.md, research/ folder comprehensive

### Quality Gates
- [ ] Phase 1: All 6 providers return data within 3 seconds
- [ ] Phase 2: Quote expiration enforced (5-minute max)
- [ ] Phase 3: 0G integration cost benchmarked
- [ ] Phase 4: Provider stake requirement implemented
- [ ] Phase 5: Security audit for escrow contract

---

## Accumulated Context

### Key Decisions Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-02-19 | 5-phase roadmap structure | Research recommends: Provider Aggregation → Agent → 0G → Onboarding → Settlement | ✓ Approved |
| 2026-02-19 | Quick depth (5 phases) | 1-week sprint constraint, focus on critical path | ✓ Approved |
| 2026-02-19 | Defer real-time re-routing | Complex feature, requires job migration infrastructure — v2 scope | ✓ Approved |

### Known Issues / Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| io.net API unavailable | MEDIUM | HIGH | REST API fallback, manual integration if needed |
| Render API deprecated | MEDIUM | MEDIUM | Research flagged 404 error; may need to defer |
| 0G Storage testnet instability | LOW | HIGH | Verify SDK behavior early in Phase 3 |
| ADI Testnet oracle feeds missing | MEDIUM | MEDIUM | Verify Chainlink feed availability before Phase 5 |
| Provider chicken-and-egg | HIGH | HIGH | Bootstrap with 3-5 committed providers (Phase 4) |

### Technical Constraints

- **Stack Lock:** Next.js 16 + React 19 + TypeScript 5.x (maintain consistency)
- **Blockchain:** ADI Testnet for settlement; 0G Storage for reasoning logs
- **Wallet:** Web3-only (viem/wagmi), no traditional auth
- **Compute Model:** Batch jobs only (not interactive/streaming)
- **Pricing:** USDC settlement (avoid token volatility)

---

## Session Continuity

### What We Were Doing
Creating project roadmap based on requirements and research. Just completed:
- ✓ Parsed 62 v1 requirements from REQUIREMENTS.md
- ✓ Validated research guidance (5-phase structure from SUMMARY.md)
- ✓ Derived success criteria using goal-backward method
- ✓ Verified 100% requirement coverage
- ✓ Wrote ROADMAP.md and STATE.md

### What's Next
1. **Immediate:** `/gsd-plan-phase 1` — Plan Phase 1: Provider Aggregation Foundation
2. **Then:** Execute Phase 1 plans (implement io.net, AWS Spot, Render, Nosana fetchers)
3. **Then:** `/gsd-plan-phase 2` — Plan Phase 2: AI Agent & Multi-Provider Routing

### Context for Claude (Next Session)

**Phase 1 Goal:** Enable agent to fetch and normalize pricing from 6+ providers

**Key Files:**
- Existing fetchers: `offchain/src/lib/providers/{akash,runpod,lambda}-fetcher.ts`
- Provider types: `offchain/src/lib/agent/types/compare-providers.ts`
- Agent tools: `offchain/src/lib/agent/tools/`

**Critical Pitfalls to Avoid:**
- API rate limiting (implement circuit breakers, caching)
- Token volatility (USD-denominated quotes from start)

**Success Criteria:**
1. 6+ providers fetch within 3 seconds
2. Normalized to SynapseProvider interface
3. USD/GPU-hr display
4. 60-second caching

**Mode:** Yolo (auto-advance enabled)

---

## Active Todos

### This Phase (Phase 1)
- [ ] Plan Phase 1 with `/gsd-plan-phase 1`
- [ ] Implement io.net provider fetcher
- [ ] Implement AWS Spot provider fetcher  
- [ ] Implement Render provider fetcher
- [ ] Implement Nosana provider fetcher
- [ ] Build unified price normalization service
- [ ] Add 60-second caching layer
- [ ] Update compare-providers-tool for multi-provider

### Upcoming
- [ ] Phase 2: Constraint-aware filtering
- [ ] Phase 2: CoinGecko integration
- [ ] Phase 2: Dynamic ranking engine
- [ ] Phase 3: 0G Storage client
- [ ] Phase 4: Provider registration form
- [ ] Phase 5: Escrow settlement

---

## Environment

### Repository
- **Path:** `/home/julius/Documents/necto`
- **Branch:** main
- **Last Commit:** 3f04970

### Key Directories
```
.planning/
  PROJECT.md           # Core value, requirements, constraints
  REQUIREMENTS.md      # 62 v1 requirements with REQ-IDs
  ROADMAP.md           # This roadmap
  STATE.md             # This file
  quick/               # Quick task artifacts
    1-fix-blockchain-integration-escrow-api-ca/
      1-PLAN.md
      1-SUMMARY.md
    2-build-out-the-0g-storage-of-llm-reasonin/
      2-PLAN.md
      2-SUMMARY.md
    3-implement-wallet-payments-to-the-escrow-/
      3-PLAN.md
      3-SUMMARY.md
  research/
    SUMMARY.md         # Research synthesis
    ARCHITECTURE.md    # Architecture patterns
    PITFALLS.md        # Critical pitfalls to avoid
    
offchain/
  src/
    lib/
      agent/           # ADK agent, tools
      providers/       # Provider fetchers
      contracts/       # wagmi contract interactions
      0g/              # 0G Storage client (NEW)
      hooks/           # React hooks including escrow payment
    components/        # React components
    app/               # Next.js App Router
    
hardhat/
  contracts/           # Solidity contracts
```

### Dependencies (Key)
- `@google/adk` — Agent framework
- `@xyflow/react` — Workflow canvas
- `zustand` — State management
- `viem`, `wagmi` — Web3 interactions
- `@0glabs/0g-ts-sdk` — 0G Storage (added in quick task 2)
- `ethers` — 0G Storage signer (added in quick task 2)

---

*State file updated: 2026-02-19*  
*Next update: After Phase 1 planning*
