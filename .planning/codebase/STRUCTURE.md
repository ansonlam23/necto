# Codebase Structure

**Analysis Date:** 2026-02-12

## Directory Layout

```
necto-temp/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── builder/            # Workflow builder pages
│   │   │   ├── page.tsx        # Main builder interface
│   │   │   └── test/           # Test sub-page
│   │   ├── test-builder/       # Standalone working builder example
│   │   ├── settings/           # System settings page
│   │   ├── audit/              # Audit log page
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Dashboard (root route)
│   │   └── globals.css         # Global styles + CSS variables
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (20+ components)
│   │   ├── workflow/           # Workflow builder feature
│   │   ├── dashboard/          # Dashboard feature
│   │   ├── layout/             # App shell components
│   │   ├── web3-provider.tsx   # Wagmi provider wrapper
│   │   └── wallet-connect.tsx  # Wallet connection UI
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utilities and stores
├── public/                     # Static assets
├── .planning/                  # GSD planning documents
│   └── codebase/               # Architecture docs (this file)
├── package.json
├── tsconfig.json
└── next.config.js
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js 16 App Router file-system routing
- Contains: Page components, layouts, global styles
- Key files: `layout.tsx` (root layout), `page.tsx` (dashboard), `globals.css`
- Pattern: Each subdirectory = route segment

**`src/components/ui/`:**
- Purpose: Reusable UI primitive components (shadcn/ui)
- Contains: 20+ components (Button, Card, Dialog, Input, Select, Sidebar, etc.)
- Pattern: Each file exports single component + variants
- Key files: `button.tsx`, `card.tsx`, `sidebar.tsx`

**`src/components/workflow/`:**
- Purpose: Visual workflow builder feature
- Contains: Canvas, node palette, configuration panel, custom node types
- Key files:
  - `workflow-canvas.tsx` - Main React Flow canvas (151 lines)
  - `node-palette.tsx` - Draggable node sidebar (79 lines)
  - `config-panel.tsx` - Node configuration UI (216 lines)
  - `custom-nodes.tsx` - Node component definitions + templates (128 lines)
  - `test-canvas.tsx` - Debug/testing canvas (45 lines)

**`src/components/dashboard/`:**
- Purpose: Dashboard feature components
- Contains: Stats cards, network status display
- Key files: `DashboardStats.tsx`, `NetworkStatus.tsx`

**`src/components/layout/`:**
- Purpose: Application shell and navigation
- Contains: Sidebar, header, shell wrapper components
- Key files:
  - `AppShell.tsx` - Main layout wrapper with SidebarProvider (28 lines)
  - `AppSidebar.tsx` - Navigation sidebar with menu items (173 lines)
  - `AppHeader.tsx` - Top bar with wallet, status indicators (101 lines)

**`src/hooks/`:**
- Purpose: Reusable React hooks
- Contains: Web3 wallet hook, mobile detection
- Key files:
  - `use-wallet.ts` - Wallet connection logic (79 lines)
  - `use-mobile.ts` - Responsive breakpoint detection (20 lines)

**`src/lib/`:**
- Purpose: Utilities, configuration, and state stores
- Contains: Zustand stores, helper functions, wagmi config
- Key files:
  - `workflow-store.ts` - Zustand store for workflow state (77 lines)
  - `utils.ts` - `cn()` class merging utility (7 lines)
  - `wagmi.ts` - Web3 configuration (17 lines)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout (fonts, theme, providers)
- `src/app/page.tsx` - Dashboard page (root route `/`)
- `src/app/builder/page.tsx` - Workflow builder (`/builder`)
- `src/app/test-builder/page.tsx` - Working builder example (`/test-builder`)
- `src/app/settings/page.tsx` - Settings page (`/settings`)
- `src/app/audit/page.tsx` - Audit log page (`/audit`)

**Configuration:**
- `src/app/globals.css` - Global styles, CSS variables, Tailwind theme
- `src/lib/wagmi.ts` - Web3/chain configuration
- `package.json` - Dependencies and scripts

**Core Logic:**
- `src/lib/workflow-store.ts` - Workflow state management (nodes, edges, selection)
- `src/components/workflow/custom-nodes.tsx` - Node type definitions
- `src/hooks/use-wallet.ts` - Wallet connection abstraction

**Layout Shell:**
- `src/components/layout/AppShell.tsx` - Main app wrapper
- `src/components/layout/AppSidebar.tsx` - Navigation with route definitions

**Testing:**
- `src/app/builder/test/page.tsx` - Builder test sub-page
- `src/components/workflow/test-canvas.tsx` - Debug canvas component

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` for pages, `PascalCase.tsx` for components in layout/dashboard
  - Example: `workflow-canvas.tsx`, `AppSidebar.tsx`, `page.tsx`
- Hooks: `use-descriptive-name.ts`
  - Example: `use-wallet.ts`, `use-mobile.ts`
- Stores: `domain-store.ts`
  - Example: `workflow-store.ts`
- Utilities: `descriptive.ts`
  - Example: `utils.ts`, `wagmi.ts`

**Directories:**
- Feature folders: `kebab-case` (e.g., `workflow/`, `test-builder/`)
- App Router routes: match URL segments exactly

**Exports:**
- Components: Named exports for components, default exports for pages
  - Page pattern: `export default function PageName()`
  - Component pattern: `export function ComponentName()`
- Hooks: Named export matching filename
  - Example: `export function useWallet()`
- Stores: Named export for hook
  - Example: `export const useWorkflowStore = create<...>()`

## Where to Add New Code

**New Feature Page:**
- Create directory: `src/app/feature-name/`
- Add page: `src/app/feature-name/page.tsx`
- Add to navigation: Update `navigationItems` in `src/components/layout/AppSidebar.tsx`

**New Workflow Node Type:**
- Add to templates: `nodeTemplates` object in `src/components/workflow/custom-nodes.tsx`
- Add icon import and mapping in same file
- Add config UI: Switch case in `renderConfigFields()` in `src/components/workflow/config-panel.tsx`

**New UI Component:**
- Use shadcn CLI: `npx shadcn add <component>`
- Installs to: `src/components/ui/`
- Follow existing patterns: cva for variants, `cn()` for class merging

**New Custom Hook:**
- Create file: `src/hooks/use-hook-name.ts`
- Export named function matching filename
- Pattern: Return object with state values and action functions

**New Store:**
- Create file: `src/lib/store-name.ts`
- Use Zustand `create()` with typed interface
- Pattern: Define interface → create store → export hook

**New Dashboard Widget:**
- Create component: `src/components/dashboard/WidgetName.tsx`
- Import and use in `src/app/page.tsx`

**New Layout Component:**
- Create in `src/components/layout/`
- Import into `AppShell.tsx` if needed globally

**Utilities:**
- Add to `src/lib/utils.ts` (for `cn()` and small helpers)
- Or create new file in `src/lib/` for domain-specific utilities

## Special Directories

**`.planning/`:**
- Purpose: GSD system planning documents
- Generated: No (manually created)
- Committed: Yes
- Contains: Research, codebase analysis, project plans

**`src/components/ui/`:**
- Purpose: shadcn/ui component library
- Generated: Partially (via `npx shadcn add`)
- Committed: Yes
- Note: These are vendored components meant to be modified in-place

**`public/`:**
- Purpose: Static assets served at root
- Generated: No
- Committed: Yes
- Currently: Appears empty (no favicon, images, etc.)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `next build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-02-12*
