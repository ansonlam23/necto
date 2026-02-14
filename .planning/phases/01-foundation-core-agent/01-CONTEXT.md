# Phase 1: Foundation & Core Agent - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can submit compute job requests and see the AI routing agent find the cheapest provider across fixed-rate, spot, and token-based pricing models. The agent normalizes all pricing into comparable USD/compute-hr and returns a ranked recommendation. On-chain recording provides an immutable audit trail from day 1.

</domain>

<decisions>
## Implementation Decisions

### On-Chain vs Off-Chain Architecture
- Job submission is **fully off-chain** — user fills form, hits API route, sees results instantly with zero gas/wallet friction
- Provider data is **off-chain** — mix of live APIs (Akash) and JSON files for providers without APIs (Lambda, Render)
- Agent routing decisions are **on-chain** — minimal data + hashes pointing to 0G Storage for full verifiability
- Rationale: users never touch the chain in Phase 1; the agent handles all on-chain interaction behind the scenes

### Smart Contract (ComputeRouter.sol on ADI Testnet)
- Stores job ID + hashes only (minimal on-chain data)
- `detailsHash` → points to full job request metadata in 0G Storage
- `routingHash` → points to full agent reasoning/decision in 0G Storage
- Agent address is **whitelisted** to call `recordRoutingDecision()` — centralized agent, controlled write access
- Emits `JobSubmitted` and `RoutingDecision` events for off-chain indexing and UI updates
- Open read access — anyone can query job history from contract

### Job Lifecycle & Status
- **Minimal state in Phase 1** — contract records job creation and routing decision only
- No intermediate status tracking (pending, active, etc.)
- Completion status tracking added in Phase 3 when escrow settlement requires it

### Tracked/Untracked Mode
- **Toggle built in Phase 1 as foundation** for Phase 4
- Tracked mode: stores user identity in job records
- Untracked mode: omits user identity for privacy
- Contract has mode parameter on submission from day 1

### Budget Constraints
- Handled **off-chain** in UI/API layer, not stored on contract
- Agent filters/ranks based on user's max price preference
- Keeps contract lean, avoids gas for constraint storage

### Provider Data Storage
- **Mix: Live APIs + JSON fallback** — no production database needed
- Akash: live API fetcher (already exists in codebase)
- Lambda Labs, Render, AWS, others: JSON files in repo (`data/providers.json`)
- Agent queries both sources and normalizes into comparable format

### Agent Architecture
- **Centralized** — runs in Next.js API route (`src/app/api/route-job`)
- Fetches providers from APIs and JSON files
- Normalizes all pricing models into USD/compute-hr
- Uploads full reasoning JSON to 0G Storage (TypeScript SDK)
- Records decision hash on-chain via whitelisted wallet
- Agent wallet funded with ADI testnet tokens from faucet

### Testnet Tokens
- ADI testnet tokens from faucet — no concerns about availability
- 0G testnet tokens when needed for storage uploads
- Agent wallet is the only one that needs funding (users don't pay gas)

### Claude's Discretion
- Contract upgradability pattern (proxy vs immutable — balance complexity vs hackathon timeline)
- Gas optimization strategies for on-chain writes
- Error handling/recovery if 0G upload fails before on-chain recording
- Job submission form UI layout, fields, and validation
- Price comparison display design and information density
- Loading states, progress indication, and error feedback

</decisions>

<specifics>
## Specific Ideas

- Verifiable decisions from day 1 — even in Phase 1, every routing decision has an immutable on-chain hash pointing to full reasoning in 0G Storage
- "If we need to pivot later and do a quick Phase 1 hack with hardcoded inputs in the last few days, that's no problem" — architecture should be strippable if timeline pressure hits
- Contract should be built as strong foundation for Phase 3 escrow, not just a standalone Phase 1 feature

</specifics>

<deferred>
## Deferred Ideas

- **Escrow settlement** → Phase 3 (build escrow-ready contract structure; USDC locking and release on job completion)
- **Full 0G verification UI** → Phase 4 ("Verify Decision" button, reasoning trace inspection)
- **Emergency controls / pausable contract** → Evaluate in Phase 3 when real funds are at risk; not needed for Phase 1 data registry
- **On-chain provider registry** → Phase 3 (providers register hardware on-chain for agent discovery)
- **Team spending dashboard** → Phase 4 (tracked mode analytics)

</deferred>

---

*Phase: 01-foundation-core-agent*
*Context gathered: 2026-02-14*
