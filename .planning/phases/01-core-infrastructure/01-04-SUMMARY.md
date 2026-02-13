---
phase: 01-core-infrastructure
plan: 04
subsystem: pricing

requires:
  - phase: 01-02
    provides: TypeScript types (PriceQuote, NormalizedPrice, HiddenCosts)
  - phase: 01-03
    provides: Provider adapters with pricing data

provides:
  - Token price fetching from CoinGecko with 10-min caching
  - GPU normalization to A100 80GB baseline (1.0)
  - Hidden cost calculator (bandwidth, storage, API)
  - Unified price normalizer pipeline
  - Barrel exports for easy module consumption

affects:
  - Agent routing logic (uses normalized prices)
  - Provider comparison UI (displays effective rates)
  - Token-based provider adapters (Akash, Filecoin, io.net)

tech-stack:
  added:
    - node-cache (price caching)
    - axios (already available, for API calls)
  patterns:
    - Singleton service instances
    - Pipeline pattern for normalization
    - Graceful degradation with fallback values

key-files:
  created:
    - src/lib/pricing/coingecko.ts
    - src/lib/pricing/gpu-ratios.ts
    - src/lib/pricing/hidden-costs.ts
    - src/lib/pricing/normalizer.ts
    - src/lib/pricing/index.ts
    - src/lib/pricing/README.md

key-decisions:
  - "A100 80GB = 1.0 baseline for GPU performance normalization per AGENT-02"
  - "10-minute cache for token prices to stay under CoinGecko 30/min rate limit"
  - "Return 0 for failed token fetches - provider scored poorly rather than crash"
  - "Include hidden costs (bandwidth, storage, API) in effective rate per user decision"
  - "Output format: $X.XX/GPU-hr displayed to users per user decision"

patterns-established:
  - "Pipeline normalization: TOKEN→USD→spot discount→hidden costs→A100-equivalent"
  - "Rate limiting with 25 req/min buffer below CoinGecko 30/min free tier"
  - "Exponential backoff for retries with 429 handling"
  - "Conservative GPU ratios based on MLPerf benchmarks"
  - "Regional cost factors for bandwidth/storage/API with AWS-ish defaults"

duration: 12min
completed: 2026-02-13
---

# Phase 1 Plan 4: Pricing Normalization Pipeline Summary

**Token price conversion with CoinGecko caching, GPU normalization to A100 baseline, hidden cost inclusion, and unified USD/GPU-hr output per AGENT-02 and AGENT-03 requirements.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-13T03:16:10Z
- **Completed:** 2026-02-13T03:28:25Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- Token price service with 10-minute caching and rate limit protection
- GPU performance normalization (A100 80GB = 1.0 baseline)
- Hidden cost calculator with regional defaults
- Unified price normalizer with full pipeline
- Comprehensive documentation and barrel exports

## Task Commits

Each task was committed atomically:

1. **Task 1: CoinGecko token price service** - `737cdf5` (feat)
2. **Task 2: GPU normalization and hidden costs** - `ce278c6` (feat)
3. **Task 3: Unified price normalizer** - `9e70927` (feat)
4. **Task 4: Pricing barrel export** - `59e24ae` (feat)

**Plan metadata:** [pending]

## Files Created/Modified

- `src/lib/pricing/coingecko.ts` - Token price service with 10-min caching, batch fetching, rate limiting
- `src/lib/pricing/gpu-ratios.ts` - GPU performance ratios (A100=1.0), normalization functions
- `src/lib/pricing/hidden-costs.ts` - Hidden cost calculator with regional defaults
- `src/lib/pricing/normalizer.ts` - Main PriceNormalizer class with full pipeline
- `src/lib/pricing/index.ts` - Barrel exports with singleton instances
- `src/lib/pricing/README.md` - Module documentation with usage examples

## Decisions Made

1. **A100 80GB baseline**: Per AGENT-02, A100 80GB = 1.0 ratio. H100 = 1.5x, H200 = 2.0x.

2. **10-minute cache**: CoinGecko free tier is 30 calls/min. Cache prevents hitting limits.

3. **Graceful fallback**: Token fetch failures return 0 instead of crashing. Provider scored poorly.

4. **Hidden costs included**: Per user decision, bandwidth/storage/API costs added to effective rate.

5. **Regional cost factors**: AWS-ish defaults for 10 regions with regional variations.

6. **Output format**: $X.XX/GPU-hr per user decision for display consistency.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## Next Phase Readiness

The pricing normalization pipeline is complete and ready for:

- **Agent routing logic** (Plan 01-05): Use `priceNormalizer.normalizeQuote()` to compare providers
- **Provider comparison UI**: Display `effectiveUsdPerA100Hour` to users
- **Token-based adapters**: Akash, Filecoin, io.net can use token price service

## Usage Example

```typescript
import { priceNormalizer, comparePrices } from '@/lib/pricing';

// Normalize quotes from multiple providers
const normalized = await Promise.all(
  quotes.map(q => priceNormalizer.normalizeQuote(q, jobRequest))
);

// Compare and rank
const ranked = comparePrices(normalized);
console.log(`Best price: ${ranked[0].providerId} at $${ranked[0].effectiveUsdPerA100Hour}/hr`);
```

---
*Phase: 01-core-infrastructure*
*Completed: 2026-02-13*
