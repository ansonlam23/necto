# External Integrations

**Analysis Date:** 2026-02-19

## APIs & External Services

**AI/LLM Services:**
- Google AI Studio (Gemini) - Powers the routing agent
  - SDK: `@google/adk` (Agent Development Kit)
  - Auth: `GOOGLE_AI_STUDIO_API_KEY` env var
  - Model: Configurable via `AGENT_MODEL` (default: `gemini-2.0-flash`)
  - Location: `offchain/src/lib/agent/agent.ts`

**Decentralized Compute Providers:**

- **Akash Network** - Primary compute marketplace
  - Console API: `https://console-api.akash.network`
  - Auth: `AKASH_CONSOLE_API_KEY` env var
  - Client: `offchain/src/lib/akash/console-api.ts`
  - Features: Deployment creation, bid management, lease acceptance, log streaming

- **RunPod** - GPU cloud provider (optional)
  - GraphQL API: `https://api.runpod.io/graphql`
  - Auth: `RUNPOD_API_KEY` env var (falls back to mock data)
  - Fetcher: `offchain/src/lib/providers/runpod-fetcher.ts`

- **Lambda Labs** - GPU cloud provider (optional)
  - REST API: `https://cloud.lambdalabs.com/api/v1/instance-types`
  - Auth: `LAMBDA_API_KEY` env var with Basic Auth (falls back to mock data)
  - Fetcher: `offchain/src/lib/providers/lambda-fetcher.ts`

## Data Storage

**Databases:**
- None - Application is stateless, relies on:
  - On-chain storage (ADI Testnet)
  - External provider APIs for state

**File Storage:**
- None - No persistent file storage required

**Caching:**
- Next.js built-in fetch caching (`next: { revalidate: 60 }`)
- In-memory caching for provider data
- React Query for client-side caching

## Authentication & Identity

**Auth Provider:**
- Web3 Wallet Connection (browser-injected wallets like MetaMask)
  - Implementation: `wagmi` with `injected()` connector
  - Location: `offchain/src/hooks/use-wallet.ts`
  - No traditional auth (email/password) - wallet address is identity

**Agent Wallet:**
- Server-side wallet for submitting transactions
  - Auth: `AGENT_PRIVATE_KEY` env var (prefixed with `0x`)
  - Used for: ComputeRouter contract interactions
  - Location: `offchain/src/lib/agent/wallet-tool.ts`

## Blockchain

**Network:**
- ADI Testnet (custom EVM-compatible chain)
  - Chain ID: 99999
  - RPC: `https://rpc.ab.testnet.adifoundation.ai`
  - Native currency: ADI (18 decimals)
  - Definition: `offchain/src/lib/adi-chain.ts`

**Smart Contracts:**
- `ComputeRouter` - Job submission and routing decisions
  - Address: `0x369CbbB21c7b85e3BB0f29DE5dCC92B2583E09Dd`
  - ABI: `offchain/src/lib/contracts/compute-router.ts`
  - Solidity: `hardhat/contracts/ComputeRouter.sol`

- `USDCEscrow` - Payment escrow for compute jobs
  - Address: `0x0Fc569ACAf6196A2dEf11C9363193c89083e6aDA`
  - ABI: `offchain/src/lib/contracts/testnet-usdc-escrow.ts`
  - Solidity: `hardhat/contracts/USDCEscrow.sol`

- `TestnetUSDC` - Mock USDC token for testing
  - Solidity: `hardhat/contracts/TestnetUSDC.sol`

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Console logging via `console.log()` and `console.error()`
- Server-side logging in API routes
- No centralized log aggregation

## CI/CD & Deployment

**Hosting:**
- Not configured - Ready for Vercel or Node.js hosting

**CI Pipeline:**
- None configured - No `.github/` workflows or similar

## Environment Configuration

**Required env vars:**
- `GOOGLE_AI_STUDIO_API_KEY` - AI agent functionality
- `AGENT_PRIVATE_KEY` - Server-side wallet for contract interactions
- `AKASH_CONSOLE_API_KEY` - Akash deployment management

**Optional env vars:**
- `AGENT_MODEL` - Override default Gemini model
- `AGENT_NAME` - Agent name override
- `RUNPOD_API_KEY` - Enable RunPod provider fetching
- `LAMBDA_API_KEY` - Enable Lambda Labs provider fetching
- `COMPUTE_ROUTER_ADDRESS` - Override contract address
- `ESCROW_CONTRACT_ADDRESS` - Override escrow address
- `TESTNET_PRIVATE_KEY` - Hardhat deployment (in hardhat package)
- `TESTNET_USDC_CONTRACT` - Override USDC token address

**Secrets location:**
- `offchain/.env.local` - Local development (git-ignored)
- Environment variables in deployment platform

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None - All integration is request/response via API calls

## API Routes (Internal)

The application exposes these Next.js API routes for frontend consumption:

- `POST /api/route-job` - Submit compute job for AI routing
- `POST /api/akash` - Direct Akash deployment creation
- `POST /api/compare-providers` - Compare available providers
- `POST /api/escrow` - Escrow operations
- `GET /api/providers` - List available compute providers
- `GET /api/deployments` - List Akash deployments
- `GET /api/deployments/[id]` - Get deployment details
- `GET /api/deployments/[id]/bids` - Get bids for deployment
- `GET /api/deployments/[id]/logs` - Stream deployment logs

---

*Integration audit: 2026-02-19*
