<p align="center">
  <img src="offchain/public/necto_readme_pic.png" alt="Necto" width="800" />
</p>

# Necto: Institutional DePIN & Compute Settlement Layer

Necto is a decentralized infrastructure protocol built on ADI Chain that enables institutions to monetize, trade, and settle real-world compute assets. It bridges the gap between idle enterprise hardware (RWA) and global demand through an intelligent, compliant execution layer.

---

## The Institutional Problem

- Stranded Assets: Universities and Enterprises sit on millions of dollars of high-performance GPUs (H100/A100s) that are underutilized, creating a massive efficiency gap in the Real-World Asset (RWA) market.
- Compliance Barriers: Institutional providers cannot participate in permissionless DePIN networks due to lack of KYC/AML controls, geofencing, and workload restrictions.
- Settlement Risk: Current compute marketplaces lack a transparent, immutable ledger for Service Level Agreements (SLAs) and payment settlement.

---

## The Solution: ADI-Powered Infrastructure

Necto leverages ADI Chain as the primary execution and settlement layer to create a regulated, transparent marketplace for compute RWAs.

### Institutional-Grade DePIN

- Permissioned Pools: Providers can enforce strict access controls (e.g., "University Researchers Only", "KYC Verified").
- Policy Engine: Granular workload restrictions (e.g., "No Crypto Mining", "GDPR Compliant Regions") ensured via on-chain metadata.
- Whitelabel Ready: Designed for consortiums to spin up their own branded internal compute markets.

### RWA Settlement on ADI Chain

- Compute-as-an-Asset: Compute capacity is treated as a tradable asset class. Necto records availability and utilization directly on ADI Chain.
- Smart Escrow: Payments are locked in ADI smart contracts and only released upon verifiable proof of service, eliminating counterparty risk.
- Audit Trail: Every job request, pricing negotiation, and final settlement is immutable, providing the audit trail required for financial reporting.

### Intelligent Execution

- AI-Driven Routing: Our agent acts as a broker, matching institutional supply with demand based on complex constraints (Price, Compliance, Latency).
- Automated Workflow: A "Zapier-style" builder allows organizations to automate complex compute pipelines (e.g., "If spot price < $2 on ADI, auto-deploy training cluster").

---

## Key Features for ADI Ecosystem

| Feature           | Institutional Relevance                                                                 |
| :---------------- | :-------------------------------------------------------------------------------------- |
| Compliance Gates  | Enables regulated entities to act as DePIN providers without legal risk.                |
| ADI Settlement    | Uses ADI Chain for high-speed, low-cost financial settlement of compute credits.        |
| Asset Dashboard   | Real-time monitoring of RWA utilization (GPU uptime, revenue yield) for fleet managers. |
| Role-Based Access | Separation of duties between "Admin", "Operator", and "User".                           |

---

## Tech Stack & Architecture

- Settlement Layer: ADI Chain (EVM)
- Application: Next.js 16, TypeScript, Tailwind CSS
- Orchestration: React Flow (Workflow Builder)
- AI Logic: Vercel AI SDK (Google Gemini)
- Data Availability: 0G Storage (Reasoning Logs)
