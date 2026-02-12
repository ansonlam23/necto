# Roadmap: Necto - Institutional DePIN Router Interface

**Project:** Necto
**Created:** February 11, 2026
**Depth:** Standard (5-8 phases)
**Coverage:** 26/26 requirements mapped ✓

## Overview

Transform institutional infrastructure procurement through seamless automation across DePIN networks. Each phase delivers a complete capability that enables enterprise teams to procure compliant compute resources without Web3 complexity. The roadmap progresses from foundation (UI shell) through core features (resource discovery) to enterprise capabilities (compliance and optimization).

## Phases

### Phase 1 - Foundation Interface
**Goal:** Users can navigate the platform and see real-time cost advantages

**Dependencies:** None (foundation)

**Requirements:** UI-01, UI-02, UI-05, DISC-02

**Success Criteria:**
1. User can navigate between Dashboard, Builder, and Audit sections via sidebar
2. User can see live KPI cards showing TVL, Compute utilization, and Compliance status
3. User can view Active Jobs Table with basic procurement activity
4. User can experience cyberpunk-professional aesthetics with consistent dark theme (bg-slate-950, text-slate-200, blue-600 accents)
5. User can see 70%+ cost savings displayed prominently vs traditional cloud providers

### Phase 2 - Resource Discovery Engine
**Goal:** Users can discover and compare resources across multiple DePIN networks

**Dependencies:** Phase 1 (requires UI foundation)

**Requirements:** UI-03, DISC-01, DISC-03, DISC-04, NET-04

**Success Criteria:**
1. User can access workflow builder with 3-pane drag-and-drop interface (Node Palette, Canvas, Configuration)
2. User can see real-time resource availability aggregated from Akash, Render, and Aethir networks
3. User can filter resources by compute type, performance specifications, and geographical location
4. User can compare resource options across different networks through consistent interface
5. User can create workflow diagrams using React Flow components for compute procurement strategies

### Phase 3 - Core Network Integration
**Goal:** Users can execute compute procurement on primary DePIN networks with full audit visibility

**Dependencies:** Phase 2 (requires resource discovery)

**Requirements:** NET-01, NET-02, COMP-01, COMP-03, RES-03, UI-04

**Success Criteria:**
1. User can successfully deploy workloads on Akash Network through platform interface
2. User can provision GPU compute resources via Render Network integration
3. User can access comprehensive audit log with TanStack table showing all procurement activities
4. User can view raw JSON proof data in slide-over panel for regulatory compliance
5. User can monitor real-time performance metrics with enterprise-grade dashboards

### Phase 4 - Enterprise Compliance & Optimization
**Goal:** Users can operate with full regulatory compliance while achieving optimal cost efficiency

**Dependencies:** Phase 3 (requires audit foundation and core networks)

**Requirements:** NET-03, BILL-01, BILL-02, BILL-03, BILL-04, COMP-02, COMP-04, RES-01, RES-02, RES-04

**Success Criteria:**
1. User can access Aethir network resources completing multi-network coverage
2. User can pay in USD without cryptocurrency exposure through automated stablecoin conversion
3. User can receive enterprise invoicing with detailed cost breakdown by network and resource
4. User can set budget limits and receive automated alerts for cost management
5. User can see provider compliance status with KYC/ISO verification indicators
6. User can benefit from automated job routing to lowest cost compliant providers
7. User can rely on basic failover when primary providers become unavailable

## Progress

| Phase | Status | Completion | Est. Duration |
|-------|--------|------------|---------------|
| Phase 1 - Foundation Interface | Pending | 0% | 2-3 weeks |
| Phase 2 - Resource Discovery Engine | Pending | 0% | 3-4 weeks |
| Phase 3 - Core Network Integration | Pending | 0% | 4-5 weeks |
| Phase 4 - Enterprise Compliance & Optimization | Pending | 0% | 4-5 weeks |

**Total Estimated Duration:** 13-17 weeks

## Dependencies Flow

```
Phase 1 (Foundation)
    ↓ (UI foundation required)
Phase 2 (Discovery)
    ↓ (Resource discovery required)
Phase 3 (Core Networks + Audit)
    ↓ (Audit foundation + core networks required)
Phase 4 (Full Compliance + Optimization)
```

## Key Milestones

- **Phase 1 Complete:** Professional platform shell with live cost comparison data
- **Phase 2 Complete:** Multi-network resource discovery with workflow building capability
- **Phase 3 Complete:** Full procurement execution on Akash and Render with audit trails
- **Phase 4 Complete:** Enterprise-ready platform with full compliance and optimization features

## Success Metrics

- **User Adoption:** Navigation between all sections works seamlessly
- **Cost Advantage:** 70%+ savings vs traditional cloud clearly visible and achievable
- **Network Coverage:** Successful integration with Akash, Render, and Aethir networks
- **Compliance Ready:** Full audit trails and regulatory reporting capabilities
- **Automation Level:** Automated routing and failover reduce manual intervention by 80%

---
*Roadmap created: February 11, 2026*
*Next: Execute Phase 1 via `/gsd:plan-phase 1`*