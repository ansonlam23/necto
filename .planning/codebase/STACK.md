# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- TypeScript 5.x - Frontend application, API routes, smart contract tooling
- Solidity 0.8.28 - Smart contracts for ADI Testnet

**Secondary:**
- JavaScript (ESM) - Build configuration files (postcss.config.mjs, eslint.config.mjs)

## Runtime

**Environment:**
- Node.js v24.11.0 (current system)
- Project targets ES2017+ for browser compatibility

**Package Manager:**
- npm 11.6.1
- Lockfile: `package-lock.json` (present in each package)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router
- React 19.2.3 - UI library
- Tailwind CSS 4.x - Utility-first styling

**Testing:**
- Hardhat 3.1.8 - Smart contract development/testing framework
- Foundry (forge-std v1.9.4) - Solidity testing utilities

**Build/Dev:**
- Turbopack (via Next.js 16) - Development bundler
- PostCSS with @tailwindcss/postcss - CSS processing

## Key Dependencies

**Critical:**
- `viem` 2.45.3 - TypeScript Ethereum library for blockchain interactions
- `wagmi` 3.4.3 - React hooks for Ethereum
- `@google/adk` 0.3.0 - Google Agent Development Kit for AI-powered routing agent
- `zustand` 5.0.11 - State management for workflow canvas

**UI Components:**
- `@radix-ui/*` - Headless UI primitives (dialog, dropdown-menu, navigation-menu, slot)
- `radix-ui` 1.4.3 - Core Radix utilities
- `lucide-react` 0.563.0 - Icon library
- `recharts` 3.7.0 - Charting library
- `class-variance-authority` 0.7.1 - Component variant styling
- `@xyflow/react` 12.10.0 - Workflow canvas/diagram library

**Data Management:**
- `@tanstack/react-query` 5.90.21 - Server state management
- `@tanstack/react-table` 8.21.3 - Table components

**Infrastructure:**
- `shadcn` 3.8.4 - UI component scaffolding CLI
- `js-yaml` 4.1.1 - YAML parsing for Akash SDL generation

## Configuration

**Environment:**
- `.env.local` - Local environment variables (not committed)
- `.env.example` - Template with required variables documented
- Config loaded via `process.env` in Next.js server components/routes

**Build:**
- `offchain/tsconfig.json` - TypeScript config (strict mode, @/* path alias)
- `hardhat/tsconfig.json` - TypeScript config for contract tooling
- `offchain/next.config.ts` - Next.js configuration
- `hardhat/hardhat.config.ts` - Hardhat deployment configuration

**Linting:**
- ESLint 9 with `eslint-config-next` (core-web-vitals + TypeScript rules)

## Platform Requirements

**Development:**
- Node.js 20+ (project uses Node 22 types)
- npm or yarn package manager

**Production:**
- Node.js runtime for Next.js server
- ADI Testnet access for blockchain features
- External API keys (Google AI, Akash, optional: RunPod, Lambda Labs)

---

*Stack analysis: 2026-02-19*
