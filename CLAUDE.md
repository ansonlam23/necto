# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Necto is a two-sided compute marketplace connecting buyers seeking affordable GPU compute with sellers monetizing idle hardware. The platform features an AI routing agent that normalizes diverse pricing models (fixed-rate, spot/auction, token-based) and automatically recommends the best deal.

**Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, wagmi/viem (Web3), Zustand (state), React Flow (workflow visualization)

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint on entire project
npx eslint offchain/src/path/to/file.tsx  # Lint specific file
```

**Note**: No test framework is configured. Install Vitest or Jest if adding tests.

## Architecture

### Application Structure

```
offchain/src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard (home)
│   ├── builder/           # Workflow builder interface
│   ├── providers/         # Provider marketplace view
│   ├── audit/             # Audit log
│   └── settings/          # User settings
├── components/
│   ├── ui/                # shadcn/ui components (Button, Dialog, etc.)
│   ├── layout/            # Shell components (AppShell, AppSidebar, AppHeader)
│   ├── workflow/          # Workflow builder components
│   ├── dashboard/         # Dashboard widgets
│   ├── web3-provider.tsx  # Wagmi/TanStack Query provider wrapper
│   └── wallet-connect.tsx # Wallet connection UI
├── lib/
│   ├── utils.ts           # cn() utility for Tailwind
│   ├── wagmi.ts           # Wagmi config (mainnet, sepolia)
│   ├── workflow-store.ts  # Zustand store for workflow state
│   └── providers/         # Provider data fetchers (Akash, etc.)
└── hooks/
    ├── use-mobile.ts      # Responsive breakpoint detection
    └── use-wallet.ts      # Wallet connection hooks
```

### Key Design Patterns

**Layout System**: All pages are wrapped in `AppShell` (via root layout), which provides:
- Collapsible sidebar navigation (`AppSidebar`)
- Header with wallet connection and status indicators (`AppHeader`)
- Responsive behavior (mobile sheet menu, desktop sidebar)

**Web3 Integration**:
- Root layout wraps app in `Web3Provider` (Wagmi + TanStack Query)
- Wallet config in `offchain/src/lib/wagmi.ts` supports mainnet and Sepolia
- Use `useAccount()`, `useConnect()`, `useDisconnect()` from wagmi for wallet operations

**Workflow Builder**:
- Uses React Flow for visual workflow composition
- Node types: `trigger`, `logic`, `provider`, `settlement`
- State managed in `useWorkflowStore` (Zustand)
- Custom nodes defined in `offchain/src/components/workflow/custom-nodes.tsx`
- Drag-and-drop palette in `offchain/src/components/workflow/node-palette.tsx`

**Provider Integration**:
- Fetchers in `offchain/src/lib/providers/` (e.g., `akash-fetcher.ts`)
- Each fetcher returns normalized `SynapseProvider` format
- Akash integration includes GPU filtering, price estimation, region parsing

### State Management

**Global State** (Zustand):
- `useWorkflowStore`: Workflow canvas nodes, edges, selection, config
  - `nodes`: Array of `WorkflowNode` (extends React Flow `Node` with `category`, `config`)
  - `edges`: React Flow edges
  - `selectedNode`: Currently selected node
  - `addNode()`, `selectNode()`, `updateNodeConfig()` for mutations

**Component State**: Use React hooks (`useState`, `useCallback`) for local UI state

**Server State**: TanStack Query (via Web3Provider) for async data fetching

## Code Style Guidelines

### TypeScript
- Strict mode enabled - always type function parameters and return values
- Use `interface` for object shapes, `type` for unions
- Prefer `interface` over `type` for extensibility
- Use `React.ComponentProps<"element">` for extending HTML props

### Imports
- Use `@/` path aliases for all project imports (configured in `tsconfig.json`)
- Import order: React → External libs → Internal (@/) → Relative
- Example:
```typescript
import * as React from "react"
import { useAccount } from "wagmi"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/lib/workflow-store"
```

### Naming Conventions
- **Components**: PascalCase (`WorkflowCanvas`, `AppSidebar`)
- **Files**: kebab-case (`workflow-canvas.tsx`, `use-wallet.ts`)
- **Functions/Variables**: camelCase (`onDrop`, `selectedNode`)
- **Hooks**: camelCase with `use` prefix (`useWorkflowStore`, `useMobile`)
- **Types/Interfaces**: PascalCase (`WorkflowNode`, `SynapseProvider`)

### Component Patterns
- Use function declarations (not arrow functions) for components
- Props interface named `ComponentName + "Props"`
- Destructure props in parameters
- Use `"use client"` directive for client components
- Use `asChild` pattern from Radix for composable components

### Styling
- Use Tailwind CSS with `cn()` utility from `@/lib/utils`
- CSS variables from design system: `bg-background`, `text-foreground`, `text-primary`
- Dark mode first: terminal/cyberpunk aesthetic (slate-950 background)
- Custom classes: `.terminal-data` (monospace), `.grid-lines` (subtle grid overlay)

### Adding shadcn/ui Components
```bash
npx shadcn add <component-name>
```
Components install to `offchain/src/components/ui/`. Use cva (class-variance-authority) for variants.

## Web3 Development

### Wallet Connection
- Use `<WalletConnect />` component in UI (already integrated in header)
- `useAccount()` for current wallet state
- `useConnect()` to initiate connection (injected connector configured)
- `useDisconnect()` to disconnect

### Adding Chains
Edit `offchain/src/lib/wagmi.ts` and import from `wagmi/chains`:
```typescript
import { mainnet, sepolia, yourChain } from 'wagmi/chains'
```

### Smart Contract Interactions
- Use `viem` for contract calls (wagmi uses viem under the hood)
- Contract addresses and ABIs should be in `offchain/src/lib/contracts/`

## Provider Integration

When adding new compute providers:

1. Create fetcher in `offchain/src/lib/providers/<provider>-fetcher.ts`
2. Implement `fetch<Provider>Providers()` returning `SynapseProvider[]`
3. Normalize pricing to USD/compute-hour
4. Include region/location data when available
5. Filter for GPU availability if relevant

**SynapseProvider format**:
```typescript
interface SynapseProvider {
  id: string
  name: string
  source: 'Akash' | 'Render' | 'Lambda' | ...
  hardware: {
    gpuModel: string
    gpuCount: number
    cpuUnits: number
    memory: number
  }
  priceEstimate: number
  region?: string
}
```

## Workflow Builder

### Adding Node Types
1. Define in `NodeCategory` type in `offchain/src/lib/workflow-store.ts`
2. Add visual styling in `getNodeStyle()` in `custom-nodes.tsx`
3. Register in `nodeTypes` export
4. Add to palette in `node-palette.tsx` with appropriate icon

### Node Configuration
- Each node has `config` object for custom settings
- Use `updateNodeConfig(nodeId, newConfig)` to update
- Display config UI in `offchain/src/components/workflow/config-panel.tsx`

## MCP Integration

**IMPORTANT**: When using documentation from a compute provider (Akash, Render, etc.), always call the context7 MCP. This is the source of truth for provider information.

## Roadmap Context

The project is built for a 1-week hackathon with 4 phases:
- **Phase 1**: Foundation & Core Agent (price normalization, job submission)
- **Phase 2**: Dynamic Agent & Real-Time UX (constraints, ranking, live updates)
- **Phase 3**: Supply Side & Settlement (provider onboarding, USDC escrow)
- **Phase 4**: Verification & Tracking (0G Storage integration, tracked/untracked modes)

Reference `.planning/ROADMAP.md` for detailed phase breakdown and requirements.

## Design System

**Theme**: Cyberpunk-professional (Bloomberg Terminal aesthetic)
- Dark mode first (slate-950 background)
- High information density
- Monospace numbers for financial data
- Terminal-style grid overlays
- Animated status indicators (pulse effects)

**Typography**:
- Primary: Geist Sans
- Terminal/data: JetBrains Mono (via `.terminal-data`)
- Tabular numbers for alignment

**Colors**:
- Background: `slate-950`
- Foreground: `slate-200`
- Primary: `blue-600`
- Accent: `purple-500`, `emerald-500`

## Common Patterns

### Client Components with Server Actions
All pages requiring interactivity need `"use client"` directive. Wrap async operations in try-catch and provide user feedback.

### Responsive Design
- Mobile: Sheet menu, stacked layouts
- Desktop: Collapsible sidebar, multi-column grids
- Use `useMobile()` hook for breakpoint detection

### Error Handling
- Try-catch for JSON parsing and external API calls
- Log errors with `console.error()` during development
- Prefer early returns over nested conditionals

## Performance Tips
- `useCallback` for event handlers passed to children
- `React.memo` for expensive renders
- `next/dynamic` for code-splitting heavy components
- React Flow handles its own virtualization
