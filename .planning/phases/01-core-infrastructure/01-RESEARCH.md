# Phase 01: Core Infrastructure - Research

**Researched:** February 12, 2026
**Domain:** Decentralized compute marketplace - smart contracts, agent logic, storage, pricing
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Pricing Normalization
- **Token conversion:** Use real-time token prices via CoinGecko API for Filecoin, Akash, and other token-based providers
- **Hidden costs:** Include typical usage assumptions (bandwidth, storage, API calls) in the effective USD/GPU-hr rate
- **GPU normalization:** Normalize to A100-equivalent using performance ratios for fair comparison across GPU types
- **Output format:** Single effective rate displayed to users ($X.XX/GPU-hr)
- **Spot pricing:** Claude's discretion on methodology

#### Provider Ranking Factors
- **Factors included:** Geographic diversity, historical uptime/reputation, and latency to job
- **Filter:** Ignore provider capacity constraints for hackathon demo
- **Recommendations:** Suggest top 3 providers with tradeoffs highlighted, not just cheapest
- **Weighting:** Claude's discretion on price vs quality balance

#### Reasoning Trace Content (0G Storage)
- **Content:** Full decision tree — every provider checked, rejected reasons, and final ranking
- **Format:** Technical logs (JSON with scores, weights, calculations)
- **Scope:** Include top 5 providers considered (not just final ranking)
- **Metadata:** Basic (timestamp, job ID, provider count)

#### Tracked vs Untracked Identity
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Summary

This research covers the technical implementation of a decentralized compute marketplace agent that normalizes pricing across multiple GPU providers (Akash, Lambda Labs, Filecoin, io.net), ranks providers based on multiple factors, stores reasoning traces on 0G Storage, and implements tracked/untracked identity modes on ADI Testnet.

**Key findings:**
1. **0G Storage** provides mature TypeScript and Go SDKs with Merkle tree verification, upload/download with retry logic, and REST API gateway. Testnet (Galileo, Chain ID 16602) is fully functional with faucets available.
2. **0G Chain** is EVM-compatible (Cancun fork) with 11,000 TPS per shard and sub-second finality - ideal for hackathon deployment of escrow and registry contracts.
3. **CoinGecko API** offers free tier (30 calls/min, 10K/month) sufficient for real-time token price conversion during hackathon.
4. **Akash Network** provides TypeScript SDK (akashjs) for querying provider listings and pricing, though API was recently deprecated and moved to chain-sdk.
5. **Lambda Labs** has a well-documented Cloud API with clear instance pricing and GPU specifications (H100, A100, etc.).

**Primary recommendation:** Build agent in TypeScript/Node.js using 0G ts-sdk for storage, ethers.js for ADI Chain contracts, and CoinGecko free API for pricing. Use a weighted scoring algorithm (60% price, 40% quality factors) for provider ranking.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @0glabs/0g-ts-sdk | latest | 0G Storage integration | Official SDK with Merkle verification, browser + Node support |
| ethers | ^6.x | ADI Chain interaction | Standard for EVM chains, works with 0G |
| hardhat | ^2.x | Smart contract development | Required for 0G Chain (Cancun EVM) |
| @akashnetwork/akashjs | latest | Akash provider queries | Official SDK for Akash Network |
| axios | ^1.x | HTTP API calls | Standard for REST APIs (Lambda, CoinGecko) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node-cache | ^5.x | Price caching | Cache CoinGecko rates to avoid hitting limits |
| winston | ^3.x | Structured logging | For reasoning trace generation |
| zod | ^3.x | Schema validation | Validate API responses |
| dotenv | ^16.x | Environment config | Never hardcode keys |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @0glabs/0g-ts-sdk | Go SDK | Go better for performance, but TypeScript faster for hackathon |
| ethers | viem | Viem is newer, but ethers has more 0G examples |
| hardhat | foundry | Foundry faster, but Hardhat has better 0G docs |
| axios | fetch | Native fetch available in Node 18+, but axios has better error handling |

**Installation:**
```bash
npm install @0glabs/0g-ts-sdk ethers hardhat @akashnetwork/akashjs axios node-cache winston zod dotenv
npm install --save-dev @nomicfoundation/hardhat-toolbox typescript ts-node
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── contracts/           # Solidity smart contracts
│   ├── Escrow.sol      # Payment escrow
│   └── ProviderRegistry.sol  # Provider registration
├── agent/              # Core agent logic
│   ├── pricing/        # Price normalization
│   │   ├── coinGecko.ts    # Token price fetching
│   │   ├── normalizer.ts   # USD/GPU-hr calculation
│   │   └── gpuRatios.ts    # A100-equivalent ratios
│   ├── ranking/        # Provider ranking
│   │   ├── scorer.ts       # Weighted scoring
│   │   └── filters.ts      # Provider filtering
│   └── storage/        # 0G Storage integration
│       ├── uploader.ts     # Upload reasoning traces
│       └── retry.ts        # Upload retry logic
├── providers/          # Provider API integrations
│   ├── akash.ts
│   ├── lambda.ts
│   ├── filecoin.ts
│   └── ionet.ts
├── types/              # TypeScript interfaces
└── utils/              # Utilities
```

### Pattern 1: Provider Adapter Pattern
**What:** Abstract provider-specific APIs behind a common interface
**When to use:** All provider integrations (Akash, Lambda, Filecoin, io.net)
**Example:**
```typescript
// Source: Architecture pattern based on common marketplace designs
interface ComputeProvider {
  getAvailableInstances(filters: InstanceFilters): Promise<Instance[]>;
  getPricing(instanceType: string): Promise<PriceQuote>;
  getProviderInfo(providerId: string): Promise<ProviderMetadata>;
}

class AkashProvider implements ComputeProvider {
  async getAvailableInstances(filters: InstanceFilters): Promise<Instance[]> {
    // Use akashjs to query chain
    const response = await queryClient.providers(filters);
    return this.normalizeToCommonFormat(response);
  }
  
  private normalizeToCommonFormat(akashResponse: any): Instance[] {
    // Convert to common Instance interface
  }
}
```

### Pattern 2: Escrow Contract Pattern
**What:** Hold funds until job completion with timeout/refund mechanism
**When to use:** Payment handling in smart contracts
**Example:**
```solidity
// Source: Standard escrow pattern adapted for 0G Chain
contract ComputeEscrow {
    struct Escrow {
        address buyer;
        address provider;
        uint256 amount;
        uint256 createdAt;
        EscrowStatus status;
        bool tracked;  // Tracked vs Untracked mode
    }
    
    mapping(bytes32 => Escrow) public escrows;
    
    function createEscrow(
        bytes32 jobId,
        address provider,
        bool tracked
    ) external payable {
        escrows[jobId] = Escrow({
            buyer: msg.sender,
            provider: provider,
            amount: msg.value,
            createdAt: block.timestamp,
            status: EscrowStatus.PENDING,
            tracked: tracked
        });
    }
    
    function releaseEscrow(bytes32 jobId) external {
        Escrow storage e = escrows[jobId];
        require(msg.sender == e.buyer || block.timestamp > e.createdAt + 7 days);
        e.status = EscrowStatus.COMPLETED;
        payable(e.provider).transfer(e.amount);
    }
}
```

### Pattern 3: 0G Storage Upload with Retry
**What:** Upload reasoning traces to 0G with exponential backoff retry
**When to use:** All reasoning trace uploads
**Example:**
```typescript
// Source: 0G Storage SDK docs + retry best practices
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';

async function uploadWithRetry(
  filePath: string,
  maxRetries: number = 3
): Promise<{ rootHash: string; txHash: string }> {
  const indexer = new Indexer(process.env.OG_INDEXER_RPC);
  const file = await ZgFile.fromFilePath(filePath);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr) throw treeErr;
      
      const [tx, uploadErr] = await indexer.upload(
        file,
        process.env.OG_RPC,
        signer
      );
      
      if (uploadErr) throw uploadErr;
      
      return {
        rootHash: tree.rootHash(),
        txHash: tx
      };
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
  
  throw new Error('Upload failed after max retries');
}
```

### Pattern 4: Price Normalization Pipeline
**What:** Convert diverse pricing models to standardized USD/GPU-hr
**When to use:** Before provider ranking
**Example:**
```typescript
// Source: Based on user requirements
interface NormalizedPrice {
  usdPerGpuHour: number;
  gpuType: string;
  a100Equivalent: number;
  hiddenCosts: {
    bandwidth: number;
    storage: number;
    apiCalls: number;
  };
  source: 'fixed' | 'spot' | 'token';
}

async function normalizePrice(
  rawPrice: ProviderPrice,
  gpuBenchmarks: GpuBenchmarks
): Promise<NormalizedPrice> {
  // 1. Convert token prices to USD using CoinGecko
  const usdPrice = rawPrice.token 
    ? await convertTokenToUsd(rawPrice.amount, rawPrice.token)
    : rawPrice.amount;
  
  // 2. Normalize GPU to A100-equivalent
  const a100Ratio = gpuBenchmarks[rawPrice.gpuType].a100Score;
  
  // 3. Add hidden costs (bandwidth, storage, API)
  const hiddenCosts = calculateHiddenCosts(rawPrice.region);
  
  // 4. Calculate effective USD/GPU-hr
  const effectivePrice = (usdPrice + hiddenCosts.total) / a100Ratio;
  
  return {
    usdPerGpuHour: effectivePrice,
    gpuType: rawPrice.gpuType,
    a100Equivalent: a100Ratio,
    hiddenCosts,
    source: rawPrice.pricingModel
  };
}
```

### Anti-Patterns to Avoid
- **Don't query CoinGecko on every price normalization** - Cache prices for 5-10 minutes to avoid rate limits
- **Don't upload reasoning traces synchronously** - Use async queue to avoid blocking agent responses
- **Don't store private keys in code** - Use environment variables or KMS
- **Don't ignore 0G upload failures** - Always implement retry with exponential backoff
- **Don't hardcode provider endpoints** - Make configurable for testnet/mainnet switching

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token price conversion | Custom price aggregator | CoinGecko API | Aggregates 1,000+ exchanges, free tier sufficient |
| Merkle tree verification | Custom crypto | 0G SDK core module | Already optimized, tested, handles edge cases |
| EVM contract interaction | Custom RPC wrapper | ethers.js | Handles nonce management, gas estimation, error parsing |
| Provider API caching | In-memory only | node-cache with Redis | Persistence across restarts, TTL support |
| Structured logging | console.log | winston | JSON format, log levels, rotation |
| Retry logic | Simple for loops | p-retry or custom exponential backoff | Jitter, circuit breaker, error classification |

**Key insight:** The 0G Storage SDK handles complex distributed storage operations (Merkle trees, proof verification, node selection) that would take weeks to build correctly. Similarly, CoinGecko has already solved the complex problem of aggregating prices across hundreds of exchanges with volume weighting.

## Common Pitfalls

### Pitfall 1: CoinGecko Rate Limiting
**What goes wrong:** Exceed 30 calls/min on free tier, get temporarily blocked
**Why it happens:** Fetching prices for multiple tokens in loops without caching
**How to avoid:** 
- Cache prices for 5-10 minutes
- Use `/simple/price` endpoint for multiple tokens at once
- Implement fallback to cached/stale prices
**Warning signs:** 429 HTTP responses, increasing response times

### Pitfall 2: 0G Storage Upload Timeouts
**What goes wrong:** Large reasoning trace files (>10MB) timeout during upload
**Why it happens:** Default RPC timeout too short for large files
**How to avoid:**
- Split large traces into chunks
- Use `fastMode: true` option in SDK
- Implement progress tracking for uploads
**Warning signs:** Timeout errors, partial uploads in storage explorer

### Pitfall 3: ADI Chain Gas Estimation
**What goes wrong:** Transactions fail with "out of gas" on 0G Chain
**Why it happens:** Different gas costs than Ethereum mainnet
**How to avoid:**
- Add 20% buffer to gas estimates
- Use `estimateGas` before sending
- Monitor testnet for gas price changes
**Warning signs:** Transaction reverts with gas-related errors

### Pitfall 4: Provider API Changes
**What goes wrong:** Akash or Lambda APIs change during hackathon
**Why it happens:** Rapid development in decentralized compute space
**How to avoid:**
- Pin SDK versions in package.json
- Abstract provider APIs behind interface
- Implement graceful degradation (skip provider if API fails)
**Warning signs:** Sudden 404 errors, missing fields in responses

### Pitfall 5: Incorrect GPU Normalization
**What goes wrong:** A100-equivalent ratios incorrect, price comparisons misleading
**Why it happens:** Using theoretical vs. real-world benchmark data
**How to avoid:**
- Use MLPerf or similar standardized benchmarks
- Document assumptions in reasoning traces
- Allow manual override for known GPU types
**Warning signs:** Inconsistent rankings, obviously wrong cheapest option

## Code Examples

### CoinGecko Price Fetching
```typescript
// Source: CoinGecko API docs (https://docs.coingecko.com)
import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface TokenPrices {
  [tokenId: string]: {
    usd: number;
    lastUpdated: Date;
  };
}

async function fetchTokenPrices(tokenIds: string[]): Promise<TokenPrices> {
  const ids = tokenIds.join(',');
  const response = await axios.get(
    `${COINGECKO_API}/simple/price`,
    {
      params: {
        ids,
        vs_currencies: 'usd',
        include_last_updated_at: true
      },
      timeout: 10000
    }
  );
  
  return Object.entries(response.data).reduce((acc, [id, data]: [string, any]) => {
    acc[id] = {
      usd: data.usd,
      lastUpdated: new Date(data.last_updated_at * 1000)
    };
    return acc;
  }, {} as TokenPrices);
}

// Usage
const prices = await fetchTokenPrices(['filecoin', 'akash-network']);
// prices['filecoin'].usd = $3.45
```

### 0G Storage Configuration
```typescript
// Source: 0G Storage SDK docs (https://docs.0g.ai)
import { Indexer, ZgFile, getFlowContract } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

// Testnet configuration
const OG_TESTNET = {
  chainId: 16602,
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai',
  flowContract: '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296'
};

async function initialize0GStorage(privateKey: string) {
  const provider = new ethers.JsonRpcProvider(OG_TESTNET.rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const indexer = new Indexer(OG_TESTNET.indexerUrl);
  const flowContract = getFlowContract(OG_TESTNET.flowContract, signer);
  
  return { indexer, signer, flowContract };
}
```

### Akash Provider Query
```typescript
// Source: Akash Network SDK patterns
import { getAkashClient } from '@akashnetwork/akashjs';

async function queryAkashProviders() {
  const client = await getAkashClient('https://rpc.akashnet.net:443');
  
  // Query active providers
  const providers = await client.query.providers.providers({
    pagination: {
      limit: BigInt(100),
      offset: BigInt(0)
    }
  });
  
  return providers.providers.map(p => ({
    owner: p.owner,
    hostUri: p.hostUri,
    attributes: p.attributes
  }));
}
```

### Hardhat Configuration for 0G Chain
```javascript
// Source: 0G Chain deployment docs (https://docs.0g.ai)
// hardhat.config.js
require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      evmVersion: 'cancun',  // Required for 0G Chain
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    '0g-testnet': {
      url: 'https://evmrpc-testnet.0g.ai',
      chainId: 16602,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      '0g-testnet': 'placeholder'
    },
    customChains: [{
      network: '0g-testnet',
      chainId: 16602,
      urls: {
        apiURL: 'https://chainscan-galileo.0g.ai/open/api',
        browserURL: 'https://chainscan-galileo.0g.ai'
      }
    }]
  }
};
```

### Reasoning Trace Generation
```typescript
// Source: Based on user requirements for trace content
interface ReasoningTrace {
  timestamp: string;
  jobId: string;
  providerCount: number;
  query: {
    gpuType: string;
    region: string;
    duration: number;
  };
  candidates: ProviderEvaluation[];
  rejected: ProviderEvaluation[];
  finalRanking: ProviderScore[];
  weights: {
    price: number;
    latency: number;
    reputation: number;
    geography: number;
  };
}

interface ProviderEvaluation {
  providerId: string;
  providerName: string;
  rawPrice: number;
  normalizedPrice: number;
  scores: {
    price: number;
    latency: number;
    reputation: number;
    geography: number;
  };
  rejectionReason?: string;
}

function generateReasoningTrace(
  jobId: string,
  query: any,
  evaluations: ProviderEvaluation[],
  weights: any
): ReasoningTrace {
  const [candidates, rejected] = evaluations.reduce(
    ([c, r], e) => e.rejectionReason ? [c, [...r, e]] : [[...c, e], r],
    [[], []] as [ProviderEvaluation[], ProviderEvaluation[]]
  );
  
  // Sort by total score
  const finalRanking = candidates
    .map(c => ({
      providerId: c.providerId,
      providerName: c.providerName,
      totalScore: Object.entries(c.scores).reduce(
        (sum, [key, score]) => sum + score * weights[key],
        0
      ),
      normalizedPrice: c.normalizedPrice
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);
  
  return {
    timestamp: new Date().toISOString(),
    jobId,
    providerCount: evaluations.length,
    query,
    candidates: candidates.slice(0, 5),
    rejected: rejected.slice(0, 5),
    finalRanking,
    weights
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom storage backends | 0G decentralized storage | 2025 | Permanent, verifiable, censorship-resistant reasoning logs |
| Manual price comparison | Automated normalization | Current | Real-time best provider selection |
| Single provider | Multi-provider aggregation | Current | Redundancy, price optimization |
| On-chain everything | Off-chain agent + on-chain escrow | Current | Lower gas costs, faster responses |

**Deprecated/outdated:**
- Akash akash-api repo: Deprecated Jan 2026, use chain-sdk instead
- Filecoin Lotus direct API: Use FVM/Solidity contracts instead
- io.net v1 API: v2 released with breaking changes (verify current docs)

## Open Questions

1. **ADI Chain specifics**
   - What we know: ADI Chain is mentioned but appears to be 0G Chain testnet or custom fork
   - What's unclear: Exact RPC endpoints, chain ID, faucet location
   - Recommendation: Confirm with user if ADI Chain = 0G Galileo testnet or separate chain

2. **io.net API availability**
   - What we know: io.net provides GPU compute marketplace
   - What's unclear: Public API documentation, rate limits, pricing model
   - Recommendation: Contact io.net team or check for partner API access

3. **Filecoin provider pricing**
   - What we know: Filecoin has storage providers, compute via FVM
   - What's unclear: Standardized compute pricing API vs. custom contracts
   - Recommendation: May need to mock Filecoin providers for hackathon or use FVM queries

4. **GPU benchmark source**
   - What we know: Need A100-equivalent ratios
   - What's unclear: Which benchmark suite to use (MLPerf, CUDA, etc.)
   - Recommendation: Start with conservative estimates, document assumptions

## Sources

### Primary (HIGH confidence)
- 0G Storage SDK docs: https://docs.0g.ai/build-with-0g/storage-sdk
  - TypeScript SDK usage patterns
  - Testnet configuration (Chain ID 16602)
  - Upload/download with retry
  - Merkle tree verification
- 0G Chain deployment docs: https://docs.0g.ai/deploy-smart-contracts
  - Hardhat/Foundry configuration
  - EVM version: Cancun
  - Contract verification process
- CoinGecko API docs: https://docs.coingecko.com
  - Free tier limits (30 calls/min)
  - `/simple/price` endpoint for multiple tokens
  - Response format
- Lambda Labs docs: https://docs.lambdalabs.com
  - Instance types and pricing
  - Cloud API availability
  - GPU specifications

### Secondary (MEDIUM confidence)
- Akash Network docs: https://docs.akash.network
  - SDK availability noted but akash-api deprecated
  - Need to verify chain-sdk usage
- Filecoin FVM docs: https://docs.filecoin.io/smart-contracts
  - FEVM compatibility confirmed
  - Solidity library available
- 0G GitHub repos: https://github.com/0gfoundation
  - 0g-ts-sdk source code
  - 0g-storage-client Go implementation
  - Deployment script examples

### Tertiary (LOW confidence)
- io.net API: Could not locate public documentation
- ADI Chain specifics: Term not found in standard documentation, assumed to be 0G testnet or project-specific
- Filecoin compute pricing: FVM compute market still emerging, APIs may be custom per provider

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official docs
- Architecture: MEDIUM-HIGH - Patterns standard but specific to this use case
- Pitfalls: MEDIUM - Based on common Web3 issues + 0G-specific findings

**Research date:** February 12, 2026
**Valid until:** March 12, 2026 (30 days for stable libraries, but 0G is actively developing)

**Known limitations:**
- ADI Chain needs verification (may differ from 0G Chain)
- io.net API access unclear
- GPU benchmark ratios need real-world validation
- Spot pricing methodology needs user confirmation
