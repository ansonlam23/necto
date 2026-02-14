# Technology Stack

**Analysis Date:** 2026-02-14

## Languages

**Primary:**
- TypeScript 5.x - All application code (`offchain/src/**/*.ts`, `offchain/src/**/*.tsx`)
- CSS - Styling with Tailwind CSS (`offchain/src/app/globals.css`)

**Configuration:**
- JSON - Component and package manifests
- MJS/MTS - ES Module configuration files

## Runtime

**Environment:**
- Node.js (managed via package manager)
- Next.js 16.1.6 App Router (React Server Components enabled)

**Package Manager:**
- npm (inferred from `package-lock.json` presence)
- Lockfile: present

## Frameworks

**Core:**
- **Next.js 16.1.6** - Full-stack React framework with App Router
- **React 19.2.3** - UI library with latest features
- **React DOM 19.2.3** - DOM rendering

**Testing:**
- Not configured (no test framework installed)

**Build/Dev:**
- **TypeScript 5.x** - Type checking and transpilation
- **Tailwind CSS v4** - Utility-first CSS framework
- **PostCSS** - CSS processing with `@tailwindcss/postcss` plugin
- **ESLint 9.x** - Linting with Next.js presets

## Key Dependencies

**Critical:**
- **viem 2.45.3** - Ethereum/EVM interaction library (onchain operations)
- **wagmi 3.4.3** - React hooks for Ethereum (wallet connection, chain switching)
- **@tanstack/react-query 5.90.21** - Server state management and caching
- **zustand 5.0.11** - Client state management (workflow store)

**UI Framework:**
- **radix-ui 1.4.3** - Headless UI primitives (dialog, dropdown-menu, navigation-menu, slot)
- **@xyflow/react 12.10.0** - React Flow - node-based workflow canvas
- **class-variance-authority 0.7.1** - Component variant management
- **tailwind-merge 3.4.0** - Tailwind class deduplication
- **clsx 2.1.1** - Conditional className joining
- **lucide-react 0.563.0** - Icon library
- **recharts 3.7.0** - Data visualization charts
- **@tanstack/react-table 8.21.3** - Table components

**Typography:**
- **Geist & Geist Mono** - Next.js Google Fonts (via `next/font/google`)

## Configuration

**Environment:**
- `.env.local` - Present (contains environment-specific configuration)
- No required env vars detected in code

**Build:**
- `next.config.ts` - Next.js configuration (minimal/default)
- `tsconfig.json` - TypeScript configuration
  - Target: ES2017
  - Module: ESNext
  - Path alias: `@/*` → `./offchain/src/*`
  - Strict mode enabled
- `postcss.config.mjs` - PostCSS with Tailwind CSS v4
- `eslint.config.mjs` - ESLint with Next.js presets

**Styling:**
- `offchain/src/app/globals.css` - Global styles with Tailwind CSS v4
- Tailwind v4 uses `@import "tailwindcss"` syntax (new v4 format)
- Dark mode theme via `.dark` class
- Custom theme variables in `@theme inline` block

**Component System:**
- `components.json` - shadcn/ui configuration
  - Style: "new-york"
  - RSC: enabled
  - TSX: enabled
  - Base color: neutral
  - CSS variables: enabled
  - Icon library: lucide

## Platform Requirements

**Development:**
- Node.js compatible with Next.js 16
- npm for package management

**Production:**
- Next.js build target: `next build`
- Static export or server deployment supported
- No detected deployment platform configuration (Vercel, Netlify, etc.)

---

*Stack analysis: 2026-02-14*
