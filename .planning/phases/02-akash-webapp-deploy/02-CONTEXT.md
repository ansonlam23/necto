---
phase: 02-akash-webapp-deploy
title: Akash Integration - Marketplace Provider
status: active
milestone: v2.0
created: 2026-02-17
---

# Phase 2 Context: Akash Integration

## Overview

This phase adds Akash Network as the first provider integration to the Necto marketplace. Buyers can now submit compute jobs that get routed to Akash providers for deployment and execution.

## Background

### Marketplace Vision
Necto is a two-sided compute marketplace where:
- **Buyers** submit compute jobs with requirements
- **Agent** routes jobs to optimal providers
- **Providers** (starting with Akash) execute the jobs

### v1.0 Foundation (Archived)
- ComputeRouter smart contract for job tracking
- Google ADK agent foundation
- Basic routing logic

### v2.0 Direction
Add Akash as the first supported provider:
- Akash API integration
- SDL generation for deployments
- Provider discovery and filtering
- Wallet integration (Keplr)

## Current State

**Completed:**
- ✅ Project foundation (v1.0 archived)
- ✅ Documentation updated for Akash integration
- ✅ Phase 2.1 plan created

**In Progress:**
- 🚧 Phase 1 Extension: Akash Integration

**Next Up:**
- Set up Akash API client
- Integrate Akash into agent routing
- Build provider discovery UI
- Implement SDL generation

## Key Decisions

1. **Akash-first provider** — Deep integration before adding others
2. **Agent routes to Akash** — Part of normal routing workflow
3. **SDL generation** — Abstract Akash deployment complexity
4. **Keplr wallet** — Standard for Akash ecosystem
5. **Marketplace context** — Not a standalone deployment tool

## Akash Integration Points

### For Buyers
- Submit jobs with Akash as target provider
- See Akash providers in recommendations
- Deploy via templates or custom SDL
- Monitor deployment status

### For the Agent
- Discover Akash providers via API
- Normalize Akash pricing (AKT/USD)
- Generate SDL for job requirements
- Route suitable jobs to Akash

### For the Marketplace
- Job records include Akash deployment details
- Pricing comparison includes Akash rates
- Settlement can eventually include AKT

## Files in This Phase

- `02-01-PLAN.md` — Detailed plan for Akash integration
- (More files to be added as work progresses)

## Related Files

- `../../PROJECT.md` — Marketplace with Akash integration
- `../../ROADMAP.md` — 4-phase marketplace roadmap
- `../../STATE.md` — Current project state
- `../01-foundation-core-agent/` — Previous phase

## Resources

### Akash Documentation
- [Akash Docs](https://docs.akash.network/)
- [SDL Reference](https://docs.akash.network/sdl/overview)
- [Console API](https://console.akash.network/api)

### Templates
- ML Training workloads
- Web services
- Static sites
- Custom Docker images

---

*Context for Phase 2: Akash Integration*
*Part of Necto two-sided compute marketplace*
