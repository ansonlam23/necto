---
phase: 02-akash-webapp-deploy
plan: 06
subsystem: ui
tags: [radix-ui, select, requirements-form, bugfix, gap-closure]

# Dependency graph
requires:
  - phase: 02-akash-webapp-deploy
    provides: requirements-form.tsx component with Region Select dropdown
provides:
  - Fixed Region Select component using 'any' sentinel value instead of empty string
  - Job submission wizard unblocked - step 2 no longer crashes
  - UAT gap #1 resolved and documented
affects: [job-submission-wizard, requirements-form, template-gallery]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Sentinel value pattern for Radix UI Select with optional/nullable state - use non-empty string like 'any' instead of empty string, convert back to undefined in onValueChange handler"]

key-files:
  created: []
  modified:
    - offchain/src/components/akash/requirements-form.tsx

key-decisions:
  - "Use 'any' as sentinel value for optional Select fields - Radix UI forbids empty string values"
  - "Convert sentinel to undefined in onValueChange to keep state clean (region === 'any' -> undefined)"

patterns-established:
  - "Radix Select optional field pattern: value={field || 'any'}, onValueChange={(v) => update(v === 'any' ? undefined : v)}"

requirements-completed: []

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 2 Plan 06: Select Component Empty Value Bug Fix Summary

**Fixed Radix UI Select crash by replacing empty string value="" with 'any' sentinel on the Region dropdown in requirements-form.tsx, unblocking the job submission wizard**

## Performance

- **Duration:** 1 min (pre-existing commits found)
- **Started:** 2026-02-19T00:48:32Z
- **Completed:** 2026-02-19T00:49:19Z
- **Tasks:** 2
- **Files modified:** 1 (requirements-form.tsx) + 1 (UAT)

## Accomplishments
- Fixed Radix UI Select crash caused by empty string value="" on Region SelectItem
- Job submission wizard step 2 (Configure) no longer throws runtime error
- "Any Region" option still correctly maps to undefined in state via sentinel value pattern
- UAT gap #1 marked as fixed with root_cause and fix_commit documented

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Select component empty value in Region dropdown** - `f96071c` (fix)
2. **Task 2: Update UAT to document fix** - `2b2ae34` (docs)

**Plan metadata:** (final commit - this session)

## Files Created/Modified
- `offchain/src/components/akash/requirements-form.tsx` - Changed `value=""` to `value="any"`, updated onValueChange to convert 'any' to undefined, updated value prop default to 'any'
- `.planning/phases/02-akash-webapp-deploy/02-UAT.md` - Gap #1 marked as fixed with root_cause and fix_commit

## Decisions Made
- Used 'any' as sentinel value for the Region Select. Radix UI Select (from shadcn/ui) does not allow empty string values for SelectItem - this is a hard runtime constraint. The sentinel 'any' cleanly represents "no preference" while satisfying Radix's non-empty requirement.
- Conversion from sentinel to undefined happens in onValueChange, keeping the rest of the codebase clean (region is undefined when not set, not 'any').

## Deviations from Plan

None - plan executed exactly as written. The fix was already applied in prior commits (f96071c, 2b2ae34) before this execution session.

## Issues Encountered
- `npx eslint` uses a global ESLint v10 that conflicts with the project's ESLint - used `./node_modules/.bin/eslint` instead (project ESLint passes cleanly).
- Both tasks were already committed prior to this execution session. SUMMARY.md and state updates were the only remaining work.

## Next Phase Readiness
- Job submission wizard is now fully unblocked
- Template gallery and step 2 configuration work correctly
- UAT gap #1 is resolved; remaining gaps (natural language parsing, SDL validation, provider details, deployment routing) are tracked in UAT
- Plans 02-07, 02-08, 02-09 have already resolved several other UAT gaps

---
*Phase: 02-akash-webapp-deploy*
*Completed: 2026-02-19*
