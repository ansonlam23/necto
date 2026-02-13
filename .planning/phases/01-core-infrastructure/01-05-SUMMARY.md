---
phase: 01-core-infrastructure
plan: 05
subsystem: storage
tags: [0g-storage, decentralized-storage, merkle-tree, retry-logic, ethers]

requires:
  - phase: 01-02
    provides: ReasoningTrace type definition, job types, provider types

provides:
  - 0G Storage SDK integration for decentralized file storage
  - StorageService for connection management to 0G Galileo Testnet
  - Uploader class with JSON/file upload and Merkle tree calculation
  - Retriever class for downloading content by content hash
  - withRetry utility with exponential backoff (3 attempts, 1s/2s/4s)
  - uploadReasoningTrace() for persisting agent decision traces
  - retrieveTrace() for fetching traces by content hash
  - Environment configuration for OG_PRIVATE_KEY, OG_RPC_URL, OG_INDEXER_URL

affects:
  - Agent routing logic (can now upload reasoning traces)
  - Job execution (can include content hash in on-chain records)
  - Verification UI (can display trace retrieval)

tech-stack:
  added:
    - "@0glabs/0g-ts-sdk@0.3.3 - 0G Storage SDK"
  patterns:
    - "Service class pattern with lazy initialization"
    - "Tuple destructuring for SDK error handling"
    - "Exponential backoff with jitter for network resilience"
    - "Type casting bridge for ethers version compatibility"

key-files:
  created:
    - src/lib/storage/index.ts - Main storage module with StorageService
    - src/lib/storage/uploader.ts - File upload with Merkle tree
    - src/lib/storage/retrieval.ts - Content download by hash
    - src/lib/storage/retry.ts - Retry logic with exponential backoff
  modified:
    - .env.example - Added 0G Storage configuration variables
    - package.json - Added @0glabs/0g-ts-sdk dependency

key-decisions:
  - "Used type assertions (any) to bridge ethers v6.13.1 (SDK) and v6.16.0 (project) incompatibility"
  - "Implemented temp file approach for ZgFile compatibility (SDK expects file paths)"
  - "Set 10MB warning threshold based on 0G research about large file timeouts"
  - "Made config public readonly on StorageService for uploader/retriever access"
  - "Used eslint-disable for necessary any casts to handle SDK type mismatches"

patterns-established:
  - "SDK Version Bridging: Use explicit any casts when peer dependency versions mismatch"
  - "Error Classification: isRetryableError() distinguishes network/rate-limit from auth/input errors"
  - "Tuple Destructuring: 0G SDK returns [result, error] pairs - always destructure both"
  - "Temp File Cleanup: Always use try/finally for ZgFile temp file cleanup"

duration: 8min
completed: 2026-02-13
---

# Phase 01 Plan 05: 0G Storage Integration Summary

**0G Storage SDK integration with upload/download for agent reasoning traces, Merkle tree-based content addressing, and exponential backoff retry on 0G Galileo Testnet (Chain ID 16602)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-13T03:16:16Z
- **Completed:** 2026-02-13T03:24:36Z
- **Tasks:** 3 (combined into 1 commit)
- **Files modified:** 7

## Accomplishments

- Installed @0glabs/0g-ts-sdk for 0G Storage integration
- StorageService class connecting to 0G Galileo Testnet (Chain ID 16602)
- Upload JSON reasoning traces with automatic Merkle tree calculation
- Exponential backoff retry: 3 attempts with 1s/2s/4s delays + jitter
- Retrieve content by root hash (content hash) from 0G network
- Comprehensive error handling with storage error codes
- Environment configuration for wallet, RPC, indexer, and contract

## Task Commits

**Note:** All 3 tasks were implemented atomically and committed together:

1. **Task 1-3 Combined: Install SDK, implement upload/retry, implement retrieval** - `cdeb658` (feat)

**Plan metadata:** [pending final commit]

## Files Created/Modified

- `src/lib/storage/index.ts` - StorageService class, uploadReasoningTrace(), retrieveTrace(), error handling
- `src/lib/storage/uploader.ts` - Uploader class with uploadJson(), uploadFile(), Merkle tree calculation
- `src/lib/storage/retrieval.ts` - Retriever class with downloadByHash(), getMetadata(), exists()
- `src/lib/storage/retry.ts` - withRetry() utility, RetryConfig interface, isRetryableError()
- `.env.example` - Added OG_PRIVATE_KEY, OG_RPC_URL, OG_INDEXER_URL, OG_FLOW_CONTRACT
- `package.json` - Added @0glabs/0g-ts-sdk dependency
- `package-lock.json` - Updated with new dependencies

## Decisions Made

- Used explicit `any` type casts to bridge ethers v6.13.1 (SDK peer dep) and v6.16.0 (project) incompatibility
- Implemented temp file approach since ZgFile expects file paths (not Buffers)
- Set 10MB warning threshold based on 0G research about large file upload timeouts
- Made StorageService config public readonly for uploader/retriever access to RPC URL
- Added eslint-disable comments for necessary any casts (documented in code)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Combined all 3 tasks into single commit**
- **Found during:** Task execution
- **Issue:** The tasks were highly interdependent - uploader needed retry logic, retrieval needed uploader patterns, high-level API needed both
- **Fix:** Implemented all 3 tasks together atomically, committed as single feat(01-05) commit
- **Files modified:** src/lib/storage/*.ts
- **Committed in:** cdeb658

**2. [Rule 3 - Blocking] Ethers version incompatibility (v6.13.1 vs v6.16.0)**
- **Found during:** Task 1 (SDK initialization)
- **Issue:** @0glabs/0g-ts-sdk peer-depends on ethers@6.13.1 (CommonJS), project uses ethers@6.16.0 (ESM)
- **Fix:** Used type assertions (`as any`) to bridge the type mismatch in getFlowContract() and indexer.upload()
- **Files modified:** src/lib/storage/index.ts, src/lib/storage/uploader.ts
- **Committed in:** cdeb658

**3. [Rule 3 - Blocking] AbstractFile not exported from SDK**
- **Found during:** Task 2 (uploader implementation)
- **Issue:** 0G SDK's AbstractFile base class is internal, not exported
- **Fix:** Used `as unknown as Parameters<typeof indexer.upload>[0]` to satisfy TypeScript while passing ZgFile
- **Files modified:** src/lib/storage/uploader.ts
- **Committed in:** cdeb658

**4. [Rule 1 - Bug] SDK indexer.download() writes to file path, not return buffer**
- **Found during:** Task 3 (retrieval implementation)
- **Issue:** Expected download() to return Buffer, but it writes to file path and returns Error|null
- **Fix:** Updated retrieval.ts to use temp file path, read file after download, then cleanup
- **Files modified:** src/lib/storage/retrieval.ts
- **Committed in:** cdeb658

**5. [Rule 2 - Missing Critical] OG_PRIVATE_KEY validation missing**
- **Found during:** Code review
- **Issue:** Plan didn't specify validation for missing private key
- **Fix:** Added validation in StorageService.initialize() with clear error message
- **Files modified:** src/lib/storage/index.ts
- **Committed in:** cdeb658

**6. [Rule 3 - Blocking] npm install peer dependency conflict**
- **Found during:** Task 1 (SDK installation)
- **Issue:** npm eresolve conflict between ethers versions
- **Fix:** Used --legacy-peer-deps flag to allow installation
- **Files modified:** package.json, package-lock.json
- **Committed in:** cdeb658

---

**Total deviations:** 6 auto-fixed (4 blocking, 1 bug, 1 missing critical)
**Impact on plan:** All fixes necessary for SDK integration. No scope creep - all changes required for correct operation.

## Issues Encountered

1. **Ethers version mismatch** - Resolved with type assertions (documented in code)
2. **SDK API expectations** - Discovered indexer.upload() returns tuples [result, error], not direct values
3. **SDK AbstractFile internal** - Cannot import AbstractFile, must use ZgFile and type cast
4. **npm peer dependency resolution** - Required --legacy-peer-deps flag

All issues resolved within the plan scope.

## User Setup Required

**External services require manual configuration.** See [01-USER-SETUP.md](./01-USER-SETUP.md) for:
- Environment variables to add (OG_PRIVATE_KEY, OG_RPC_URL, etc.)
- Wallet generation and funding from 0G faucet
- Verification commands to test the setup

**Quick setup checklist:**
1. Generate or use existing Ethereum wallet
2. Fund wallet from https://faucet.0g.ai or Discord
3. Add OG_PRIVATE_KEY to .env
4. Test with: `npx ts-node -e "import('./src/lib/storage').then(m => m.storageService.initialize())"`

## Next Phase Readiness

- ✅ 0G Storage SDK integrated and configured
- ✅ StorageService can upload reasoning traces
- ✅ StorageService can retrieve by content hash
- ✅ Retry logic handles network failures gracefully
- ⚠️ Requires funded wallet for actual testnet uploads (see User Setup)
- ✅ Code ready for integration with agent routing logic

**Integration points ready:**
- Agent routing can call `uploadReasoningTrace(trace)` after making provider selection
- Job record can store returned rootHash for on-chain verification
- Frontend can display "View reasoning trace" links using content hash

---
*Phase: 01-core-infrastructure*  
*Completed: 2026-02-13*
