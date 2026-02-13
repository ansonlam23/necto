# External Integrations

**Analysis Date:** 2026-02-12

## APIs & External Services

**No REST/HTTP API clients detected.**

The application currently uses:
- Local state management via Zustand (`src/lib/workflow-store.ts`)
- Mock/hardcoded data in components (e.g., `DashboardStats.tsx`, `NetworkStatus.tsx`)

**Planned/TODO Integrations (marked in code):**
- Workflow save functionality (`src/app/builder/page.tsx` - `handleSave()`)
- Workflow deployment (`src/app/builder/page.tsx` - `handleDeploy()`)

## Data Storage

**Databases:**
- Not applicable - No database client or ORM detected

**File Storage:**
- Local filesystem only - No cloud storage SDKs detected

**Caching:**
- TanStack Query (React Query) for client-side server state caching
- Zustand for client-side global state persistence

## Authentication & Identity

**Web3 Wallet Authentication:**
- Provider: wagmi + injected wallet connector
- Implementation: `src/components/web3-provider.tsx`, `src/hooks/use-wallet.ts`
- Supported Wallets: MetaMask and other EIP-1193 compatible wallets
- Connection Flow: `src/components/wallet-connect.tsx`

**No traditional auth provider detected** (no Auth0, Clerk, NextAuth, etc.)

## Blockchain Integration

**Network Configuration (`src/lib/wagmi.ts`):**
- Mainnet (Ethereum) - Production
- Sepolia - Testnet

**Transport:**
- HTTP JSON-RPC via viem's `http()` transport
- No custom RPC URLs configured (uses public endpoints)

**Wallet Features:**
- Connection/disconnection
- Chain switching
- Address display with formatting
- Etherscan link generation

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Bugsnag, etc.)

**Logs:**
- Console logging only (`console.error`, `console.log`)

**Analytics:**
- None detected

## CI/CD & Deployment

**Hosting:**
- Next.js 16 - Compatible with Vercel, Netlify, or custom Node.js hosting

**CI Pipeline:**
- None detected (no GitHub Actions, etc.)

**Build Output:**
- Standard Next.js build (`.next/` directory)

## Environment Configuration

**Environment Files:**
- `.env.local` exists (70 bytes) - contains local environment variables

**Required env vars:**
- None detected in source code (no `process.env` usage found)

**Note:** If adding Web3 RPC providers or backend APIs, configure via:
- `NEXT_PUBLIC_*` for client-side exposed variables
- Standard env vars for server-side only

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

## External Explorer Links

**Etherscan Integration:**
- Address lookup: `https://etherscan.io/address/${address}`
- Implementation: `src/components/wallet-connect.tsx`

## Package Registries

**shadcn/ui Registry:**
- Schema: https://ui.shadcn.com/schema.json
- Style: New York
- Icon library: Lucide

---

*Integration audit: 2026-02-12*
