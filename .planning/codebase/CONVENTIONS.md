# Coding Conventions

**Analysis Date:** 2026-02-12

## Naming Patterns

### Files
- **Components:** kebab-case (`button.tsx`, `workflow-canvas.tsx`)
- **Hooks:** kebab-case starting with `use` (`use-mobile.ts`, `use-wallet.ts`)
- **Utilities:** kebab-case (`utils.ts`, `workflow-store.ts`)
- **Pages:** kebab-case for route directories, `page.tsx` for route files

### Functions/Variables
- camelCase for all functions and variables
- Examples: `onDrop`, `selectedNode`, `addNode`, `isConnected`

### Components
- PascalCase for component names
- Function declarations used (not arrow functions)
- Props interface named with component name + "Props"
- Example:
```typescript
interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  // ...
}
```

### Hooks
- camelCase with `use` prefix
- Example: `useWallet()`, `useIsMobile()`, `useWorkflowStore()`

### Types/Interfaces
- PascalCase for type names
- Prefer `interface` over `type` for extensible definitions
- Use type aliases for unions
- Example:
```typescript
export interface WorkflowNode extends Node {
  category: NodeCategory
  config?: Record<string, any>
}

export type NodeCategory = 'trigger' | 'logic' | 'provider' | 'settlement'
```

### Constants
- UPPER_SNAKE_CASE for true constants
- Example: `const MOBILE_BREAKPOINT = 768`

## Code Style

### Formatting
- **Indentation:** 2 spaces
- **Semicolons:** Use semicolons
- **Quotes:** Single quotes for strings (double quotes for JSX attributes)
- **Trailing commas:** No trailing commas in multi-line objects
- **Line length:** Max 100 characters (prettier default)

### Linting
- **Tool:** ESLint 9.x with `eslint-config-next`
- **Config:** `eslint.config.mjs`
- Uses Next.js core-web-vitals and typescript configurations

### TypeScript
- Strict mode enabled
- Always define types for function parameters and return values
- Use `React.ComponentProps<"element">` for HTML prop extensions
- Example:
```typescript
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn(styles, className)} {...props} />
}
```

## Import Organization

### Order
1. React imports
2. External library imports
3. Internal imports using `@/` path aliases
4. Relative imports (only for files in the same directory)

### Example
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import { nodeTypes } from "./custom-nodes"
```

### Path Aliases
- `@/*` maps to `./src/*`
- Use for all project imports except relative files in same directory
- Example: `import { Button } from "@/components/ui/button"`

## Error Handling

### Patterns
- Use try-catch for parsing operations (JSON.parse)
- Log errors with `console.error()` for debugging
- Prefer early returns over nested conditionals
- Example:
```typescript
try {
  const { nodeType, nodeData } = JSON.parse(data)
  // ...
} catch (error) {
  console.error('Error parsing drag data:', error)
}
```

### Async Error Handling
- Wrap async operations in try-catch
- Log errors before re-throwing
- Example from `src/hooks/use-wallet.ts`:
```typescript
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

## Logging

### Framework
- Use native `console` methods
- `console.log()` for debugging flow
- `console.error()` for errors

### Patterns
- Log state changes in stores for debugging
- Example from `src/lib/workflow-store.ts`:
```typescript
console.log('Store: Adding node', newNode)
console.log('Store: Current nodes count:', currentNodes.length)
```

## Styling

### Tailwind CSS
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Use CSS variables from design system (`bg-background`, `text-foreground`)
- Prefer semantic class names over arbitrary values
- Dark mode: use `dark:` variant

### Example Pattern
```typescript
className={cn(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
  className
)}
```

### Component Variants
- Use cva (class-variance-authority) for variant components
- Define variants, sizes, and defaults
- Example from `src/components/ui/button.tsx`:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // ...
      },
      size: {
        default: "h-9 px-4 py-2",
        // ...
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Component Patterns

### Client Components
- Use `"use client"` directive at top of file for client components
- Required for: hooks, browser APIs, event handlers

### Props Destructuring
- Destructure props in function parameters
- Use rest pattern for spreading remaining props
- Example:
```typescript
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(styles, className)} {...props} />
}
```

### asChild Pattern
- Use Radix Slot for composable components
- Example:
```typescript
const Comp = asChild ? Slot.Root : "button"
return <Comp {...props} />
```

## State Management

### Zustand Stores
- Store files in `src/lib/`
- Use TypeScript interfaces for store shape
- Export hook with `use` prefix
- Example:
```typescript
interface WorkflowStore {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNode: WorkflowNode | null
  setNodes: (nodes: WorkflowNode[]) => void
  // ...
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // implementation
}))
```

### Local State
- Use React hooks (useState, useCallback) for local component state
- Use useCallback for event handlers passed to child components

## Module Exports

### Named Exports
- Prefer named exports for components
- Export component and related utilities
- Example:
```typescript
export { Button, buttonVariants }
```

### Barrel Files
- Not heavily used; direct imports preferred
- Components export from their own files

## Comments

### When to Comment
- Explain complex logic or business rules
- Document workarounds or temporary fixes
- Use console.log for debugging (remove before production)

### JSDoc/TSDoc
- Not consistently used
- Types provide documentation through TypeScript

---

*Convention analysis: 2026-02-12*
