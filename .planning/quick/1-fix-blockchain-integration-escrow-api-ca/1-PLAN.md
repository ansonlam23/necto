---
phase: 1-fix-blockchain-integration-escrow-api-ca
plan: 1
type: execute
wave: 1
depends_on: []
files_modified: [
  "offchain/src/app/api/escrow/route.ts",
  "offchain/src/app/buyer/dashboard/page.tsx",
  "offchain/src/lib/agent/agent.ts"
]
autonomous: true
requirements: [BLOCK-01, BLOCK-02, BLOCK-03]
must_haves:
  truths:
    - "Escrow API reads from real contract, not mock Map"
    - "Escrow API returns properly encoded calldata using viem"
    - "Dashboard displays real escrow balance from contract"
    - "Agent no longer generates fake transaction hashes"
  artifacts:
    - path: "offchain/src/app/api/escrow/route.ts"
      provides: "Contract-based escrow API with viem encodeFunctionData"
      exports: ["GET", "POST", "DELETE"]
    - path: "offchain/src/app/buyer/dashboard/page.tsx"
      provides: "Dashboard with real escrow balance fetch"
      changes: ["escrowBalance fetched from contract"]
    - path: "offchain/src/lib/agent/agent.ts"
      provides: "Agent without fake tx hash generation"
      removes: ["fake transaction hash generation"]
  key_links:
    - from: "offchain/src/app/api/escrow/route.ts"
      to: "offchain/src/lib/contracts/testnet-usdc-escrow.ts"
      via: "ESCROW_ABI, ESCROW_ADDRESS imports"
    - from: "offchain/src/app/buyer/dashboard/page.tsx"
      to: "offchain/src/lib/contracts/testnet-usdc-escrow.ts"
      via: "viem contract read"
---

<objective>
Fix blockchain integration by replacing mock implementations with real contract calls. This involves updating the escrow API to read from the blockchain, fixing calldata encoding to use viem properly, fetching real escrow balances in the dashboard, and removing fake transaction hash generation from the agent.

Purpose: Enable actual blockchain interactions instead of mocked/fake data for escrow operations.
Output: Three files updated to use real contract interactions.
</objective>

<execution_context>
@/home/julius/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/julius/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
# Current State
- **offchain/src/app/api/escrow/route.ts**: Uses `const mockEscrows: Map<string, EscrowData> = new Map()` instead of calling contract
  - Lines 298-310: `buildEscrowDepositCalldata` and `buildEscrowRefundCalldata` use `JSON.stringify` instead of viem `encodeFunctionData`
  - ESCROW_ABI and ESCROW_ADDRESS available in `offchain/src/lib/contracts/testnet-usdc-escrow.ts`
  
- **offchain/src/app/buyer/dashboard/page.tsx**: Line 125 shows `escrowBalance: 0 // TODO: Fetch from escrow contract`
  - Uses MOCK_DEPLOYMENTS instead of real data
  - Needs to fetch user's escrow balance from contract

- **offchain/src/lib/agent/agent.ts**: Lines 222-227 generates fake transaction hash:
  ```typescript
  transaction = {
    success: true,
    hash: `0x${Date.now().toString(16)}`,  // FAKE!
    jobId: BigInt(Date.now())
  };
  ```
  
# Available Resources
- ESCROW_ABI and ESCROW_ADDRESS in `offchain/src/lib/contracts/testnet-usdc-escrow.ts`
- `createPublicClient` and `createWalletClient` from viem available
- `adiTestnet` chain config exists in codebase
- Wallet tool already implemented in `wallet-tool.ts`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix escrow API to use real contract calls</name>
  <files>offchain/src/app/api/escrow/route.ts</files>
  <action>
Replace the mock Map-based implementation with real blockchain contract calls:

1. Remove the mock `EscrowData` interface and `mockEscrows` Map (lines 9-18)

2. Import from viem and escrow contract:
   - Import `encodeFunctionData` and `createPublicClient` from viem
   - Import `ESCROW_ABI`, `ESCROW_ADDRESS`, `EscrowStatus` from `testnet-usdc-escrow.ts`
   - Import `adiTestnet` chain config

3. Create a public client at module level:
   ```typescript
   const publicClient = createPublicClient({
     chain: adiTestnet,
     transport: http(process.env.ADI_TESTNET_RPC_URL || 'https://rpc.ab.testnet.adifoundation.ai/')
   });
   ```

4. Update GET handler:
   - If jobId provided: call `publicClient.readContract` with `getEscrow` function
   - Filter by depositor address to verify ownership
   - Map contract status enum to string status ('active' | 'released' | 'refunded')
   - Return all escrows for user: iterate through known jobIds or implement indexer query
   - For now, return empty array with summary (full indexing requires backend db)

5. Update buildEscrowDepositCalldata (lines 298-310):
   - Replace JSON.stringify with `encodeFunctionData({
       abi: ESCROW_ABI,
       functionName: 'deposit',
       args: [BigInt(jobId), BigInt(amount)]
     })`

6. Update buildEscrowRefundCalldata:
   - Replace JSON.stringify with `encodeFunctionData({
       abi: ESCROW_ABI,
       functionName: 'refund',
       args: [BigInt(jobId)]
     })`

7. Update POST handler transaction destination:
   - Change `to: TESTNET_USDC_ADDRESS` to `to: ESCROW_ADDRESS`
   - Remove mock escrow creation (mockEscrows.set)

8. Update DELETE handler:
   - Remove mock escrow lookup and status update
   - Keep transaction data building for refund

Note: Since we don't have an indexer, the GET /api/escrow endpoint will return limited data. Document this in code comments.
  </action>
  <verify>Run `npx tsc --noEmit` in offchain directory and verify no type errors</verify>
  <done>
- GET /api/escrow uses publicClient.readContract to fetch escrow data
- buildEscrowDepositCalldata uses viem encodeFunctionData with ESCROW_ABI
- buildEscrowRefundCalldata uses viem encodeFunctionData with ESCROW_ABI
- POST returns transaction with to: ESCROW_ADDRESS
- No mockEscrows Map usage remains in file
  </done>
</task>

<task type="auto">
  <name>Task 2: Fetch real escrow balance in buyer dashboard</name>
  <files>offchain/src/app/buyer/dashboard/page.tsx</files>
  <action>
Fetch real escrow balance from the contract instead of hardcoded 0:

1. Add imports at top of file:
   ```typescript
   import { createPublicClient, http } from 'viem';
   import { adiTestnet } from '@/lib/chains';
   import { ESCROW_ABI, ESCROW_ADDRESS } from '@/lib/contracts/testnet-usdc-escrow';
   ```

2. Create public client inside component or at module level:
   ```typescript
   const publicClient = createPublicClient({
     chain: adiTestnet,
     transport: http(process.env.NEXT_PUBLIC_ADI_TESTNET_RPC || 'https://rpc.ab.testnet.adifoundation.ai/')
   });
   ```

3. In the `fetchDeployments` function (around line 98-132), add escrow balance fetch:
   - After setting deployments, fetch user's total escrow balance from contract
   - Since there's no direct "getUserBalance" function, we need to:
     a. Track jobIds the user has deposited to (this requires backend storage)
     b. For now, show a computed value or fetch a specific job if known
   - **Simpler approach**: Add a new useEffect that fetches escrow data when address changes:
     ```typescript
     useEffect(() => {
       if (!address) return;
       
       const fetchEscrowBalance = async () => {
         try {
           // For now, we'll need to track jobIds locally or via API
           // This is a placeholder - in production, index events to get user's escrows
           // For demo, calculate from known jobIds or show 0 with note
           setStats(prev => ({
             ...prev,
             escrowBalance: 0 // TODO: Integrate with backend indexer
           }));
         } catch (error) {
           console.error('Failed to fetch escrow balance:', error);
         }
       };
       
       fetchEscrowBalance();
     }, [address]);
     ```
   - **Better approach**: Add a call to `/api/escrow` endpoint which now reads from contract:
     ```typescript
     const escrowResponse = await fetch('/api/escrow', {
       headers: { 'x-user-address': address }
     });
     if (escrowResponse.ok) {
       const escrowData = await escrowResponse.json();
       const totalDeposited = escrowData.summary?.totalDeposited || '0';
       setStats(prev => ({
         ...prev,
         escrowBalance: Number(totalDeposited) / 1_000_000 // Convert from USDC decimals
       }));
     }
     ```

4. Remove the TODO comment on line 125 since we're now fetching (or attempting to fetch)

5. Update the escrow balance display to show proper formatting (already uses toFixed(2))

Note: The escrow balance calculation depends on the API implementation. If the API returns limited data due to lack of indexer, document this in a comment near the fetch.
  </action>
  <verify>Run `npx tsc --noEmit` and verify no type errors. Check that dashboard compiles.</verify>
  <done>
- Dashboard imports viem and escrow contract constants
- fetchDeployments calls /api/escrow to get total deposited amount
- escrowBalance is calculated from API response (totalDeposited / 1e6 for USDC decimals)
- TODO comment removed from line 125
- Stats display shows real escrow balance (or 0 if API returns no data)
  </done>
</task>

<task type="auto">
  <name>Task 3: Remove fake transaction hash from agent</name>
  <files>offchain/src/lib/agent/agent.ts</files>
  <action>
Remove the fake transaction hash generation and properly handle tracked mode:

1. Find the section in routeComputeJob (lines 210-244) where tracked mode is handled:
   ```typescript
   // Step 4: Submit to blockchain if tracked
   let transaction: TransactionResult | undefined;
   
   if (request.isTracked) {
     onThinking?.({
       id: '3',
       message: 'Submitting job to blockchain...',
       status: 'active',
       timestamp: Date.now()
     });
     
     // Note: Actual blockchain submission would use walletTool
     // This is a placeholder for the tool-based approach
     transaction = {
       success: true,
       hash: `0x${Date.now().toString(16)}`,  // FAKE!
       jobId: BigInt(Date.now())
     };
   ```

2. Replace the fake transaction block with one of these approaches:

   **Option A - Disable tracked mode for now** (safest):
   ```typescript
   // Step 4: Submit to blockchain if tracked
   let transaction: TransactionResult | undefined;
   
   if (request.isTracked) {
     onThinking?.({
       id: '3',
       message: 'Blockchain tracking not yet implemented - job routed off-chain only',
       status: 'complete',
       timestamp: Date.now()
     });
     
     // TODO: Implement blockchain submission using walletTool
     // transaction = await walletTool({ ... });
     transaction = undefined; // No on-chain record yet
   }
   ```

   **Option B - Comment out tracked mode entirely**:
   ```typescript
   // Step 4: Submit to blockchain if tracked
   // TODO: Implement walletTool-based blockchain submission
   // Currently disabled - jobs are routed off-chain only
   const transaction: TransactionResult | undefined = undefined;
   ```

3. Update the return statement to handle undefined transaction:
   - Line 246: `return { result, transaction, routeResult };` - this is fine as transaction is already optional

4. Add a comment explaining the current state and what needs to be done for full blockchain integration.

5. Consider removing isTracked from the request type or marking it as not-yet-implemented.

Choose Option A to preserve the thinking step logging while making it clear that blockchain tracking is not yet implemented.
  </action>
  <verify>Run `npx tsc --noEmit` and verify no type errors in agent.ts</verify>
  <done>
- Fake transaction hash generation removed (lines 223-227 replaced)
- Tracked mode either disabled or returns undefined transaction
- User-facing message updated to indicate blockchain tracking not implemented
- Return type still allows undefined transaction (already supported)
- No compilation errors
  </done>
</task>

</tasks>

<verification>
1. Type checking passes: `cd offchain && npx tsc --noEmit`
2. Lint passes: `npm run lint`
3. Escrow API imports and uses ESCROW_ABI/ESCROW_ADDRESS correctly
4. No mockEscrows Map references remain in escrow/route.ts
5. encodeFunctionData is imported from viem and used in calldata builders
6. Dashboard fetches from /api/escrow endpoint
7. Agent no longer generates fake transaction hashes
</verification>

<success_criteria>
- `offchain/src/app/api/escrow/route.ts` uses viem `encodeFunctionData` for calldata and reads from contract via publicClient
- `offchain/src/app/buyer/dashboard/page.tsx` fetches escrow data from API instead of hardcoded 0
- `offchain/src/lib/agent/agent.ts` does not generate fake transaction hashes
- All files compile without TypeScript errors
- Build passes: `npm run build` completes successfully
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-blockchain-integration-escrow-api-ca/1-SUMMARY.md`
</output>
