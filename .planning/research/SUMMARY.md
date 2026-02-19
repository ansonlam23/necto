# Project Research Summary

**Project:** Necto — Two-Sided Compute Marketplace with AI Routing Agent  
**Domain:** DePIN (Decentralized Physical Infrastructure Networks) Compute Marketplace  
**Researched:** February 19, 2026  
**Confidence:** MEDIUM-HIGH

---

## Executive Summary

Necto is a DePIN compute marketplace that connects GPU buyers with sellers across multiple providers (Akash, io.net, AWS Spot, Render, Nosana) through an AI routing agent. Based on research, the 2025 standard architecture for such marketplaces follows a five-layer pattern: Presentation → Agent/Orchestration → Integration → Storage/Logging → Blockchain. The existing Next.js/React foundation with Google ADK agent positions Necto well, but requires significant extensions for multi-provider aggregation, 0G Storage integration, and on-chain settlement.

The recommended approach is to build incrementally: first establish provider aggregation with price normalization (using CoinGecko + Chainlink oracles), then layer in 0G Storage for immutable reasoning logs, followed by provider onboarding with Cosmos SDK patterns, and finally escrow settlement with USDC on ADI Testnet. This sequencing minimizes dependencies and allows validation at each layer.

Key risks include oracle price staleness (which can cause quote/execution price divergence), the two-sided marketplace chicken-and-egg problem (providers won't join without consumers), and gas cost explosion if reasoning logs are stored on-chain rather than 0G. Mitigation strategies include strict timestamp validation for oracles, bootstrapping with committed providers, and using 0G Storage as the primary audit layer with on-chain hash verification only.

---

## Key Findings

### Recommended Stack

Based on official documentation verification, the stack builds on Necto's existing Next.js/React foundation with specialized DePIN libraries. Core aggregation uses `@akashnetwork/chain-sdk` (replacing deprecated akashjs), `@0glabs/0g-ts-sdk` for immutable reasoning logs, `@aws-sdk/client-ec2` for AWS Spot pricing, and `@nosana/kit` for Solana ecosystem access. Price normalization relies on CoinGecko REST API (free tier sufficient) with Chainlink as on-chain verification fallback.

**Core technologies:**
- **`@akashnetwork/chain-sdk`** — Akash provider integration (official replacement for deprecated akashjs, CosmJS-based) — Critical for querying providers, bids, and deployments
- **`@0glabs/0g-ts-sdk`** — 0G Storage for reasoning logs (immutable audit trails with Merkle proofs) — Required peer dep: ethers ^6.x
- **`@aws-sdk/client-ec2`** — AWS Spot price queries via `DescribeSpotPriceHistory` — Lower volume fits free tier
- **`@nosana/kit`** — Nosana GPU marketplace access — Official TypeScript SDK for deployments and market discovery
- **CoinGecko API v3** — Token price feeds for RNDR, NOS, AKT — Industry standard, 20s cache free tier, no API key required for basic queries
- **`@cosmjs/stargate` + `@cosmjs/proto-signing`** — Cosmos SDK provider interactions — Industry standard for provider registration with Keplr wallet integration
- **`@chainlink/contracts`** — On-chain price verification via `AggregatorV3Interface` — Double-check token prices before settlement

**Confidence: HIGH** — All core components verified through official documentation.

---

### Expected Features

Synthesized from PROJECT.md requirements and research patterns:

**Must have (table stakes):**
- Multi-provider price aggregation (Akash, io.net, AWS Spot, Render, Nosana) — Core marketplace function, users expect comparison
- Three pricing model normalization (fixed-rate, spot/auction, token-based) — Critical differentiator for Necto
- Token price feeds for USD conversion — Required for apples-to-apples comparison
- Tracked/Untracked mode toggle — Privacy choice is core value proposition
- Basic provider onboarding dashboard — Supply side requires self-service listing
- USDC escrow settlement — Trustless payment is table stakes for DeFi marketplaces

**Should have (competitive):**
- 0G Storage integration for immutable reasoning logs — Verifiable AI decisions differentiate from opaque competitors
- Team spending dashboard with audit trails — Enterprise teams need cost visibility
- Real-time price comparison table — Live data builds trust
- Provider reputation scores — Quality signal for routing decisions
- Circuit breakers for failing providers — Reliability vs. competitor downtime

**Defer (v2+):**
- Real-time re-routing mid-job — Complex, requires job migration infrastructure
- Advanced provider SLAs — Reputation sufficient for MVP
- Fiat on-ramp — USDC-only acceptable for DePIN audience
- Multi-region orchestration — Single region focus for v1
- Provider insurance/hedging — Advanced feature, providers can self-hedge initially

---

### Architecture Approach

DePIN compute marketplaces follow a modular layered architecture separating concerns between user interaction, intelligent orchestration, provider integration, and settlement. The five key patterns are: (1) Agent-Based Tool Routing — LLM agents parse natural language and orchestrate multi-step workflows; (2) Provider Adapter Pattern — Common interface for heterogeneous providers; (3) Immutable Audit Logging — 0G Storage for tamper-proof reasoning trails; (4) Token Price Normalization — Real-time oracle conversion to comparable USD values; (5) Escrow-Based Settlement — Smart contract holds funds until job completion verification.

**Major components:**
1. **Agent/Orchestration Layer** — Google ADK with tool registry (compare_providers, route_to_*, upload_reasoning) — Parses intent, selects tools, executes workflows
2. **Provider Aggregation Layer** — Adapter pattern fetchers for each DePIN network — Normalizes heterogeneous APIs to common schema
3. **Price Normalization Service** — CoinGecko + Chainlink hybrid feeds — Converts token-denominated pricing to effective USD/GPU-hr
4. **0G Storage Client** — File/KV storage with Merkle proofs — Immutable audit logs for routing decisions
5. **ComputeRouter Contract** — Escrow, settlement, dispute resolution — On-chain coordination layer

**Confidence: MEDIUM-HIGH** — Patterns well-documented, 0G integration newer but SDK is stable.

---

### Critical Pitfalls

Seven critical pitfalls identified with specific prevention strategies:

1. **Oracle Price Staleness** — Price feeds update on heartbeats (often 1 hour), not real-time. Stale quotes cause execution price divergence.
   - *Avoid:* Check `updatedAt` timestamp < 5 minutes, use multiple oracle sources, implement 1-2% slippage buffers

2. **Provider-Consumer Chicken-and-Egg Death Spiral** — No providers without consumers, no consumers without providers. Cold start kills platform.
   - *Avoid:* Bootstrap with 3-5 committed providers (staking), subsidize early consumers, guarantee minimum payments to early providers

3. **Reputation Gaming and Sybil Attacks** — Pseudonymous identities allow one person to control multiple wallets, inflating ratings.
   - *Avoid:* Proof-of-completion ratings only, economic stake requirement, time-decay reputation, multi-dimensional scoring

4. **Gas Cost Explosion from On-Chain Storage** — Storing AI reasoning logs on-chain costs ~20,000 gas per 32 bytes. Megabytes of logs = prohibitive.
   - *Avoid:* Use 0G Storage for logs with on-chain hash verification only, implement retention policies, batch submissions

5. **Privacy vs Verifiability Impossible Trade-off** — Untracked mode cannot provide verifiable proofs of provider misbehavior without audit trail.
   - *Avoid:* Graduated privacy levels (Tracked/Semi-Private/Untracked), cryptographic commitments, 5x higher stake for Untracked providers

6. **Provider API Rate Limiting and Downtime Cascades** — Popular providers hit rate limits during spikes, causing cascading failures.
   - *Avoid:* Health monitoring with automatic removal, circuit breaker pattern, graceful degradation to backup providers

7. **Token Volatility Destroying Provider Economics** — 20% price drops between quote and settlement hurt provider revenue.
   - *Avoid:* USDC-denominated pricing (already planned), 5-minute quote expiration, show realized P&L to providers

**Confidence: MEDIUM** — Oracle patterns HIGH confidence, marketplace dynamics and 0G-specific pitfalls based on inference.

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Provider Aggregation
**Rationale:** Must establish provider connections and price normalization before any routing can occur. Dependencies: None.
**Delivers:** Working provider fetchers for Akash + 2 additional providers, unified price comparison endpoint, basic price normalization with CoinGecko.
**Uses:** `@akashnetwork/chain-sdk`, `@nosana/kit`, `@aws-sdk/client-ec2`, CoinGecko API
**Implements:** Provider Adapter Pattern, Token Price Normalization Pattern
**Avoids:** Pitfall 7 (Token Volatility) via USD-denominated quotes, Pitfall 6 (API Rate Limiting) via caching layer

### Phase 2: AI Agent & Multi-Provider Routing
**Rationale:** Build on aggregation layer to enable intelligent routing. Agent needs normalized data to make decisions.
**Delivers:** Extended ADK tools for multi-provider routing, constraint-aware filtering, dynamic ranking engine, live price comparison UI.
**Uses:** Existing Google ADK, Zustand for state, react-query for caching
**Implements:** Agent-Based Tool Routing Pattern
**Avoids:** Pitfall 1 (Oracle Staleness) via timestamp validation, Pitfall 6 (Rate Limiting) via circuit breakers
**Research Flag:** MEDIUM — ADK tool design may need iteration; verify pattern with small test before scaling.

### Phase 3: 0G Storage Integration
**Rationale:** Audit layer adds trust but isn't required for basic routing. Can validate core marketplace first.
**Delivers:** 0G Storage client wrapper, upload_reasoning tool, immutable reasoning logs, proof-of-routing on-chain.
**Uses:** `@0glabs/0g-ts-sdk`, ethers ^6.x
**Implements:** Immutable Audit Logging Pattern
**Avoids:** Pitfall 4 (Gas Cost Explosion) — critical that logs go to 0G not on-chain
**Research Flag:** LOW-MEDIUM — 0G is newer tech; verify SDK behavior on testnet before mainnet planning.

### Phase 4: Provider Onboarding & Supply Side
**Rationale:** Need demand validation before investing in supply-side infrastructure. Also requires smart contracts deployed.
**Delivers:** Provider dashboard, hardware listing forms, capacity management toggle, Cosmos SDK integration for registration.
**Uses:** `@cosmjs/stargate`, `@cosmjs/proto-signing`, react-hook-form, zod
**Implements:** Provider Onboarding Service
**Avoids:** Pitfall 2 (Chicken-and-Egg) via committed provider bootstrapping, Pitfall 3 (Reputation Gaming) via stake requirements
**Research Flag:** MEDIUM — Provider staking contract patterns need verification on ADI Testnet.

### Phase 5: Settlement & Modes
**Rationale:** Final layer — requires all previous components stable. Escrow is last trust hurdle.
**Delivers:** USDC escrow on ADI Testnet, Tracked/Untracked mode implementation, team spending dashboard, dispute resolution framework.
**Uses:** viem, `@openzeppelin/contracts` Escrow patterns
**Implements:** Escrow-Based Settlement Pattern
**Avoids:** Pitfall 5 (Privacy vs Verifiability) via graduated privacy levels
**Research Flag:** LOW — Escrow patterns well-established; main risk is ADI Testnet oracle availability.

### Phase Ordering Rationale

1. **Provider Aggregation before Agent Routing** — Agent can't make intelligent decisions without normalized provider data
2. **0G Storage before Provider Onboarding** — Audit trail needed before bringing external providers into system
3. **Settlement last** — Requires provider registry, pricing normalization, and audit infrastructure all working
4. **Grouped by risk** — Each phase isolates one major pitfall class (pricing, audit, supply, trust)

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (AI Agent):** ADK is newer technology; complex tool orchestration may need API research
- **Phase 3 (0G Storage):** Limited real-world usage data; verify SDK behavior and costs
- **Phase 4 (Provider Onboarding):** Cosmos SDK patterns on ADI Testnet need validation

Phases with standard patterns (skip research-phase):
- **Phase 1 (Provider Aggregation):** Well-documented REST APIs, standard adapter pattern
- **Phase 5 (Settlement):** Established escrow patterns, OpenZeppelin contracts

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core components verified through official documentation (Akash, 0G, Nosana, CoinGecko, Chainlink, AWS) |
| Features | MEDIUM-HIGH | Synthesized from validated PROJECT.md requirements; domain patterns well-understood |
| Architecture | MEDIUM-HIGH | Standard DePIN patterns documented; 0G integration is primary uncertainty |
| Pitfalls | MEDIUM | Oracle patterns HIGH confidence; marketplace dynamics and 0G-specific based on inference |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **io.net API:** No official TypeScript SDK found; REST API integration may need manual research during Phase 1
- **Render API:** Unable to verify API docs (404 error); may require authentication or be deprecated — needs validation
- **ADI Testnet Oracle Feeds:** Some Chainlink/Pyth feeds may not exist on testnet — verify feed availability before Phase 2
- **0G Storage Costs:** Real-world cost data limited — benchmark during Phase 3 development
- **Provider Commitment:** Bootstrap strategy requires 3-5 committed providers — secure letters of intent before Phase 4

---

## Sources

### Primary (HIGH confidence)
- [Akash SDK Docs](https://akash.network/docs/api-documentation/sdk) — Official chain-sdk, deprecation of akashjs, Node 22 requirement
- [0G Storage SDK Docs](https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk) — TypeScript SDK installation, ethers v6 peer dependency, starter kits
- [CoinGecko API Docs](https://docs.coingecko.com/reference/simple-price) — `/simple/price` endpoint, free tier limits, 20s cache
- [Chainlink Data Feeds](https://docs.chain.link/data-feeds) — AggregatorV3Interface patterns, proxy/aggregator architecture
- [Nosana API Docs](https://docs.nosana.io/api/intro.html) — `@nosana/kit` SDK, REST API structure, authentication patterns
- [AWS EC2 API](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_DescribeSpotPriceHistory.html) — Spot price history endpoint, SDK v3 patterns
- [OpenZeppelin Price Oracle Security](https://blog.openzeppelin.com/secure-smart-contract-guidelines-the-dangers-of-price-oracles/) — Oracle manipulation risks
- [Samczsun: "So you want to use a price oracle"](https://samczsun.com/so-you-want-to-use-a-price-oracle/) — Oracle best practices

### Secondary (MEDIUM confidence)
- PROJECT.md requirements — Validated features from project initialization
- Architecture patterns — Synthesized from DePIN marketplace research and existing codebase structure

### Tertiary (LOW confidence)
- io.net API — Unable to connect to docs; API status unverified
- Render API — 404 error; may require authentication or be deprecated
- 0G Storage pitfalls — Limited real-world usage data, primarily theoretical

---

*Research completed: February 19, 2026*  
*Files synthesized: STACK.md, ARCHITECTURE.md, PITFALLS.md, PROJECT.md*  
*Ready for roadmap: yes*
