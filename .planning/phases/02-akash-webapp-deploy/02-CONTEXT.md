---
phase: 02-akash-webapp-deploy
title: Akash Integration - Marketplace Provider
status: active
milestone: v2.0
created: 2026-02-17
updated: 2026-02-17
gathered: 2026-02-17
---

# Phase 2 Context: Akash Integration

**Gathered:** 2026-02-17  
**Status:** Ready for planning (updated)

<domain>
## Phase Boundary

Add Akash Network as the first provider integration to the Necto marketplace. Buyers submit compute jobs and the agent routes suitable workloads to Akash providers for deployment and execution. Uses Console API for deployment management with **testnet USDC payments** (fake/test tokens, not real money).

Key integration: Users pay Necto in testnet USDC (on-chain escrow), Necto backend manages Akash Console API funding. Despite testnet tokens, deployments on Akash are real using the actual provider network.

</domain>

<decisions>
## Implementation Decisions

### Job Routing Logic
- **Agent auto-routes** suitable workloads to Akash based on job requirements
- **Multi-factor provider selection**: Agent chooses based on latency, uptime, bid price, and performance specs (informed by user's natural language query/form inputs)
- **Configurable suitability**: Job characteristics (GPU needs, duration, region) determine if Akash is appropriate
- **Auto-sign enabled**: For streamlined hackathon/demo flow, agent can deploy automatically when good match found

### Funding & Payment Flow
- **Testnet USDC on ADI Chain** (fake/test coin): Users pay Necto in testnet USDC via smart contract escrow on ADI Testnet (chain 99999) - NOT real money
- **Escrow mechanism**: Funds held on ADI Testnet, released to Necto when deployment created
- **ADI Chain**: Contracts deployed on ADI Testnet (same chain as ComputeRouter), NOT Ethereum testnet
- **Real Akash deployments**: Despite fake USDC on ADI, deployments on Akash are real (Console API uses real provider network)
- **Deposit timing**: Charge when deployment is confirmed (not at job submission)
- **Additional funds**: Prompt user at threshold when balance low, they decide to add funds or close deployment
- **Failed payments**: Deployment hold - pause until payment resolved
- **Cost transparency**: Detailed breakdown showing estimated hourly cost, total for duration, and deposit required

### Deployment Lifecycle
- **No bids scenario**: Cancel deployment, refund escrow, notify user to try different specs/region
- **Bid polling**: Periodic polling (every X seconds) via Console API
- **Bid timeout**: 5 minutes - if no bids in 5 min, cancel and notify
- **Lease closure**: Auto-close when:
  - Funds exhausted (escrow runs out)
  - User explicitly stops deployment
  - Job completes (for batch workloads)

### Monitoring & Status UI
- **Full status dashboard**: Show complete state timeline (Pending → Bidding → Active → Complete) with timestamps and provider details
- **Log access**: Real-time log stream in UI (like `kubectl logs -f`)
- **Deployment list**: Minimal list view showing name + status, click for full details
- **Notifications**: In-app toast notifications for state changes, bid received, errors, funds low

### Templates vs Custom SDL
- **Agent-driven approach**: Agent crafts custom SDL based on user's natural language description of workload needs
- **Template suggestions**: Agent suggests relevant templates as alternatives (ML Training, Web Service, Static Site)
- **Natural language UI**: User describes requirements in text, agent interprets and generates SDL
- **Full customization**: After SDL generation (template-based or custom), user can edit any field (resources, env vars, ports)
- **Usage mix**: 20% templates, 80% custom SDL - most users get agent-crafted configurations

### Claude's Discretion
- Exact polling interval for bid checks
- Notification timing and frequency
- Dashboard layout and visual design
- Error message wording
- Template card design
- Log stream UI implementation details

</decisions>

<specifics>
## Specific Ideas

- **Cost display**: Show estimated hourly cost prominently before deployment confirmation
- **Bid comparison**: If multiple bids received, show comparison table with provider specs and pricing
- **Auto-sign safety**: Cap auto-sign at reasonable cost threshold (e.g., $20 max without explicit confirmation)
- **Template suggestions**: Agent proactively suggests: "Based on your ML training job, I can deploy a GPU-enabled template or create a custom configuration"
- **Escrow transparency**: Show escrow balance in real-time, warn when < 1 hour of runtime remaining

</specifics>

<deferred>
## Deferred Ideas

- **Scheduled deployments** — deploy at specific time (future phase)
- **Multi-region failover** — auto-retry in different regions if no bids (could enhance current "cancel and notify")
- **Email notifications** — currently in-app only (future enhancement)
- **Template marketplace** — community-contributed templates (future)
- **WebSocket real-time** — currently using polling, WebSocket could be upgrade

</deferred>

---

## Architecture Notes

### Payment Flow (ADI Chain)
```
User → Testnet USDC → ADI Testnet Escrow (Chain 99999)
                          ↓
Necto Backend ← Monitors Escrow → Creates Deployment via Console API
                          ↓
                  Akash Provider executes workload (real deployment)
                          ↓
               Funds released to Necto on ADI Testnet
```

### SDL Template Strategy (Hybrid Approach)
**Tier 1 - Hardcoded Core Templates (6 templates):**
- ML Training (GPU, CUDA)
- Web Service (Node.js)
- Web Service (Python)
- Static Site (nginx)
- Database (PostgreSQL)
- Cache (Redis)

**Tier 2 - Remote Template Fetch:**
- Fetch from `https://github.com/akash-network/awesome-akash` (290+ templates)
- SDL supports `include: ["https://..."]` for remote includes
- Cache templates locally for performance

**Tier 3 - Template Browser:**
- Search/filter through fetched templates
- Preview before selection

### ADI Chain Configuration
**Network:** ADI Testnet (Chain ID 99999)
**RPC URL:** https://rpc.ab.testnet.adifoundation.ai/
**Faucet:** https://faucet.ab.testnet.adifoundation.ai/
**Currency:** ADI (for gas)

**Contracts to Deploy:**
1. **TestnetUSDC.sol** - ERC20 with 6 decimals, mintable for testing
2. **AkashEscrow.sol** - Escrow contract holding USDC, releases on deployment

**Deployment Tool:** Hardhat + Ignition (same as ComputeRouter)

### Key Integration Points
1. **Escrow Contract (ADI Testnet)**: Handles testnet USDC deposits, releases funds on deployment events
2. **Console API Client**: Authenticated with Necto's API key, manages deployment lifecycle
3. **Agent Router**: Evaluates jobs, generates SDL (with remote template support), selects providers
4. **Monitoring Service**: Polls Console API for status updates, updates UI in real-time

### Files in This Phase

- `02-01-PLAN.md` — Infrastructure: Console API client + SDL generator + Escrow integration
- `02-02-PLAN.md` — Agent Integration: Routing logic + Provider discovery UI
- `02-03-PLAN.md` — UI Components: Natural language form + Template suggestions
- `02-04-PLAN.md` — API Routes: Deployment lifecycle + Monitoring + E2E testing

---

## Technical Requirements

### Smart Contract (New for this phase)
- Escrow contract for USDC deposits
- Release funds on deployment creation
- Refund on deployment cancellation
- Balance tracking per user/deployment

### Console API Integration
- Provider discovery endpoint
- Deployment creation with SDL
- Bid polling mechanism
- Lease management
- Log retrieval

### Agent Enhancements
- Natural language to SDL conversion
- Multi-factor provider ranking
- Escrow integration for payments
- Auto-sign with cost thresholds

---

*Phase: 02-akash-webapp-deploy*  
*Context gathered: 2026-02-17*  
*Payment model: USDC on-chain escrow + Console API deployment*
