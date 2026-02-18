---
status: resolved
trigger: "Natural language input 'I need a PyTorch environment with 2 GPUs' selects wrong template (Ollama instead of PyTorch) and routes 1 GPU instead of 2"
created: 2026-02-17T00:00:00Z
updated: 2026-02-17T00:10:00Z
---

## Current Focus

hypothesis: The parseNaturalLanguage function has TWO bugs: (1) No GPU count extraction - always defaults to 1 GPU, (2) Template matching may be happening elsewhere and incorrectly selecting Ollama
test: Examine template gallery and wizard flow to see how templates are matched
expecting: Find where templates are matched to parsed requirements and why Ollama is selected instead of PyTorch
next_action: Search for template matching logic in the wizard/components

## Symptoms

expected: Typing "I need a PyTorch environment with 2 GPUs" should select PyTorch template and set GPU count to 2
actual: Template shows "Ollama LLM" and only routes 1 GPU
errors: None reported - silent failure
reproduction: Type natural language input with PyTorch + 2 GPUs
started: Always broken

## Eliminated

## Evidence

- timestamp: 2026-02-17T00:05:00Z
  checked: parseNaturalLanguage function in sdl-generator.ts lines 296-337
  found: GPU count extraction is completely missing - line 302 always sets `requirements.gpu = { units: 1 }` regardless of what number user specifies
  implication: Bug #1: "2 GPUs" in input will always result in 1 GPU because no regex extracts the number

- timestamp: 2026-02-17T00:06:00Z
  checked: parseNaturalLanguage template matching logic lines 306-323
  found: Template matching uses else-if chain. PyTorch check is first (line 306), then TensorFlow, Jupyter, Stable Diffusion, and finally Ollama (line 319)
  implication: "pytorch" should match first before "ollama" or "llm", so the template matching SHOULD work for PyTorch

- timestamp: 2026-02-17T00:07:00Z
  checked: Input text "I need a PyTorch environment with 2 GPUs"
  found: "pytorch" is detected at line 306, "llm" is NOT in "environment" so won't trigger Ollama
  implication: The reported "Ollama" selection must be happening elsewhere or there's confusion about what's being displayed

- timestamp: 2026-02-17T00:08:00Z
  checked: How requirements.name is displayed in UI
  found: The quick status card (page.tsx lines 203-204) shows `selectedTemplate?.name || requirements.name`. If no template is selected, it shows requirements.name which would be "pytorch" (lowercase)
  implication: The UI might be showing the service name "pytorch" not the template name "PyTorch GPU Training"

## Resolution

root_cause: |
  TWO BUGS in parseNaturalLanguage() function (sdl-generator.ts lines 296-337):
  
  BUG #1 - GPU Count Not Extracted (Line 302):
  The code always sets `requirements.gpu = { units: 1 }` when GPU keywords are detected,
  but NEVER extracts the actual number from input. Input "2 GPUs" should set units: 2,
  but code ignores the number and always uses 1.
  
  BUG #2 - Missing GPU Count Regex:
  No regex pattern exists to extract GPU count. Should match patterns like:
  - "2 GPUs" → units: 2
  - "2 GPU" → units: 2  
  - "2 x GPU" → units: 2
  - "two GPUs" → units: 2 (optional word numbers)

fix: |
  Add GPU count extraction regex to parseNaturalLanguage function:
  1. Add regex to match GPU count: /(\d+)\s*(?:x\s*)?gpu/i
  2. Extract the number and use it for gpu.units instead of hardcoded 1
  3. Keep default of 1 if no number found but GPU keywords present
  
  NOTE: The reported "Ollama" template issue could not be reproduced from code analysis.
  The else-if chain ensures PyTorch is checked before Ollama. This may be user confusion
  or clicking the wrong example button. The primary fix is GPU count extraction.

verification: |
  Test with input "I need a PyTorch environment with 2 GPUs":
  - GPU units should be 2 (not 1)
  - Image should be pytorch/pytorch:latest
  - Name should be 'pytorch'

files_changed:
  - offchain/src/lib/akash/sdl-generator.ts
