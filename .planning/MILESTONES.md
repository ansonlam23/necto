# Milestones: Necto

**Project:** Necto - Two-Sided Compute Marketplace  
**Created:** February 17, 2026  
**Last Updated:** February 17, 2026

---

## Completed Milestones

### v1.0 — Foundation & Core Agent
**Status:** ✅ COMPLETE  
**Completed:** February 17, 2026  
**Focus:** Smart contract foundation and Google ADK agent for marketplace routing

**Deliverables:**
- ComputeRouter.sol smart contract with full test coverage (26 tests)
- Ignition deployment module for ADI Testnet
- Google ADK agent with Google AI Studio API for provider routing
- Agent thinking process UI with step-by-step visualization
- /api/route-job endpoint and /verify-agent demo page
- TypeScript integration with viem/wagmi

**Archived Phase:**
- Phase 01-01: ComputeRouter Contract → `.planning/milestones/v1.0-phases/01-01/`

---

## Current Milestone

### v2.0 — Akash Provider Integration
**Status:** 🚧 IN PROGRESS  
**Started:** February 17, 2026  
**Focus:** Add Akash Network as the first provider in the marketplace

**Important:** This is NOT a pivot away from the marketplace. Necto remains a two-sided compute marketplace. v2.0 adds the capability to route compute jobs to Akash Network providers.

**Goal:** Buyers can submit jobs and have them routed to Akash providers for deployment and execution

**Key Features:**
- Akash API integration for provider discovery
- SDL (Stack Definition Language) generator for deployments
- Template gallery for common workloads
- Keplr wallet integration for AKT transactions
- Agent routing to Akash providers
- Real-time deployment monitoring

---

## Future Milestones

### v3.0 — Additional Provider Integrations
**Status:** 📋 PLANNED  
**Focus:** Add more providers (io.net, Lambda Labs, AWS Spot, Render)

### v4.0 — Provider Platform
**Status:** 📋 PLANNED  
**Focus:** Two-sided marketplace with provider onboarding

### v5.0 — Settlement & Verification
**Status:** 📋 PLANNED  
**Focus:** Payment escrow, 0G Storage integration, verification layer

---

## Archive Structure

```
.planning/milestones/
├── v1.0-phases/             # Archived v1.0 work
│   └── 01-01/               # ComputeRouter contract
│       ├── 01-01-PLAN.md
│       ├── 01-01-SUMMARY.md
│       └── 01-01-VERIFICATION.md
└── (future milestones)
```

## Phase Directory Status

| Phase | Milestone | Status | Location |
|-------|-----------|--------|----------|
| 01-01 | v1.0 | ✅ Archived | `.planning/milestones/v1.0-phases/01-01/` |
| 01-02 | v2.0 | 🚧 Active | `.planning/phases/01-foundation-core-agent/` |
| 02-01 | v2.0 | 🚧 Active | `.planning/phases/02-akash-webapp-deploy/` |

---

## Marketplace Vision

Necto is and remains a **two-sided compute marketplace**:

1. **Buyers** submit compute jobs with requirements
2. **Agent** scans providers and routes to optimal match
3. **Providers** (starting with Akash) execute the jobs

The v2.0 milestone adds Akash as the first integrated provider. Future milestones will add more providers and complete the marketplace functionality.

---

*Last updated: February 17, 2026 - Akash integration as first marketplace provider*
