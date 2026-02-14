# Testing Patterns

**Analysis Date:** 2026-02-14

## Test Framework Status

**Current State: NO TEST FRAMEWORK CONFIGURED**

No test framework is currently installed or configured in this project. The `test/` directory exists but is empty.

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

**Missing:** No test-related scripts present.

## Recommended Test Setup

Since this is a Next.js 16 + React 19 + TypeScript project, **Vitest** is the recommended test framework for compatibility with modern React and TypeScript features.

### Installation Commands

```bash
# Install Vitest and testing utilities
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# For mocking fetch and async operations
npm install -D msw
```

### Configuration Files

**vitest.config.ts** (create at project root):
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['offchain/src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**test/setup.ts** (create):
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

### Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Test File Organization

**Recommended Location:** Co-located with source files

```
offchain/src/
  components/
    ui/
      button.tsx
      button.test.tsx          # Test file next to component
    workflow/
      workflow-canvas.tsx
      workflow-canvas.test.tsx
  lib/
    workflow-store.ts
    workflow-store.test.ts
  hooks/
    use-wallet.ts
    use-wallet.test.ts
```

**Alternative:** Separate `test/` directory structure

```
test/
  components/
    button.test.tsx
    workflow-canvas.test.tsx
  hooks/
    use-wallet.test.ts
  lib/
    workflow-store.test.ts
```

## Test Structure Patterns

**Component Test Example:**
```typescript
// offchain/src/components/ui/button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Button ref={ref}>Click me</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
```

**Hook Test Example:**
```typescript
// offchain/src/hooks/use-mobile.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobile } from './use-mobile'

describe('useIsMobile', () => {
  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false for desktop viewport', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true when viewport is mobile', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })
})
```

**Store Test Example:**
```typescript
// offchain/src/lib/workflow-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkflowStore } from './workflow-store'

describe('workflow store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkflowStore.setState({
      nodes: [],
      edges: [],
      selectedNode: null,
    })
  })

  it('adds a node', () => {
    const { addNode } = useWorkflowStore.getState()
    
    addNode({
      type: 'trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Test Node' },
      category: 'trigger',
    })

    const { nodes } = useWorkflowStore.getState()
    expect(nodes).toHaveLength(1)
    expect(nodes[0].data.label).toBe('Test Node')
  })

  it('selects a node', () => {
    const { addNode, selectNode } = useWorkflowStore.getState()
    
    addNode({
      type: 'trigger',
      position: { x: 100, y: 100 },
      data: { label: 'Test Node' },
      category: 'trigger',
    })

    const { nodes } = useWorkflowStore.getState()
    selectNode(nodes[0].id)

    const { selectedNode } = useWorkflowStore.getState()
    expect(selectedNode).toBeDefined()
    expect(selectedNode?.id).toBe(nodes[0].id)
  })
})
```

## Mocking Patterns

**Mock External Libraries:**
```typescript
// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  ReactFlow: vi.fn(({ children }) => <div>{children}</div>),
  Background: vi.fn(() => <div data-testid="background" />),
  Controls: vi.fn(() => <div data-testid="controls" />),
  MiniMap: vi.fn(() => <div data-testid="minimap" />),
  addEdge: vi.fn((connection, edges) => [...edges, connection]),
  applyNodeChanges: vi.fn((changes, nodes) => nodes),
  applyEdgeChanges: vi.fn((changes, edges) => edges),
}))

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useConnection: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
  })),
  useChainId: vi.fn(() => 1),
  useConnectors: vi.fn(() => [{ id: 'injected', name: 'Injected' }]),
  useConnect: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useDisconnect: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}))
```

**Mock Next.js Router:**
```typescript
// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}))
```

## What to Mock

**Mock:**
- External API calls (use MSW)
- Browser APIs (matchMedia, localStorage, etc.)
- Third-party library behavior
- Next.js router and navigation
- Web3/wallet connections

**Do NOT Mock:**
- Simple utility functions (test actual behavior)
- React built-ins
- Zustand stores (use actual store with reset)

## Common Testing Scenarios

**Testing Event Handlers:**
```typescript
it('handles drag events', () => {
  const onDrop = vi.fn()
  render(<WorkflowCanvas onDrop={onDrop} />)
  
  const canvas = screen.getByTestId('canvas')
  fireEvent.drop(canvas, {
    dataTransfer: {
      getData: vi.fn().mockReturnValue(JSON.stringify({ nodeType: 'trigger' })),
    },
  })
  
  expect(onDrop).toHaveBeenCalled()
})
```

**Testing Async Operations:**
```typescript
it('connects wallet successfully', async () => {
  const { result } = renderHook(() => useWallet())
  
  await act(async () => {
    await result.current.connect()
  })
  
  expect(result.current.isConnected).toBe(true)
})
```

**Testing Error States:**
```typescript
it('handles connection error', async () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const mockConnect = vi.fn().mockRejectedValue(new Error('User rejected'))
  
  vi.mocked(useConnect).mockReturnValue({
    mutateAsync: mockConnect,
  })
  
  const { result } = renderHook(() => useWallet())
  
  await expect(result.current.connect()).rejects.toThrow('User rejected')
  expect(consoleSpy).toHaveBeenCalledWith('Failed to connect wallet:', expect.any(Error))
  
  consoleSpy.mockRestore()
})
```

## Coverage Recommendations

**Priority Areas (High):**
- `offchain/src/lib/workflow-store.ts` - Core business logic
- `offchain/src/hooks/use-wallet.ts` - Wallet connection logic
- `offchain/src/components/workflow/custom-nodes.tsx` - Node rendering
- `offchain/src/components/ui/*.tsx` - UI components

**Priority Areas (Medium):**
- `offchain/src/components/workflow/workflow-canvas.tsx` - Canvas interactions
- `offchain/src/components/workflow/node-palette.tsx` - Drag and drop
- `offchain/src/components/layout/*.tsx` - Layout components

**Target Coverage:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Test Commands (After Setup)

```bash
# Run all tests
npm run test

# Run tests in watch mode (development)
npm run test

# Run tests once (CI)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run tests for specific file
npx vitest offchain/src/components/ui/button.test.tsx
```

---

**CRITICAL NOTE:** Testing framework must be installed before writing any tests. Install Vitest first, then add tests incrementally as features are developed.

*Testing analysis: 2026-02-14*
