# Necto Roadmap

**Project:** Necto — Two-Sided Compute Marketplace with AI Routing Agent  
**Depth:** Quick (5 phases, critical path only)  
**Created:** 2026-02-19  
**Based on:** Research recommendations and existing codebase foundation

---

## Current State

**Existing Foundation:**
- Next.js 16 + React 19 + TypeScript frontend
- Google ADK agent with tool architecture
- Provider fetchers for Akash, RunPod, Lambda Labs
- ComputeRouter and USDCEscrow contracts on ADI Testnet
- Zustand state management, wagmi Web3 hooks

**Validated (✓):**
- ✓ Agent-Based Compute Routing (ADK with tool registry)
- ✓ Multi-Provider Discovery (3 providers)
- ✓ Akash Console API integration
- ✓ On-Chain Job Tracking (ComputeRouter)
- ✓ Web3 Wallet Integration (viem/wagmi)
- ✓ Workflow Canvas UI (@xyflow/react)

---

## Phases

- [ ] **Phase 1: Provider Aggregation Foundation** - Extend to 6+ providers with unified pricing
- [ ] **Phase 2: AI Agent & Multi-Provider Routing** - Constraint filtering, ranking engine, live UI
- [ ] **Phase 3: 0G Storage Integration** - Immutable reasoning logs, verifiable audit trail
- [ ] **Phase 4: Provider Onboarding & Supply Side** - Seller dashboard, hardware listing, capacity mgmt
- [ ] **Phase 5: Settlement & Tracked/Untracked Modes** - USDC escrow, privacy modes, team access control

---

## Phase Details

### Phase 1: Provider Aggregation Foundation

**Goal:** Enable agent to fetch and normalize pricing from 6+ providers with unified USD/GPU-hr comparison

**Depends on:** Nothing (extends existing provider fetchers)

**Requirements:** PROV-01, PROV-02, PROV-03, PROV-07, PROV-08, PRICE-01, PRICE-02

**Success Criteria** (what must be TRUE):
1. Agent fetches live pricing from Akash, io.net, AWS Spot, Render, Nosana, and Necto providers within 3 seconds
2. All provider responses normalized to SynapseProvider interface with consistent schema
3. Fixed-rate and spot/auction pricing displayed as effective USD/GPU-hr
4. Provider data cached with 60-second revalidation (stale-while-revalidate pattern)
5. Price comparison table renders all providers with sortable columns

**Avoids Research Pitfalls:**
- Pitfall 6 (API Rate Limiting): Parallel fetch with circuit breakers
- Pitfall 7 (Token Volatility): USD-denominated quotes from start

**Plans:** TBD

---

### Phase 2: AI Agent & Multi-Provider Routing

**Goal:** Users can submit compute jobs with constraints and receive intelligent routing recommendations with transparent reasoning

**Depends on:** Phase 1 (normalized provider data required for ranking)

**Requirements:** PROV-04, PROV-05, PRICE-03, PRICE-04, PRICE-05, PRICE-06, FEED-01, FEED-02, FEED-03, AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, MODE-01, MODE-04, BUYER-01, BUYER-02, BUYER-03

**Success Criteria** (what must be TRUE):
1. User can submit job form with GPU type, quantity, duration, max price, region constraints
2. Agent filters providers by hard constraints before ranking (respects all exclusions)
3. CoinGecko API provides real-time token prices with 20-second cache
4. Token-based pricing (RNDR, NOS) converted to USD with timestamp validation (<5 min staleness)
5. Agent displays thinking steps in real-time: "Scanning Akash... Checking io.net..."
6. Top recommendation highlighted with cost breakdown and 2-3 alternatives
7. Tracked/Untracked toggle visible in job form (routing logic identical)
8. Live price comparison table updates automatically with normalized rates

**Avoids Research Pitfalls:**
- Pitfall 1 (Oracle Staleness): Timestamp validation with 5-minute threshold
- Pitfall 6 (API Rate Limiting): Circuit breaker pattern, graceful degradation

**Research Flag:** MEDIUM — ADK tool design may need iteration

**Plans:** TBD

---

### Phase 3: 0G Storage Integration

**Goal:** Every routing decision is transparently logged and verifiable via immutable 0G Storage audit trail

**Depends on:** Phase 2 (agent routing stable before adding audit layer)

**Requirements:** ZERO-01, ZERO-02, ZERO-03, ZERO-04, ZERO-05, ZERO-06, CHAIN-05, BUYER-04, BUYER-06

**Success Criteria** (what must be TRUE):
1. Every routing decision uploads JSON to 0G Storage within 5 seconds of completion
2. JSON includes: all prices fetched, normalization math, ranking criteria, final selection
3. 0G content hash returned and stored in on-chain job record via ComputeRouter
4. SDK supports both file storage (reasoning logs) and KV storage (structured data)
5. Tracked Mode: user identity (wallet address) included in 0G JSON
6. Untracked Mode: user field omitted from JSON (anonymous but verifiable)
7. "Verify Decision" button opens 0G reasoning trace for any completed job
8. Audit log page displays all jobs with on-chain links and 0G file hashes

**Avoids Research Pitfalls:**
- Pitfall 4 (Gas Cost Explosion): Critical — logs go to 0G not on-chain

**Research Flag:** LOW-MEDIUM — 0G is newer tech; verify SDK behavior on testnet

**Plans:** TBD

---

### Phase 4: Provider Onboarding & Supply Side

**Goal:** Organizations can list idle GPUs, configure pricing, and manage capacity through self-service dashboard

**Depends on:** Phase 3 (audit infrastructure needed before external providers join)

**Requirements:** PROV-06, ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-05, ONBOARD-06, ONBOARD-07, ONBOARD-08, ONBOARD-09, SELLER-01, SELLER-02, SELLER-03, SELLER-04, SELLER-05, SELLER-06, SELLER-07

**Success Criteria** (what must be TRUE):
1. Provider registration form captures org name, contact, wallet address
2. Hardware listing form accepts GPU type, quantity, location, specs
3. Availability windows configurable (e.g., "weeknights 6pm-8am", "always on")
4. Pricing model selection: fixed (USD/hr), dynamic (floor + demand ceiling), token-based
5. Capacity management toggle: available/reserved/offline (agent only routes to available)
6. Approved providers display "Live" badge in marketplace
7. Provider dashboard shows: jobs served, revenue earned, utilization rate
8. Earnings history with payout dates and amounts
9. Usage log displays jobs with timestamps; Tracked shows pseudonymous ID, Untracked shows "Anonymous"
10. Provider can update pricing and mark hardware offline for maintenance

**Avoids Research Pitfalls:**
- Pitfall 2 (Chicken-and-Egg): Bootstrap with committed providers via staking
- Pitfall 3 (Reputation Gaming): Stake requirement for provider registration

**Research Flag:** MEDIUM — Provider staking patterns need ADI Testnet validation

**Plans:** TBD

---

### Phase 5: Settlement & Tracked/Untracked Modes

**Goal:** Trustless USDC escrow settlement with privacy-preserving Tracked/Untracked modes and team access control

**Depends on:** Phase 3 and Phase 4 (audit + provider registry required before settlement)

**Requirements:** CHAIN-01, CHAIN-02, CHAIN-03, CHAIN-04, CHAIN-06, CHAIN-07, MODE-02, MODE-03, MODE-05, FEED-04, BUYER-05, BUYER-07, ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04

**Success Criteria** (what must be TRUE):
1. ComputeRouter extended with escrow: USDC deposit, lock until completion, release to provider
2. Job submitter can deposit USDC which locks in smart contract
3. Agent confirms job completion triggers escrow release to provider address
4. Job record stores: Job ID, provider, effective price, status, 0G hash
5. Tracked Mode: user ID stored with job record (full audit trail)
6. Untracked Mode: user field left empty (anonymous but on-chain verifiable)
7. Mode selection stored with job record for audit purposes
8. Chainlink on-chain verification for settlement-critical token prices
9. Team Spending Dashboard (Tracked only): spend per user, provider breakdown
10. Lightweight RBAC: Admin (manage team, whitelist), Viewer (read-only), User (submit jobs)

**Avoids Research Pitfalls:**
- Pitfall 5 (Privacy vs Verifiability): Graduated privacy levels with clear trade-offs
- Pitfall 1 (Oracle Staleness): On-chain price verification for settlement

**Research Flag:** LOW — Escrow patterns well-established

**Plans:** TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Provider Aggregation Foundation | 0/2 | Not started | - |
| 2. AI Agent & Multi-Provider Routing | 0/3 | Not started | - |
| 3. 0G Storage Integration | 0/2 | Not started | - |
| 4. Provider Onboarding & Supply Side | 0/3 | Not started | - |
| 5. Settlement & Modes | 0/2 | Not started | - |

---

## Dependency Graph

```
Phase 1: Provider Aggregation Foundation
    ↓
Phase 2: AI Agent & Multi-Provider Routing
    ↓ ↘
    ↓   Phase 4: Provider Onboarding
    ↓   (supply side prep)
    ↓ ↗
Phase 3: 0G Storage Integration
    ↓
Phase 5: Settlement & Modes
    (requires audit + providers stable)
```

**Sequencing Rationale:**
1. **Provider Aggregation before Agent Routing** — Agent needs normalized data to make intelligent decisions
2. **0G Storage before Settlement** — Audit trail infrastructure required for trustless escrow
3. **Provider Onboarding parallel-ready after Phase 2** — Can build supply side while audit layer developed
4. **Settlement last** — Requires all previous components stable (pricing, audit, provider registry)

---

## Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (AI Agent):** ADK tool orchestration complexity; verify pattern with small test
- **Phase 3 (0G Storage):** Limited real-world usage; verify SDK behavior and testnet costs
- **Phase 4 (Provider Onboarding):** Cosmos SDK patterns on ADI Testnet need validation

Phases with established patterns:
- **Phase 1 (Provider Aggregation):** Well-documented REST APIs, standard adapter pattern
- **Phase 5 (Settlement):** Established escrow patterns, OpenZeppelin reference contracts

---

## Build Order Guidance

From research/SUMMARY.md:

1. **Provider Aggregation Layer first (foundation)** — Normalize 6+ providers to common interface
2. **AI Agent & Multi-Provider Routing (extends existing)** — Constraint filtering, ranking engine
3. **0G Storage Integration (audit layer)** — Immutable reasoning logs before external providers join
4. **Provider Onboarding & Supply Side (after demand validation)** — Bootstrap with committed providers
5. **Settlement & Modes (final layer)** — USDC escrow, privacy modes, team access

---

*Last updated: 2026-02-19*
*Next: `/gsd-plan-phase 1` to begin planning*
