Progress report: /agents page (implemented as /agent)

Overview
- The UI is fully built: chat interface, scenario shortcuts, requirement checklist, and deployment modal all render from `/offchain/src/app/agent/page.tsx`.
- Primary functionality depends on the `/api/agent-chat` endpoint and external services (Gemini API key, Akash provider data, wallet connectivity).

Functional status (what works)
- Chat flow is wired via `useChat` and `DefaultChatTransport` to `/api/agent-chat`.
- The agent can propose deployment configs and search Akash providers via tool calls in `/offchain/src/app/api/agent-chat/route.ts`.
- The left sidebar checklist updates based on the latest `proposeDeployment` tool output.
- The Deploy button unlocks only after `searchAkash` returns success.
- Deploy modal includes a multi-step flow with config editing, wallet connection, escrow payment, and deployment status rendering.
- Deployment completion produces a summary message and records audit data.

Limitations / blockers
- The chat endpoint hard-requires a Gemini API key (`GOOGLE_AI_STUDIO_API_KEY` or equivalent). Without it, the page cannot function beyond the UI.
- Provider search depends on `fetchAkashProviders`; if that service fails or returns empty, deployment discovery is blocked.
- Real deployment requires wallet connectivity (wagmi) and a working Akash deployment hook; without a connected wallet the deploy flow stops at payment.
- Documentation lookup tool is stubbed with static data rather than real Context7 integration.

Overall assessment
- UI and wiring are complete, but end-to-end functionality is gated by external configuration and services.
- With correct API keys and wallet setup, the page should be operational for the propose → search → deploy flow.
