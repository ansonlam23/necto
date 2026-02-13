# Phase 1: Core Infrastructure - Context

**Gathered:** February 12, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Smart contracts deployed to ADI Testnet, agent logic functional for price normalization and provider ranking, 0G Storage integration working for reasoning logs, Tracked/Untracked mode logic implemented. Foundation for buyer/seller interfaces in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Pricing Normalization
- **Token conversion:** Use real-time token prices via CoinGecko API for Filecoin, Akash, and other token-based providers
- **Hidden costs:** Include typical usage assumptions (bandwidth, storage, API calls) in the effective USD/GPU-hr rate
- **GPU normalization:** Normalize to A100-equivalent using performance ratios for fair comparison across GPU types
- **Output format:** Single effective rate displayed to users ($X.XX/GPU-hr)
- **Spot pricing:** Claude's discretion on methodology

### Provider Ranking Factors
- **Factors included:** Geographic diversity, historical uptime/reputation, and latency to job
- **Filter:** Ignore provider capacity constraints for hackathon demo
- **Recommendations:** Suggest top 3 providers with tradeoffs highlighted, not just cheapest
- **Weighting:** Claude's discretion on price vs quality balance

### Reasoning Trace Content (0G Storage)
- **Content:** Full decision tree — every provider checked, rejected reasons, and final ranking
- **Format:** Technical logs (JSON with scores, weights, calculations)
- **Scope:** Include top 5 providers considered (not just final ranking)
- **Metadata:** Basic (timestamp, job ID, provider count)

### Tracked vs Untracked Identity
- **Tracked mode:** Store full identity details — wallet address, organization, team member ID, timestamps
- **Untracked mode:** 
  - Hash wallet address and organization IDs (irreversible but auditable)
  - Keep anonymous audit trail without identity linkage
- **Contract architecture:** Claude's discretion on implementation (separate methods vs flag parameter)

### Claude's Discretion
- Spot pricing snapshot methodology
- Price vs quality weighting in ranking algorithm
- Smart contract mode selection architecture
- Error handling and retry strategies for 0G uploads
- Test coverage approach
- Contract optimization and gas efficiency

</decisions>

<specifics>
## Specific Ideas

- Agent should normalize pricing across fixed, spot, and token-based models into comparable USD/GPU-hr
- Reasoning traces should capture the full decision tree for transparency/verification
- Tracked mode allows per-user cost tracking; Untracked provides privacy with audit trail
- Hash identifiers in untracked mode to maintain audit capability without exposing identity
- Token providers (Filecoin, Akash) need real-time price conversion

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-core-infrastructure*
*Context gathered: February 12, 2026*
