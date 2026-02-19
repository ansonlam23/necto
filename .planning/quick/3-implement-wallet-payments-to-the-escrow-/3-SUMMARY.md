---
phase: quick/3-implement-wallet-payments-to-the-escrow-
plan: 3
type: execute
subsystem: escrow-payment
status: completed
date_completed: 2026-02-19
tech_stack:
  added: []
  patterns:
    - wagmi hooks for contract interactions
    - Sequential async payment flow
    - USDC approval-before-transfer pattern
    - Escrow state machine
key_files:
  created:
    - offchain/src/hooks/use-escrow-payment.ts
  modified:
    - offchain/src/hooks/use-akash-deployment.ts
    - offchain/src/components/akash/deployment-status.tsx
    - offchain/src/app/buyer/submit/page.tsx
dependency_graph:
  requires: []
  provides:
    - escrow-payment-hook
    - payment-integrated-deployment
  affects:
    - offchain/src/app/buyer/submit/page.tsx
    - offchain/src/hooks/use-akash-deployment.ts
decisions:
  - Executed escrow payment BEFORE Akash deployment to ensure funds are locked before compute resources are allocated
  - Used polling-based jobId retrieval instead of event log parsing for MVP simplicity
  - Added useRef to preserve jobId across async payment flow
metrics:
  duration_minutes: 35
  tasks: 3
  commits: 3
---

# Quick Task 3: Implement Wallet Payments to the Escrow — Summary

**One-liner:** Complete escrow payment integration enabling USDC approval, job submission to ComputeRouter, and escrow deposit within the buyer submit workflow.

## What Was Built

### 1. Escrow Payment Hook (`use-escrow-payment.ts`)
A comprehensive hook managing the complete payment flow:

**Payment States:**
- `idle` — Ready to initiate payment
- `approving` — Requesting USDC spend approval
- `submitting_job` — Submitting job to ComputeRouter
- `depositing` — Depositing USDC into escrow
- `completed` — Payment flow finished successfully
- `error` — Payment failed with specific error message

**Key Features:**
- Checks USDC allowance vs required amount
- Requests approval if insufficient
- Hashes job requirements using keccak256 for ComputeRouter
- Submits job and captures jobId
- Deposits USDC into escrow for the job
- Graceful error handling with user-friendly messages

### 2. Updated Deployment Hook (`use-akash-deployment.ts`)
Integrated escrow payment before Akash deployment:

**New State:** `paying_escrow` (40% progress)

**API Changes:**
```typescript
interface StartDeploymentParams {
  requirements: JobRequirements;
  autoAccept?: boolean;
  escrowAmount?: bigint; // USDC amount with 6 decimals
  isTracked?: boolean;
}
```

**Features:**
- Executes escrow payment before calling `/api/akash`
- Passes jobId to API when payment succeeds
- Exposes escrow transaction hash, jobId, error, and state
- Backward compatible — skips payment if escrowAmount not provided

### 3. Payment UI Integration (`submit/page.tsx`)
Complete payment flow UI:

**Review Step:**
- Wallet connection status with connect/disconnect buttons
- Real-time escrow amount slider (1-100 USDC)
- "Pay {amount} USDC & Deploy" button
- Disabled until wallet connected
- Shows payment progress during transaction

**Deploy Step:**
- Escrow transaction card showing:
  - Payment status (pending/completed/failed)
  - Transaction hash with copy button
  - Link to ADI Testnet explorer
  - Job ID from ComputeRouter
  - Amount deposited
- Error display with clear messages

## Verification Results

```bash
$ cd offchain && npx tsc --noEmit
# No TypeScript errors
```

All hooks compile correctly with proper type exports.

## Deviations from Plan

None — plan executed exactly as written.

## Key Implementation Details

### Payment Flow Sequence
1. **USDC Approval** — Check allowance, request approval if needed
2. **Job Submission** — Submit job to ComputeRouter, get jobId
3. **Escrow Deposit** — Deposit USDC for the jobId
4. **Akash Deployment** — Only proceed after escrow succeeds

### Error Handling
- "Insufficient USDC balance" — Token balance check
- "Transaction rejected by user" — User cancelled
- "Job submission failed" — ComputeRouter error
- "Escrow deposit failed" — Escrow contract error

### State Management
- Uses useRef to preserve jobId across async operations
- Escrow hook state is independent of deployment hook state
- Both hooks expose reset() for clean state transitions

## Files Created/Modified

| File | Lines | Purpose |
|------|-------|---------|
| `use-escrow-payment.ts` | 226 lines | New hook with full payment flow |
| `use-akash-deployment.ts` | +78/-14 lines | Escrow integration, new state |
| `deployment-status.tsx` | +1/-0 lines | Added 'paying_escrow' state |
| `submit/page.tsx` | +249/-5 lines | Payment UI, wallet integration |

## Commits

| Hash | Message |
|------|---------|
| `3c0e5a2` | feat(quick-3): create escrow payment hook |
| `8175cd7` | feat(quick-3): update deployment hook with escrow integration |
| `00ba559` | feat(quick-3): wire payment UI into submit workflow |

## Self-Check: PASSED

| Check | Status |
|-------|--------|
| use-escrow-payment.ts exists | ✓ |
| use-akash-deployment.ts exists | ✓ |
| deployment-status.tsx exists | ✓ |
| submit/page.tsx exists | ✓ |
| TypeScript compilation | ✓ |
| Commits recorded | ✓ |

All files created and modified as documented. All TypeScript compilation passes.

## Next Steps

The payment flow is now complete. Future enhancements could include:
- Real-time USDC balance display
- Gas estimation before transaction
- Retry logic for failed transactions
- Transaction history in user dashboard
