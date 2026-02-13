# Synapse Agent

Intelligent compute routing agent that finds the best GPU providers across decentralized and traditional clouds.

## Overview

The Synapse Agent is the core routing engine that:

1. **Filters providers** by constraints (price, region, GPU type)
2. **Fetches quotes** from 8+ providers in parallel
3. **Normalizes prices** to A100-equivalent USD/GPU-hr
4. **Scores and ranks** providers using weighted factors
5. **Uploads reasoning** to 0G Storage for transparency
6. **Returns top 3 recommendations** with tradeoff analysis

## Architecture

```
Job Request → Identity → Filter Providers → Get Quotes → 
Normalize Prices → Score & Rank → Upload Trace → Recommendations
```

### Pipeline Steps

| Step | Module | Description |
|------|--------|-------------|
| 1 | `identity` | Create Tracked or Untracked identity |
| 2 | `filter` | Apply constraints (price, region, GPU) |
| 3 | `ranker` | Fetch quotes with 5s timeout |
| 4 | `pricing` | Normalize to A100-equivalent USD |
| 5 | `scorer` | Score by price (60%), latency (15%), reputation (15%), geography (10%) |
| 6 | `reasoning` | Generate decision trace |
| 7 | `storage` | Upload to 0G Storage |
| 8 | `orchestrator` | Assemble final result |

## Quick Start

### Submit a Job

```typescript
import { submitJob, IdentityMode } from '@/lib/agent';

const result = await submitJob({
  id: 'job-123',
  buyerAddress: '0x...',
  gpuCount: 2,
  durationHours: 24,
  constraints: {
    identityMode: IdentityMode.TRACKED,
    requiredGpuType: GpuType.A100_80GB,
    maxPricePerHour: 5.0,
    preferredRegions: ['us-east', 'us-west'],
  },
  createdAt: new Date(),
});

console.log('Selected:', result.selectedProviderName);
console.log('Cost: $', result.totalCost);
console.log('Reasoning:', result.reasoningHash); // 0G Storage hash
```

### Get Recommendations (Preview)

```typescript
import { getRecommendations, IdentityMode } from '@/lib/agent';

const recommendations = await getRecommendations(
  {
    identityMode: IdentityMode.UNTRACKED,
    requiredGpuType: GpuType.H100,
    maxPricePerHour: 8.0,
  },
  4,  // gpuCount
  12  // durationHours
);

recommendations.forEach(rec => {
  console.log(`#${rec.rank}: ${rec.provider.name}`);
  console.log(`  Price: $${rec.normalizedPrice.effectiveUsdPerA100Hour.toFixed(2)}/GPU-hr`);
  console.log(`  Score: ${rec.totalScore}/100`);
  rec.tradeoffs.forEach(t => console.log(`  - ${t}`));
});
```

## Identity Modes

### Tracked Mode

For teams requiring audit trails and compliance:

```typescript
constraints: {
  identityMode: IdentityMode.TRACKED,
  teamMemberId: 'user-123',
}
```

- Full wallet address recorded
- Team member attribution
- Organization spending tracking
- Complete audit trail

### Untracked Mode

For privacy-preserving compute:

```typescript
constraints: {
  identityMode: IdentityMode.UNTRACKED,
}
```

- Wallet address hashed (keccak256)
- Anonymous audit ID
- No PII in reasoning trace
- GDPR/privacy compliant

## HTTP API

### POST /api/agent

Submit a job request:

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "buyerAddress": "0x1234567890123456789012345678901234567890",
    "gpuCount": 2,
    "durationHours": 24,
    "constraints": {
      "identityMode": "TRACKED",
      "requiredGpuType": "A100_80GB",
      "maxPricePerHour": 5.0
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "jobId": "job-1678886400000-abc123",
  "recommendations": [
    {
      "rank": 1,
      "provider": {
        "id": "lambda-us-east-1",
        "name": "Lambda Labs",
        "type": "lambda",
        "pricingModel": "FIXED"
      },
      "normalizedPrice": {
        "effectiveUsdPerA100Hour": 2.49,
        "usdPerGpuHour": 2.49,
        "a100Equivalent": 1.0
      },
      "totalScore": 87.5,
      "tradeoffs": [
        "Best price — most cost-effective option",
        "Good latency — suitable for most workloads",
        "Highest reputation — 99.9% uptime"
      ],
      "estimatedSavings": "35.0%"
    }
  ],
  "totalCost": 119.52,
  "reasoningHash": "0xabcd...",
  "status": "CONFIRMED"
}
```

### GET /api/agent

Health check:

```bash
curl http://localhost:3000/api/agent
```

**Response:**

```json
{
  "status": "ok",
  "agent": {
    "version": "1.0.0",
    "initialized": true
  },
  "providers": {
    "count": 8,
    "stats": {
      "byType": {
        "akash": 1,
        "lambda": 1,
        "filecoin": 1,
        "ionet": 1,
        "synapse": 4
      },
      "byPricingModel": {
        "FIXED": 3,
        "SPOT": 2,
        "TOKEN": 3
      },
      "avgReputation": 82.5
    }
  }
}
```

## Scoring Weights

Default weights for provider ranking:

| Factor | Weight | Description |
|--------|--------|-------------|
| Price | 60% | Normalized USD per A100-equivalent hour |
| Latency | 15% | Network latency to preferred regions |
| Reputation | 15% | Historical uptime and performance |
| Geography | 10% | Match to preferred regions |

Customize weights:

```typescript
import { orchestrator } from '@/lib/agent';

orchestrator.setConfig({
  weights: {
    price: 0.50,
    latency: 0.25,
    reputation: 0.15,
    geography: 0.10,
  }
});
```

## Configuration

### Environment Variables

```bash
# 0G Storage (required for trace upload)
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
OG_FLOW_CONTRACT=0x22E03a6A89B950F1c82ec5e74F8eCa321a105296
OG_PRIVATE_KEY=your_private_key_here

# Optional: Token price API (for TOKEN pricing models)
COINGECKO_API_KEY=your_key_here
```

### Orchestrator Config

```typescript
import { AgentOrchestrator } from '@/lib/agent';

const orchestrator = new AgentOrchestrator(
  registry,           // ProviderRegistry
  priceNormalizer,    // PriceNormalizer
  ranker,            // Ranker
  storageService,    // StorageService
  identityService,   // IdentityService
  {
    quoteTimeoutMs: 5000,      // Quote fetch timeout
    traceWarningSize: 5242880, // 5MB warning
    traceMaxSize: 9437184,     // 9MB limit
    topN: 3,                   // Number of recommendations
    includeRejected: true,     // Include rejected providers in trace
  }
);
```

## Testing

Run integration tests:

```bash
# Manual test script
npx ts-node src/lib/agent/integration.test.ts

# Or via npm (if configured)
npm run test:agent
```

Tests cover:
- Tracked/Untracked identity modes
- Constraint filtering
- Price normalization
- Pipeline performance (<10s target)
- Error handling

## Performance

Target pipeline performance:

| Step | Target | Typical |
|------|--------|---------|
| Identity | <10ms | ~5ms |
| Filter | <50ms | ~20ms |
| Quotes | <5000ms | ~500ms |
| Normalize | <100ms | ~50ms |
| Rank | <50ms | ~20ms |
| Trace | <50ms | ~20ms |
| Upload | <5000ms | ~2000ms |
| **Total** | **<10s** | **~3-5s** |

## Modules

### filter.ts
Constraint-based provider filtering

```typescript
import { filterProviders, ConstraintFilter } from '@/lib/agent';

const results = filterProviders(providers, constraints);
```

### scorer.ts
Weighted provider scoring

```typescript
import { scoreProviders, DEFAULT_WEIGHTS } from '@/lib/agent';

const scored = scoreProviders(providerPrices, weights, constraints);
```

### ranker.ts
Ranking and recommendations

```typescript
import { Ranker } from '@/lib/agent';

const ranker = new Ranker();
const result = await ranker.rank(jobRequest);
```

### reasoning.ts
Trace generation for 0G Storage

```typescript
import { generateReasoningTrace } from '@/lib/agent';

const trace = generateReasoningTrace({
  jobRequest,
  filterResults,
  scoredProviders,
  weights,
  duration,
});
```

### orchestrator.ts
Main coordination

```typescript
import { orchestrator, AgentOrchestrator } from '@/lib/agent';

// Use singleton
const result = await orchestrator.processJob(request);

// Or create custom instance
const custom = new AgentOrchestrator(registry, normalizer, ranker, storage, identity);
```

## Error Handling

The agent handles errors gracefully:

- **Provider unavailable**: Skipped, logged, continues with others
- **Quote timeout**: 5s timeout per provider
- **0G upload failure**: Returns hash as 'upload-failed-{timestamp}'
- **No providers match**: Throws clear error message
- **Invalid input**: Returns validation errors via HTTP API

## Integration Checklist

- [ ] 0G Storage credentials configured (for trace upload)
- [ ] Provider registry initialized with 8 providers
- [ ] Token price service configured (for TOKEN pricing)
- [ ] HTTP API route deployed at /api/agent
- [ ] Identity service configured for Tracked/Untracked modes
- [ ] Integration tests passing

## Next Steps

- **Phase 2**: Buyer/seller UI integration
- **Phase 3**: Smart contract settlement on ADI Chain
- **Phase 4**: Production deployment

## Support

For issues or questions:
- Check integration tests: `src/lib/agent/integration.test.ts`
- Review 0G Storage setup: `01-USER-SETUP.md`
- Inspect reasoning traces via 0G Storage hash
