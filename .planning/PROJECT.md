# Necto - Two-Sided Compute Marketplace with Intelligent Routing

## What This Is

Necto is a two-sided compute marketplace powered by an AI routing agent that eliminates decision fatigue in the fragmented compute market. For buyers (developers, researchers, small teams), it scans every connected provider, normalizes wildly different pricing models into comparable metrics, and recommends the best deal in seconds. For sellers (companies, labs, institutions with spare capacity), it provides an easy on-ramp to monetize idle compute by connecting them to cost-conscious buyers without building their own marketplace infrastructure.

## Core Value

The cheapest Compute always finds its buyer, and idle hardware always finds a job - if the system can't normalize pricing across three fundamentally different models (fixed-rate, spot/auction, token-based), provide verifiable routing decisions, and handle both tracked and untracked modes, the entire marketplace value proposition fails.

## Current Milestone: v2.0 Akash Integration

**Goal:** Build functionality that allows someone to actually route their compute to Akash Network

**Target features:**
- Akash API integration for deployment management
- SDL (Stack Definition Language) builder/generator for Akash deployments
- Deployment monitoring and logs for routed jobs
- Web app template gallery for common workloads
- Wallet integration for Akash transactions (AKT)
- Provider discovery and filtering for Akash providers

This milestone focuses specifically on the Akash integration piece while maintaining the broader marketplace vision.

## Team Structure

**Single Developer:** Full-stack development
- Frontend UI components (React/Next.js)
- Agent logic and price normalization
- API routes and data flow
- Akash API integration
- Wallet connections

## Requirements

### Validated

(None yet — ship to validate)

### Active (v2.0 - Akash Integration)

#### A. Akash Routing & Deployment
- [ ] **AKA-01**: Akash API client for provider discovery and deployment management
- [ ] **AKA-02**: SDL generator that converts user compute requirements to valid Akash SDL YAML
- [ ] **AKA-03**: Web app template gallery (Next.js, React, Vue, static sites)
- [ ] **AKA-04**: One-click deployment routing to Akash providers
- [ ] **AKA-05**: Real-time deployment status and logs for routed jobs
- [ ] **AKA-06**: Keplr wallet integration for Akash transactions (AKT)

#### B. Provider Discovery (Akash-specific)
- [ ] **PROV-01**: Akash provider discovery with filtering (price, region, specs)
- [ ] **PROV-02**: Provider comparison table with normalized pricing
- [ ] **PROV-03**: Auto-select best Akash provider based on price/performance

#### C. Marketplace Integration
- [ ] **MRK-01**: Job submission form now includes "Deploy to Akash" option
- [ ] **MRK-02**: Agent routes suitable workloads to Akash providers
- [ ] **MRK-03**: Deployment tracking integrated with job registry
- [ ] **MRK-04**: Pricing normalization for AKT token pricing

### Completed (v1.0 - Foundation)

#### Foundation
- [x] **FND-01**: ComputeRouter smart contract for job tracking (ADI Testnet)
- [x] **FND-02**: Google ADK agent for provider routing
- [x] **FND-03**: Agent thinking process UI
- [x] **FND-04**: TypeScript monorepo with viem/wagmi

### Future (v3.0+)

#### Additional Provider Integrations
- [ ] **INT-01**: io.net integration
- [ ] **INT-02**: Lambda Labs integration
- [ ] **INT-03**: AWS Spot integration
- [ ] **INT-04**: Render integration

#### Provider Platform (Supply Side)
- [ ] **PROV-ADV-01**: Provider dashboard for hardware listing
- [ ] **PROV-ADV-02**: Flexible pricing configuration
- [ ] **PROV-ADV-03**: Capacity management

#### Settlement & Verification
- [ ] **SET-01**: Escrow settlement with USDC
- [ ] **SET-02**: 0G Storage integration for reasoning logs
- [ ] **SET-03**: Verifiable routing decisions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Enterprise-grade compliance | Focus on SMB/individual users |
| Real-time job migration | Single routing decision per job |
| Custom blockchain | Use existing ADI Chain and 0G Storage |
| Multi-chain settlement | ADI Chain sufficient for MVP |
| Mobile applications | Web-first approach |

## Context

**Target Users:**
- **Demand Side:** Independent ML researchers, indie developers, startups, hackathon builders who want to deploy to Akash
- **Supply Side:** Akash providers, research labs, enterprises with spare capacity

**Core Workflows:**
1. **Buyer Flow:** Submit job request → Agent scans providers (including Akash) → Pricing normalization → Routing recommendation → Deploy to Akash → Monitor
2. **Akash Deploy Flow:** Select template/custom app → Configure resources → Generate SDL → Choose Akash provider → Sign with Keplr → Deploy → Monitor logs

**Technical Environment:** Next.js 16 monorepo with TypeScript throughout, viem/wagmi for blockchain interaction, Google ADK for agent logic.

## Constraints

- **Tech Stack**: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui
- **Blockchain**: ADI Chain for settlements, Akash Network for compute
- **LLM Provider**: Google ADK with Google AI Studio
- **Pricing Data**: Akash API + CoinGecko for AKT/USD
- **Timeline**: 1-week hackathon build
- **Architecture**: Monorepo with shared types

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Akash-first integration | Start with one provider, do it well | — In Progress |
| Template-based deployments | Lower barrier than custom SDL | — Pending |
| Keplr wallet | Standard for Akash ecosystem | — Pending |
| SDL generator | Abstract Akash complexity | — Pending |

---
*Updated: February 17, 2026 - Akash integration as part of marketplace vision*
