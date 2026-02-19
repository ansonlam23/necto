# Coding Conventions

**Analysis Date:** 2026-02-19

## Naming Patterns

**Files:**
- Components: kebab-case (`button.tsx`, `workflow-canvas.tsx`, `provider-card.tsx`)
- Hooks: kebab-case with `use` prefix (`use-mobile.ts`, `use-wallet.ts`)
- Utilities: kebab-case (`utils.ts`, `workflow-store.ts`)
- API routes: route-specific (`route.ts` inside feature directory)
- Types: kebab-case (`akash.ts`, `types.ts`)

**Functions:**
- Components: PascalCase (`Button`, `ProviderCard`, `WorkflowCanvas`)
- Hooks: camelCase with `use` prefix (`useIsMobile`, `useWallet`)
- Utilities: camelCase (`cn`, `getTimeToDeploy`)
- Event handlers: camelCase with `on` prefix (`onDrop`, `onConnect`, `onSelect`)

**Variables:**
- camelCase for all variables (`isLoading`, `selectedNode`, `userAddress`)
- UPPER_SNAKE_CASE for true constants (`MOBILE_BREAKPOINT`, `FAUCET_AMOUNT`)

**Types:**
- Interfaces: PascalCase with descriptive names (`WalletState`, `ProviderCardProps`, `WorkflowNode`)
- Type aliases: PascalCase (`NodeCategory`, `DeploymentStatus`)
- Union types: PascalCase (`LeaseStatus`, `DeploymentStatus`)

**Exports:**
- Named exports preferred for components: `export function Button(...)`
- Named exports for utilities: `export function cn(...)`
- Named exports for types: `export interface WalletState`

## Code Style

**Formatting:**
- No Prettier config file detected - relies on ESLint for formatting
- 2-space indentation
- Semicolons used
- Single quotes for strings (observed in most files)
- Max line length appears to follow prettier default (~100 chars)

**Linting:**
- ESLint 9 with flat config: `offchain/eslint.config.mjs`
- Config extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**TypeScript:**
- Strict mode enabled in both `offchain/tsconfig.json` and `hardhat/tsconfig.json`
- `noEmit: true` - no compiled output
- `esModuleInterop: true`
- `isolatedModules: true`
- Path aliases: `@/*` maps to `./src/*`

## Import Organization

**Order (observed pattern):**
1. React imports: `import * as React from "react"` or `import { useCallback } from 'react'`
2. External libraries: `import { cva, type VariantProps } from "class-variance-authority"`
3. Internal aliases (`@/`): `import { cn } from "@/lib/utils"`
4. Relative imports: `import { nodeTypes } from "./custom-nodes"`

**Path Aliases:**
- `@/*` maps to `offchain/src/*`
- Use `@/` for all cross-directory imports
- Use relative imports only within same directory

**Example from `offchain/src/components/ui/button.tsx`:**
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
```

## Error Handling

**API Routes Pattern (from `offchain/src/app/api/deployments/route.ts`):**
```typescript
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validation
    if (!userAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Business logic...
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to list deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Patterns:**
- Always use try-catch in API routes
- Return `{ error: string }` for error responses
- Include HTTP status codes
- Use `error instanceof Error ? error.message : 'Unknown error'` for error details
- Log errors with `console.error()` before returning

**Client-Side Error Handling (from `offchain/src/hooks/use-wallet.ts`):**
```typescript
const connect = useCallback(async () => {
  try {
    const connector = connectors.find((c) => c.id === 'injected')
    if (connector) {
      await connectAsync({ connector })
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    throw error  // Re-throw for caller to handle
  }
}, [connectors, connectAsync])
```

**Patterns:**
- Catch, log, re-throw pattern for async operations
- Let caller decide how to surface errors to user

## Logging

**Framework:** Console API (`console.log`, `console.error`, `console.warn`)

**Patterns:**
```typescript
// Debug logging during development
console.log('WorkflowCanvas rendering with nodes:', nodes)
console.log('Store: Adding node', newNode)

// Error logging
console.error('Failed to connect wallet:', error)

// Warning logging
console.warn('Auto-accept bid failed:', bidError)
```

**When to Log:**
- Debug: State changes, render cycles, data flow
- Error: Caught exceptions, failed operations
- Warning: Non-critical failures, deprecations

**Production Note:** Debug `console.log` statements are present in production code. Consider using a logging library with levels for production.

## Comments

**When to Comment:**
- JSDoc for public APIs, libraries, and complex functions
- Block comments for file/module documentation
- Inline comments for non-obvious logic

**JSDoc/TSDoc Pattern (from `offchain/src/lib/agent/agent.ts`):**
```typescript
/**
 * @title Google ADK Agent
 * @notice Main agent implementation using Google ADK and AI Studio
 * @dev Routes compute jobs using tool-based architecture for multi-provider support
 */

/**
 * Route a compute job using the agent
 * 
 * This is the main entry point for job routing. It uses a tool-based
 * approach where the agent delegates to specialized tools rather than
 * having hardcoded provider logic.
 * 
 * Tool flow:
 * 1. compare_providers - Evaluate available providers
 * 2. route_to_akash - Execute routing on selected provider
 * 3. submit_job_to_blockchain (wallet tool) - Record on-chain (if tracked)
 */
export async function routeComputeJob(...) { ... }
```

**Notice/Dev Tags:**
- `@title` - Component/function name
- `@notice` - User-facing description
- `@dev` - Developer notes

**Inline Comments (from `offchain/src/app/api/deployments/route.ts`):**
```typescript
// TODO: Get authenticated user from session/JWT
// If auto-accept is enabled and bids come in quickly, accept the first one
// Don't fail the deployment creation if bid acceptance fails
```

## Function Design

**Size:** Functions vary from small utilities to larger business logic. Keep focused on single responsibility.

**Parameters:**
- Destructure in function parameters: `function Button({ className, variant, ...props }: ButtonProps)`
- Optional parameters with defaults: `variant = "default"`, `showDetails = true`
- Use interfaces for complex parameter types

**Return Values:**
- Explicit return types for public functions
- Promise types for async: `Promise<NextResponse>`, `Promise<void>`
- Object types for complex returns: `WalletState & WalletActions`

## Component Design

**Component Pattern (from `offchain/src/components/ui/button.tsx`):**
```typescript
// 1. Imports
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

// 2. Variants (if applicable)
const buttonVariants = cva("base-classes", { variants: { ... } })

// 3. Props interface
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive"
  asChild?: boolean
}

// 4. Component function
function Button({ className, variant = "default", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp className={cn(buttonVariants({ variant, className }))} {...props} />
}

// 5. Exports
export { Button, buttonVariants }
```

**Props Interface Pattern (from `offchain/src/components/akash/provider-card.tsx`):**
```typescript
interface ProviderCardProps {
  provider: Provider
  score?: ProviderScore
  isSelected?: boolean
  onSelect?: () => void
  onViewDetails?: () => void
  showDetails?: boolean
  className?: string
}
```

**Client Components:**
- Use `"use client"` directive at top of file for client-side components
- Required for hooks, event handlers, browser APIs

## Styling

**Tailwind CSS:**
- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Use semantic color variables: `bg-background`, `text-foreground`, `border-border`
- Dark mode via `dark:` variant; theme set via `className="dark"` on `<html>`

**Conditional Classes Pattern:**
```typescript
<div className={cn(
  "base-classes",
  isSelected && "selected-classes",
  className
)}>
```

**CSS Variables (from `offchain/src/app/globals.css`):**
- Theme uses CSS custom properties
- Colors: `--color-primary`, `--color-background`, etc.
- Radii: `--radius-sm`, `--radius-md`, `--radius-lg`

## State Management

**Global State (Zustand):**
- Store location: `offchain/src/lib/workflow-store.ts`
- Pattern: `create<StoreType>((set, get) => ({ ... }))`
- Usage: `const { nodes, addNode } = useWorkflowStore()`

**Local State (React):**
- `useState` for component-local state
- `useCallback` for memoized handlers passed to children
- `useEffect` for side effects and subscriptions

## Module Design

**Exports:**
- Named exports preferred: `export function ...`, `export const ...`
- Re-export for convenience: `export { routeToAkashTool, compareProvidersTool }`
- Index files for barrel exports: `export * from './tools'`

**Barrel Files:**
- `offchain/src/lib/agent/index.ts` - exports all agent modules
- `offchain/src/lib/agent/tools/index.ts` - exports all tools

---

*Convention analysis: 2026-02-19*
