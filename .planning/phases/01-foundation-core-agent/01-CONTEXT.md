# Phase 1: Foundation & Core Agent - Context

**Gathered:** 2026-02-14  
**Updated:** 2026-02-17  
**Status:** Partially Archived

## Update Notice

**February 17, 2026:** The project has pivoted to focus on Akash web app deployment. 

**01-01 Plan (ComputeRouter Contract) has been archived** to `milestones/v1.0-phases/01-01/` as part of v1.0 milestone.

**01-02 Plan remains** but is currently on hold pending Phase 2 completion.

---

## Phase Boundary (Historical)

Users can submit compute job requests and see the AI routing agent find the cheapest provider across fixed-rate, spot, and token-based pricing models. The agent normalizes all pricing into comparable USD/compute-hr and returns a ranked recommendation. On-chain recording provides an immutable audit trail from day 1.

**Note:** This was the original direction. Current focus is Akash deployment platform.

---

## Archived Work (01-01)

**Status:** ✅ COMPLETE — Archived to milestones/v1.0-phases/01-01/

**Deliverables:**
- ComputeRouter.sol smart contract (26 tests passing)
- Ignition deployment module
- TypeScript ABI and types
- ADI Testnet configuration

**Files Archived:**
- 01-01-PLAN.md
- 01-01-SUMMARY.md  
- 01-01-VERIFICATION.md

---

## Remaining Work (01-02 - On Hold)

**Status:** ⏸️ ON HOLD

**Original Scope:** Offchain implementation with Google ADK agent, thinking UI, auto-sign

**Note:** Much of this work was completed as Quick Task 02. The foundation exists but full integration is pending Akash deployment focus.

---

## Context for Current Work

See `../02-akash-webapp-deploy/02-CONTEXT.md` for current project direction.

This phase directory is retained for:
1. Historical reference
2. 01-02 work if resumed
3. Foundation code that may be reused

---

## Original Implementation Decisions (Retained for Reference)

### On-Chain vs Off-Chain Architecture
- Job submission is **fully off-chain** — user fills form, hits API route, sees results instantly with zero gas/wallet friction
- Provider data is **off-chain** — mix of live APIs (Akash) and JSON files for providers without APIs
- Agent routing decisions are **on-chain** — minimal data + hashes pointing to 0G Storage

### Smart Contract (ComputeRouter.sol on ADI Testnet)
- Stores job ID + hashes only (minimal on-chain data)
- `detailsHash` → points to full job request metadata in 0G Storage
- `routingHash` → points to full agent reasoning/decision in 0G Storage
- Agent address is **whitelisted** to call `recordRoutingDecision()`

### Tracked/Untracked Mode
- **Toggle built in Phase 1 as foundation** for Phase 4
- Tracked mode: stores user identity in job records
- Untracked mode: omits user identity for privacy

---

*Phase: 01-foundation-core-agent*  
*Context gathered: 2026-02-14*  
*Updated: 2026-02-17 - Archived 01-01, project pivot*
