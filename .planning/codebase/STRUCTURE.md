# Codebase Structure

**Analysis Date:** 2026-02-14

## Directory Layout

```
necto/
├── offchain/src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Dashboard (home page)
│   │   ├── globals.css         # Global styles + CSS variables
│   │   ├── builder/
│   │   │   └── page.tsx        # Workflow builder page
│   │   ├── providers/
│   │   │   └── page.tsx        # GPU providers listing
│   │   ├── settings/
│   │   │   └── page.tsx        # Settings page
│   │   ├── audit/
│   │   │   └── page.tsx        # Audit log page
│   │   └── test-builder/
│   │       └── page.tsx        # Test workflow builder
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx
│   │   │   └── tooltip.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── AppShell.tsx    # Main app shell wrapper
│   │   │   ├── AppHeader.tsx   # Header with wallet/status
│   │   │   └── AppSidebar.tsx  # Navigation sidebar
│   │   ├── workflow/           # Workflow builder components
│   │   │   ├── workflow-canvas.tsx
│   │   │   ├── node-palette.tsx
│   │   │   ├── custom-nodes.tsx
│   │   │   ├── config-panel.tsx
│   │   │   └── test-canvas.tsx
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── DashboardStats.tsx
│   │   │   └── NetworkStatus.tsx
│   │   ├── wallet-connect.tsx  # Wallet connection button
│   │   └── web3-provider.tsx   # Wagmi/Query provider
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-wallet.ts       # Wallet connection hook
│   │   └── use-mobile.ts       # Mobile detection hook
│   └── lib/                    # Utilities and configurations
│       ├── utils.ts            # cn() utility
│       ├── workflow-store.ts   # Zustand workflow store
│       ├── wagmi.ts            # Wagmi configuration
│       └── providers/
│           └── akash-fetcher.ts # Akash provider API
├── .planning/                  # Project planning documents
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   ├── REQUIREMENTS.md
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   └── phases/
│       └── 01-foundation-core-agent/
│           └── 01-CONTEXT.md
├── components.json             # shadcn/ui configuration
├── next.config.ts              # Next.js configuration
├── package.json
├── tsconfig.json
└── tailwind.config files...    # Tailwind v4 (via CSS)
```

## Directory Purposes

**`offchain/src/app/`:**
- Purpose: Next.js App Router file-based routing
- Contains: Pages, layouts, global styles
- Key files: `layout.tsx`, `page.tsx`, `globals.css`

**`offchain/src/components/ui/`:**
- Purpose: Base UI primitives from shadcn/ui
- Contains: Buttons, cards, forms, navigation components
- Pattern: Each component uses Radix UI primitives + cva for variants

**`offchain/src/components/layout/`:**
- Purpose: Application shell and layout structure
- Contains: AppShell, AppHeader, AppSidebar
- Pattern: Composable layout components wrapping page content

**`offchain/src/components/workflow/`:**
- Purpose: Workflow builder feature components
- Contains: Canvas, palette, node types, configuration panel
- Pattern: React Flow integration with Zustand state management

**`offchain/src/components/dashboard/`:**
- Purpose: Dashboard-specific display components
- Contains: Stats cards, network status display

**`offchain/src/hooks/`:**
- Purpose: Reusable React hook logic
- Contains: Wallet connection, mobile detection
- Pattern: Wrap external library hooks (Wagmi) with app-specific logic

**`offchain/src/lib/`:**
- Purpose: Core utilities, configuration, and data fetching
- Contains: Utils, stores, Wagmi config, provider fetchers
- Pattern: Shared code used across components

**`.planning/`:**
- Purpose: Project documentation and planning
- Contains: Architecture docs, requirements, roadmaps, phase plans

## Key File Locations

**Entry Points:**
- `offchain/src/app/layout.tsx`: Root layout - all pages wrapped here
- `offchain/src/app/page.tsx`: Dashboard home page
- `offchain/src/app/builder/page.tsx`: Workflow builder main page

**Configuration:**
- `components.json`: shadcn/ui component registry config
- `next.config.ts`: Next.js framework configuration
- `tsconfig.json`: TypeScript configuration with `@/*` path alias

**Core Logic:**
- `offchain/src/lib/workflow-store.ts`: Zustand store for workflow state
- `offchain/src/lib/wagmi.ts`: Blockchain connection configuration
- `offchain/src/lib/providers/akash-fetcher.ts`: External API integration

**Global State:**
- `offchain/src/lib/workflow-store.ts`: Workflow nodes and edges
- `offchain/src/components/web3-provider.tsx`: Wagmi + React Query providers

**Testing:**
- No test framework configured currently
- Test components exist in `offchain/src/components/workflow/test-canvas.tsx`

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (`workflow-canvas.tsx`)
- Hooks: `use-descriptive-name.ts` (`use-wallet.ts`)
- Utilities: `descriptive-name.ts` (`workflow-store.ts`)
- Pages: `page.tsx` (Next.js convention for App Router)
- Layouts: `layout.tsx` (Next.js convention)

**Directories:**
- Feature folders: `kebab-case/` (`workflow/`, `dashboard/`)
- Component categories: descriptive nouns (`ui/`, `layout/`, `hooks/`, `lib/`)

**Exports:**
- Components: Named exports for components, `export function ComponentName`
- Hooks: Named exports with `use` prefix
- Types: Named exports with PascalCase
- Utilities: Named exports with camelCase

## Where to Add New Code

**New Page:**
- Create directory: `offchain/src/app/[route-name]/`
- Add page: `offchain/src/app/[route-name]/page.tsx`
- Update sidebar: `offchain/src/components/layout/AppSidebar.tsx` navigation items

**New UI Component:**
- Use shadcn CLI: `npx shadcn add <component-name>`
- Installs to: `offchain/src/components/ui/[component-name].tsx`
- Manual components: `offchain/src/components/[category]/[ComponentName].tsx`

**New Workflow Node Type:**
- Add template: `offchain/src/components/workflow/custom-nodes.tsx` in `nodeTemplates`
- Add to palette: Automatically included via templates
- Add styling: Update `getNodeStyle()` in same file

**New Hook:**
- Create file: `offchain/src/hooks/use-[name].ts`
- Export function with `use` prefix
- Import in components: `import { useHookName } from '@/hooks/use-hook-name'`

**New Provider Integration:**
- Create fetcher: `offchain/src/lib/providers/[provider-name]-fetcher.ts`
- Export type and fetch function
- Import in page component for server-side fetching

**New Store/State:**
- Add to existing: Extend `offchain/src/lib/workflow-store.ts` for workflow-related state
- New domain: Create `offchain/src/lib/[domain]-store.ts` following Zustand pattern

**Utilities:**
- Add to: `offchain/src/lib/utils.ts` for shared helpers
- Keep `cn()` function as primary class merging utility

## Special Directories

**`offchain/src/app/`:**
- Purpose: Next.js App Router pages and layouts
- Generated: No (handwritten)
- Committed: Yes
- Special: File-based routing - file paths become URL paths

**`offchain/src/components/ui/`:**
- Purpose: shadcn/ui component library
- Generated: Partially (via `npx shadcn add`)
- Committed: Yes
- Special: Uses Radix UI primitives, cva for variants

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `next build` or `next dev`)
- Committed: No (in .gitignore)
- Special: Contains compiled output, cache, type definitions

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-02-14*
