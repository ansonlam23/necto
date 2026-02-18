---
status: resolved
trigger: "Test 3 (major) - SDL editor doesn't update validation for invalid syntax"
created: 2026-02-18T02:00:00Z
updated: 2026-02-18T02:10:00Z
---

## Current Focus

hypothesis: SDL editor validation is either not being triggered on editor content change, or validation results are not being passed to UI properly
test: Find SDL editor component and examine validation logic
expecting: Validation should run on content change and update UI state
next_action: Implement fix with js-yaml parsing

## Symptoms

expected: SDL editor shows generated YAML from requirements. Validation highlights syntax errors in real-time.
actual: Generated YAML exists, but validation doesn't update for invalid syntax
errors: None reported - silent failure
reproduction: When user edits YAML text in the editor, validation badge and error messages don't update to reflect invalid syntax
started: During UAT testing 2026-02-18

## Eliminated

## Evidence

- timestamp: 2026-02-18T02:00:00Z
  checked: UAT test file
  found: Issue reported in Test 3 - validation not updating for invalid syntax
  implication: Validation logic exists but may have stale dependencies or missing reactive updates

- timestamp: 2026-02-18T02:05:00Z
  checked: sdl-editor.tsx component
  found: handleYamlChange function only updates yaml state and sets isModified, but does NOT parse or validate the YAML
  implication: Validation only runs in useEffect when initialSdl or requirements props change, not when user edits

- timestamp: 2026-02-18T02:07:00Z
  checked: sdl-generator.ts validateSDL function
  found: validateSDL takes an SdlSpec object and validates its structure
  implication: Need to parse YAML string back to SdlSpec before validation can work

- timestamp: 2026-02-18T02:08:00Z
  checked: package.json dependencies
  found: js-yaml is not installed - component has comment "Full YAML parsing would require js-yaml library"
  implication: Need to install js-yaml to parse user-edited YAML for validation

## Resolution

root_cause: The SdlEditor component's handleYamlChange function only updates local state but does NOT parse the YAML or run validation. The validateSDL function requires an SdlSpec object, but when the user types invalid YAML, there's no parsing to convert it back to an object for validation. The component even has a comment acknowledging this limitation. Without js-yaml, real-time validation of user-edited YAML is impossible.

fix: Install js-yaml and implement parseYAMLToSDL function, then call it in handleYamlChange to validate user input
verification: User edits to YAML will trigger validation updates, showing Invalid badge and error messages
files_changed:
  - offchain/src/components/akash/sdl-editor.tsx
  - offchain/src/lib/akash/sdl-generator.ts
  - offchain/package.json
