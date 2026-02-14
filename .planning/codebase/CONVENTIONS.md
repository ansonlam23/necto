# Coding Conventions

**Analysis Date:** 2026-02-14

## Naming Patterns

**Files:**
- Components: PascalCase with matching filename - `AppShell.tsx`, `WorkflowCanvas.tsx`
- Hooks: camelCase with `use` prefix - `use-wallet.ts`, `use-mobile.ts`
- Utilities: camelCase - `utils.ts`, `workflow-store.ts`
- Page files: camelCase - `page.tsx`, `layout.tsx`

**Components:**
```typescript
// Use function declarations (not arrow functions)
function Button({ className, variant = "default", ...props }: ButtonProps) {
  return <button className={cn(styles, className)} {...props} />
}

// Props interface named with component name + "Props"
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive"
}
```

**Variables/Functions:**
```typescript
// camelCase for variables and functions
const selectedNode = useWorkflowStore(state => state.selectedNode)
const onDragStart = (event: React.DragEvent, nodeType: string) => { ... }

// UPPER_SNAKE_CASE for constants
const MOBILE_BREAKPOINT = 768
```

**Types/Interfaces:**
```typescript
// PascalCase for types and interfaces
interface WorkflowNode extends Node {
  category: NodeCategory
  config?: Record<string, any>
}

type NodeCategory = 'trigger' | 'logic' | 'provider' | 'settlement'
```

**React Hooks:**
```typescript
// camelCase with 'use' prefix
export function useWallet(): WalletState & WalletActions { ... }
export function useIsMobile() { ... }
```

## Code Style

**Formatting:**
- 2-space indentation (no tabs)
- Use semicolons
- Single quotes for strings
- No trailing commas in multi-line objects
- Max line length: 100 characters (prettier default)

**TypeScript:**
- Strict mode enabled (`tsconfig.json`)
- Always define types for function parameters and return values
- Use interfaces for object shapes
- Use type aliases for unions
- Prefer `interface` over `type` for extensible definitions
- Use `React.ComponentProps<"element">` for HTML prop extensions

**Client Components:**
```typescript
// Always use "use client" directive at top of file
"use client"

import { useCallback } from 'react'
```

## Import Organization

**Order:**
```typescript
// 1. React imports
import * as React from "react"
import { useCallback } from 'react'

// 2. External library imports (grouped by source)
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { WagmiProvider } from 'wagmi'

// 3. Internal imports using @/ path aliases
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/lib/workflow-store"
import { Button } from "@/components/ui/button"

// 4. Relative imports only for same directory
import { nodeTypes } from "./custom-nodes"
```

**Path Aliases:**
- `@/*` → `./offchain/src/*`
- `@/components/*` → `./offchain/src/components/*`
- `@/lib/*` → `./offchain/src/lib/*`
- `@/hooks/*` → `./offchain/src/hooks/*`

## Error Handling

**Patterns:**
```typescript
// Use try-catch for parsing operations
const onDrop = useCallback((event: React.DragEvent) => {
  try {
    const { nodeType, nodeData } = JSON.parse(data)
    // ... handle parsed data
  } catch (error) {
    console.error('Error parsing drag data:', error)
  }
}, [addNode])

// Async error handling in hooks
const connect = async () => {
  try {
    const connector = connectors.find((c) => c.id === 'injected')
    if (connector) {
      await connectAsync({ connector })
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    throw error
  }
}
```

**Preferred approach:**
- Use `console.error()` for debugging
- Prefer early returns over nested conditionals
- Re-throw errors when they need to bubble up

## Logging

**Framework:** Console-based logging

**Patterns:**
```typescript
// Debug logging with descriptive messages
console.log('WorkflowCanvas rendering with nodes:', nodes)
console.log('Store: Adding node', newNode)
console.error('Failed to connect wallet:', error)
```

## Comments

**When to Comment:**
- Explain non-obvious logic or workarounds
- Document component behavior

**Examples:**
```typescript
// Main component - no need for wrapper since we're inside ReactFlowProvider
export function WorkflowCanvas() { ... }

// Map icon names to icon components
const iconMap: Record<string, LucideIcon> = { ... }

// Default icon if none provided
Icon = Activity
```

**JSDoc/TSDoc:**
- Not extensively used in this codebase
- TypeScript types provide sufficient documentation

## Function Design

**Size:**
- Keep functions focused and under 50 lines when possible
- Extract complex logic into separate functions

**Parameters:**
```typescript
// Destructure props in function parameters
function Button({ className, variant = "default", asChild = false, ...props }: ButtonProps) { ... }

// Use default values for optional props
const switchChain = async (targetChainId: number) => { ... }
```

**Return Values:**
```typescript
// Explicit return types for hooks
export function useWallet(): WalletState & WalletActions { ... }

// Use proper type annotations
const stats = [
  { title: "Active Compute Units", changeType: "increase" as const }
]
```

## Module Design

**Exports:**
```typescript
// Named exports for most components
export function Button({ ... }) { ... }
export { Button, buttonVariants }

// Default exports for Next.js pages
export default function DashboardPage() { ... }

// Type exports
export type NodeCategory = 'trigger' | 'logic' | 'provider' | 'settlement'
export interface WorkflowNode extends Node { ... }
```

**Barrel Files:**
- Not used in this codebase
- Import directly from component files

## State Management

**Zustand Pattern:**
```typescript
// Define store interface
interface WorkflowStore {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNode: WorkflowNode | null
  addNode: (node: Omit<WorkflowNode, 'id'>) => void
}

// Create store with actions
export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  addNode: (nodeData) => {
    const id = nodeData.id || `${nodeData.type}-${Date.now()}`
    set({ nodes: [...get().nodes, newNode] })
  }
}))
```

**Local State:**
```typescript
// Use React hooks for local component state
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
```

## Component Patterns

**shadcn/ui Pattern:**
```typescript
// Use cva (class-variance-authority) for variant components
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**asChild Pattern:**
```typescript
// Use Slot.Root from Radix for composable components
function Button({ asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp data-slot="button" {...props} />
}
```

## Styling

**Tailwind CSS:**
- Use Tailwind CSS with `cn()` utility from `@/lib/utils` for conditional classes
- Use CSS variables from design system (`bg-background`, `text-foreground`)
- Prefer semantic class names over arbitrary values
- Dark mode: use `dark:` variant; theme set via `className="dark"` on html

```typescript
// cn() utility for conditional classes
className={cn(buttonVariants({ variant, size, className }))}

// Semantic class names
<div className="bg-card border-border h-full overflow-y-auto">

// Dark mode variant
<span className="text-lg tracking-tight cyberpunk-glow dark:aria-invalid:ring-destructive/40">
```

## Performance Patterns

**useCallback:**
```typescript
// Use useCallback for event handlers passed to child components
const onDrop = useCallback((event: React.DragEvent) => {
  // ... handle drop
}, [addNode])
```

**React.memo:**
- Not explicitly used yet; considered for expensive renders

---

*Convention analysis: 2026-02-14*
