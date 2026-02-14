# Architecture

**Analysis Date:** 2026-02-14

## Pattern Overview

**Overall:** Next.js 16 App Router with React Server Components and Client Components layered pattern

**Key Characteristics:**
- App Router with page-based routing
- Client/Server component boundary with explicit `"use client"` directives
- Zustand for client-side state management (workflows)
- React Query (TanStack) for server state management
- Wagmi/viem for blockchain integration
- Custom hooks for reusable logic encapsulation
- Shadcn/ui + Radix UI for component composition
- Tailwind CSS v4 for styling with CSS variables for theming

## Layers

**Presentation Layer:**
- Purpose: UI rendering and user interaction
- Location: `offchain/src/app/**/page.tsx`, `offchain/src/components/**`
- Contains: Pages, layout components, UI components, workflow visualizations
- Depends on: Hooks, stores, utilities
- Used by: Next.js routing system

**State Management Layer:**
- Purpose: Client-side and server state management
- Location: `offchain/src/lib/workflow-store.ts`, `offchain/src/lib/wagmi.ts`
- Contains: Zustand stores, Wagmi configuration, React Query setup
- Depends on: External libraries (zustand, wagmi, @tanstack/react-query)
- Used by: Components, hooks

**Hook Layer:**
- Purpose: Reusable logic and data fetching abstractions
- Location: `offchain/src/hooks/**`
- Contains: Custom React hooks for wallet connection, mobile detection
- Depends on: Wagmi hooks, React APIs
- Used by: Components

**Service/Integration Layer:**
- Purpose: External API integrations and data fetching
- Location: `offchain/src/lib/providers/**`
- Contains: Provider fetchers (Akash API integration)
- Depends on: External APIs
- Used by: Server components, API routes

**Utility Layer:**
- Purpose: Helper functions and shared utilities
- Location: `offchain/src/lib/utils.ts`
- Contains: `cn()` utility for Tailwind class merging
- Depends on: clsx, tailwind-merge
- Used by: All layers

**UI Component Layer:**
- Purpose: Reusable UI primitives
- Location: `offchain/src/components/ui/**`
- Contains: Button, Card, Dialog, Dropdown, Input, etc.
- Depends on: Radix UI primitives, Tailwind, cva
- Used by: All feature components

## Data Flow

**Workflow Builder Flow:**

1. User drags node from `NodePalette` (`offchain/src/components/workflow/node-palette.tsx`)
2. Drop triggers `onDrop` in `WorkflowCanvas` (`offchain/src/components/workflow/workflow-canvas.tsx`)
3. Canvas calls `addNode()` from `useWorkflowStore` (`offchain/src/lib/workflow-store.ts`)
4. Zustand store updates and triggers re-render of subscribed components
5. React Flow renders updated nodes from store state

**Provider Data Flow:**

1. Server component `ProvidersPage` (`offchain/src/app/providers/page.tsx`) renders
2. Suspense boundary wraps `ProviderGrid` async component
3. `fetchAkashProviders()` (`offchain/src/lib/providers/akash-fetcher.ts`) fetches from Akash Console API
4. Data transforms from Akash format to internal `SynapseProvider` type
5. Component renders `ProviderCard` components with transformed data

**Wallet Connection Flow:**

1. User clicks `WalletConnect` button (`offchain/src/components/wallet-connect.tsx`)
2. `useWallet` hook (`offchain/src/hooks/use-wallet.ts`) manages connection state
3. Wagmi provider handles injected wallet connection
4. Connection state propagates through `Web3Provider` context (`offchain/src/components/web3-provider.tsx`)
5. UI updates to show connected address and dropdown menu

**State Management:**

- **Global Client State:** Zustand store in `offchain/src/lib/workflow-store.ts` for workflow nodes/edges
- **Server State:** React Query via Wagmi's QueryClientProvider for blockchain data
- **Local Component State:** React useState for UI interactions (sidebar state, modals)

## Key Abstractions

**WorkflowNode Type:**
- Purpose: Unified node representation for React Flow
- Location: `offchain/src/lib/workflow-store.ts`
- Pattern: Extends React Flow's Node type with custom `category` and `config` fields

**NodeCategory Enum:**
- Purpose: Categorizes workflow nodes by function
- Values: `'trigger' | 'logic' | 'provider' | 'settlement'`
- Pattern: Used for styling, palette organization, and connection validation

**SynapseProvider Type:**
- Purpose: Normalized provider representation across different sources
- Location: `offchain/src/lib/providers/akash-fetcher.ts`
- Pattern: Transforms external API responses into consistent internal format

**Custom Node Components:**
- Purpose: Visual representation of workflow nodes
- Location: `offchain/src/components/workflow/custom-nodes.tsx`
- Pattern: Category-based styling with dynamic icon mapping

## Entry Points

**Application Entry:**
- Location: `offchain/src/app/layout.tsx`
- Triggers: Next.js root layout render
- Responsibilities: 
  - Font loading (Geist Sans/Mono)
  - Metadata configuration
  - Web3Provider wrapper
  - AppShell layout wrapper
  - Dark mode class on html

**Page Entry Points:**
- Dashboard: `offchain/src/app/page.tsx`
- Providers: `offchain/src/app/providers/page.tsx`
- Workflow Builder: `offchain/src/app/builder/page.tsx`
- Settings: `offchain/src/app/settings/page.tsx`
- Audit: `offchain/src/app/audit/page.tsx`

**Component Entry Points:**
- AppShell: `offchain/src/components/layout/AppShell.tsx` - Layout wrapper
- Web3Provider: `offchain/src/components/web3-provider.tsx` - Blockchain context

## Error Handling

**Strategy:** Console logging with graceful degradation

**Patterns:**
- Try-catch blocks around JSON parsing operations
- API fetch fallbacks (multiple endpoints attempted in `fetchAkashProviders`)
- Empty arrays returned on fetch failure rather than throwing
- Optional chaining for potentially undefined values

## Cross-Cutting Concerns

**Logging:** Console logging for debugging (to be replaced with proper logging in production)

**Validation:** Runtime validation via TypeScript strict mode; minimal runtime validation currently

**Authentication:** Wallet-based authentication via Wagmi; no session management

**Styling:**
- Tailwind CSS with CSS custom properties for theming
- Dark mode default with cyberpunk-professional color scheme
- `cn()` utility for conditional class merging

**Type Safety:**
- TypeScript strict mode enabled
- Interface definitions for all data shapes
- Type exports for cross-module usage

---

*Architecture analysis: 2026-02-14*
