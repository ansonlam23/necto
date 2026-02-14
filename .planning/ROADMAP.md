# Roadmap: Necto - Two-Sided Compute Marketplace

**Project:** Necto
**Created:** February 13, 2026
**Timeline:** 1-Week Hackathon Build
**Coverage:** 26/26 requirements mapped ✓

## Overview

Build a two-sided compute marketplace that connects buyers seeking the cheapest GPU compute with sellers monetizing idle hardware. The AI routing agent eliminates decision fatigue by normalizing three different pricing models (fixed-rate, spot/auction, token-based) into comparable metrics and automatically recommending the best deal. Each phase delivers a complete capability following the hackathon build plan structure.

## Phases

### Phase 1 - Foundation & Core Agent (Days 1-2)
**Goal:** Users can submit jobs and see the agent find the cheapest provider

**Dependencies:** None (foundation)

**Requirements:** AGT-01, AGT-02, AGT-03, BUY-01, BUY-02, SYS-01, SYS-02, SYS-03, SYS-04

**Success Criteria:**
1. User can submit job request with GPU type, quantity, duration through clean form interface
2. Agent scans mock provider data covering fixed-rate (Lambda Labs), spot (AWS), and token-based (Render) pricing
3. Pricing normalization converts all models into effective USD/Compute-hr for direct comparison
4. Live price comparison table displays all providers with normalized rates and pricing model badges
5. Agent returns ranked recommendation with clear cost breakdown and reasoning

**Implementation Focus:**
- Next.js 14 monorepo scaffold with TypeScript throughout
- ComputeRouter.sol smart contract deployed to ADI Testnet
- Price normalization module with hardcoded provider data (6-8 providers)
- Basic job submission form and price comparison UI
- API route for agent that queries, normalizes, and ranks providers

### Phase 2 - Dynamic Agent & Real-Time UX (Days 3-4)
**Goal:** Users see live agent activity and can apply constraints to find optimal providers

**Dependencies:** Phase 1 (requires core agent functionality)

**Requirements:** AGT-04, AGT-05, BUY-03, SYS-05

**Success Criteria:**
1. User can set hard constraints (max price, region, GPU type, pricing model exclusions) that filter results
2. Dynamic ranking engine sorts by cost with secondary criteria (latency, uptime, provider rating)
3. Agent activity feed shows real-time progress ("Scanning Akash... Fetching RNDR price... Ranking complete")
4. Live updates use server-sent events or WebSocket for seamless UX
5. Agent handles token price volatility by fetching real-time rates from CoinGecko API

**Implementation Focus:**
- Constraint filtering logic in agent and UI
- Real-time UI updates with server-sent events
- Token price feed integration (CoinGecko API)
- Enhanced ranking algorithm with multiple criteria
- Activity feed component with live progress indicators

### Phase 3 - Supply Side & Settlement (Days 5-6)
**Goal:** Providers can list hardware and receive payments through on-chain escrow

**Dependencies:** Phase 2 (requires working demand side)

**Requirements:** PROV-01, PROV-02, PROV-03, SET-01, SET-02, SET-03

**Success Criteria:**
1. Provider can register hardware through dashboard form (GPU specs, location, availability windows)
2. Flexible pricing configuration supports fixed-rate, dynamic, and token-based models
3. Capacity management lets providers mark hardware as available, reserved, or offline
4. On-chain provider registry stores hardware listings and pricing that agent can discover
5. USDC escrow system locks buyer funds and releases to provider on job completion
6. End-to-end flow: seller lists → buyer finds via agent → on-chain settlement completes

**Implementation Focus:**
- Provider dashboard with hardware listing forms
- On-chain provider registry contract integration
- USDC escrow settlement with viem/wagmi
- Provider capacity management interface
- Integration between provider listings and agent discovery

### Phase 4 - Verification & Tracking Modes (Days 7)
**Goal:** Users can verify agent decisions and choose between tracked/untracked modes

**Dependencies:** Phase 3 (requires complete marketplace flow)

**Requirements:** VER-01, VER-02, VER-03, VER-04, AGT-06, BUY-04, BUY-05, PROV-04, PROV-05, SET-04

**Success Criteria:**
1. Every routing decision uploads structured reasoning JSON to 0G Storage with immutable hash
2. On-chain job records include 0G reasoning hash for cryptographic proof of agent logic
3. "Verify Decision" button lets users inspect full reasoning trace from 0G Storage
4. Tracked mode stores user identity in job records and enables team spending dashboard
5. Untracked mode preserves full audit trail but omits user identity for privacy
6. Provider earnings dashboard shows revenue, utilization, and job history
7. Team dashboard (tracked mode) displays per-user spending and provider breakdown

**Implementation Focus:**
- 0G Storage integration for reasoning logs
- Tracked/Untracked mode implementation
- Verification UI for inspecting reasoning traces
- Team spending dashboard with user analytics
- Provider earnings and usage analytics
- Demo preparation and bounty feature highlighting

## Progress Tracking

| Phase | Status | Duration | Focus Area |
|-------|--------|----------|------------|
| Phase 1 - Foundation & Core Agent | Pending | Days 1-2 | MVP agent with price normalization |
| Phase 2 - Dynamic Agent & Real-Time UX | Pending | Days 3-4 | Constraints, ranking, live updates |
| Phase 3 - Supply Side & Settlement | Pending | Days 5-6 | Provider onboarding, escrow settlement |
| Phase 4 - Verification & Tracking | Pending | Day 7 | 0G integration, tracking modes, demo polish |

**Total Timeline:** 7 days (hackathon schedule)

## Dependencies Flow

```
Phase 1 (Core Agent)
    ↓ (Agent functionality required)
Phase 2 (Enhanced Agent + UX)
    ↓ (Demand side complete)
Phase 3 (Supply Side + Settlement)
    ↓ (Complete marketplace flow)
Phase 4 (Verification + Modes)
```

## Key Milestones

- **Phase 1 Complete:** Working agent that finds cheapest provider across pricing models
- **Phase 2 Complete:** Live agent with constraints and real-time activity feed
- **Phase 3 Complete:** Full two-sided marketplace with provider onboarding and escrow settlement
- **Phase 4 Complete:** Verifiable decisions with 0G integration and tracked/untracked modes

## Bounty Integration Points

**0G Storage Bounty:**
- Phase 4: Immutable reasoning logs stored as JSON files on 0G
- Phase 4: User-facing verification linking on-chain jobs to 0G reasoning traces
- Phase 4: Structured JSON preserving complete agent decision logic

**ADI Chain Bounty:**
- Phase 1: ComputeRouter.sol contract deployment and basic structure
- Phase 3: Provider registry and USDC escrow settlement implementation
- Phase 4: Job registry with 0G hash references for verifiable routing

## Demo Flow Preparation

**Seller Flow:** Provider registers 8x A100 GPUs at $1.25/GPU-hr → Agent includes in discovery → Buyer routes job to them → Escrow settlement completes

**Buyer Flow (Tracked):** User submits "2x A100 for 8 hours" → Agent scans all providers → Recommends Render at $1.19/GPU-hr → User verifies 0G reasoning trace → Team dashboard shows spend

**Buyer Flow (Untracked):** Same agent logic and verification but job registered anonymously for privacy-focused users

---
*Created: February 13, 2026 for marketplace pivot*
*Estimated completion: February 20, 2026*