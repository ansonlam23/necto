---
phase: quick/3-implement-wallet-payments-to-the-escrow-
plan: 3
type: execute
wave: 1
depends_on: []
files_modified:
  - offchain/src/hooks/use-escrow-payment.ts
  - offchain/src/hooks/use-akash-deployment.ts
  - offchain/src/app/buyer/submit/page.tsx
  - offchain/src/lib/contracts/testnet-usdc-token.ts
autonomous: true
requirements:
  - ESCROW-01
must_haves:
  truths:
    - User can deposit USDC to escrow contract when submitting a job
    - Escrow deposit happens after ComputeRouter job registration
    - UI shows payment status and transaction hash
    - USDC approval is handled before deposit
  artifacts:
    - path: offchain/src/hooks/use-escrow-payment.ts
      provides: Escrow payment hook with approve + deposit flow
      exports: [useEscrowPayment]
    - path: offchain/src/hooks/use-akash-deployment.ts
      provides: Updated deployment hook with escrow integration
    - path: offchain/src/app/buyer/submit/page.tsx
      provides: Payment step integrated into workflow
  key_links:
    - from: use-akash-deployment.ts
      to: use-escrow-payment.ts
      via: hook composition
    - from: submit/page.tsx
      to: use-akash-deployment.ts
      via: React state
---

<objective>
Integrate wallet payments to the escrow contract into the /buyer/submit workflow.

**Purpose:** Enable buyers to actually deposit USDC into escrow when submitting compute jobs, completing the payment flow alongside job registration.
**Output:** Working payment flow with USDC approval, escrow deposit, and transaction tracking.
</objective>

<execution_context>
@/home/julius/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@offchain/src/lib/contracts/testnet-usdc-escrow.ts
@offchain/src/lib/contracts/compute-router.ts
@offchain/src/lib/contracts/testnet-usdc-token.ts
@offchain/src/hooks/use-akash-deployment.ts
@offchain/src/app/buyer/submit/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create escrow payment hook</name>
  <files>offchain/src/hooks/use-escrow-payment.ts</files>
  <action>
Create a new hook `useEscrow-payment.ts` that handles the complete escrow payment flow:

1. **USDC Approval**: Check and request approval for the escrow contract to spend USDC
   - Use `testnet-usdc-token.ts` for USDC contract interactions
   - Check current allowance vs required amount
   - Call approve() if allowance insufficient

2. **ComputeRouter Job Submission**: Submit job to get jobId
   - Use `compute-router.ts` submitJob function
   - Pass job details hash (keccak256 of requirements JSON)
   - Set isTracked based on user preference

3. **Escrow Deposit**: Deposit USDC into escrow for the jobId
   - Use `testnet-usdc-escrow.ts` deposit function
   - Pass jobId and amount (from UI slider)
   - Validate job exists in router before deposit

4. **State Management**: Track payment state
   - States: 'idle' | 'approving' | 'submitting_job' | 'depositing' | 'completed' | 'error'
   - Expose: txHash, error, isLoading, currentStep
   - Provide reset() function

Hook signature:
```typescript
interface UseEscrowPaymentReturn {
  state: PaymentState;
  txHash: string | null;
  jobId: bigint | null;
  error: string | null;
  isLoading: boolean;
  executePayment: (params: PaymentParams) => Promise<void>;
  reset: () => void;
}

interface PaymentParams {
  requirements: JobRequirements;
  amount: bigint; // USDC amount (6 decimals)
  isTracked: boolean;
}
```

Use wagmi hooks: useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract.
Handle errors gracefully with specific messages.
  </action>
  <verify>Hook compiles without TypeScript errors and exports all required types</verify>
  <done>Type-safe escrow payment hook exists with full approve→submit→deposit flow</done>
</task>

<task type="auto">
  <name>Task 2: Update deployment hook with escrow integration</name>
  <files>offchain/src/hooks/use-akash-deployment.ts</files>
  <action>
Update `use-akash-deployment.ts` to integrate escrow payment before Akash deployment:

1. **Add escrow step**: New state 'paying_escrow' in DeploymentState
2. **Accept escrow params**: Add `escrowAmount` and `isTracked` to startDeployment params
3. **Payment first**: Before calling /api/akash, execute escrow payment flow
   - Call useEscrowPayment.executePayment()
   - Wait for jobId and transaction confirmation
   - Only proceed to Akash if payment succeeds
4. **Pass jobId to API**: Include jobId in the /api/akash request body
   - Server can link Akash deployment to on-chain job
5. **Error handling**: Handle payment errors separately from deployment errors
   - If payment fails, don't attempt Akash deployment
   - Show specific error messages for each failure type

Updated hook signature:
```typescript
interface StartDeploymentParams {
  requirements: JobRequirements;
  autoAccept?: boolean;
  escrowAmount?: bigint; // USDC amount
  isTracked?: boolean;
}

// startDeployment signature changes to:
startDeployment: (params: StartDeploymentParams) => Promise<void>;
```

Add progress calculation for the new 'paying_escrow' state (between 'selecting_provider' and 'creating_deployment').

Ensure backward compatibility - if escrowAmount not provided, skip payment flow.
  </action>
  <verify>Hook accepts new params and integrates escrow payment before deployment API call</verify>
  <done>Deployment hook orchestrates escrow payment → Akash deployment sequence</done>
</task>

<task type="auto">
  <name>Task 3: Wire payment UI into submit workflow</name>
  <files>offchain/src/app/buyer/submit/page.tsx</files>
  <action>
Update the submit page to actually execute escrow payment:

1. **Payment button**: In the 'review' step, change "Next" button to trigger payment
   - Show "Pay & Deploy" instead of just "Next"
   - Disable button while payment in progress
   - Show loading state with current step (approving, depositing, etc.)

2. **Pass escrow params**: Update handleDeploy to pass escrow data
   ```typescript
   await deployment.startDeployment({
     requirements: requirements as JobRequirements,
     autoSign,
     escrowAmount: BigInt(escrowAmount) * BigInt(1_000_000), // Convert to 6 decimals
     isTracked: true // or from user toggle
   });
   ```

3. **Transaction status display**: In the 'deploy' step, show:
   - Escrow transaction hash (with link to block explorer)
   - Payment status (completed, pending, failed)
   - Job ID from ComputeRouter
   - USDC amount deposited

4. **Error handling**: Show specific error messages
   - "Insufficient USDC balance" if approval/transfer fails
   - "Transaction rejected" if user cancels
   - "Job submission failed" if router call fails

5. **Wallet connection check**: Before allowing payment, verify wallet is connected
   - Show "Connect Wallet" button if not connected
   - Disable "Pay & Deploy" until connected

UI changes in 'review' step:
- Add wallet connection status
- Show estimated gas cost
- Confirm button: "Pay {escrowAmount} USDC & Deploy"

UI changes in 'deploy' step:
- Add escrow transaction card showing:
  - Status icon (pending/success/error)
  - Transaction hash (truncated with copy button)
  - Job ID
  - Amount deposited
  - Link to ADI Testnet explorer
  </action>
  <verify>Page shows payment UI, passes escrow params, displays transaction status</verify>
  <done>Complete payment flow integrated into submit workflow with transaction tracking</done>
</task>

</tasks>

<verification>
- [ ] useEscrowPayment hook exports all required functions and types
- [ ] useAkashDeployment accepts and uses escrow parameters
- [ ] Submit page shows payment button and transaction status
- [ ] TypeScript compilation passes: `cd offchain && npx tsc --noEmit`
</verification>

<success_criteria>
1. User can connect wallet on /buyer/submit
2. Review step shows "Pay X USDC & Deploy" button
3. Clicking button triggers: approve USDC → submit job to router → deposit to escrow
4. Deploy step shows transaction hash and job ID
5. Error states handled gracefully with clear messages
6. Payment flow completes before Akash deployment starts
</success_criteria>

<output>
After completion, create `.planning/quick/3-implement-wallet-payments-to-the-escrow-/3-SUMMARY.md`
</output>
