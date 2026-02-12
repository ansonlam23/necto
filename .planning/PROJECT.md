# Necto - Institutional DePIN Router Interface

## What This Is

Necto is a "financial terminal" style interface that serves as an institutional compliance gateway for accessing decentralized compute resources. It allows infrastructure teams at AI labs, universities, and enterprises to procure cost-effective compute across fragmented DePIN networks without managing the complexity or regulatory risk of individual Web3 providers directly.

## Core Value

Infrastructure teams can execute compliant compute procurement with seamless automation - if the system can't find verified providers, route jobs automatically, and maintain audit trails for regulators, the entire value proposition fails for enterprise adoption.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Global Shell with sidebar navigation (Dashboard, Builder, Audit) and header with Wallet Connect & Agent Status
- [ ] Dashboard with 3 KPI cards (TVL, Compute, Compliance) and Active Jobs Table
- [ ] Workflow Builder with 3-pane drag-and-drop interface using React Flow (Node Palette, Canvas, Configuration)
- [ ] Audit Log with TanStack table and slide-over panel for raw JSON proof viewing
- [ ] Cyberpunk-professional design system with deep dark mode (bg-slate-950, text-slate-200, blue-600 accent)
- [ ] Real-time provider compliance verification (KYC/ISO status tracking)
- [ ] Cost optimization via automated arbitrage routing
- [ ] Risk management through automated failover and diversified allocation
- [ ] Comprehensive audit trails for regulatory compliance

### Out of Scope

- Consumer-facing interfaces — Enterprise/institutional focus only
- Direct Web3 wallet management — Abstracted through compliance gateway
- Individual DePIN protocol integrations — Handled by backend routing layer

## Context

**Target Users:** Infrastructure teams at AI labs, universities, and enterprises who need enterprise-grade compute procurement without Web3 complexity.

**Success Metrics:** All four outcomes are interdependent for institutional adoption:
- Seamless execution (reduces operational overhead)
- Cost savings (20-40% vs traditional cloud while maintaining SLAs)
- Risk mitigation (zero compliance violations, minimal downtime)
- Operational efficiency (single interface vs managing dozens of providers)

**Core Workflows:**
1. **Resource procurement** — Finding and allocating compute capacity across DePIN providers
2. **Compliance verification** — Ensuring providers meet institutional security/audit requirements
3. **Cost optimization** — Real-time arbitrage routing to cheapest compliant options
4. **Risk management** — Automated failover and diversified allocation strategies

**Technical Environment:** Next.js 14 ecosystem with modern React patterns, institutional-grade TypeScript requirements, and specific design system constraints for professional trading terminal aesthetics.

## Constraints

- **Tech Stack**: Next.js 14 (App Router), Tailwind CSS, Shadcn UI, React Flow — No deviations
- **Design System**: Strict cyberpunk-professional theme (bg-slate-950, text-slate-200, blue-600 accent, monospace data fonts)
- **Icon Library**: lucide-react only
- **Charts**: recharts only
- **TypeScript**: Strict typing required, no any types
- **Component Architecture**: Small, modular components for maintainability
- **Development Agent**: Use frontend-developer subagent from agents folder for all UI implementation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Flow for workflow builder | Proven drag-and-drop library for complex node-based interfaces | — Pending |
| TanStack for audit table | Performance requirements for large audit datasets | — Pending |
| Financial terminal UX paradigm | Users expect Bloomberg/trading desk density and speed | — Pending |
| Deep dark theme (slate-950) | Professional appearance for institutional environments | — Pending |

---
*Last updated: 2026-02-11 after initialization*