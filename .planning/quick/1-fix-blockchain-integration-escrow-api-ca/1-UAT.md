# UAT: Blockchain Integration Fixes

**Date:** 2026-02-19  
**Scope:** Quick Task 1 - Blockchain Integration (escrow API, calldata, dashboard, agent)  
**Status:** In Progress

---

## Test Cases

### UAT-001: Escrow API - Get Escrow by Job ID
**Objective:** Verify GET /api/escrow?jobId={id} reads from contract

**Prerequisites:**
- Escrow contract deployed on ADI Testnet
- At least one escrow exists in contract

**Test Steps:**
1. Send GET request to `/api/escrow?jobId=1` with valid x-user-address header
2. Verify response contains escrow data from contract
3. Check that depositor, amount, status, createdAt fields are populated

**Expected Result:**
```json
{
  "success": true,
  "escrow": {
    "jobId": "1",
    "amount": "5000000",
    "status": "active",
    "createdAt": "2026-02-19T...",
    "deploymentId": "dep-001"
  }
}
```

**Status:** ⏸ PENDING (requires contract with existing escrows)

---

### UAT-002: Escrow API - List All User Escrows
**Objective:** Verify GET /api/escrow (no jobId) returns all user escrows

**Prerequisites:**
- User has deposited multiple escrows

**Test Steps:**
1. Send GET request to `/api/escrow` with x-user-address header
2. Verify response contains array of escrows
3. Check summary.totalDeposited is calculated correctly

**Expected Result:**
```json
{
  "success": true,
  "escrows": [...],
  "summary": {
    "totalEscrows": 3,
    "totalDeposited": "15000000",
    "activeCount": 2,
    "pendingCount": 1
  }
}
```

**Note:** This requires an indexer. Current implementation returns empty list.
**Status:** ⏸ PENDING (requires indexer implementation)

---

### UAT-003: Escrow API - Create Deposit Transaction
**Objective:** Verify POST /api/escrow returns properly encoded calldata

**Test Steps:**
1. Send POST request:
   ```json
   {
     "jobId": "999",
     "amount": "5000000",
     "deploymentId": "test-dep"
   }
   ```
2. Verify response contains transaction data
3. Decode calldata and verify it matches deposit function

**Expected Result:**
```json
{
  "success": true,
  "transaction": {
    "to": "0x...",
    "data": "0x...", // Properly ABI-encoded
    "value": "0",
    "chainId": 99999
  }
}
```

**Status:** ⏸ PENDING (manual verification required)

---

### UAT-004: Buyer Dashboard - Escrow Balance Display
**Objective:** Verify dashboard fetches and displays real escrow balance

**Test Steps:**
1. Navigate to /buyer/dashboard with connected wallet
2. Check Escrow Balance card displays actual balance
3. Verify balance updates after deposit/withdrawal

**Expected Result:**
- Balance card shows real USDC amount (e.g., "$5.00")
- Balance is formatted correctly (divided by 1M for decimals)

**Status:** ⏸ PENDING (requires frontend testing)

---

### UAT-005: Agent - No Fake Transaction Hash
**Objective:** Verify tracked mode no longer generates fake hashes

**Test Steps:**
1. Submit job with isTracked=true
2. Check agent response
3. Verify no transaction.hash in response (should be undefined)

**Expected Result:**
- Agent completes routing
- transaction field is undefined or null
- User sees message: "Blockchain tracking not yet implemented..."

**Status:** ⏸ PENDING (requires agent testing)

---

### UAT-006: Code Review - Calldata Encoding
**Objective:** Verify calldata uses proper ABI encoding

**Test Steps:**
1. Open `offchain/src/app/api/escrow/route.ts`
2. Find `buildEscrowDepositCalldata` function
3. Verify it uses `encodeFunctionData` with ESCROW_ABI

**Expected Result:**
```typescript
function buildEscrowDepositCalldata(jobId: string, amount: string): string {
  return encodeFunctionData({
    abi: ESCROW_ABI,
    functionName: 'deposit',
    args: [BigInt(jobId), BigInt(amount)]
  });
}
```

**Status:** ✅ VERIFIED

---

### UAT-007: Code Review - No Mock Map
**Objective:** Verify in-memory Map is removed

**Test Steps:**
1. Open `offchain/src/app/api/escrow/route.ts`
2. Search for `mockEscrows` Map
3. Verify it no longer exists

**Expected Result:**
- No `const mockEscrows: Map<string, EscrowData> = new Map()` declaration
- Uses `publicClient.readContract()` instead

**Status:** ✅ VERIFIED

---

## Static Verification Results

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript compiles | ✅ PASS | `npx tsc --noEmit` - no errors |
| No fake hash generation | ✅ PASS | Agent.ts no longer has `Date.now().toString(16)` |
| Real contract calls | ✅ PASS | Uses `publicClient.readContract` with ESCROW_ABI (lines 60, 164, 252) |
| Proper calldata | ✅ PASS | Uses `encodeFunctionData` not JSON.stringify (lines 319, 330) |
| Dashboard API integration | ✅ PASS | Fetches from `/api/escrow` endpoint (line 125) |
| Agent proper messaging | ✅ PASS | Shows "Blockchain tracking not yet implemented" (line 220) |

---

## Functional Testing Required

The following require runtime testing:

1. **Contract Integration:** Need actual escrows in contract to test reads
2. **Frontend Testing:** Need to run dashboard and verify balance display
3. **Agent Testing:** Need to submit tracked job and verify response

---

## Summary

**Static Checks:** 5/5 PASS ✅  
**Functional Tests:** 0/5 RUN (requires runtime environment)  

**Recommendation:** Deploy test escrows to contract and run functional tests before marking complete.

---

*UAT Created: 2026-02-19*  
*Last Updated: 2026-02-19*
