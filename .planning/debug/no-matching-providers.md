---
status: investigating
trigger: "Test 7 (Blocker) - Deployment fails immediately with 'No matching providers' error"
created: 2026-02-18T02:00:00Z
updated: 2026-02-18T02:10:00Z
---

## Current Focus

hypothesis: Case sensitivity mismatch in GPU type filtering causes all providers to be filtered out
test: Traced filter flow through sdl-generator → akash-router → provider-selection
expecting: GPU model 'nvidia' (lowercase) doesn't match 'NVIDIA A100' (uppercase)
next_action: Document root cause and affected files

## Symptoms

expected: Deployment should route to Akash provider and show progress through states
actual: Deployment fails immediately with "ERROR No providers match requirements"
errors: "Error: no matching providers"
reproduction: Attempt to create a deployment through the wizard (especially GPU templates like PyTorch, Ollama)
started: Always broken

## Eliminated

## Evidence

- timestamp: 2026-02-18T02:05:00Z
  checked: offchain/src/lib/akash/sdl-generator.ts line 181
  found: SDL generator sets `gpu.model = 'nvidia'` (lowercase) for GPU workloads
  implication: GPU model is hardcoded to lowercase 'nvidia'

- timestamp: 2026-02-18T02:07:00Z
  checked: offchain/src/lib/agent/akash-router.ts lines 193-200
  found: Router passes `filters.gpuType = request.requirements.gpu?.model` → 'nvidia'
  implication: Filter receives lowercase 'nvidia' as gpuType filter

- timestamp: 2026-02-18T02:08:00Z
  checked: offchain/src/lib/agent/provider-selection.ts line 178
  found: Filter uses case-sensitive `p.gpuTypes.includes(filters.gpuType)`
  implication: 'NVIDIA A100'.includes('nvidia') returns false

- timestamp: 2026-02-18T02:09:00Z
  checked: offchain/src/lib/agent/akash-router.ts lines 54-115 (MOCK_PROVIDERS)
  found: Mock providers have gpuTypes: ['NVIDIA A100', 'NVIDIA V100'] (uppercase)
  implication: Case mismatch prevents any provider from matching

## Resolution

root_cause: Case sensitivity mismatch between GPU model in requirements ('nvidia') and provider GPU types ('NVIDIA A100'). The filterProviders function in provider-selection.ts uses case-sensitive string comparison, causing all providers to be filtered out when GPU is requested.

fix: Make GPU type filtering case-insensitive in provider-selection.ts line 178, OR normalize GPU model values in sdl-generator.ts to match provider naming convention.

verification: 
files_changed: []
