# Necto — The Two-Sided Compute Marketplace with Intelligent Routing

## What This Is

Necto is a two-sided compute marketplace powered by an AI routing agent. For buyers (developers, researchers, teams), it eliminates decision fatigue by scanning every connected provider, normalizing different pricing models, and recommending the best deal in seconds. For sellers (organizations with idle GPUs), it provides an easy on-ramp to monetize spare capacity without building their own marketplace.

The marketplace operates in two modes: **Tracked Mode** for teams needing audit trails and cost visibility, and **Untracked Mode** for individual builders who value privacy while maintaining verifiability through on-chain records.

## Core Value

Connect compute buyers with the cheapest available GPUs across all providers while giving sellers with idle capacity a zero-friction path to monetization — all routing decisions are transparent, verifiable, and settled on-chain.

## Requirements

### Validated

- ✓ **Agent-Based Compute Routing** — Google ADK agent with tool architecture for provider comparison and job routing
- ✓ **Multi-Provider Discovery** — Provider fetchers for Akash, RunPod, Lambda Labs with SynapseProvider normalization
- ✓ **Akash Integration** — Console API client, SDL generator, deployment creation and bid management
- ✓ **On-Chain Job Tracking** — ComputeRouter Solidity contract on ADI Testnet for job creation and routing records
- ✓ **Web3 Wallet Integration** — viem/wagmi for user wallet connection and transaction signing
- ✓ **Workflow Canvas UI** — Interactive node-based workflow builder with @xyflow/react
- ✓ **State Management** — Zustand stores for global workflow state
- ✓ **Tool-Based Architecture** — Extensible tool registry (compare_providers, route_to_akash, wallet_tool)
- ✓ **Provider Comparison UI** — Provider cards with comparison capabilities and 60-second cached data

### Active

#### Compute Routing Agent (Demand Side)

- [ ] **Multi-Provider Price Aggregation** — Expand beyond Akash to io.net, AWS Spot, Render, Nosana, and Necto-listed providers
- [ ] **Pricing Model Normalization** — Convert fixed-rate, spot/auction, and token-based pricing to unified effective-USD-per-GPU-hour metric
- [ ] **Token Price Feed Integration** — Real-time crypto price data (CoinGecko) for token-denominated rate conversion
- [ ] **Constraint-Aware Filtering** — Hard constraints (max price, region, GPU type, pricing-model exclusions) respected before ranking
- [ ] **Dynamic Ranking Engine** — Sort by effective cost with secondary sort by latency, uptime, user rating
- [ ] **Tracked/Untracked Mode Toggle** — User chooses identity attachment to job record; routing logic identical in both modes
- [ ] **Real-Time Re-Routing (Stretch)** — Monitor prices mid-job and recommend/execute migration to cheaper provider

#### Provider Onboarding (Supply Side)

- [ ] **Provider Dashboard** — Interface for organizations to list available hardware (GPU type, quantity, location, availability windows)
- [ ] **Flexible Pricing Configuration** — Fixed rate, dynamic (floor + demand-based), or token-based pricing models
- [ ] **Capacity Management** — Toggle hardware available/reserved/offline; agent only routes to available capacity
- [ ] **Earnings Dashboard** — Incoming jobs, revenue earned, utilization rates, payout history
- [ ] **Usage Log** — Jobs run on hardware with Tracked (pseudonymous ID) or Untracked (anonymous) entries

#### Verifiable Decision-Making (0G Bounty)

- [ ] **Immutable Reasoning Logs** — Every routing decision saved as JSON to 0G Storage (inputs, logic, output; user ID included in Tracked, omitted in Untracked)
- [ ] **Proof of Routing** — On-chain job record includes 0G file hash linking payment to agent reasoning
- [ ] **User-Facing Verification** — "Verify Decision" button to inspect full reasoning trace from 0G

#### On-Chain Registry & Settlement (ADI Bounty)

- [ ] **Job Registry Contract** — Store Job ID, provider, effective price, status, 0G hash (Tracked: user ID stored; Untracked: empty user field)
- [ ] **Escrow Settlement** — USDC deposit, lock until completion, release to provider (both modes)
- [ ] **Lightweight Access Control (Tracked)** — Admin (manage team, whitelist providers), Viewer (browse history), User (submit jobs)

#### Dashboard Enhancements

- [ ] **Job Submission Form** — Compute requirements, constraints, Tracked/Untracked toggle
- [ ] **Live Price Comparison Table** — All providers with normalized USD/GPU-hr rates and availability
- [ ] **Agent Activity Feed** — Real-time updates: "Scanning Akash... Checking io.net..."
- [ ] **Team Spending Dashboard (Tracked)** — Spend per user, provider breakdown, basic accountability
- [ ] **Audit Log** — All jobs with on-chain links and 0G reasoning files (Tracked: user identity; Untracked: anonymous)

### Out of Scope

- **Heavy Compliance/Enterprise Auditing** — Lightweight team visibility only, not SOC 2 or enterprise-grade audit trails
- **Multi-Region Deployment Management** — Single region focus for v1
- **Advanced Job Orchestration** — No distributed training coordination or complex job dependencies
- **Provider SLAs/Guarantees** — Reputation scores but no contractual SLA enforcement
- **Fiat On-Ramp** — USDC only; no credit card or bank integration
- **Mobile Native App** — Web-only for v1
- **Real-Time Compute Streaming** — Batch jobs only, no interactive/streaming workloads

## Context

**Existing Foundation:** The codebase has a working Next.js 16 + React 19 frontend with a Google ADK agent for compute routing, Akash Console API integration, provider fetchers for 3 sources, and a ComputeRouter contract on ADI Testnet. The architecture is tool-based with clear separation between offchain UI/agent and on-chain tracking.

**Target Users:**
- **Demand Side:** Independent ML researchers, indie developers, hackathon builders, cost-conscious startups running batch jobs
- **Supply Side:** Research labs with idle GPUs, over-provisioned startups, enterprises with off-peak capacity, small hosting providers

**Key Differentiators:**
1. Three pricing paradigms normalized (fixed, spot/auction, token-based)
2. Privacy-preserving Untracked mode with full verifiability
3. Zero-friction seller onboarding for idle capacity
4. Transparent AI routing with immutable 0G logs

**Technical Environment:**
- Node.js 20+, TypeScript 5.x, Next.js 16, React 19
- Solidity 0.8.28, Hardhat 3.x, ADI Testnet
- Google ADK 0.3.0 for agent logic
- viem/wagmi for Web3 interactions
- 0G Storage for immutable reasoning logs

## Constraints

- **Tech Stack:** Next.js 16 + React 19 + TypeScript already established; maintain consistency
- **Blockchain:** ADI Testnet for settlement; 0G Storage for reasoning logs
- **Timeline:** 1-week sprint for core routing + provider onboarding + 0G integration
- **API Dependencies:** Akash Console API, CoinGecko for token prices, 0G SDK
- **Wallet:** Web3-only, no traditional auth
- **Compute Model:** Batch jobs only (not interactive/streaming)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tool-based agent architecture | Extensible routing for multiple providers | ✓ Good — easily add new providers as tools |
| Tracked/Untracked dual mode | Serve both enterprise teams and privacy-conscious individuals | — Pending |
| 0G Storage for reasoning logs | Immutable, verifiable audit trail without blockchain bloat | — Pending |
| USDC settlement on ADI | Stable, fast settlement with smart contract escrow | — Pending |
| SynapseProvider normalization | Single interface for all provider types | ✓ Good — consistent data model |

---
*Last updated: 2026-02-19 after initialization*
