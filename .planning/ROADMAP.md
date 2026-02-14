# Roadmap: Necto - Feature-Complete Marketplace

**Project:** Necto
**Created:** February 13, 2026 (Original)
**Reorganized:** February 14, 2026
**Coverage:** 26/26 requirements mapped ✓

## Overview

Build a two-sided compute marketplace with parallel development: offchain specialist owns frontend + agent logic, onchain specialist owns smart contracts. Each phase delivers a complete, functional feature that both developers integrate at the end.

## Team Structure

**Offchain Developer:**
- Frontend UI components (React/Next.js)
- Agent logic and price normalization
- API routes and data flow
- Real-time updates and UX

**Onchain Developer:**
- Smart contract development
- Blockchain integrations (ADI Chain, 0G Storage)
- Wallet connections and transaction handling
- On-chain data structures and events

## Phases

### Phase 1: Buyer Discovery (Complete Feature)
**Goal:** Buyers can submit jobs and see complete routing recommendations with working contracts

**Dependencies:** None (foundation)

**Requirements:** AGT-01, AGT-02, AGT-03, BUY-01, BUY-02, SYS-01, SYS-02, SYS-03, SYS-04, SET-01

**Plans:** 2 plans
- [ ] 01-01-PLAN.md — Onchain: ComputeRouter Contract (ADI Testnet)
- [ ] 01-02-PLAN.md — Offchain: Job Submission + Agent Routing + Price Comparison

**Offchain Work:**
- Job submission form with GPU requirements
- Price comparison table with normalized rates
- Agent logic: provider aggregation + normalization (off-chain provider data)
- TypeScript types and API structure
- UI for viewing routing results

**Onchain Work:**
- ComputeRouter.sol: store job ID, hashes, provider, amount (minimal on-chain data)
- Basic contract structure and events
- Deployment to ADI Testnet
- ABI generation and integration points

**Integration Point:**
- Agent writes job record to ComputeRouter on submission
- Frontend reads job status from contract
- Provider data stays off-chain (cheap reads via API)

**Success Criteria:**
1. Buyer submits job → sees routing recommendation immediately
2. Job record exists on-chain with correct data
3. Price comparison shows normalized rates for all 3 pricing models
4. Both developers' code works together end-to-end

---

### Phase 2: Dynamic Routing (Complete Feature)
**Goal:** Buyers can apply constraints and see real-time agent activity with enhanced contracts

**Dependencies:** Phase 1 (requires job submission flow)

**Requirements:** AGT-04, AGT-05, BUY-03, SYS-05

**Offchain Work:**
- Constraint filters (max price, region, GPU type, pricing model)
- Dynamic ranking engine with secondary criteria
- Agent activity feed with progress updates
- Server-sent events for real-time UX
- CoinGecko API integration for token prices

**Onchain Work:**
- Enhanced JobRegistry with constraint storage
- Events for constraint changes
- Gas optimization for frequent reads
- Integration testing with offchain filters

**Integration Point:**
- Constraints stored on-chain, agent reads from contract
- Activity feed reflects on-chain job state

**Success Criteria:**
1. Buyer sets constraints → agent respects them in recommendations
2. Activity feed shows real-time progress with on-chain status updates
3. Token price volatility handled correctly in rankings
4. Complete feature works without scaffolding gaps

---

### Phase 3: Provider Platform (Complete Feature)
**Goal:** Providers can fully onboard and list hardware with off-chain registry + on-chain commitments

**Dependencies:** Phase 2 (requires working demand side)

**Requirements:** PROV-01, PROV-02, PROV-03, SET-03

**Offchain Work:**
- Provider dashboard UI with full metadata management
- Hardware listing forms (specs, location, detailed availability windows)
- Pricing configuration interface (3 models with current rates)
- Capacity management controls (online/offline/reserved)
- Provider profiles stored in database/API

**Onchain Work:**
- ProviderRegistry.sol: provider address, base rate, pricing model type, reputation score
- Lightweight commitment (not full metadata)
- Events for provider registration and updates
- Agent reads provider list from chain, details from API

**Integration Point:**
- Provider registers on-chain (commitment) + off-chain (full profile)
- Agent discovers providers from chain, reads details from API
- Capacity changes update off-chain immediately (free), on-chain for commitments (gas-efficient)

**Success Criteria:**
1. Provider can register hardware with full details
2. Pricing configuration stored on-chain
3. Capacity changes reflect immediately in agent discovery
4. Complete provider experience from onboarding to live listing

---

### Phase 4: Settlement & Verification (Complete Feature)
**Goal:** Full payment flow with escrow, earnings tracking, and verifiable routing

**Dependencies:** Phase 3 (requires provider listings)

**Requirements:** VER-01, VER-02, VER-03, VER-04, AGT-06, BUY-04, BUY-05, PROV-04, PROV-05, SET-02, SET-04

**Offchain Work:**
- USDC payment integration (viem/wagmi)
- Team spending dashboard (tracked mode)
- Provider earnings dashboard
- "Verify Decision" UI with 0G lookup
- Audit log with on-chain links
- Tracked/Untracked mode toggle

**Onchain Work:**
- Escrow contract: lock USDC, release on completion
- 0G Storage integration for reasoning logs
- Access control contract (Admin/Viewer/User roles)
- Job completion verification
- On-chain analytics events

**Integration Point:**
- Payment flows through escrow with on-chain settlement
- 0G reasoning hash stored in job record
- Verification UI reads from 0G via on-chain hash

**Success Criteria:**
1. Buyer pays → funds locked in escrow → provider receives on completion
2. Every routing decision has verifiable 0G reasoning log
3. Team spending dashboard shows accurate on-chain data
4. Provider earnings calculated from settlement events
5. Tracked/untracked modes work end-to-end

---

## Progress Tracking

| Phase | Feature | Status | Offchain | Onchain |
|-------|---------|--------|----------|---------|
| 1 | Buyer Discovery | Pending | Form + Agent + UI | JobRegistry contract |
| 2 | Dynamic Routing | Pending | Constraints + Activity | Enhanced registry |
| 3 | Provider Platform | Pending | Dashboard + Listing | ProviderRegistry |
| 4 | Settlement & Verification | Pending | Payments + Dashboards | Escrow + 0G + Access |

**Total Timeline:** Flexible based on team velocity

## Development Workflow

**Each Phase:**
1. Both developers plan integration points
2. Work in parallel on their components
3. Regular sync on interface/contracts
4. Integration testing at phase end
5. Feature demo before moving to next

**Integration Checklist per Phase:**
- [ ] Offchain can call onchain functions
- [ ] Onchain events readable by frontend
- [ ] End-to-end user flow works
- [ ] No scaffolding or placeholder code
- [ ] Feature is demo-ready

## Bounty Integration Points

**0G Storage Bounty:**
- Phase 4: Full 0G integration with reasoning logs
- Phase 4: Verify Decision UI with 0G lookup

**ADI Chain Bounty:**
- Phase 1: JobRegistry deployment
- Phase 3: ProviderRegistry deployment  
- Phase 4: Escrow settlement with USDC

---
*Reorganized: February 14, 2026 for parallel team development*
