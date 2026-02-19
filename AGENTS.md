# Agent Guidelines for Necto

This is a Next.js 16 + React 19 + TypeScript project with Tailwind CSS v4 and shadcn/ui components.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Production | `npm run start` |
| Lint | `npm run lint` |
| Lint file | `npx eslint offchain/src/path/to/file.tsx` |

**Note:** No test framework is configured. If adding tests, install and configure Vitest or Jest first.

## Code Style

### TypeScript
- Strict mode enabled - always define types for function parameters and return values
- Use interfaces for object shapes, type aliases for unions
- Prefer `interface` over `type` for extensible definitions
- Use `React.ComponentProps<"element">` for HTML prop extensions

### Imports
- Use `@/` path aliases for all project imports: `@/components/ui/button`, `@/lib/utils`
- Use relative imports only for files in the same directory
- Group imports: React → External libs → Internal (@/) → Relative
- Named imports preferred; use `* as React` when needed
- Example:
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import { nodeTypes } from "./custom-nodes"
```

### Formatting
- 2-space indentation
- Use semicolons
- Single quotes for strings
- No trailing commas in multi-line objects (follow existing patterns)
- Max line length: 100 characters (prettier default)

### Naming Conventions
- **Components**: PascalCase (`Button`, `WorkflowCanvas`)
- **Files**: kebab-case (`workflow-canvas.tsx`, `use-mobile.ts`)
- **Functions/Variables**: camelCase (`onDrop`, `selectedNode`)
- **Hooks**: camelCase with `use` prefix (`useWorkflowStore`)
- **Types/Interfaces**: PascalCase (`WorkflowNode`, `NodeCategory`)
- **Constants**: UPPER_SNAKE_CASE for true constants

### Component Patterns
- Use function declarations for components (not arrow functions)
- Props interface named with component name + "Props"
- Destructure props in function parameters
- Use `"use client"` directive for client components
- Use `asChild` pattern from Radix for composable components
- Example:
```typescript
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive"
}

function Button({ className, variant = "default", ...props }: ButtonProps) {
  return <button className={cn(styles, className)} {...props} />
}
```

### Styling
- Use Tailwind CSS with `cn()` utility from `@/lib/utils` for conditional classes
- Use CSS variables from design system (`bg-background`, `text-foreground`)
- Prefer semantic class names over arbitrary values
- Dark mode: use `dark:` variant; theme is set via `className="dark"` on html

### State Management
- Use Zustand for global state (see `@/lib/workflow-store.ts`)
- Use React hooks (useState, useCallback) for local component state

### Error Handling
- Use try-catch for parsing operations (JSON.parse)
- Log errors with `console.error()` for debugging
- Prefer early returns over nested conditionals

### File Structure
```
offchain/src/
  app/              # Next.js App Router pages
  components/
    ui/             # shadcn/ui components
    layout/         # Layout components (AppShell, AppSidebar)
    workflow/       # Feature-specific components
  lib/
    utils.ts        # cn() utility
    workflow-store.ts  # Zustand stores
  hooks/            # Custom React hooks
```

### shadcn/ui Guidelines
- Install new components with: `npx shadcn add <component>`
- Components live in `offchain/src/components/ui/`
- Use existing components as templates for new UI components
- Follow the cva (class-variance-authority) pattern for variant components

### Performance
- Use `useCallback` for event handlers passed to child components
- Use `React.memo` for expensive renders
- Lazy load heavy components with `next/dynamic`

### MCP
- Every time you use documentation from a provider, call the context7 mcp. This is the source of truth for all provider information.

### Miscellaenous
- Do not commit for every change that happens inside when using gsd agents. Commits should be done with human intervention.

### The edit tool is broken for opencode agents
- Use the write tool instead

### Typechecking
cd offchain && npx tsc --noEmit 2>&1