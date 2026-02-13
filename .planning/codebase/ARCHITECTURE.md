# Architecture

**Analysis Date:** 2026-02-12

## Pattern Overview

**Overall:** Modern React application with Next.js App Router, following a component-based architecture with feature-focused organization. Uses React Flow for visual workflow editing and Zustand for centralized state management.

**Key Characteristics:**
- Next.js 16 App Router with React Server Components (pages marked `"use client"` when needed)
- Feature-based component organization (workflow, dashboard, layout)
- Visual workflow builder using `@xyflow/react` (React Flow)
- Global state management via Zustand stores
- shadcn/ui component library with Tailwind CSS v4 theming
- Web3 integration via wagmi/viem for Ethereum wallet connectivity

## Layers

**Presentation Layer (Pages):**
- Purpose: Route entry points and page composition
- Location: `src/app/`
- Contains: Next.js App Router pages, layout definitions
- Depends on: Components, hooks, stores
- Used by: Next.js router

**Feature Components Layer:**
- Purpose: Domain-specific UI components organized by feature
- Location: `src/components/workflow/`, `src/components/dashboard/`, `src/components/layout/`
- Contains: Workflow canvas, node palette, dashboard stats, navigation shell
- Depends on: UI components, hooks, stores
- Used by: Pages, other components

**UI Components Layer:**
- Purpose: Reusable presentational components
- Location: `src/components/ui/`
- Contains: shadcn/ui components (Button, Card, Dialog, Select, etc.)
- Depends on: `cn()` utility, Radix UI primitives
- Used by: Feature components, pages

**State Management Layer:**
- Purpose: Global application state
- Location: `src/lib/workflow-store.ts`
- Contains: Zustand store for workflow nodes, edges, selection state
- Depends on: `@xyflow/react` for node/edge types
- Used by: Workflow components, hooks

**Hooks Layer:**
- Purpose: Encapsulated reusable logic
- Location: `src/hooks/`
- Contains: `useWallet`, `useIsMobile`, wallet connection logic
- Depends on: wagmi, React
- Used by: Components needing Web3 or responsive behavior

**Utilities Layer:**
- Purpose: Helper functions and configurations
- Location: `src/lib/`
- Contains: `cn()` (class merging), wagmi config
- Depends on: tailwind-merge, clsx, wagmi
- Used by: All components

**Infrastructure Layer:**
- Purpose: External service configurations and providers
- Location: `src/components/web3-provider.tsx`, `src/lib/wagmi.ts`
- Contains: WagmiProvider, QueryClient setup
- Depends on: wagmi, @tanstack/react-query
- Used by: Root layout

## Data Flow

**Workflow Node Creation:**

1. User drags/clicks node from `NodePalette` (`src/components/workflow/node-palette.tsx`)
2. `onDragStart`/`handleAddNode` triggers store action via `useWorkflowStore.addNode()`
3. Store creates node with unique ID, position, and category
4. `workflow-canvas.tsx` subscribes to store and renders updated nodes via React Flow
5. React Flow handles internal position updates via `onNodesChange`

**Node Selection:**

1. User clicks node on canvas → `onNodeClick` callback
2. `selectNode(nodeId)` action updates `selectedNode` in store
3. `ConfigPanel` (`src/components/workflow/config-panel.tsx`) subscribes to `selectedNode`
4. Config panel conditionally renders configuration UI based on node type
5. User changes config → `updateNodeConfig()` updates node in store
6. Store updates trigger re-render of connected components

**Wallet Connection:**

1. `WalletConnect` component renders connect/disconnect UI
2. Calls `useWallet()` hook for wallet state and actions
3. Hook delegates to wagmi hooks (`useConnection`, `useConnect`, etc.)
4. `Web3Provider` provides wagmi context at app root
5. Wallet state flows back up through hook to UI

**State Management:**
- **Global:** Zustand store for workflow state (nodes, edges, selection)
- **Local:** React `useState` for component-specific UI state
- **Context:** React Flow context for canvas interactions (within `ReactFlowProvider`)

## Key Abstractions

**WorkflowNode (Extended React Flow Node):**
- Purpose: Domain-specific node type for DePIN workflow builder
- Definition: `src/lib/workflow-store.ts` (lines 6-9)
- Pattern: Extends `@xyflow/react`'s `Node` with `category` and `config` fields
- Categories: `trigger`, `logic`, `provider`, `settlement`

**CustomNode Component:**
- Purpose: Visual rendering of workflow nodes with category-based styling
- Location: `src/components/workflow/custom-nodes.tsx`
- Pattern: React Flow custom node with Handle components for connections
- Features: Dynamic icon mapping, category-based color coding, input/output handle visibility

**Node Templates:**
- Purpose: Catalog of available node types for palette
- Location: `src/components/workflow/custom-nodes.tsx` (lines 108-128)
- Pattern: Static configuration objects mapping to Lucide icons and categories
- Sections: Triggers, Logic, Providers, Settlement

**shadcn/ui Component Pattern:**
- Purpose: Consistent UI component API using Radix primitives
- Location: `src/components/ui/*.tsx`
- Pattern: cva (class-variance-authority) for variant styling, `cn()` for class merging
- Example: `Button` component with variant/size props and `asChild` pattern

**Web3 Provider Wrapper:**
- Purpose: Provide Ethereum wallet connectivity throughout app
- Location: `src/components/web3-provider.tsx`
- Pattern: HOC wrapping wagmi and TanStack Query providers
- Configuration: `src/lib/wagmi.ts` with mainnet/sepolia chains and injected connector

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: All page loads
- Responsibilities: 
  - Load Geist fonts
  - Apply dark theme (`className="dark"`)
  - Wrap in `Web3Provider` and `AppShell`
  - Define metadata

**Dashboard Page:**
- Location: `src/app/page.tsx`
- Route: `/`
- Responsibilities: Display network stats, transaction list, alerts
- Components: `DashboardStats`, `NetworkStatus`

**Workflow Builder Page:**
- Location: `src/app/builder/page.tsx`
- Route: `/builder`
- Responsibilities: Visual workflow editor interface
- Components: `NodePalette`, `WorkflowCanvas`, `ConfigPanel`, `TestCanvas`
- Pattern: Three-pane layout (palette, canvas, config) within `ReactFlowProvider`

**Test Builder Page:**
- Location: `src/app/test-builder/page.tsx`
- Route: `/test-builder`
- Responsibilities: Standalone working example of React Flow
- Pattern: Self-contained local state (not using global store)

**Settings Page:**
- Location: `src/app/settings/page.tsx`
- Route: `/settings`
- Responsibilities: System configuration placeholder

**Audit Log Page:**
- Location: `src/app/audit/page.tsx`
- Route: `/audit`
- Responsibilities: Transaction history placeholder

## Error Handling

**Strategy:** Try-catch with console logging for debugging

**Patterns:**
- Wallet operations catch and log errors: `src/hooks/use-wallet.ts` (lines 34-43)
- Drag-drop operations catch JSON parse errors: `src/components/workflow/workflow-canvas.tsx` (lines 62-65)
- Graceful fallbacks for missing data (e.g., default Activity icon in `custom-nodes.tsx`)

## Cross-Cutting Concerns

**Logging:**
- Console logging used extensively for workflow debugging
- Pattern: `console.log('Component: action', data)` throughout workflow components

**Validation:**
- Basic type checking via TypeScript strict mode
- Runtime validation minimal (TODO comments indicate planned save/deploy validation)

**Authentication:**
- Web3 wallet-based authentication via wagmi
- Mock admin user in sidebar (hardcoded: `admin@necto.io`)
- No server-side auth guards currently implemented

**Styling:**
- Tailwind CSS v4 with CSS-first configuration
- Design tokens via CSS variables (oklch color space)
- Dark theme as default (`className="dark"` on html element)
- `terminal-data` class for monospace numeric display
- Extensive CSS overrides for React Flow white background

---

*Architecture analysis: 2026-02-12*
