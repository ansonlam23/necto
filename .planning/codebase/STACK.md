# Technology Stack

**Analysis Date:** 2026-02-12

## Languages

**Primary:**
- TypeScript 5.x - All source code (`src/**/*.ts`, `src/**/*.tsx`)
- CSS - Styling via Tailwind CSS v4 (`src/app/globals.css`)

**Configuration:**
- JSON - Package and component manifests
- MJS/TS - Config files (`next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`)

## Runtime

**Environment:**
- Node.js 24.11.0 (detected in environment)
- No engines specification in `package.json`

**Package Manager:**
- npm (package-lock.json present)
- Lockfile: Present and committed

## Frameworks

**Core:**
- Next.js 16.1.6 - React framework with App Router
- React 19.2.3 - UI library with React Server Components
- React DOM 19.2.3 - DOM rendering

**UI Components:**
- shadcn/ui - Component architecture and CLI (`components.json`)
- Radix UI - Headless UI primitives (`@radix-ui/react-*`)

**State Management:**
- Zustand 5.0.11 - Global state management (`src/lib/workflow-store.ts`)

**Data Fetching:**
- TanStack Query (React Query) 5.90.21 - Server state management and caching

**Web3/Blockchain:**
- wagmi 3.4.3 - Ethereum React hooks and wallet connection
- viem 2.45.3 - Ethereum client library

**Visualization:**
- @xyflow/react 12.10.0 - Node-based workflow canvas (React Flow)
- Recharts 3.7.0 - Data visualization charts

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS framework
- tw-animate-css 1.4.0 - Tailwind animation utilities
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Conditional class names
- tailwind-merge 3.4.0 - Tailwind class deduplication

**Icons:**
- lucide-react 0.563.0 - Icon library

## Key Dependencies

**Critical Infrastructure:**
- `@tanstack/react-table` 8.21.3 - Table/data grid components
- `@radix-ui/react-slot` 1.2.4 - Component composition primitive

**Build/Dev:**
- `@tailwindcss/postcss` 4.x - Tailwind PostCSS plugin
- `shadcn` 3.8.4 - shadcn/ui CLI for component management
- TypeScript 5.x - Type checking
- ESLint 9.x - Linting with `eslint-config-next`

## Configuration

**Next.js:**
- Config: `next.config.ts` (TypeScript config)
- App Router enabled (`src/app/` structure)
- Static export not configured

**TypeScript:**
- Strict mode enabled (`tsconfig.json`)
- Path alias: `@/*` → `./src/*`
- Module resolution: bundler
- Target: ES2017
- JSX: react-jsx

**Tailwind CSS:**
- Config: Inline in `src/app/globals.css` using `@theme`
- CSS variables for theming
- Dark mode via `dark` class

**ESLint:**
- Config: `eslint.config.mjs` using flat config format
- Extends: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`

**PostCSS:**
- Config: `postcss.config.mjs`
- Plugin: `@tailwindcss/postcss`

## Platform Requirements

**Development:**
- Node.js 18+ (recommended, tested on 24.11.0)
- npm 9+
- Modern browser with ES2017+ support

**Production:**
- Next.js compatible hosting (Vercel, Node.js server, or static export)
- No serverless-specific dependencies detected

## Font Configuration

**Google Fonts (via next/font):**
- Geist Sans - Primary sans-serif font
- Geist Mono - Monospace font for terminal/data displays

---

*Stack analysis: 2026-02-12*
