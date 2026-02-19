---
status: complete
phase: 02-akash-webapp-deploy
source: 02-06-SUMMARY.md, 02-07-SUMMARY.md, 02-08-SUMMARY.md, 02-09-SUMMARY.md
started: 2026-02-19T01:00:00Z
updated: 2026-02-19T01:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Job Wizard Step 2 No Longer Crashes
expected: Navigate to /buyer/submit, pick a template, advance to step 2 Configure. Region dropdown shows "Any Region". No crash or runtime error occurs. Wizard advances to step 3.
result: pass

### 2. Provider Score Breakdown Shows Real Values
expected: On the provider selection screen, each provider card shows a score breakdown with actual numeric values for all four metrics: price, reliability, performance, and latency (not all zeros or placeholders).
result: pass

### 3. Provider Detail Dialog Opens on Card Header Click
expected: On the provider list, clicking the header area of a provider card opens a detail dialog with full provider info (region, GPU specs, uptime, pricing). Clicking the select/bottom area of the card does NOT open the dialog — it selects the provider.
result: pass

### 4. Dashboard Stats Update Reactively on Close
expected: On /buyer/dashboard, close an active deployment using the close action. The "Active Deployments" stat card decrements immediately — without a page refresh.
result: pass

### 5. Compare Providers Button in Dashboard
expected: On /buyer/dashboard, a "Compare Providers" button appears in the header area. Clicking it navigates to /buyer/providers/compare.
result: pass

### 6. Provider Comparison Page Renders
expected: At /buyer/providers/compare, the page shows provider cards in a side-by-side layout. A recommendation banner highlights the top-scored suitable provider in green above the comparison grid.
result: pass

### 7. SDL Editor Real-Time Validation
expected: In the job submission wizard's SDL editor step, entering invalid YAML (e.g., delete a required field or break indentation) immediately shows an error message below the editor without needing to submit.
result: pass

### 8. GPU Filter Is Case-Insensitive
expected: In provider selection, filtering or searching for "nvidia" (lowercase) returns providers whose GPU type is listed as "NVIDIA A100", "NVIDIA V100", etc. Case mismatch no longer causes zero results.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
