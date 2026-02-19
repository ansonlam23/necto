# Requirements: Necto — Compute Marketplace

**Defined:** 2026-02-19
**Core Value:** Connect compute buyers with cheapest available GPUs across all providers while giving sellers zero-friction monetization — all routing decisions transparent, verifiable, settled on-chain

## v1 Requirements

### Provider Aggregation (Core Infrastructure)

- [ ] **PROV-01**: Agent can fetch pricing from Akash (fixed + auction rates)
- [ ] **PROV-02**: Agent can fetch pricing from io.net (REST API fallback)
- [ ] **PROV-03**: Agent can fetch pricing from AWS Spot (EC2 API)
- [ ] **PROV-04**: Agent can fetch pricing from Render Network (token-based)
- [ ] **PROV-05**: Agent can fetch pricing from Nosana (SDK integration)
- [ ] **PROV-06**: Agent can fetch pricing from Necto-listed providers (supply side)
- [ ] **PROV-07**: All providers normalized to SynapseProvider interface with unified schema
- [ ] **PROV-08**: Provider data cached with 60-second revalidation

### Pricing Normalization

- [ ] **PRICE-01**: Fixed-rate offers converted to effective USD/GPU-hr
- [ ] **PRICE-02**: Spot/auction pricing converted to effective USD/GPU-hr with bid volatility indicator
- [ ] **PRICE-03**: Token-based pricing converted to USD using real-time CoinGecko feed
- [ ] **PRICE-04**: Token price includes timestamp validation (prevent stale quotes)
- [ ] **PRICE-05**: Historical volatility displayed for token-based providers (±24hr range)
- [ ] **PRICE-06**: All prices ranked by effective cost with secondary sort options (latency, uptime)

### Token Price Feed

- [ ] **FEED-01**: CoinGecko API integration for AKT, RNDR, NOS, and other provider tokens
- [ ] **FEED-02**: 20-second price cache to avoid rate limits
- [ ] **FEED-03**: Fallback to last known price if API unavailable (with warning)
- [ ] **FEED-04**: On-chain Chainlink verification for settlement-critical prices

### Agent Routing Engine

- [ ] **AGENT-01**: Constraint-aware filtering (max price, region, GPU type, pricing model exclusions)
- [ ] **AGENT-02**: Dynamic ranking by effective cost
- [ ] **AGENT-03**: Thinking steps exposed to UI ("Scanning Akash... Checking io.net...")
- [ ] **AGENT-04**: Top recommendation highlighted with cost breakdown
- [ ] **AGENT-05**: Alternative options displayed with reasoning

### 0G Storage Integration

- [ ] **ZERO-01**: Every routing decision JSON saved to 0G Storage
- [ ] **ZERO-02**: JSON includes: all prices fetched, normalization math, ranking criteria, final selection
- [ ] **ZERO-03**: Content hash returned and stored in on-chain job record
- [ ] **ZERO-04**: SDK supports both file storage (logs) and KV storage (structured data)
- [ ] **ZERO-05**: Tracked Mode: user identity included in JSON
- [ ] **ZERO-06**: Untracked Mode: user field omitted from JSON

### On-Chain Registry & Settlement

- [ ] **CHAIN-01**: ComputeRouter extended with escrow functionality
- [ ] **CHAIN-02**: USDC deposit accepted from job submitter
- [ ] **CHAIN-03**: Funds locked until agent confirms job completion
- [ ] **CHAIN-04**: Funds released to provider address on completion
- [ ] **CHAIN-05**: Job record includes: Job ID, provider, effective price, status, 0G hash
- [ ] **CHAIN-06**: Tracked Mode: user ID stored with job record
- [ ] **CHAIN-07**: Untracked Mode: user field left empty (anonymous)

### Tracked/Untracked Mode

- [ ] **MODE-01**: Prominent toggle in job submission form
- [ ] **MODE-02**: Tracked Mode: full audit trail with user identity (0G + on-chain)
- [ ] **MODE-03**: Untracked Mode: verifiable routing without identity exposure (0G + on-chain, no user field)
- [ ] **MODE-04**: Routing logic identical in both modes (only difference is user identity storage)
- [ ] **MODE-05**: Mode selection stored with job record for audit purposes

### Provider Onboarding (Supply Side)

- [ ] **ONBOARD-01**: Provider registration form (org name, contact, wallet address)
- [ ] **ONBOARD-02**: Hardware listing form (GPU type, quantity, location, specs)
- [ ] **ONBOARD-03**: Availability windows (e.g., "weeknights 6pm–8am", "always on")
- [ ] **ONBOARD-04**: Pricing model selection (fixed, dynamic, token-based)
- [ ] **ONBOARD-05**: Fixed rate: set USD/hr price
- [ ] **ONBOARD-06**: Dynamic rate: set floor price with demand-based ceiling
- [ ] **ONBOARD-07**: Token-based: select supported token and rate
- [ ] **ONBOARD-08**: Capacity management: toggle available/reserved/offline
- [ ] **ONBOARD-09**: Provider receives "Live" badge when approved and active

### Provider Dashboard (Supply Side)

- [ ] **SELLER-01**: Dashboard showing: jobs served, revenue earned, utilization rate
- [ ] **SELLER-02**: Earnings history with payout dates and amounts
- [ ] **SELLER-03**: Usage log: jobs run on hardware with timestamps
- [ ] **SELLER-04**: Tracked jobs: show pseudonymous user ID
- [ ] **SELLER-05**: Untracked jobs: show "Anonymous" entry
- [ ] **SELLER-06**: Provider can update pricing at any time
- [ ] **SELLER-07**: Provider can mark hardware offline for maintenance

### Buyer Dashboard

- [ ] **BUYER-01**: Job submission form with GPU type, quantity, duration, constraints
- [ ] **BUYER-02**: Live price comparison table showing all providers with USD/GPU-hr
- [ ] **BUYER-03**: Agent activity feed with real-time scanning updates
- [ ] **BUYER-04**: "Verify Decision" button linking to 0G reasoning trace
- [ ] **BUYER-05**: Team Spending Dashboard (Tracked Mode only): spend per user, provider breakdown
- [ ] **BUYER-06**: Audit log: all jobs with on-chain links and 0G hashes
- [ ] **BUYER-07**: Audit log shows user identity for Tracked, "Anonymous" for Untracked

### Access Control (Tracked Mode)

- [ ] **ACCESS-01**: Admin role: manage team members, whitelist providers
- [ ] **ACCESS-02**: Viewer role: browse team job history and spending (read-only)
- [ ] **ACCESS-03**: User role: submit jobs, view own history
- [ ] **ACCESS-04**: Lightweight RBAC — no enterprise-grade compliance overhead

## v2 Requirements

### Advanced Routing

- **ROUTE-01**: Real-time re-routing for long-running jobs based on price changes
- **ROUTE-02**: Provider reputation scoring based on uptime and job success rate
- **ROUTE-03**: Machine learning price prediction for spot/auction markets
- **ROUTE-04**: Multi-region job distribution and failover

### Enhanced Provider Features

- **SELLER-08**: Automated payout scheduling (daily/weekly/monthly)
- **SELLER-09**: Provider performance analytics (latency benchmarks, utilization forecasting)
- **SELLER-10**: API keys for programmatic provider management

### Platform Features

- **PLATFORM-01**: Job templates (common configurations saved for reuse)
- **PLATFORM-02**: Batch job submission (multiple jobs at once)
- **PLATFORM-03**: Cost alerts (notify when preferred provider drops below threshold)
- **PLATFORM-04**: Mobile-responsive dashboard improvements

## Out of Scope

| Feature | Reason |
|---------|--------|
| Heavy Compliance/Enterprise Auditing | Lightweight team visibility only; SOC 2 deferred to v2+ |
| Multi-Region Deployment Management | Single region focus for v1; multi-region in v2 |
| Advanced Job Orchestration | No distributed training coordination; single-node jobs only |
| Provider SLAs/Guarantees | Reputation scores only; no contractual enforcement |
| Fiat On-Ramp | USDC only; credit card integration deferred |
| Mobile Native App | Web-only for v1; native apps v2+ |
| Real-Time Compute Streaming | Batch jobs only; interactive/streaming workloads deferred |
| Custom Provider SDK | REST/GraphQL only; custom SDKs v2+ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROV-01 | Phase 1 | Pending |
| PROV-02 | Phase 1 | Pending |
| PROV-03 | Phase 1 | Pending |
| PROV-04 | Phase 2 | Pending |
| PROV-05 | Phase 2 | Pending |
| PROV-06 | Phase 4 | Pending |
| PROV-07 | Phase 1 | Pending |
| PROV-08 | Phase 1 | Pending |
| PRICE-01 | Phase 1 | Pending |
| PRICE-02 | Phase 1 | Pending |
| PRICE-03 | Phase 2 | Pending |
| PRICE-04 | Phase 2 | Pending |
| PRICE-05 | Phase 2 | Pending |
| PRICE-06 | Phase 2 | Pending |
| FEED-01 | Phase 2 | Pending |
| FEED-02 | Phase 2 | Pending |
| FEED-03 | Phase 2 | Pending |
| FEED-04 | Phase 5 | Pending |
| AGENT-01 | Phase 2 | Pending |
| AGENT-02 | Phase 2 | Pending |
| AGENT-03 | Phase 2 | Pending |
| AGENT-04 | Phase 2 | Pending |
| AGENT-05 | Phase 2 | Pending |
| ZERO-01 | Phase 3 | Pending |
| ZERO-02 | Phase 3 | Pending |
| ZERO-03 | Phase 3 | Pending |
| ZERO-04 | Phase 3 | Pending |
| ZERO-05 | Phase 3 | Pending |
| ZERO-06 | Phase 3 | Pending |
| CHAIN-01 | Phase 5 | Pending |
| CHAIN-02 | Phase 5 | Pending |
| CHAIN-03 | Phase 5 | Pending |
| CHAIN-04 | Phase 5 | Pending |
| CHAIN-05 | Phase 3 | Pending |
| CHAIN-06 | Phase 5 | Pending |
| CHAIN-07 | Phase 5 | Pending |
| MODE-01 | Phase 2 | Pending |
| MODE-02 | Phase 5 | Pending |
| MODE-03 | Phase 5 | Pending |
| MODE-04 | Phase 2 | Pending |
| MODE-05 | Phase 5 | Pending |
| ONBOARD-01 | Phase 4 | Pending |
| ONBOARD-02 | Phase 4 | Pending |
| ONBOARD-03 | Phase 4 | Pending |
| ONBOARD-04 | Phase 4 | Pending |
| ONBOARD-05 | Phase 4 | Pending |
| ONBOARD-06 | Phase 4 | Pending |
| ONBOARD-07 | Phase 4 | Pending |
| ONBOARD-08 | Phase 4 | Pending |
| ONBOARD-09 | Phase 4 | Pending |
| SELLER-01 | Phase 4 | Pending |
| SELLER-02 | Phase 4 | Pending |
| SELLER-03 | Phase 4 | Pending |
| SELLER-04 | Phase 4 | Pending |
| SELLER-05 | Phase 4 | Pending |
| SELLER-06 | Phase 4 | Pending |
| SELLER-07 | Phase 4 | Pending |
| BUYER-01 | Phase 2 | Pending |
| BUYER-02 | Phase 2 | Pending |
| BUYER-03 | Phase 2 | Pending |
| BUYER-04 | Phase 3 | Pending |
| BUYER-05 | Phase 5 | Pending |
| BUYER-06 | Phase 3 | Pending |
| BUYER-07 | Phase 5 | Pending |
| ACCESS-01 | Phase 5 | Pending |
| ACCESS-02 | Phase 5 | Pending |
| ACCESS-03 | Phase 5 | Pending |
| ACCESS-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation*

**Phase Definitions:** See `.planning/ROADMAP.md` for detailed phase goals and success criteria
