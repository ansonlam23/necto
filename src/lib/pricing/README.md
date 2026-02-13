# Pricing Module

Unified pricing normalization pipeline for the Synapse compute marketplace.

## Overview

This module converts diverse provider pricing models (fixed USD, dynamic spot, volatile tokens) into standardized **USD/GPU-hr** metrics normalized to **A100 80GB equivalent**.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│ Price Quote │────▶│ Normalizer  │────▶│ NormalizedPrice │
│  (various)  │     │  Pipeline   │     │ (USD/A100-hr)   │
└─────────────┘     └─────────────┘     └─────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Token Prices  │  │ GPU Ratios    │  │ Hidden Costs  │
│ (CoinGecko)   │  │ (A100=1.0)    │  │ (bw/storage)  │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Normalization Pipeline

1. **Token Conversion**: TOKEN → USD via CoinGecko API (cached 10 min)
2. **Spot Discount**: Apply discount percentage if applicable
3. **Hidden Costs**: Add bandwidth, storage, API costs
4. **GPU Normalization**: Convert to A100 80GB equivalent
5. **Output**: Single comparable `effectiveUsdPerA100Hour`

## Usage

### Basic Price Normalization

```typescript
import { priceNormalizer } from '@/lib/pricing';

const normalized = await priceNormalizer.normalizeQuote(quote, jobRequest);

console.log(`
  Provider: ${normalized.providerId}
  GPU: ${normalized.gpuType}
  Effective Rate: $${normalized.effectiveUsdPerA100Hour.toFixed(2)}/GPU-hr
  Hidden Costs: $${normalized.hiddenCosts.total.toFixed(2)}/hr
`);
```

### Compare Multiple Providers

```typescript
import { comparePrices } from '@/lib/pricing';

const normalized = await Promise.all(
  quotes.map(q => priceNormalizer.normalizeQuote(q, jobRequest))
);

const ranked = comparePrices(normalized);

ranked.forEach((provider, index) => {
  console.log(`${index + 1}. ${provider.providerId}: $${provider.effectiveUsdPerA100Hour.toFixed(2)}/hr`);
});
```

### Get Token Prices

```typescript
import { getTokenPrice } from '@/lib/pricing';

const akt = await getTokenPrice('AKT');
console.log(`AKT: $${akt.usdPrice} (updated: ${akt.lastUpdated})`);
```

### GPU Normalization

```typescript
import { normalizeToA100, getA100Equivalent } from '@/lib/pricing';

// H100 is 1.5x A100 performance
const ratio = getA100Equivalent('H100'); // 1.5

// H100 at $3/hr = $2/A100-hr
const normalized = normalizeToA100(3.0, 'H100'); // 2.0
```

### Hidden Costs Calculation

```typescript
import { calculateHiddenCosts } from '@/lib/pricing';

const costs = calculateHiddenCosts({
  region: 'us-east',
  durationHours: 24,
  expectedBandwidthGB: 36,    // 1.5 GB/hour
  expectedStorageGB: 75,
  expectedApiCallsPerHour: 10,
});

console.log(`Hidden costs: $${costs.total.toFixed(4)}/hr`);
```

## Configuration

### Token Price Service

```typescript
import { TokenPriceService } from '@/lib/pricing';

const service = new TokenPriceService({
  cacheTtlSeconds: 600,        // 10 minutes
  maxRequestsPerMinute: 25,    // Buffer below 30/min limit
  retryAttempts: 3,
  timeout: 10000,
});
```

### Price Normalizer

```typescript
import { PriceNormalizer, DEFAULT_NORMALIZER_CONFIG } from '@/lib/pricing';

const normalizer = new PriceNormalizer(tokenService, {
  includeHiddenCosts: true,
  applySpotDiscounts: true,
  defaultWorkloadType: 'training', // or 'inference'
});
```

## API Rate Limits

**CoinGecko Free Tier:**
- 30 calls/minute
- 10,000 calls/month

Our implementation:
- Caches prices for 10 minutes
- Rate limits at 25 req/min (buffer)
- Batch fetches for multiple tokens
- Graceful fallback to stale cache

## GPU Performance Ratios

| GPU | Ratio | Description |
|-----|-------|-------------|
| H200 | 2.0 | Flagship datacenter |
| H100 | 1.5 | High-end datacenter |
| A100 80GB | 1.0 | **Baseline** |
| A100 40GB | 0.9 | Same chip, less memory |
| RTX 4090 | 0.6 | Consumer flagship |
| RTX 3090 | 0.5 | Previous gen consumer |
| A10G | 0.4 | Inference optimized |
| V100 | 0.3 | Previous gen datacenter |
| T4 | 0.15 | Entry inference |

*Ratios based on MLPerf inference benchmarks and conservative estimates*

## Hidden Cost Defaults

### Regional Rates (per hour)

| Region | Bandwidth | Storage | API |
|--------|-----------|---------|-----|
| us-east | $0.09/GB | $0.023/GB/mo | $0.003/1K |
| eu-west | $0.09/GB | $0.024/GB/mo | $0.003/1K |
| ap-northeast | $0.114/GB | $0.026/GB/mo | $0.003/1K |

### ML Training Assumptions

- Bandwidth: 1.5 GB/hour (checkpoints + data)
- Storage: 75 GB (dataset + model)
- API calls: 10/hour

### Inference Assumptions

- Bandwidth: 2.0 GB/hour (higher API traffic)
- Storage: 25 GB (model files only)
- API calls: 100/hour

## Error Handling

Token price failures:
- Returns cached price if available (< 10 min old)
- Returns 0 if no cache (provider scored poorly)
- Logs warning for monitoring

Unknown GPU types:
- Uses price as-is without normalization
- Logs warning
- Continues with pipeline

## Files

- `coingecko.ts` - Token price fetching with caching
- `gpu-ratios.ts` - GPU performance normalization
- `hidden-costs.ts` - Hidden cost calculations
- `normalizer.ts` - Main normalization pipeline
- `index.ts` - Module exports

## Testing

```bash
# Test CoinGecko API
curl "https://api.coingecko.com/api/v3/simple/price?ids=filecoin,akash-network&vs_currencies=usd"

# Compile module
npx tsc --noEmit src/lib/pricing/index.ts
```
