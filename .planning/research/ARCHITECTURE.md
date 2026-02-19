# Architecture Research: DePIN Compute Marketplace

**Domain:** DePIN Compute Marketplace with Agent-Based Architecture  
**Researched:** February 2026  
**Confidence:** MEDIUM-HIGH

## Standard Architecture for DePIN Compute Marketplaces

### System Overview

DePIN (Decentralized Physical Infrastructure Networks) compute marketplaces follow a modular layered architecture that separates concerns between user interaction, intelligent orchestration, provider integration, and settlement.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    UI/App    │  │  Workflow    │  │   Wallet     │  │   Status     │    │
│  │   (Next.js)  │  │   Canvas     │  │  Connection  │  │  Dashboard   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │             │
├─────────┴─────────────────┴─────────────────┴─────────────────┴─────────────┤
│                           AGENT/ORCHESTRATION LAYER                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ADK Agent + Tool Registry                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │compare_pr... │  │route_to_...  │  │wallet_tool   │  ...         │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Agent Reasoning Engine                            │    │
│  │   (Intent parsing → Tool selection → Execution → Response)           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INTEGRATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Provider   │  │   Provider   │  │   Provider   │  │   Provider   │    │
│  │   Fetcher    │  │   Fetcher    │  │   Fetcher    │  │   Fetcher    │    │
│  │  (Akash)     │  │  (RunPod)    │  │  (Lambda)    │  │  (io.net)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │Price Normalize│  │   Provider   │  │   Token      │                      │
│  │   Service    │  │  Onboarding  │  │   Oracles    │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                           STORAGE & LOGGING LAYER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    0G Storage Client                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │  File Store  │  │    KV Store  │  │  Merkle Proofs│             │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                           BLOCKCHAIN LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ComputeRouter Contract                            │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │    Escrow    │  │  Settlement  │  │   Routing    │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Agent Layer** | Natural language intent parsing, tool orchestration, reasoning | Google ADK with custom tools |
| **Provider Fetchers** | Pull compute offers from DePIN networks, normalize to common schema | Provider-specific API clients |
| **Price Normalizer** | Convert heterogeneous pricing to comparable USD values | CoinGecko + normalization engine |
| **Provider Onboarding** | KYC, hardware verification, stake management | Web forms + smart contract staking |
| **0G Storage Client** | Immutable audit logs, reasoning persistence | @0glabs/0g-ts-sdk |
| **ComputeRouter** | Escrow management, settlement, dispute resolution | Solidity smart contract |

## Recommended Project Structure

```
offchain/src/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   └── route.ts              # ADK agent endpoint
│   │   ├── deployments/
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── bids/
│   │   │       │   └── route.ts
│   │   │       └── logs/
│   │   │           └── route.ts
│   │   ├── providers/
│   │   │   └── route.ts
│   │   └── escrow/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── workflow/                     # Workflow canvas components
│   └── providers/                    # Provider discovery UI
├── lib/
│   ├── agent/
│   │   ├── agent.ts                  # ADK agent setup
│   │   ├── tools/
│   │   │   ├── compare-providers-tool.ts
│   │   │   ├── route-to-akash-tool.ts
│   │   │   ├── route-to-ionet-tool.ts
│   │   │   ├── wallet-tool.ts
│   │   │   └── upload-reasoning-tool.ts  # 0G integration
│   │   └── types.ts
│   ├── providers/
│   │   ├── akash-fetcher.ts
│   │   ├── runpod-fetcher.ts
│   │   ├── lambda-fetcher.ts
│   │   ├── ionet-fetcher.ts         # New provider
│   │   └── price-normalizer.ts      # Token pricing service
│   ├── storage/
│   │   └── zero-g-client.ts         # 0G Storage client wrapper
│   ├── onboarding/
│   │   └── provider-service.ts      # Supply-side management
│   ├── contracts/
│   │   └── compute-router.ts        # Contract interactions
│   └── workflow-store.ts            # Zustand state management
├── hooks/
│   ├── use-akash-deployment.ts
│   ├── use-provider-discovery.ts
│   └── use-wallet.ts
└── types/
    ├── akash.ts
    └── providers.ts

hardhat/
├── contracts/
│   ├── ComputeRouter.sol            # Main marketplace contract
│   ├── Escrow.sol                   # Payment escrow
│   └── interfaces/
│       ├── IProviderRegistry.sol
│       └── ISettlement.sol
├── ignition/modules/
└── test/
```

## Architectural Patterns

### Pattern 1: Agent-Based Tool Routing

**What:** LLM agents parse natural language, select appropriate tools, and orchestrate multi-step workflows.

**When to use:** When user intents are complex, multi-step, or require intelligent decision-making between options.

**Trade-offs:** 
- (+) Natural UX, flexible workflows
- (-) Non-deterministic, requires careful tool design

**Example:**
```typescript
// Agent evaluates provider options and routes accordingly
const result = await agent.invoke({
  input: "I need 4x A100 GPUs for training",
  tools: [compareProvidersTool, routeToAkashTool, routeToIoNetTool]
});
// Agent compares prices, availability, user preferences → selects best provider
```

### Pattern 2: Provider Adapter Pattern

**What:** Each DePIN provider implements a common interface, allowing the system to treat heterogeneous providers uniformly.

**When to use:** When integrating multiple external services with different APIs.

**Trade-offs:**
- (+) Consistent API across all providers
- (-) May lose provider-specific features

**Example:**
```typescript
interface ProviderFetcher {
  fetchOffers(filters: ComputeFilters): Promise<ProviderOffer[]>;
  getCapabilities(): ProviderCapabilities;
}

class AkashFetcher implements ProviderFetcher {
  async fetchOffers(filters): Promise<ProviderOffer[]> {
    // Transform Akash-specific response to common schema
  }
}

class IoNetFetcher implements ProviderFetcher {
  async fetchOffers(filters): Promise<ProviderOffer[]> {
    // Transform io.net-specific response to common schema
  }
}
```

### Pattern 3: Immutable Audit Logging

**What:** Store all agent reasoning, decisions, and execution logs to 0G Storage for transparency and verifiability.

**When to use:** When trustless verification of AI agent decisions is required.

**Trade-offs:**
- (+) Tamper-proof audit trail, verifiable AI
- (-) Adds latency, storage costs

**Example:**
```typescript
async function executeWithLogging(agentInput: string, tools: Tool[]) {
  const startTime = Date.now();
  const result = await agent.invoke({ input: agentInput, tools });
  
  // Upload reasoning to 0G
  const logEntry = {
    timestamp: startTime,
    input: agentInput,
    toolsUsed: result.toolsUsed,
    decision: result.decision,
    output: result.output
  };
  
  const rootHash = await zeroGClient.upload(
    Buffer.from(JSON.stringify(logEntry))
  );
  
  return { result, auditHash: rootHash };
}
```

### Pattern 4: Token Price Normalization

**What:** Convert all provider pricing to a common denomination (USD) using real-time oracle data.

**When to use:** When comparing prices across providers using different tokens (AKT, RENDER, USDC, etc.).

**Trade-offs:**
- (+) True price comparison, user clarity
- (-) Oracle dependency, stale price risk

**Example:**
```typescript
class PriceNormalizer {
  async normalizePrice(
    amount: number,
    token: string,
    provider: string
  ): Promise<NormalizedPrice> {
    const usdPrice = await this.coinGecko.getPrice(token, 'usd');
    return {
      originalAmount: amount,
      originalToken: token,
      usdEquivalent: amount * usdPrice,
      provider,
      timestamp: Date.now()
    };
  }
}
```

### Pattern 5: Escrow-Based Settlement

**What:** Use smart contracts to hold funds in escrow until compute job completion, then release to provider.

**When to use:** When coordinating payment between untrusted parties.

**Trade-offs:**
- (+) Trustless execution, dispute resolution
- (-) Gas costs, complexity

**Example:**
```solidity
// ComputeRouter.sol
function createEscrow(
    bytes32 jobId,
    address provider,
    uint256 amount,
    uint256 duration
) external {
    require(token.transferFrom(msg.sender, address(this), amount));
    escrows[jobId] = Escrow({
        client: msg.sender,
        provider: provider,
        amount: amount,
        deadline: block.timestamp + duration,
        status: EscrowStatus.ACTIVE
    });
}

function releaseEscrow(bytes32 jobId) external {
    Escrow storage escrow = escrows[jobId];
    require(msg.sender == escrow.client || block.timestamp > escrow.deadline);
    escrow.status = EscrowStatus.RELEASED;
    token.transfer(escrow.provider, escrow.amount);
}
```

## Data Flow

### Request Flow: User Intent to Compute Deployment

```
User Input ("I need 4x A100s for 3 days")
    ↓
ADK Agent (intent parsing)
    ↓
compare_providers Tool
    ├─→ Fetch Akash offers → Normalize prices
    ├─→ Fetch io.net offers → Normalize prices
    ├─→ Fetch RunPod offers → Normalize prices
    └─→ Compare & rank by price/availability
    ↓
Agent Decision (route to optimal provider)
    ↓
route_to_[provider] Tool
    ├─→ Prepare deployment spec (SDL/manifest)
    ├─→ Submit to provider API
    └─→ Get deployment ID
    ↓
Create Escrow (ComputeRouter contract)
    ├─→ Lock payment in smart contract
    └─→ Emit JobCreated event
    ↓
Upload Audit Log to 0G Storage
    ├─→ Serialize decision chain
    ├─→ Upload via 0G indexer
    └─→ Store rootHash for verification
    ↓
Return to User (deployment ID, status, audit proof)
```

### Settlement Flow: Job Completion to Payment

```
Provider reports job completion
    ↓
Settlement Oracle verifies completion
    ├─→ Check deployment status via provider API
    ├─→ Verify compute hours used
    └─→ Generate completion proof
    ↓
ComputeRouter.releaseEscrow(jobId, proof)
    ├─→ Validate proof
    ├─→ Transfer funds to provider
    └─→ Emit PaymentReleased event
    ↓
Upload settlement receipt to 0G
    ↓
Update UI status
```

### Key Data Flows

1. **Provider Discovery Flow:** Client requests compute → Agent queries all fetchers → Normalizer converts pricing → Agent ranks and presents options

2. **Deployment Flow:** User selects provider → Agent prepares spec → Submits to provider → Creates escrow → Logs to 0G

3. **Settlement Flow:** Job completes → Oracle verifies → Escrow released → Receipt logged → Provider paid

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Current** (1-10 deployments/day) | Monolithic OK, in-memory caching, direct API calls |
| **Growth** (100-1K deployments/day) | Add Redis caching for provider data, rate limiting, queue for 0G uploads |
| **Scale** (10K+ deployments/day) | Split agent service from API, add worker queues, consider sharding 0G streams |

### Scaling Priorities

1. **First bottleneck:** Provider API rate limits → implement caching layer with TTL based on provider data freshness requirements

2. **Second bottleneck:** 0G Storage upload latency → batch audit logs, use async upload queue

3. **Third bottleneck:** Agent inference costs → add simple intent classification layer before ADK

## Anti-Patterns

### Anti-Pattern 1: Synchronous Provider Aggregation

**What people do:** Fetch all providers sequentially in the request path.

**Why it's wrong:** Latency adds up linearly (500ms × 4 providers = 2s delay).

**Do this instead:** Parallel fetch with Promise.all, add caching layer, return cached results immediately while refreshing in background.

### Anti-Pattern 2: Storing Sensitive Data On-Chain

**What people do:** Put API keys, user PII, or provider credentials in smart contract storage.

**Why it's wrong:** Blockchain is public and immutable — credentials can never be rotated.

**Do this instead:** Store sensitive data in encrypted off-chain storage (0G with encryption), only store hashes/commitments on-chain.

### Anti-Pattern 3: Single Oracle Price Source

**What people do:** Use one price feed for all token conversions.

**Why it's wrong:** Oracle failure or manipulation affects all pricing decisions.

**Do this instead:** Use multiple oracle sources (CoinGecko + Chainlink + Uniswap TWAP), take median or require 2/3 agreement.

### Anti-Pattern 4: Tight Coupling Between Agent and Providers

**What people do:** Hard-code provider logic directly in agent tools.

**Why it's wrong:** Adding a new provider requires modifying agent code, testing everything.

**Do this instead:** Provider adapter pattern — each provider implements common interface, agent works with abstractions.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Akash Network** | REST API + Console API | SDL-based deployments, bid system |
| **io.net** | REST API | Ray.io cluster deployments, GPU-focused |
| **RunPod** | GraphQL API | Serverless GPU, pod-based |
| **Lambda Labs** | REST API | Bare metal GPU instances |
| **CoinGecko** | REST API | Token price feeds, rate limit 10-30 calls/min (free) |
| **0G Storage** | TypeScript SDK | File/KV storage, merkle proofs, encrypted uploads |
| **Google ADK** | Node.js SDK | Agent runtime, tool registry |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **UI ↔ Agent API** | HTTP/REST | JSON requests, SSE for streaming responses |
| **Agent ↔ Provider Fetchers** | In-process calls | Adapter pattern, common interface |
| **Agent ↔ 0G Client** | HTTP via SDK | Async uploads, retry logic |
| **Agent ↔ Blockchain** | wagmi/viem | Contract reads/writes, event listening |
| **Provider Fetchers ↔ External APIs** | HTTP | Rate limiting, caching, circuit breakers |

## Build Order Implications

### Recommended Sequence

1. **Provider Aggregation Layer** (foundation)
   - Build adapter interface
   - Implement 2-3 fetchers (Akash, io.net, RunPod)
   - Add price normalizer with CoinGecko
   - Dependencies: None

2. **Extended Agent Tools** (extends existing)
   - Add new provider routing tools
   - Enhance compare_providers with multi-provider logic
   - Dependencies: Provider aggregation layer

3. **0G Storage Integration** (audit layer)
   - Build 0G client wrapper
   - Add upload_reasoning tool
   - Integrate into agent execution flow
   - Dependencies: Agent layer stable

4. **Provider Onboarding Service** (supply side)
   - Build registration forms
   - Implement staking contract integration
   - Add verification workflows
   - Dependencies: Smart contracts deployed

5. **Extended ComputeRouter** (settlement layer)
   - Add escrow functionality
   - Implement settlement logic
   - Add dispute resolution
   - Dependencies: Provider onboarding, 0G for audit logs

### Dependency Graph

```
Provider Aggregation
       ↓
   Agent Tools
   ↙       ↘
0G Storage   Provider Onboarding
       ↘       ↙
    ComputeRouter
       ↓
   Settlement
```

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| 0G Storage Integration | HIGH | Well-documented SDK, clear patterns |
| Provider Aggregation | MEDIUM-HIGH | Standard adapter pattern, API docs available |
| Price Normalization | MEDIUM | Oracle reliability is main risk |
| Escrow/Settlement | MEDIUM | Pattern is standard, but contract security critical |
| Agent Tool Design | MEDIUM | ADK is newer, may need iteration |

## Sources

- 0G Storage SDK: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
- 0G Storage Client GitHub: https://github.com/0gfoundation/0g-storage-client
- 0G DePIN Concepts: https://docs.0g.ai/concepts/depin
- 0G Chain Architecture: https://docs.0g.ai/concepts/chain
- Akash Network Docs: https://docs.akash.network
- Google ADK: https://github.com/google/adk (archived, use gemini-adk or equivalent)

---
*Architecture research for: Necto DePIN Compute Marketplace*  
*Researched: February 2026*
