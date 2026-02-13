# Synapse - Two-Sided Compute Marketplace

## What This Is

Synapse is a two-sided compute marketplace powered by an AI routing agent. It connects buyers (developers, researchers, small teams) with sellers (organizations with idle compute capacity) through an intelligent layer that normalizes pricing across three fundamentally different models.

## Core Value

**For buyers:** Eliminates decision fatigue when finding cheapest cloud compute. Users describe what they need; the agent scans every connected provider, normalizes pricing, and recommends the best deal in seconds.

**For sellers:** Easy on-ramp to monetize idle compute. Organizations list available GPUs/CPUs, set pricing terms, and immediately access a pool of cost-conscious buyers without building their own marketplace.

## The Problem

The compute market is fragmented across dozens of providers with incompatible pricing models:

1. **Fixed-Rate:** Posted USD/stablecoin rates (Akash reserved, Lambda Labs, AWS reserved)
2. **Dynamic/Spot:** Floats with supply/demand (AWS Spot, Akash reverse-auction, io.net)
3. **Token-Based:** Native crypto tokens (Render RNDR, Nosana NOS) with volatile USD cost

Buyers can't easily compare. Sellers can't easily reach buyers. Synapse solves both.

## Two Operating Modes

### Tracked Mode (Default)
For teams and organizations using shared compute. Maintains lightweight audit trail with user identity — which user ran what job, on which provider, at what cost. Team leads see spending; finance reconciles bills.

### Untracked Mode
For individual builders who value privacy. Strips user-identifying information while preserving full audit trail of what happened (logged to 0G, settled on ADI). Full verifiability, zero identity exposure.

## Requirements

### Validated
(None yet — hackathon demo will validate)

### Active

- [ ] **AGENT-01:** Multi-provider price aggregation across 6-8 providers (Akash, io.net, Lambda Labs, AWS Spot, Render, Synapse-listed)
- [ ] **AGENT-02:** Pricing model normalization (fixed, spot/auction, token-based → effective USD/GPU-hr)
- [ ] **AGENT-03:** Real-time token price feed for token-based providers
- [ ] **AGENT-04:** Constraint-aware filtering (max price, region, GPU type, pricing model exclusions)
- [ ] **AGENT-05:** Dynamic ranking engine by effective cost
- [ ] **AGENT-06:** Tracked/Untracked mode toggle with identity handling

- [ ] **BUYER-01:** Job submission form with requirements and constraints
- [ ] **BUYER-02:** Live price comparison table with normalized rates
- [ ] **BUYER-03:** Agent activity feed (real-time scanning updates)
- [ ] **BUYER-04:** Team spending dashboard (Tracked mode only)
- [ ] **BUYER-05:** Audit log with links to on-chain records and 0G reasoning

- [ ] **SELLER-01:** Provider dashboard for listing hardware
- [ ] **SELLER-02:** Flexible pricing configuration (fixed/dynamic/token)
- [ ] **SELLER-03:** Capacity management (available/reserved/offline)
- [ ] **SELLER-04:** Earnings dashboard with utilization metrics
- [ ] **SELLER-05:** Usage log (Tracked shows pseudonymous user; Untracked shows anonymous)

- [ ] **0G-01:** Upload agent reasoning trace to 0G Storage
- [ ] **0G-02:** Include 0G hash in on-chain job record
- [ ] **0G-03:** "Verify Decision" modal fetching reasoning from 0G

- [ ] **ADI-01:** Deploy ComputeRouter.sol to ADI Testnet
- [ ] **ADI-02:** Provider registry (registerProvider, updateProviderRate)
- [ ] **ADI-03:** Job registry (createJob, completeJob)
- [ ] **ADI-04:** USDC escrow settlement
- [ ] **ADI-05:** Lightweight access control for Tracked mode

### Out of Scope (v1)

- Real-time re-routing mid-job (stretch goal only)
- Production API integrations (use mocked data for demo)
- Advanced SLA guarantees
- ML-based predictive optimization

## Constraints

- **Timeline:** 1-week hackathon build
- **Tech Stack:** Next.js 14 (App Router), TypeScript throughout, Tailwind CSS, Shadcn UI
- **Blockchain:** Viem/Wagmi for ADI Chain, 0G JS/TS SDK
- **Contracts:** Hardhat with TypeScript config
- **Pricing Data:** Hardcoded/mocked for 6-8 providers including 2-3 "Synapse-listed" orgs
- **Design:** Can reuse Necto cyberpunk-professional aesthetic

## Context

**Target Users:**
- **Buyers:** ML researchers, indie developers, hackathon builders, startups, data engineers
- **Sellers:** Research labs, startups with over-provisioned infra, enterprises with off-peak capacity

**Success Metrics:**
- Buyer can submit job and get ranked recommendations in <10 seconds
- Seller can list hardware and receive jobs
- Full Tracked and Untracked flows working end-to-end
- 0G reasoning logs verifiable
- ADI on-chain settlement functional

**Bounty Requirements:**
- **0G Bounty:** Immutable reasoning logs, proof of routing, user-facing verification
- **ADI Bounty:** On-chain job registry, escrow settlement, provider management

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Unified TypeScript stack | Single language for frontend, agent, contracts simplifies 1-week timeline | — Pending |
| Hardcoded pricing data | No time for 6-8 API integrations; realistic mocked data sufficient for demo | — Pending |
| Reuse Necto UI foundation | shadcn/ui components, layout patterns, wallet connection already built | — Pending |
| Tracked/Untracked as toggle | Single code path; only difference is user identity in logs | — Pending |

---
*Last updated: 2026-02-12 for Synapse pivot*
