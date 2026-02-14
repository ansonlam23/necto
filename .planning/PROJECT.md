# Necto - Two-Sided Compute Marketplace with Intelligent Routing

## What This Is

Necto is a two-sided compute marketplace powered by an AI routing agent that eliminates decision fatigue in the fragmented compute market. For buyers (developers, researchers, small teams), it scans every connected provider, normalizes wildly different pricing models into comparable metrics, and recommends the best deal in seconds. For sellers (companies, labs, institutions with spare capacity), it provides an easy on-ramp to monetize idle compute by connecting them to cost-conscious buyers without building their own marketplace infrastructure.

## Core Value

The cheapest GPU always finds its buyer, and idle hardware always finds a job - if the system can't normalize pricing across three fundamentally different models (fixed-rate, spot/auction, token-based), provide verifiable routing decisions, and handle both tracked and untracked modes, the entire marketplace value proposition fails.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### A. Compute Routing Agent (Core Product — Demand Side)
- [ ] Multi-Provider Price Aggregation across Akash, io.net, Lambda Labs, AWS Spot, Render, and Necto-listed providers
- [ ] Pricing Model Normalization converting fixed-rate, spot/auction, and token-based pricing into unified effective-USD-per-GPU-hour metric
- [ ] Token Price Feed integration (CoinGecko API) for real-time crypto token price conversion
- [ ] Constraint-Aware Filtering with user-defined hard constraints (max price, region, GPU type, pricing-model exclusions)
- [ ] Dynamic Ranking Engine sorting by effective cost with secondary criteria (latency, uptime, rating)
- [ ] Tracked/Untracked Mode Toggle for user identity handling in job records

#### B. Provider Onboarding & Listing (Supply Side)
- [ ] Provider Dashboard for organizations to list available hardware with specs, location, availability windows
- [ ] Flexible Pricing Configuration supporting fixed rate, dynamic, or token-based pricing models
- [ ] Capacity Management with simple controls to mark hardware as available, reserved, or offline
- [ ] Earnings Dashboard showing incoming jobs, revenue, utilization rates, and payout history
- [ ] Usage Log showing all jobs (with user visibility based on tracking mode)

#### C. Verifiable Decision-Making (0G Integration)
- [ ] Immutable Reasoning Logs saved as structured JSON files to 0G Storage for every routing decision
- [ ] Proof of Routing with on-chain job records including 0G file hash for cryptographic linking
- [ ] User-Facing Verification with "Verify Decision" button to inspect full reasoning trace

#### D. On-Chain Job Registry & Settlement (ADI Integration)
- [ ] Job Registry Contract storing every job (Job ID, provider, price, status, 0G reasoning hash)
- [ ] Escrow Settlement with USDC deposits locked until job completion, then released to provider
- [ ] Lightweight Access Control for tracked mode (Admin, Viewer, User roles)

#### E. The Dashboard (Frontend)
- [ ] Job Submission Form with compute requirements specification and Tracked/Untracked toggle
- [ ] Live Price Comparison Table showing all providers with normalized USD/GPU-hr rates
- [ ] Agent Activity Feed with real-time updates during scanning and ranking process
- [ ] Team Spending Dashboard (Tracked Mode) with user spend breakdown and provider analytics
- [ ] Audit Log with links to on-chain records and 0G reasoning files

### Out of Scope

- Enterprise-grade compliance features — Focus on SMB and individual users
- Real-time re-routing during job execution — Single routing decision per job
- Custom blockchain development — Use existing ADI Chain and 0G Storage
- Advanced ML model training — Use simple ranking algorithms initially
- Mobile applications — Web-first approach

## Context

**Target Users:**
- **Demand Side:** Independent ML researchers, indie developers, startups, hackathon builders, data engineers running batch jobs
- **Supply Side:** Research labs, startups with over-provisioned infrastructure, enterprises with off-peak capacity, small hosting companies

**Core Workflows:**
1. **Buyer Flow:** Submit job request → Agent scans providers → Pricing normalization → Ranking/recommendation → 0G logging → On-chain registration → Settlement
2. **Seller Flow:** Register hardware → Configure pricing → Manage capacity → Receive routed jobs → Earn revenue → View usage analytics

**Pricing Models Supported:**
- **Fixed-Rate:** Posted rates in USD/stablecoin per hour (Akash reserved, Lambda Labs, traditional cloud)
- **Dynamic/Auction/Spot:** Floating rates with supply/demand (AWS Spot, Akash auctions, io.net dynamic)
- **Token-Based:** Rates in native crypto tokens with USD conversion (Render RNDR, Nosana NOS)

**Technical Environment:** Next.js 14 monorepo with TypeScript throughout, viem/wagmi for blockchain interaction, Anthropic Claude SDK for LLM integration.

## Constraints

- **Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI — Unified language stack
- **Blockchain**: ADI Chain for settlements, 0G Storage for reasoning logs
- **LLM Provider**: Anthropic Claude SDK for natural language job parsing
- **Pricing Data**: Hardcoded/mocked for demo, live APIs for production
- **Timeline**: 1-week hackathon build focused on core marketplace functionality
- **Architecture**: Monorepo structure with shared types and utilities across frontend/backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TypeScript monorepo | Single language for frontend, backend, and contracts simplifies hackathon development | — Pending |
| Tracked vs Untracked modes | Serves both teams needing visibility and individuals wanting privacy | — Pending |
| Three pricing model support | Addresses complete fragmentation in current compute market | — Pending |
| 0G + ADI integration | Provides verifiable routing with immutable audit trail | — Pending |
| Agent-centric UX | Eliminates decision fatigue by automating provider comparison | — Pending |

---
*Last updated: 2026-02-13 after marketplace pivot*