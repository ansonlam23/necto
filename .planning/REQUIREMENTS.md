# Requirements: Synapse - Two-Sided Compute Marketplace

**Defined:** February 12, 2026  
**Core Value:** AI-powered compute routing that normalizes pricing across fixed, spot, and token-based models; two-sided marketplace connecting buyers to cheapest compute and sellers to monetize idle capacity.

## v1 Requirements (Hackathon Build)

### Compute Routing Agent

- [ ] **AGENT-01:** Multi-provider price aggregation from 6-8 sources (Akash, io.net, Lambda Labs, AWS Spot, Render, Synapse-listed providers)
- [ ] **AGENT-02:** Pricing model normalization to effective USD per GPU-hour
- [ ] **AGENT-03:** Real-time token price feed (CoinGecko API) for token-based providers
- [ ] **AGENT-04:** Constraint-aware filtering (max price, region, GPU type, pricing model exclusions)
- [ ] **AGENT-05:** Dynamic ranking engine (cost primary, latency/uptime secondary)
- [ ] **AGENT-06:** Tracked/Untracked mode toggle with identity stripping

### Buyer Interface

- [ ] **BUYER-01:** Job submission form (GPU type, quantity, duration, constraints, mode toggle)
- [ ] **BUYER-02:** Live price comparison table with badges (Fixed, Spot, Token, Synapse)
- [ ] **BUYER-03:** Agent activity feed showing real-time scan progress
- [ ] **BUYER-04:** Team spending dashboard (Tracked mode only)
- [ ] **BUYER-05:** Audit log with on-chain links and 0G verification

### Seller Interface

- [ ] **SELLER-01:** Provider dashboard for listing hardware (GPU type, quantity, location, availability windows)
- [ ] **SELLER-02:** Pricing configuration (fixed rate, dynamic floor, token-based)
- [ ] **SELLER-03:** Capacity management toggle (available/reserved/offline)
- [ ] **SELLER-04:** Earnings dashboard (jobs served, revenue, utilization %)
- [ ] **SELLER-05:** Usage log (Tracked shows user ID; Untracked shows anonymous)

### 0G Integration (Bounty)

- [ ] **0G-01:** Upload agent reasoning JSON to 0G Storage
- [ ] **0G-02:** Include 0G content hash in on-chain job record
- [ ] **0G-03:** "Verify Decision" modal fetching and displaying reasoning trace

### ADI Chain Integration (Bounty)

- [ ] **ADI-01:** Deploy ComputeRouter.sol to ADI Testnet
- [ ] **ADI-02:** Provider registry functions (registerProvider, updateProviderRate)
- [ ] **ADI-03:** Job registry with createJob, completeJob
- [ ] **ADI-04:** USDC escrow settlement (lock on create, release on complete)
- [ ] **ADI-05:** Lightweight RBAC for Tracked mode (Admin, Viewer, User)

## v2 Requirements (Post-Hackathon)

Deferred to future development.

### Advanced Agent Features
- **AGENT-V2-01:** Real-time re-routing for long-running jobs
- **AGENT-V2-02:** Predictive cost optimization using historical data
- **AGENT-V2-03:** AI-powered resource matching for optimal hardware selection

### Enhanced Seller Tools
- **SELLER-V2-01:** Advanced scheduling (recurring availability windows)
- **SELLER-V2-02:** Dynamic pricing based on demand
- **SELLER-V2-03:** Performance analytics and optimization suggestions

### Production Integrations
- **INT-V2-01:** Live API connections to all providers
- **INT-V2-02:** Webhook support for job status updates
- **INT-V2-03:** Enterprise SSO integration

## Out of Scope

Explicitly excluded for v1 hackathon build.

| Feature | Reason |
|---------|--------|
| Live provider APIs | Time constraint; hardcoded data sufficient for demo |
| Production-grade monitoring | Basic activity feed sufficient |
| Multi-chain support | Focus on ADI Testnet for bounty |
| Advanced compliance | Lightweight team visibility only |
| Mobile app | Web-only for hackathon |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGENT-01 | Phase 1 | Pending |
| AGENT-02 | Phase 1 | Pending |
| AGENT-03 | Phase 1 | Pending |
| AGENT-04 | Phase 1 | Pending |
| AGENT-05 | Phase 1 | Pending |
| AGENT-06 | Phase 1 | Pending |
| BUYER-01 | Phase 2 | Pending |
| BUYER-02 | Phase 2 | Pending |
| BUYER-03 | Phase 2 | Pending |
| BUYER-04 | Phase 3 | Pending |
| BUYER-05 | Phase 3 | Pending |
| SELLER-01 | Phase 2 | Pending |
| SELLER-02 | Phase 2 | Pending |
| SELLER-03 | Phase 2 | Pending |
| SELLER-04 | Phase 3 | Pending |
| SELLER-05 | Phase 3 | Pending |
| 0G-01 | Phase 1 | Pending |
| 0G-02 | Phase 1 | Pending |
| 0G-03 | Phase 3 | Pending |
| ADI-01 | Phase 1 | Pending |
| ADI-02 | Phase 1 | Pending |
| ADI-03 | Phase 1 | Pending |
| ADI-04 | Phase 1 | Pending |
| ADI-05 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: February 12, 2026*
