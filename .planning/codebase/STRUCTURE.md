# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
necto/
├── offchain/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages & API
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Core business logic
│   │   └── types/               # TypeScript type definitions
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies
│   └── tsconfig.json            # TypeScript config
├── hardhat/                     # Smart contract development
│   ├── contracts/               # Solidity contracts
│   ├── ignition/                # Deployment modules
│   ├── scripts/                 # Deployment scripts
│   ├── test/                    # Contract tests
│   └── hardhat.config.ts        # Hardhat configuration
├── .planning/                   # Planning documents
│   └── codebase/                # Codebase analysis docs
├── AGENTS.md                    # Agent guidelines
├── CLAUDE.md                    # Project documentation
└── .gitignore                   # Git ignore rules
```

## Directory Purposes

**`offchain/src/app/`:**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components (`page.tsx`), layouts (`layout.tsx`), API handlers (`route.ts`)
- Key files: `layout.tsx` (root layout), `page.tsx` (dashboard), `api/*/route.ts` (API endpoints)

**`offchain/src/components/`:**
- Purpose: Reusable React components
- Contains: UI primitives, feature components, layout components
- Key files: `ui/button.tsx` (shadcn components), `layout/AppShell.tsx` (main layout), `workflow/workflow-canvas.tsx`

**`offchain/src/lib/`:**
- Purpose: Core business logic and utilities
- Contains: Agent logic, provider integrations, contract ABIs, stores
- Key files: `agent/index.ts` (agent exports), `workflow-store.ts` (Zustand store), `wagmi.ts` (Web3 config)

**`offchain/src/hooks/`:**
- Purpose: Custom React hooks for reusable stateful logic
- Contains: Wallet hook, provider discovery hook, Akash deployment hook
- Key files: `use-wallet.ts` (wallet interactions), `use-provider-discovery.ts`

**`offchain/src/types/`:**
- Purpose: TypeScript type definitions shared across codebase
- Contains: Akash types, provider types
- Key files: `akash.ts` (Akash SDL/deployment types)

**`hardhat/contracts/`:**
- Purpose: Solidity smart contracts
- Contains: Core contracts for job tracking and escrow
- Key files: `ComputeRouter.sol` (job management), `USDCEscrow.sol` (payment escrow), `TestnetUSDC.sol` (mock token)

**`hardhat/ignition/modules/`:**
- Purpose: Hardhat Ignition deployment modules
- Contains: Deployment configurations for each contract
- Key files: `ComputeRouter.ts`, `USDCEscrow.ts`

## Key File Locations

**Entry Points:**
- `offchain/src/app/layout.tsx`: Root layout with providers
- `offchain/src/app/page.tsx`: Dashboard page
- `offchain/src/lib/agent/agent.ts`: Agent entry point

**Configuration:**
- `offchain/package.json`: Frontend dependencies
- `hardhat/hardhat.config.ts`: Blockchain configuration
- `offchain/src/lib/wagmi.ts`: Web3 provider config

**Core Logic:**
- `offchain/src/lib/agent/index.ts`: Agent module exports
- `offchain/src/lib/agent/tools/index.ts`: Tool registry
- `offchain/src/lib/workflow-store.ts`: Workflow state management

**Smart Contracts:**
- `hardhat/contracts/ComputeRouter.sol`: Job tracking contract
- `hardhat/contracts/USDCEscrow.sol`: Payment escrow contract
- `offchain/src/lib/contracts/compute-router.ts`: Contract ABI

**API Routes:**
- `offchain/src/app/api/route-job/route.ts`: Main job routing endpoint
- `offchain/src/app/api/providers/route.ts`: Provider listing
- `offchain/src/app/api/deployments/route.ts`: Deployment management

**Components:**
- `offchain/src/components/layout/AppShell.tsx`: Main app layout
- `offchain/src/components/web3-provider.tsx`: Web3 context provider
- `offchain/src/components/workflow/workflow-canvas.tsx`: Visual workflow editor

## Naming Conventions

**Files:**
- Components: kebab-case (`workflow-canvas.tsx`, `provider-card.tsx`)
- Hooks: camelCase with `use` prefix (`use-wallet.ts`, `use-mobile.ts`)
- Utilities: kebab-case (`workflow-store.ts`, `sdl-generator.ts`)
- Types: kebab-case (`akash.ts`)
- API routes: kebab-case directories (`route-job/`, `compare-providers/`)
- Smart contracts: PascalCase (`ComputeRouter.sol`, `USDCEscrow.sol`)

**Directories:**
- Feature modules: kebab-case (`workflow/`, `agent/`, `akash/`)
- UI components: lowercase (`ui/`, `layout/`)
- Dynamic routes: bracket notation (`[id]/`)

## Where to Add New Code

**New Feature:**
- Primary code: `offchain/src/app/[feature]/page.tsx`
- Components: `offchain/src/components/[feature]/`
- API endpoint: `offchain/src/app/api/[feature]/route.ts`
- Tests: No test framework configured yet

**New Provider Integration:**
- Tool: `offchain/src/lib/agent/tools/[provider]-tool.ts`
- Fetcher: `offchain/src/lib/providers/[provider]-fetcher.ts`
- Export: Add to `offchain/src/lib/agent/tools/index.ts`

**New Smart Contract:**
- Contract: `hardhat/contracts/[ContractName].sol`
- Deployment: `hardhat/ignition/modules/[ContractName].ts`
- ABI: `offchain/src/lib/contracts/[contract-name].ts`

**New UI Component:**
- shadcn component: Run `npx shadcn add <component>` → `offchain/src/components/ui/`
- Custom component: `offchain/src/components/[category]/[component-name].tsx`

**New API Endpoint:**
- Route handler: `offchain/src/app/api/[endpoint]/route.ts`
- Use Next.js `NextRequest`/`NextResponse` for type safety

**New Hook:**
- Hook file: `offchain/src/hooks/use-[feature].ts`
- Use `'use client'` directive for client-side hooks

**New Store:**
- Store file: `offchain/src/lib/[feature]-store.ts`
- Use Zustand's `create` function

## Special Directories

**`offchain/src/components/ui/`:**
- Purpose: shadcn/ui component library
- Generated: Yes (via `npx shadcn add`)
- Committed: Yes
- Do not manually edit unless extending

**`hardhat/artifacts/`:**
- Purpose: Compiled contract artifacts
- Generated: Yes (via `npx hardhat compile`)
- Committed: Partially (build-info)
- Do not manually edit

**`hardhat/ignition/deployments/`:**
- Purpose: Deployment state and addresses
- Generated: Yes (via `npx hardhat ignition deploy`)
- Committed: Yes
- Contains: Chain-specific deployment data

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents
- Generated: Yes (by GSD agents)
- Committed: Yes
- Contains: Architecture, conventions, concerns docs
