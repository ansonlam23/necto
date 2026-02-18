---
status: testing
phase: 02-akash-webapp-deploy
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md
started: 2026-02-18T01:30:00Z
updated: 2026-02-18T01:40:00Z
---

## Current Test

number: 1
name: Template Gallery - Browse and Select (RE-TEST)
expected: |
  Navigate to /buyer/submit. Template gallery displays 6 templates across 4 categories (AI, Compute, Storage, Web). Category tabs work. Clicking a template selects it and advances to configuration step. The previous Select component bug should be fixed.
awaiting: user response

## Tests

### 1. Template Gallery - Browse and Select
expected: Template gallery displays 6 templates across 4 categories (AI, Compute, Storage, Web). Category tabs filter templates. Selecting a template advances to configuration.
result: fixed
reported: "Clicking manual setup button or clicking next after selecting a template throws Runtime Error: A <Select.Item /> must have a value prop that is not an empty string. Error in requirements-form.tsx line 314 where SelectItem has value='' for 'Any Region' option."
severity: major
fix_commit: "f96071c"

### 2. Natural Language Input - Parse Requirements
expected: Type "I need a PyTorch environment with 2 GPUs" in the natural language input. System parses requirements and pre-fills the configuration form with GPU count and template suggestion.
result: pending

### 3. SDL Editor - YAML Preview and Validation
expected: SDL editor shows generated YAML from requirements. Validation highlights syntax errors. Copy button copies YAML to clipboard. Download button saves as .yaml file.
result: pending

### 4. Multi-Step Wizard - Complete Flow
expected: 5-step wizard progresses through Input → Configure → SDL → Review → Deploy. Each step validates before advancing. Can navigate back to previous steps.
result: pending

### 5. Provider List - Browse and Filter
expected: Provider list page shows available providers with GPU specs, pricing, and region. Filters work for GPU type, max price, and region. Each provider shows score breakdown (price 35%, reliability 25%, etc).
result: pending

### 6. Provider Card - View Details
expected: Clicking a provider opens detailed card showing hardware specs (GPU model, memory), pricing estimate, uptime percentage, and provider score with visual indicators.
result: pending

### 7. Deployment Status - Track Progress
expected: During deployment, status component shows current state with progress bar (0-100%). States include: Creating → Waiting for Bids → Selecting Provider → Deploying → Active. Real-time updates every 10 seconds.
result: pending

### 8. Buyer Dashboard - View Deployments
expected: Dashboard at /buyer/dashboard shows stats cards (active deployments, total spent, escrow balance). Deployment list displays all deployments with status badges (pending, active, closed, error). Clicking deployment shows details.
result: pending

### 9. Deployment Actions - Close Deployment
expected: In deployment list or detail view, clicking "Close Deployment" initiates shutdown. Status changes to "Closing" then "Closed". Deployment removed from active count.
result: pending

### 10. Log Streaming - View Real-Time Logs
expected: Clicking "View Logs" on a deployment opens log viewer. Server-Sent Events stream logs in real-time. Logs show deployment events, errors, and provider communications.
result: pending

### 11. Escrow Flow - Transaction Generation
expected: Creating a deployment generates escrow transaction data. API returns transaction object for client-side signing. No server-side key handling. Transaction includes amount, provider address, and job ID.
result: pending

### 12. ADK Tool Integration - Provider Comparison
expected: Agent can compare multiple providers using compareProvidersTool. Shows side-by-side comparison with suitability scores, estimated costs, and pros/cons for each provider.
result: pending

## Summary

total: 12
passed: 0
issues: 1
pending: 11
skipped: 0

## Gaps

- truth: "Template gallery displays 6 templates and selecting a template advances to configuration step"
  status: fixed
  reason: "User reported: Clicking manual setup button or clicking next after selecting a template throws Runtime Error: A <Select.Item /> must have a value prop that is not an empty string. Error in requirements-form.tsx line 314 where SelectItem has value='' for 'Any Region' option."
  severity: major
  test: 1
  root_cause: "Radix UI Select component doesn't allow empty string values. The 'Any Region' option used value='' which is invalid."
  artifacts:
    - path: "offchain/src/components/akash/requirements-form.tsx"
      issue: "Line 314: SelectItem value='' is invalid"
      fix: "Changed to SelectItem value='any' with proper conversion logic"
  missing: []
  debug_session: ""
  fix_commit: "f96071c"
