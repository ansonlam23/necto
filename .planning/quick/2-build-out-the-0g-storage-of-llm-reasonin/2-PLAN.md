---
phase: 0g-storage-quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - offchain/src/lib/0g/client.ts
  - offchain/src/lib/0g/types.ts
  - offchain/src/lib/agent/tools/log-reasoning-to-0g.ts
  - offchain/src/lib/agent/hooks/use-0g-logging.ts
autonomous: true
requirements:
  - 0G-01
must_haves:
  truths:
    - Agent reasoning logs are stored immutably on 0G Storage
    - Each reasoning decision has a retrievable 0G hash/root
    - Logging happens automatically during agent execution
  artifacts:
    - path: offchain/src/lib/0g/client.ts
      provides: 0G Storage client wrapper with upload/download methods
      exports: ["0gClient", "uploadReasoningLog", "fetchReasoningLog"]
    - path: offchain/src/lib/0g/types.ts
      provides: TypeScript types for 0G reasoning logs
      exports: ["ReasoningLog", "ReasoningLogUpload"]
    - path: offchain/src/lib/agent/tools/log-reasoning-to-0g.ts
      provides: ADK tool for logging reasoning to 0G
      exports: ["logReasoningTo0gTool"]
    - path: offchain/src/lib/agent/hooks/use-0g-logging.ts
      provides: React hook for 0G log retrieval/display
      exports: ["use0gLog"]
  key_links:
    - from: log-reasoning-to-0g.ts
      to: offchain/src/lib/agent/adk-agent.ts
      via: "Register tool in agent"
      pattern: "tools: \[.*logReasoningTo0gTool.*\]"
user_setup:
  - service: 0g-storage
    why: 0G Storage testnet for immutable reasoning logs
    env_vars:
      - name: NEXT_PUBLIC_0G_STORAGE_RPC
        source: 0G Testnet configuration
      - name: OG_STORAGE_PRIVATE_KEY
        source: 0G Wallet private key for uploads
---

<objective>
Build 0G Storage integration for immutable LLM reasoning logs. Create a client wrapper, logging tool, and React hook to enable transparent, verifiable agent decision tracking.

Purpose: Implement the critical transparency layer where every routing decision's reasoning is immutably logged to 0G Storage, fulfilling the "Transparent AI routing" differentiator.
Output: Working 0G integration with upload/download capabilities and agent tool integration.
</objective>

<execution_context>
@/home/julius/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@offchain/src/lib/agent/adk-agent.ts
@offchain/src/lib/agent/types/compare-providers.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create 0G Storage client and types</name>
  <files>
    offchain/src/lib/0g/client.ts
    offchain/src/lib/0g/types.ts
  </files>
  <action>
Create offchain/src/lib/0g/types.ts with types:
- ReasoningLog: { id: string, timestamp: number, query: string, selectedProvider: string, reasoning: string[], confidence: number, txHash?: string }
- ReasoningLogUpload: { log: ReasoningLog, tags?: string[] }

Create offchain/src/lib/0g/client.ts:
- Initialize 0G SDK client with env vars
- uploadReasoningLog(log: ReasoningLogUpload): Promise&lt;{ root: string; txHash: string }&gt; - uploads JSON to 0G
- fetchReasoningLog(root: string): Promise&lt;ReasoningLog&gt; - retrieves from 0G
- Handle 0G testnet RPC configuration
- Add error handling for network/storage failures

Install @0glabs/0g-ts-sdk if not present (npm install @0glabs/0g-ts-sdk)

Note: Use 0G Storage SDK v1.x APIs for testnet compatibility. Include retry logic for testnet instability (STATE.md flagged this risk).
  </action>
  <verify>
cd offchain && npx tsc --noEmit 2>&1 | grep -E "(error|0g)" || echo "TypeScript check passed"
</verify>
  <done>
0G client compiles without errors, types are exported correctly
</done>
</task>

<task type="auto">
  <name>Task 2: Create agent tool and hook for 0G logging</name>
  <files>
    offchain/src/lib/agent/tools/log-reasoning-to-0g.ts
    offchain/src/lib/agent/hooks/use-0g-logging.ts
  </files>
  <action>
Create offchain/src/lib/agent/tools/log-reasoning-to-0g.ts:
- Build ADK tool "log_reasoning_to_0g" that accepts ReasoningLog input
- Calls uploadReasoningLog from 0G client
- Returns { root: string, txHash: string } on success
- Include in tool description: "Stores agent reasoning immutably to 0G Storage for transparency"

Create offchain/src/lib/agent/hooks/use-0g-logging.ts:
- React hook use0gLog(root: string) that fetches and displays reasoning logs
- Returns { log: ReasoningLog | null, loading: boolean, error: Error | null }
- Use for dashboard "View Reasoning" feature
- Cache results in memory for 30 seconds

Update offchain/src/lib/agent/adk-agent.ts to register the new tool in the agent's tools array.
  </action>
  <verify>
grep -q "log_reasoning_to_0g" offchain/src/lib/agent/adk-agent.ts && echo "Tool registered"
cd offchain && npx tsc --noEmit 2>&1 | grep -E "error" | head -5 || echo "TypeScript check passed"
</verify>
  <done>
Tool is registered in agent, hook compiles, types are consistent
</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- 0G client exports all required functions
- Agent tool is registered in adk-agent.ts tools array
- Hook can be imported and used in components
</verification>

<success_criteria>
- 0G Storage client exists with upload/download methods
- ADK tool for logging reasoning is registered and callable
- React hook for retrieving logs exists
- Code compiles and types are consistent
</success_criteria>

<output>
After completion, create `.planning/quick/2-build-out-the-0g-storage-of-llm-reasonin/2-SUMMARY.md`
</output>
