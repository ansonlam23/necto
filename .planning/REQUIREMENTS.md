# Requirements: Necto - Two-Sided Compute Marketplace

**Defined:** February 13, 2026
**Core Value:** The cheapest GPU always finds its buyer, and idle hardware always finds a job - if the system can't normalize pricing across three fundamentally different models (fixed-rate, spot/auction, token-based), provide verifiable routing decisions, and handle both tracked and untracked modes, the entire marketplace value proposition fails.

## v1 Requirements

Requirements for marketplace MVP. Organized by feature area.

### Agent Core (Demand Side)

- [ ] **AGT-01**: Multi-provider price aggregation from Akash, io.net, Lambda Labs, AWS Spot, Render, and Necto-listed providers
- [ ] **AGT-02**: Pricing model normalization converting fixed-rate, spot/auction, and token-based into effective USD/GPU-hr
- [ ] **AGT-03**: Token price feed integration via CoinGecko API for real-time crypto token conversion
- [ ] **AGT-04**: Constraint-aware filtering supporting max price, region, GPU type, and pricing model exclusions
- [ ] **AGT-05**: Dynamic ranking engine sorting by effective cost with secondary criteria (latency, uptime, rating)
- [ ] **AGT-06**: Tracked/Untracked mode toggle affecting user identity storage in job records

### Provider Platform (Supply Side)

- [ ] **PROV-01**: Provider dashboard for hardware listing with specs, location, and availability windows
- [ ] **PROV-02**: Flexible pricing configuration supporting fixed-rate, dynamic, and token-based models
- [ ] **PROV-03**: Capacity management with available/reserved/offline status controls
- [ ] **PROV-04**: Earnings dashboard showing jobs served, revenue, utilization rates, and payout history
- [ ] **PROV-05**: Usage log displaying all jobs with user visibility based on tracking mode

### Verification Layer (0G Integration)

- [ ] **VER-01**: Immutable reasoning logs saved as JSON files to 0G Storage for every routing decision
- [ ] **VER-02**: Proof of routing with on-chain job records including 0G file hash
- [ ] **VER-03**: User-facing verification with "Verify Decision" button to inspect full reasoning trace
- [ ] **VER-04**: Reasoning log structure preserving all inputs, normalization logic, and ranking output

### Settlement Layer (ADI Integration)

- [ ] **SET-01**: Job registry contract storing Job ID, provider, price, status, and 0G reasoning hash
- [ ] **SET-02**: Escrow settlement with USDC deposits locked until job completion
- [ ] **SET-03**: Provider registration system for on-chain hardware listing and rate updates
- [ ] **SET-04**: Lightweight access control for tracked mode (Admin, Viewer, User roles)

### Buyer Dashboard

- [ ] **BUY-01**: Job submission form with compute requirements and Tracked/Untracked mode toggle
- [ ] **BUY-02**: Live price comparison table showing all providers with normalized USD/GPU-hr rates
- [ ] **BUY-03**: Agent activity feed with real-time scanning and ranking progress updates
- [ ] **BUY-04**: Team spending dashboard (Tracked mode) with per-user breakdown and provider analytics
- [ ] **BUY-05**: Audit log with links to ADI Chain records and 0G Storage reasoning files

### System Foundation

- [ ] **SYS-01**: TypeScript monorepo with shared types across frontend, agent, and contracts
- [ ] **SYS-02**: Next.js 14 app with API routes for agent endpoints
- [ ] **SYS-03**: Pricing normalization module supporting all three pricing models
- [ ] **SYS-04**: Mock provider data covering 6-8 providers including 2-3 Necto-listed organizations
- [ ] **SYS-05**: Real-time UI updates using server-sent events or WebSocket for agent progress

## v2 Requirements

Deferred to post-MVP. Tracked but not in current scope.

### Advanced Agent Features

- **AGT-ADV-01**: Real-time re-routing for long-running jobs when cheaper options emerge
- **AGT-ADV-02**: Historical price volatility analysis for token-based provider risk assessment
- **AGT-ADV-03**: Machine learning models for demand prediction and dynamic pricing optimization
- **AGT-ADV-04**: Multi-job batching for cost optimization across related workloads

### Enhanced Provider Features

- **PROV-ADV-01**: Advanced capacity scheduling with time-based pricing tiers
- **PROV-ADV-02**: Provider reputation system based on job completion rates and user ratings
- **PROV-ADV-03**: Automated hardware monitoring and availability status updates
- **PROV-ADV-04**: Provider analytics with demand forecasting and revenue optimization

### Extended Integrations

- **INT-01**: Live API integrations replacing mock data for all major providers
- **INT-02**: Additional DePIN networks (Nosana, Bacalhau, Golem)
- **INT-03**: Traditional cloud provider spot market integrations (GCP, Azure)
- **INT-04**: Direct enterprise client onboarding with custom SLAs

## Out of Scope

Explicitly excluded to maintain MVP focus.

| Feature | Reason |
|---------|--------|
| Enterprise compliance features | Focus on SMB/individual users, not institutional requirements |
| Real-time job migration | Single routing decision per job simplifies implementation |
| Custom blockchain development | Leverage existing ADI Chain and 0G Storage infrastructure |
| Advanced ML training | Simple ranking algorithms sufficient for MVP validation |
| Mobile applications | Web-first approach for faster development |
| Multi-chain settlement | ADI Chain sufficient for demonstrating settlement layer |
| Provider KYC verification | Trust-based system for MVP, formal verification in v2 |

## Traceability

Which features map to implementation phases (reorganized for parallel development).

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGT-01 | Phase 1: Buyer Discovery | Pending |
| AGT-02 | Phase 1: Buyer Discovery | Pending |
| AGT-03 | Phase 1: Buyer Discovery | Pending |
| BUY-01 | Phase 1: Buyer Discovery | Pending |
| BUY-02 | Phase 1: Buyer Discovery | Pending |
| SYS-01 | Phase 1: Buyer Discovery | Pending |
| SYS-02 | Phase 1: Buyer Discovery | Pending |
| SYS-03 | Phase 1: Buyer Discovery | Pending |
| SYS-04 | Phase 1: Buyer Discovery | Pending |
| SET-01 | Phase 1: Buyer Discovery | Pending |
| AGT-04 | Phase 2: Dynamic Routing | Pending |
| AGT-05 | Phase 2: Dynamic Routing | Pending |
| BUY-03 | Phase 2: Dynamic Routing | Pending |
| SYS-05 | Phase 2: Dynamic Routing | Pending |
| PROV-01 | Phase 3: Provider Platform | Pending |
| PROV-02 | Phase 3: Provider Platform | Pending |
| PROV-03 | Phase 3: Provider Platform | Pending |
| SET-03 | Phase 3: Provider Platform | Pending |
| VER-01 | Phase 4: Settlement & Verification | Pending |
| VER-02 | Phase 4: Settlement & Verification | Pending |
| VER-03 | Phase 4: Settlement & Verification | Pending |
| VER-04 | Phase 4: Settlement & Verification | Pending |
| AGT-06 | Phase 4: Settlement & Verification | Pending |
| BUY-04 | Phase 4: Settlement & Verification | Pending |
| BUY-05 | Phase 4: Settlement & Verification | Pending |
| PROV-04 | Phase 4: Settlement & Verification | Pending |
| PROV-05 | Phase 4: Settlement & Verification | Pending |
| SET-02 | Phase 4: Settlement & Verification | Pending |
| SET-04 | Phase 4: Settlement & Verification | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: February 13, 2026*
*Last updated: February 14, 2026 after roadmap reorganization for parallel development*