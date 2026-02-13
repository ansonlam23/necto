# Roadmap: Synapse - Two-Sided Compute Marketplace

**Project:** Synapse  
**Created:** February 12, 2026  
**Timeline:** 1-Week Hackathon  
**Coverage:** 23/23 requirements mapped ✓

## Overview

Build a two-sided compute marketplace with AI routing agent, 0G Storage reasoning logs, and ADI Chain settlement. Progresses from smart contract foundation through agent logic to buyer/seller interfaces.

## Phases

### Phase 1 - Core Infrastructure (Days 1-2)
**Goal:** Smart contracts deployed, agent logic functional, 0G integration working

**Dependencies:** None (foundation)

**Requirements:** AGENT-01 through AGENT-06, 0G-01, 0G-02, ADI-01 through ADI-04

**Plans:** 9 plans in 4 waves

**Plan List:**
- [ ] 01-01-PLAN.md — Smart Contract Foundation (ComputeRouter, ProviderRegistry, JobRegistry, Escrow)
- [ ] 01-02-PLAN.md — Agent Core Types (Provider, Job, Pricing, Reasoning type definitions)
- [ ] 01-03-PLAN.md — Provider Adapters (8 provider implementations: Akash, Lambda, Filecoin, io.net, 4 mocks)
- [ ] 01-04-PLAN.md — Pricing Normalization (CoinGecko integration, GPU ratios, hidden costs, normalizer)
- [ ] 01-05-PLAN.md — 0G Storage Integration (SDK setup, upload with retry, reasoning trace storage)
- [ ] 01-06-PLAN.md — Provider Ranking Engine (filtering, weighted scoring, top-3 recommendations)
- [ ] 01-07-PLAN.md — Tracked/Untracked Identity (identity modes, hashing, audit trails)
- [ ] 01-08-PLAN.md — Agent Orchestration (pipeline coordination, HTTP API, integration)
- [ ] 01-09-PLAN.md — Contract Deployment (ADI Testnet deployment, frontend config, verification)

**Success Criteria:**
1. ComputeRouter.sol deployed to ADI Testnet with provider registry and escrow
2. Agent can normalize pricing from 6-8 providers into effective USD/GPU-hr
3. Agent uploads reasoning trace to 0G and receives content hash
4. Job creation locks USDC in escrow; completion releases payment
5. Tracked/Untracked mode logic implemented (identity handling)

### Phase 2 - Buyer & Seller Interfaces (Days 3-4)
**Goal:** Complete UI for job submission, price comparison, and provider management

**Dependencies:** Phase 1 (requires agent logic and contracts)

**Requirements:** BUYER-01 through BUYER-03, SELLER-01 through SELLER-03, ADI-05

**Success Criteria:**
1. Buyer can submit job with requirements, constraints, and mode toggle
2. Live price comparison table displays normalized rates from all providers
3. Agent activity feed shows real-time scanning progress
4. Seller can list hardware with pricing configuration
5. Seller can toggle capacity status and set availability windows
6. Lightweight RBAC working for Tracked mode team access

### Phase 3 - Verification & Polish (Days 5-6)
**Goal:** Audit trails, verification UI, dashboards complete

**Dependencies:** Phase 2 (requires interfaces for verification)

**Requirements:** BUYER-04, BUYER-05, SELLER-04, SELLER-05, 0G-03

**Success Criteria:**
1. "Verify Decision" modal fetches and displays full reasoning trace from 0G
2. Team spending dashboard shows per-user costs (Tracked mode)
3. Audit log links to ADI Explorer and 0G Storage
4. Seller earnings dashboard shows revenue and utilization
5. Usage log displays job history with appropriate identity handling
6. Both Tracked and Untracked flows work end-to-end

### Phase 4 - Demo & Documentation (Day 7)
**Goal:** Demo video, README, deployment instructions, pitch preparation

**Dependencies:** Phase 3 (requires complete features)

**Success Criteria:**
1. Demo video shows seller listing compute and buyer purchasing (both modes)
2. README with architecture, setup, and deployment instructions
3. All bounty features prominently visible for judges
4. Pitch deck highlighting two-sided marketplace value

## Progress

| Phase | Status | Completion | Duration |
|-------|--------|------------|----------|
| Phase 1 - Core Infrastructure | Pending | 0% | Days 1-2 |
| Phase 2 - Buyer & Seller Interfaces | Pending | 0% | Days 3-4 |
| Phase 3 - Verification & Polish | Pending | 0% | Days 5-6 |
| Phase 4 - Demo & Documentation | Pending | 0% | Day 7 |

## Dependencies Flow

```
Phase 1 (Infrastructure)
    ↓ (Contracts + agent required)
Phase 2 (Interfaces)
    ↓ (UI required for verification)
Phase 3 (Verification)
    ↓ (Complete features required)
Phase 4 (Demo)
```

## Key Milestones

- **Phase 1 Complete:** Contracts deployed, agent ranking providers, 0G integration working
- **Phase 2 Complete:** Buyer can submit jobs, seller can list capacity, full UI functional
- **Phase 3 Complete:** Verification modals, dashboards, both Tracked/Untracked flows working
- **Phase 4 Complete:** Demo video recorded, README complete, ready for submission

## Success Metrics

- **Routing:** Agent provides ranked recommendations in <10 seconds
- **Coverage:** 6-8 providers including 2-3 Synapse-listed orgs
- **Verification:** 0G reasoning trace accessible and complete
- **Settlement:** USDC escrow functional on ADI Testnet
- **Modes:** Both Tracked and Untracked flows fully functional

---
*Roadmap created: February 12, 2026*
*Next: Execute Phase 1 via `/gsd-execute-phase 1`*
