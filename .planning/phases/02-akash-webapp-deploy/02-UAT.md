---
status: diagnosed
phase: 02-akash-webapp-deploy
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md
started: 2026-02-18T01:30:00Z
updated: 2026-02-18T02:00:00Z
---

## Current Test

[testing complete - diagnosed]

## Tests

### 1. Template Gallery - Browse and Select
expected: Template gallery displays 6 templates across 4 categories (AI, Compute, Storage, Web). Category tabs filter templates. Selecting a template advances to configuration.
result: pass
notes: "Fixed Select component bug, now working correctly"

### 1. Template Gallery - Browse and Select (RE-TEST)
expected: Template gallery displays 6 templates across 4 categories (AI, Compute, Storage, Web). Category tabs work. Clicking a template selects it and advances to configuration step. The previous Select component bug should be fixed.
result: pass

### 2. Natural Language Input - Parse Requirements
expected: Type "I need a PyTorch environment with 2 GPUs" in the natural language input. System parses requirements and pre-fills the configuration form with GPU count and template suggestion.
result: issue
reported: "The name is wrong for the selected template(says ollama llm), and only routes 1gpu"
severity: major

### 3. SDL Editor - YAML Preview and Validation
expected: SDL editor shows generated YAML from requirements. Validation highlights syntax errors. Copy button copies YAML to clipboard. Download button saves as .yaml file.
result: issue
reported: "The generated yaml exists, but doesn't updatet for invalid syntax"
severity: major

### 4. Multi-Step Wizard - Complete Flow
expected: 5-step wizard progresses through Input → Configure → SDL → Review → Deploy. Each step validates before advancing. Can navigate back to previous steps.
result: pass

### 5. Provider List - Browse and Filter
expected: Provider list page shows available providers with GPU specs, pricing, and region. Filters work for GPU type, max price, and region. Each provider shows score breakdown (price 35%, reliability 25%, etc).
result: issue
reported: "The providers don't show score breakdow, with price, reliability, etc"
severity: minor

### 6. Provider Card - View Details
expected: Clicking a provider opens detailed card showing hardware specs (GPU model, memory), pricing estimate, uptime percentage, and provider score with visual indicators.
result: issue
reported: "There is no detail card opened"
severity: major

### 7. Deployment Status - Track Progress
expected: During deployment, status component shows current state with progress bar (0-100%). States include: Creating → Waiting for Bids → Selecting Provider → Deploying → Active. Real-time updates every 10 seconds.
result: issue
reported: "Error: no matching providers - deployment fails immediately with ERROR No providers match requirements"
severity: blocker

### 8. Buyer Dashboard - View Deployments
expected: Dashboard at /buyer/dashboard shows stats cards (active deployments, total spent, escrow balance). Deployment list displays all deployments with status badges (pending, active, closed, error). Clicking deployment shows details.
result: skipped
reason: "Cannot test with real data - deployments failing due to 'no matching providers' blocker"

### 9. Deployment Actions - Close Deployment
expected: In deployment list or detail view, clicking "Close Deployment" initiates shutdown. Status changes to "Closing" then "Closed". Deployment removed from active count.
result: issue
reported: "Not removed from active count"
severity: major

### 10. Log Streaming - View Real-Time Logs
expected: Clicking "View Logs" on a deployment opens log viewer. Server-Sent Events stream logs in real-time. Logs show deployment events, errors, and provider communications.
result: issue
reported: "IT shows logs, but it is hardcoded, most likely, since no real deployments have been made so far"
severity: minor

### 11. Escrow Flow - Transaction Generation
expected: Creating a deployment generates escrow transaction data. API returns transaction object for client-side signing. No server-side key handling. Transaction includes amount, provider address, and job ID.
result: skipped
reason: "Cannot test - jobs can't be created due to deployment failure"

### 12. ADK Tool Integration - Provider Comparison
expected: Agent can compare multiple providers using compareProvidersTool. Shows side-by-side comparison with suitability scores, estimated costs, and pros/cons for each provider.
result: issue
reported: "where in the ui would this occur"
severity: major

## Summary

total: 12
passed: 2
issues: 9
pending: 0
skipped: 2

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

- truth: "Natural language input parses requirements correctly - PyTorch environment with 2 GPUs"
  status: failed
  reason: "User reported: The name is wrong for the selected template(says ollama llm), and only routes 1gpu"
  severity: major
  test: 2
  root_cause: "parseNaturalLanguage() function in sdl-generator.ts always sets requirements.gpu.units = 1 regardless of user input. Missing regex to extract GPU count from '2 GPUs'."
  artifacts:
    - path: "offchain/src/lib/akash/sdl-generator.ts"
      issue: "Line 302: always sets units: 1, ignores count from input"
      fix: "Add regex /(\d+)\s*(?:x\s*)?gpu/i to extract GPU count"
  missing:
    - "Regex pattern to extract GPU count from natural language"
  debug_session: ".planning/debug/resolved/nl-parsing-wrong-template.md"

- truth: "SDL editor validation highlights syntax errors in real-time"
  status: failed
  reason: "User reported: The generated yaml exists, but doesn't updatet for invalid syntax"
  severity: major
  test: 3
  root_cause: "handleYamlChange() only updates state, never parses or validates. js-yaml library not installed. validateSDL requires SdlSpec object but text changes aren't converted back."
  artifacts:
    - path: "offchain/src/components/akash/sdl-editor.tsx"
      issue: "Lines 64-69: no validation in handleYamlChange"
    - path: "offchain/src/lib/akash/sdl-generator.ts"
      issue: "Missing parseYAMLToSDL function to convert string back to SdlSpec"
    - path: "offchain/package.json"
      issue: "js-yaml dependency missing"
  missing:
    - "js-yaml npm package"
    - "parseYAMLToSDL() function"
    - "Real-time validation in handleYamlChange"
  debug_session: ".planning/debug/sdl-editor-validation.md"

- truth: "Provider list shows score breakdown with price, reliability, performance percentages"
  status: failed
  reason: "User reported: The providers don't show score breakdow, with price, reliability, etc"
  severity: minor
  test: 5
  root_cause: "provider-list.tsx only destructures totalScore from ranked items but passes hardcoded zeros for breakdown scores to ProviderCard."
  artifacts:
    - path: "offchain/src/components/akash/provider-list.tsx"
      issue: "Lines 167-171: only totalScore destructured, zeros passed for priceScore, reliabilityScore, performanceScore, latencyScore"
      fix: "Destructure all score fields: ({ provider, totalScore, priceScore, reliabilityScore, performanceScore, latencyScore })"
  missing: []
  debug_session: ".planning/debug/akash-uat-provider-deployment-issues.md"

- truth: "Clicking a provider opens detailed card with hardware specs and pricing"
  status: failed
  reason: "User reported: There is no detail card opened"
  severity: major
  test: 6
  root_cause: "No ProviderDetailDialog component exists. handleSelect only manages selection state (border + checkmark), not opening detailed view."
  artifacts:
    - path: "offchain/src/components/akash/provider-list.tsx"
      issue: "Lines 40-46: handleSelect only sets selectedProvider, no dialog"
    - path: "offchain/src/components/akash/provider-card.tsx"
      issue: "onClick triggers onSelect callback only"
  missing:
    - "ProviderDetailDialog component"
    - "Dialog integration in provider-list.tsx"
  debug_session: ".planning/debug/akash-uat-provider-deployment-issues.md"

- truth: "Deployment routes to Akash provider and shows progress through states"
  status: failed
  reason: "User reported: Error: no matching providers - deployment fails immediately with ERROR No providers match requirements"
  severity: blocker
  test: 7
  root_cause: "Case-sensitive GPU type filtering. SDL generator sets 'nvidia' (lowercase), mock providers have 'NVIDIA A100' (uppercase). 'NVIDIA A100'.includes('nvidia') returns false, filtering out all providers."
  artifacts:
    - path: "offchain/src/lib/agent/provider-selection.ts"
      issue: "Line 178: case-sensitive p.gpuTypes.includes(filters.gpuType)"
      fix: "Change to case-insensitive: p.gpuTypes.some(gpu => gpu.toLowerCase().includes(filters.gpuType!.toLowerCase()))"
    - path: "offchain/src/lib/akash/sdl-generator.ts"
      issue: "Line 181: hardcoded lowercase 'nvidia'"
  missing: []
  debug_session: ".planning/debug/no-matching-providers.md"

- truth: "Closing deployment removes it from active count"
  status: failed
  reason: "User reported: Not removed from active count"
  severity: major
  test: 9
  root_cause: "Stats calculated once during fetchDeployments but never recalculated when deployments state changes. handleCloseDeployment updates state but stats don't react."
  artifacts:
    - path: "offchain/src/app/buyer/dashboard/page.tsx"
      issue: "Lines 110-125: stats only calculated in fetchDeployments, no useEffect for reactive updates"
      fix: "Add useEffect to recalculate stats when deployments changes, or refetch after close"
  missing:
    - "useEffect for reactive stats update OR refetch after close"
  debug_session: ".planning/debug/akash-uat-provider-deployment-issues.md"

- truth: "Log viewer streams real-time logs via Server-Sent Events from actual deployments"
  status: failed
  reason: "User reported: IT shows logs, but it is hardcoded, most likely, since no real deployments have been made so far"
  severity: minor
  test: 10
  root_cause: "Cannot verify - blocked by 'no matching providers' deployment failure. Logs appear to show UI but real SSE connection can't be tested without working deployments."
  artifacts:
    - path: "offchain/src/components/akash/deployment-logs.tsx"
      issue: "Cannot verify real SSE behavior without working deployments"
  missing:
    - "Working deployments to test real log streaming"
  debug_session: ""

- truth: "Agent can compare multiple providers using compareProvidersTool UI integration"
  status: failed
  reason: "User reported: where in the ui would this occur"
  severity: major
  test: 12
  root_cause: "compareProvidersTool exists in agent/tools but has no UI integration. No page or component exposes the side-by-side comparison feature."
  artifacts:
    - path: "offchain/src/lib/agent/tools/compare-providers-tool.ts"
      issue: "Tool exists (418 lines) but no UI consumes it"
    - path: "offchain/src/app/"
      issue: "No route/page for provider comparison"
  missing:
    - "Provider comparison page/component"
    - "Integration of compareProvidersTool in UI"
  debug_session: ""
