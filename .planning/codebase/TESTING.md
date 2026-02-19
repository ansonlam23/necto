# Testing Patterns

**Analysis Date:** 2026-02-19

## Test Framework

### Offchain (Next.js Application)

**Status:** No test framework configured

**Findings:**
- No test files found (`*.test.*`, `*.spec.*`)
- No test configuration files (`jest.config.*`, `vitest.config.*`, `playwright.config.*`)
- No test dependencies in `offchain/package.json`
- ESLint ignores test directories by default

**Action Required:** If adding tests, install and configure a test framework first.

**Recommended Setup:**
```bash
# Install Vitest (recommended for Next.js)
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom

# Or Jest
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### Hardhat (Smart Contracts)

**Runner:**
- Node.js built-in test runner: `node:test`
- Hardhat Toolbox with Viem
- Config: `hardhat/hardhat.config.ts`

**Assertion Library:**
- Node.js built-in assertions: `node:assert/strict`

**Run Commands:**
```bash
npx hardhat test              # Run all tests
npx hardhat test test/Counter.ts  # Run specific test file
npx hardhat test --grep "mint"    # Run tests matching pattern
```

## Test File Organization

### Offchain

**Location:** Not applicable - no tests exist

**Expected Pattern (when added):**
- Co-located with source files: `src/components/__tests__/button.test.tsx`
- Or separate directory: `src/__tests__/components/button.test.tsx`

### Hardhat

**Location:**
- Tests in `hardhat/test/` directory
- One test file per contract: `test/Counter.ts`, `test/TestnetUSDC.ts`

**Naming:**
- Test files match contract names: `TestnetUSDC.ts` tests `TestnetUSDC.sol`
- No `.test.` or `.spec.` suffix - just contract name

**Structure:**
```
hardhat/
├── test/
│   ├── ComputeRouter.ts
│   ├── Counter.ts
│   ├── TestnetUSDC.ts
│   └── USDCEscrow.ts
├── ignition/
│   └── modules/
│       └── [deployment scripts]
└── scripts/
    └── [utility scripts]
```

## Test Structure

### Hardhat Test Pattern

**Suite Organization:**
```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("TestnetUSDC", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, alice, bob] = await viem.getWalletClients();

  describe("Deployment", async function () {
    it("Should have correct name, symbol, and decimals", async function () {
      const token = await viem.deployContract("TestnetUSDC");

      assert.equal(await token.read.name(), "Testnet USDC");
      assert.equal(await token.read.symbol(), "tUSDC");
      assert.equal(await token.read.decimals(), 6);
    });

    it("Should start with zero total supply", async function () {
      const token = await viem.deployContract("TestnetUSDC");
      assert.equal(await token.read.totalSupply(), 0n);
    });
  });

  describe("mint (faucet)", async function () {
    it("Anyone can mint tokens up to faucet limit", async function () {
      const token = await viem.deployContract("TestnetUSDC");
      const amount = 1000n * ONE_USDC;

      const tx = await token.write.mint([alice.account.address, amount]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      assert.equal(await token.read.balanceOf([alice.account.address]), amount);
    });
  });
});
```

**Patterns:**
- Top-level `describe` for contract name
- Nested `describe` blocks for function groups (e.g., "Deployment", "mint", "transfer")
- One `it` block per test case
- Contract deployment in each test or `beforeEach` setup

**Setup Pattern (from `hardhat/test/TestnetUSDC.ts`):**
```typescript
describe("TestnetUSDC", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, alice, bob] = await viem.getWalletClients();

  // Helper function
  const addr = (a: string) => getAddress(a);

  // Constants
  const FAUCET_AMOUNT = 10_000n * 1_000_000n;
  const ONE_USDC = 1_000_000n;
  
  // Tests use these shared variables
});
```

## Mocking

### Offchain

**Framework:** Not applicable - no tests exist

**Expected Patterns (when Vitest/Jest added):**
```typescript
// Mock external modules
vi.mock('wagmi', () => ({
  useConnection: vi.fn(() => ({ address: '0x1234...' })),
  useConnect: vi.fn(),
}));

// Mock fetch/API calls
vi.mock('@/lib/akash/console-api', () => ({
  getConsoleClient: vi.fn(() => ({
    listDeployments: vi.fn().mockResolvedValue([]),
  })),
}));
```

### Hardhat

**No Mocking Required:**
- Tests use Hardhat Network (local blockchain)
- Each test deploys fresh contract instances
- Viem provides deterministic test environment

**Test Isolation:**
```typescript
// Each test gets fresh contract state
it("Test 1", async function () {
  const token = await viem.deployContract("TestnetUSDC");
  // Fresh token with 0 supply
});

it("Test 2", async function () {
  const token = await viem.deployContract("TestnetUSDC");
  // Another fresh token, independent from Test 1
});
```

## Fixtures and Factories

### Hardhat

**Test Data:**
```typescript
// Constants defined at describe level
const FAUCET_AMOUNT = 10_000n * 1_000_000n;  // 10,000 tUSDC (6 decimals)
const ONE_USDC = 1_000_000n;

// Test addresses from wallet clients
const [deployer, alice, bob] = await viem.getWalletClients();

// Helper functions
const addr = (a: string) => getAddress(a);
```

**Location:**
- Defined inline within test files
- No separate fixture files

### Offchain

**Not applicable - no tests exist**

## Coverage

### Offchain

**Requirements:** None enforced

**Current Coverage:** 0% (no tests)

### Hardhat

**Requirements:** None enforced

**Current Coverage:** Unknown (no coverage tool configured)

**Adding Coverage:**
```bash
# Install coverage plugin
npm install -D solidity-coverage

# Add to hardhat.config.ts
import "solidity-coverage"

# Run with coverage
npx hardhat coverage
```

## Test Types

### Unit Tests

**Hardhat:**
- Scope: Individual contract functions
- Approach: Deploy contract, call function, assert result
- Each test is isolated with fresh deployment

**Offchain:**
- Not implemented

### Integration Tests

**Hardhat:**
- Multi-contract interactions: `USDCEscrow.ts` tests escrow with USDC token
- Uses multiple wallet clients to simulate different users

**Offchain:**
- Not implemented

### E2E Tests

**Framework:** Not used

**Recommendation:** Consider Playwright for E2E testing of Next.js application

## Common Patterns

### Hardhat Async Testing

**Transaction Testing:**
```typescript
it("Should emit Transfer event", async function () {
  const token = await viem.deployContract("TestnetUSDC");

  // Write transaction
  const tx = await token.write.mint([alice.account.address, ONE_USDC]);
  
  // Wait for confirmation
  await publicClient.waitForTransactionReceipt({ hash: tx });

  // Assert result
  assert.equal(await token.read.balanceOf([alice.account.address]), ONE_USDC);
});
```

**Event Testing:**
```typescript
it("Should emit the Increment event", async function () {
  const counter = await viem.deployContract("Counter");

  await viem.assertions.emitWithArgs(
    counter.write.inc(),
    counter,
    "Increment",
    [1n],
  );
});
```

**Error Testing:**
```typescript
it("Cannot mint more than faucet limit", async function () {
  const token = await viem.deployContract("TestnetUSDC");

  let callFailed = false;
  try {
    await token.write.mint([alice.account.address, FAUCET_AMOUNT + 1n]);
  } catch {
    callFailed = true;
  }
  assert.equal(callFailed, true, "Should reject amounts exceeding faucet limit");
});
```

### Recommended Offchain Patterns (When Implemented)

**Component Testing:**
```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

**Hook Testing:**
```typescript
import { renderHook, act } from "@testing-library/react";
import { useWorkflowStore } from "./workflow-store";

describe("useWorkflowStore", () => {
  it("adds a node", () => {
    const { result } = renderHook(() => useWorkflowStore());
    
    act(() => {
      result.current.addNode({
        type: "trigger",
        position: { x: 0, y: 0 },
        data: { label: "Test" },
        category: "trigger"
      });
    });

    expect(result.current.nodes).toHaveLength(1);
  });
});
```

**API Route Testing:**
```typescript
import { POST } from "./route";

describe("POST /api/deployments", () => {
  it("returns 401 without user address", async () => {
    const request = new Request("http://localhost/api/deployments", {
      method: "POST",
      headers: {},
      body: JSON.stringify({ sdl: {} }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

## Test Coverage Gaps

**Offchain - No tests exist for:**
- `src/components/**/*.tsx` - All React components
- `src/hooks/**/*.ts` - All custom hooks  
- `src/lib/**/*.ts` - All utility functions and stores
- `src/app/api/**/*.ts` - All API routes
- Priority: **High** - Critical functionality untested

**Hardhat - Tests exist for:**
- ✅ `Counter.sol` - Basic counter contract
- ✅ `TestnetUSDC.sol` - Full ERC20 token coverage
- ✅ `USDCEscrow.sol` - Escrow contract
- ✅ `ComputeRouter.sol` - Router contract

---

*Testing analysis: 2026-02-19*
