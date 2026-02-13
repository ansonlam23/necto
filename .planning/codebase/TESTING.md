# Testing Patterns

**Analysis Date:** 2026-02-12

## Test Framework Status

**Current State:** No test framework configured

As noted in project documentation, no test framework is currently installed or configured. This is a gap that should be addressed for production readiness.

## Recommended Test Setup

### Framework Selection
For this Next.js + React + TypeScript project, **Vitest** is recommended:
- Fast execution with Vite integration
- Native TypeScript support
- Compatible with React Testing Library
- Good match for Next.js 16 and React 19

### Installation Commands
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### Configuration
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## Test File Organization

### Recommended Location
- Co-located with source files OR
- Mirror structure in `src/__tests__/` directory

### Naming Convention
- Files: `{filename}.test.ts` or `{filename}.test.tsx`
- Example: `button.test.tsx`, `use-wallet.test.ts`

### Directory Structure
```
src/
  components/
    ui/
      button.tsx
      button.test.tsx     # Co-located test
  hooks/
    use-wallet.ts
    use-wallet.test.ts   # Co-located test
  __tests__/
    integration/          # Integration tests
    e2e/                  # E2E tests (if applicable)
  test/
    setup.ts             # Test setup and mocks
    fixtures/            # Test data
```

## Test Structure

### Unit Test Pattern
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Hook Test Pattern
```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from './use-mobile'

describe('useIsMobile', () => {
  it('returns false for desktop viewport', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
```

## Mocking Patterns

### External Libraries
Mock external SDKs and clients:
```typescript
// src/test/mocks/wagmi.ts
vi.mock('wagmi', () => ({
  useConnection: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
  useChainId: vi.fn(),
}))
```

### Zustand Stores
```typescript
// Mock store for testing
const mockStore = {
  nodes: [],
  edges: [],
  selectedNode: null,
  addNode: vi.fn(),
  selectNode: vi.fn(),
}

vi.mock('@/lib/workflow-store', () => ({
  useWorkflowStore: vi.fn(() => mockStore),
}))
```

### What to Mock
- External APIs (wagmi, React Query)
- Browser APIs (matchMedia, clipboard)
- Zustand stores
- Complex child components

### What NOT to Mock
- Simple UI components being tested
- Utility functions (test them directly)
- Type definitions

## Fixtures and Factories

### Test Data Location
- `src/test/fixtures/` for reusable test data

### Fixture Pattern
```typescript
// src/test/fixtures/nodes.ts
import { WorkflowNode, NodeCategory } from '@/lib/workflow-store'

export const createMockNode = (overrides?: Partial<WorkflowNode>): WorkflowNode => ({
  id: 'test-node-1',
  type: 'trigger',
  position: { x: 100, y: 100 },
  data: { label: 'Test Node' },
  category: 'trigger' as NodeCategory,
  config: {},
  ...overrides,
})

export const mockNodes: WorkflowNode[] = [
  createMockNode(),
  createMockNode({ id: 'test-node-2', category: 'logic' }),
]
```

## Coverage

### Recommended Targets
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### View Coverage
```bash
npm run test:coverage
```

### Coverage Configuration
```typescript
// vitest.config.ts
test: {
  coverage: {
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/test/',
      '**/*.d.ts',
    ],
  },
}
```

## Test Commands

### Recommended Scripts (add to package.json)
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Priority Test Areas

### High Priority (Core Functionality)
1. **Hooks:** `use-wallet.ts` - Wallet connection logic
2. **Store:** `workflow-store.ts` - Node/edge operations
3. **Components:** `workflow-canvas.tsx` - Drag and drop, node interactions

### Medium Priority (UI Components)
1. **UI Components:** Button, Input, Card variants
2. **Layout Components:** AppShell, AppSidebar
3. **Dashboard:** DashboardStats calculations

### Low Priority (Visual Only)
1. Pure styling components
2. Static content pages
3. Icon components

## Testing Checklist for New Code

- [ ] Unit tests for utility functions
- [ ] Component tests for interactive UI
- [ ] Hook tests for custom React hooks
- [ ] Mock external dependencies
- [ ] Test error states and edge cases
- [ ] Verify accessibility attributes
- [ ] Test responsive behavior (if applicable)

## Integration Testing

### Scope
- Test component interactions
- Test store + component integration
- Test routing behavior

### Example
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkflowCanvas } from '@/components/workflow/workflow-canvas'
import { useWorkflowStore } from '@/lib/workflow-store'

describe('Workflow Integration', () => {
  it('adds node when dropped on canvas', () => {
    // Test drag and drop interaction
    // Verify store state updates
    // Verify node appears in DOM
  })
})
```

---

*Testing analysis: 2026-02-12*

**Note:** Testing infrastructure needs to be set up. No tests currently exist in the codebase.
