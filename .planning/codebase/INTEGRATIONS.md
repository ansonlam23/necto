# External Integrations

**Analysis Date:** 2026-02-14

## APIs & External Services

**DePIN/Compute Networks:**
- **Akash Network** - Decentralized GPU/cloud compute marketplace
  - Primary API: `https://console-api.akash.network/v1/providers`
  - Fallback API: `https://api.cloudmos.io/v1/providers`
  - Implementation: `offchain/src/lib/providers/akash-fetcher.ts`
  - Returns GPU provider listings with hardware specs, pricing, location
  - Cache: 60 seconds via Next.js `next.revalidate`

**Blockchains (EVM):**
- **Ethereum Mainnet** - Primary production network
  - Chain ID: 1
  - Transport: HTTP via viem/wagmi defaults
  - Implementation: `offchain/src/lib/wagmi.ts`

- **Sepolia Testnet** - Development/testing network
  - Chain ID: 11155111
  - Transport: HTTP via viem/wagmi defaults
  - Implementation: `offchain/src/lib/wagmi.ts`

**External Explorers:**
- **Etherscan** - Address lookup via `window.open()`
  - URL pattern: `https://etherscan.io/address/{address}`
  - Usage: `offchain/src/components/wallet-connect.tsx`

## Data Storage

**Databases:**
- Not detected - No database client libraries installed
- State managed via Zustand (client-side only)

**File Storage:**
- Local filesystem only - No cloud storage SDKs detected

**Caching:**
- **Next.js Request Memoization** - API fetch caching (`next.revalidate: 60`)
- **TanStack Query** - Server state caching with QueryClient
- **Zustand** - Client state persistence (no storage middleware detected)

## Authentication & Identity

**Auth Provider:**
- **Wallet-based authentication** via wagmi
  - Connector: `injected()` (MetaMask, Coinbase Wallet, etc.)
  - No email/password or OAuth providers detected
  - Implementation: `offchain/src/hooks/use-wallet.ts`

**Wallet Operations:**
- Connect/disconnect wallet
- Chain switching (mainnet ↔ sepolia)
- Address formatting and display

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Bugsnag, or similar installed

**Logs:**
- Browser console logging (`console.error`, `console.log`, `console.warn`)
- No structured logging service integration

## CI/CD & Deployment

**Hosting:**
- Not specified - No platform-specific config (Vercel, Netlify, etc.)
- Standard Next.js build assumed

**CI Pipeline:**
- Not detected - No GitHub Actions, CircleCI, etc. configuration found

## Environment Configuration

**Required env vars:**
- None explicitly required in code
- `.env.local` exists but contents not analyzed (secrets protection)

**Secrets location:**
- `.env.local` - Local environment variables
- Note: Never commit this file

## Webhooks & Callbacks

**Incoming:**
- **Webhook Trigger Node** - Planned feature for workflow triggers
  - Template defined in: `offchain/src/components/workflow/custom-nodes.tsx`
  - Not yet implemented as endpoint

**Outgoing:**
- None currently implemented
- Planned integrations (node templates):
  - Akash Group deployment
  - io.net Cluster provisioning
  - Render Node management
  - ADI Payment processing
  - 0G Audit logging

## Integration Architecture

**Web3 Stack:**
```
UI Components → useWallet hook → wagmi → viem → Browser Wallet → EVM Networks
                                     ↓
                              TanStack Query (caching)
```

**DePIN Data Flow:**
```
Providers Page → fetchAkashProviders() → Akash API → Provider Cards
                     ↓
              Next.js Cache (60s)
```

**Planned Workflow Integrations:**
| Node Type | Service | Purpose |
|-----------|---------|---------|
| Trigger | Webhook | External event initiation |
| Provider | Akash Group | GPU deployment |
| Provider | io.net Cluster | Compute cluster provisioning |
| Provider | Render Node | Render farm access |
| Settlement | ADI Payment | Cross-chain payments |
| Settlement | 0G Audit Log | Decentralized logging |

---

*Integration audit: 2026-02-14*
