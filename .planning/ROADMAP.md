# Roadmap: Necto - Two-Sided Compute Marketplace

**Project:** Necto  
**Created:** February 13, 2026 (Original)  
**Updated:** February 17, 2026  
**Coverage:** 26/26 requirements mapped ✓

## Overview

Build a two-sided compute marketplace with the first integration being Akash Network. The marketplace will eventually support multiple providers (io.net, Lambda Labs, AWS Spot, Render, etc.) but v2.0 focuses specifically on routing compute jobs to Akash providers.

## Phase Structure

### Phase 1: Buyer Discovery (Complete Feature) - IN PROGRESS
**Goal:** Buyers can submit jobs and see complete routing recommendations with Akash providers, agent thinking UI, and optional auto-sign

**Dependencies:** None (foundation)

**Requirements:** AGT-01, AGT-02, AGT-03, AGT-07, AGT-08, BUY-01, BUY-02, BUY-03, SYS-01, SYS-02, SYS-03, SYS-04, SYS-06, SYS-07, SET-01

**Plans:**
- [x] 01-01-PLAN.md — Onchain: ComputeRouter Contract (ADI Testnet) — COMPLETE (Archived)
- [ ] 01-02-PLAN.md — Offchain: Job Submission + Agent Routing + Thinking UI
- [ ] 02-01-PLAN.md — Akash Integration: Deployment routing to Akash providers

**Offchain Work:**
- Job submission form with GPU requirements, Akash deployment toggle
- Price comparison table with normalized rates from Akash providers
- Google ADK agent implementation for routing decisions
- Agent thinking process UI: animated steps showing routing logic
- Auto-sign flow for seamless demo experience
- Akash deployment integration (SDL generation, provider selection)

**Onchain Work:**
- ComputeRouter.sol: store job ID, hashes, provider, amount
- Integration with offchain agent routing

**Integration Point:**
- Agent routes suitable jobs to Akash providers
- Job records stored on-chain with Akash deployment details
- Provider data from Akash API

**Success Criteria:**
1. Buyer submits job → sees agent thinking → routing recommendation → deploy to Akash
2. Job record exists on-chain with correct data
3. Price comparison shows normalized Akash rates
4. Auto-sign toggle works for seamless flow
5. Full end-to-end deployment to Akash works

---

### Phase 2: Provider Platform (Complete Feature)
**Goal:** Providers can fully onboard and list hardware with off-chain registry + on-chain commitments

**Dependencies:** Phase 1

**Requirements:** PROV-01, PROV-02, PROV-03, SET-03

**Offchain Work:**
- Provider dashboard UI with full metadata management
- Hardware listing forms (specs, location, availability)
- Pricing configuration interface
- Capacity management controls

**Onchain Work:**
- ProviderRegistry.sol: provider address, base rate, pricing model
- Events for provider registration and updates

**Integration Point:**
- Provider registers on-chain + off-chain profile
- Agent discovers providers from chain, reads details from API

**Success Criteria:**
1. Provider can register hardware with full details
2. Pricing configuration stored on-chain
3. Capacity changes reflect immediately in agent discovery

---

### Phase 3: Dynamic Routing (Complete Feature)
**Goal:** Enhanced routing with constraints and real-time activity across all providers

**Dependencies:** Phase 2

**Requirements:** AGT-04, AGT-05, SYS-05

**Offchain Work:**
- Constraint filters (max price, region, GPU type)
- Dynamic ranking engine
- Real-time activity feed
- Multi-provider support (io.net, Lambda, AWS, etc.)

**Onchain Work:**
- Enhanced JobRegistry with constraint storage
- Gas optimization for frequent reads

**Success Criteria:**
1. Buyer sets constraints → agent respects them
2. Activity feed shows real-time progress
3. Multi-provider routing works

---

### Phase 4: Settlement & Verification (Complete Feature)
**Goal:** Full payment flow with escrow, earnings tracking, and verifiable routing

**Dependencies:** Phase 3

**Requirements:** VER-01, VER-02, VER-03, VER-04, AGT-06, BUY-04, BUY-05, PROV-04, PROV-05, SET-02, SET-04

**Offchain Work:**
- USDC payment integration
- Team spending dashboard
- Provider earnings dashboard
- "Verify Decision" UI with 0G lookup

**Onchain Work:**
- Escrow contract: lock USDC, release on completion
- 0G Storage integration for reasoning logs
- Access control contract

**Success Criteria:**
1. Buyer pays → funds locked → provider receives on completion
2. Every routing decision has verifiable 0G reasoning log
3. Spending dashboards show accurate data
4. Tracked/untracked modes work end-to-end

---

## Progress Tracking

| Phase | Feature | Status | Offchain | Onchain |
|-------|---------|--------|----------|---------|
| 1 | Buyer Discovery + Akash Routing | 🚧 In Progress | Form + Agent + Akash Deploy | ComputeRouter ✓ |
| 2 | Provider Platform | 📋 Planned | Dashboard + Listing | ProviderRegistry |
| 3 | Dynamic Routing | 📋 Planned | Constraints + Activity | Enhanced registry |
| 4 | Settlement & Verification | 📋 Planned | Payments + Dashboards | Escrow + 0G |

**Total Timeline:** Flexible based on team velocity

## Development Workflow

**Each Phase:**
1. Plan the integration points
2. Work on components in parallel
3. Regular sync on interfaces
4. Integration testing at phase end
5. Feature demo before moving to next

**Integration Checklist per Phase:**
- [ ] Offchain can call onchain functions
- [ ] Onchain events readable by frontend
- [ ] End-to-end user flow works
- [ ] No scaffolding or placeholder code
- [ ] Feature is demo-ready

## Akash Integration Points

**Phase 1 Specific:**
- Akash Console API for provider discovery
- SDL generation for deployments
- Keplr wallet for AKT transactions
- Real-time deployment monitoring
- Job routing to Akash providers

**Future Phases:**
- Other providers (io.net, Lambda Labs, etc.)
- Cross-provider price comparison
- Unified settlement layer

---
*Updated: February 17, 2026 - Akash integration as Phase 1 extension*
