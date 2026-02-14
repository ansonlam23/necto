# Necto Global Shell Implementation

## Overview

The global shell layout for the Necto institutional DePIN interface has been successfully implemented with a cyberpunk-professional design system. The shell provides a Bloomberg Terminal-style interface optimized for financial data and institutional compute procurement workflows.

## Architecture

### Core Components

1. **AppShell** (`/offchain/src/components/layout/AppShell.tsx`)
   - Main layout wrapper using ShadCN sidebar provider
   - Handles responsive behavior and sidebar state management
   - Provides consistent layout structure across all pages

2. **AppSidebar** (`/offchain/src/components/layout/AppSidebar.tsx`)
   - Collapsible navigation sidebar with icon mode
   - Navigation items: Dashboard, Workflow Builder, Audit Log, Settings
   - User profile dropdown with account management
   - Built using ShadCN sidebar components for accessibility

3. **AppHeader** (`/offchain/src/components/layout/AppHeader.tsx`)
   - Top header with sidebar trigger and page context
   - Wallet connection status and controls
   - Agent status indicators with real-time visual feedback
   - Responsive design for desktop and tablet

### Route Structure

```
/offchain/src/app/
├── page.tsx                 # Dashboard (home)
├── builder/page.tsx         # Workflow Builder
├── audit/page.tsx           # Audit Log
└── settings/page.tsx        # Settings
```

### Dashboard Components

1. **DashboardStats** - Financial metrics cards with terminal styling
2. **NetworkStatus** - Real-time DePIN network status indicators

## Design System Features

### Color Scheme
- **Background**: `slate-950` (oklch(0.08 0.004 270))
- **Foreground**: `slate-200` (oklch(0.92 0.003 270))
- **Primary Accent**: `blue-600` (oklch(0.573 0.199 264))
- **Cards**: `slate-900` with subtle borders

### Typography
- **Primary Font**: Geist Sans (clean, modern)
- **Terminal Data**: Custom `.terminal-data` class with JetBrains Mono
- **Numeric Data**: Tabular numbers for financial precision

### Visual Effects
- **Cyberpunk Glow**: Text shadow effect for accent elements
- **Grid Lines**: Subtle grid overlay for terminal aesthetic
- **Status Indicators**: Animated pulse effects for real-time data

## Key Features

### Navigation
- **Keyboard Shortcuts**: Cmd/Ctrl + B to toggle sidebar
- **Responsive**: Mobile sheet menu, desktop collapsible sidebar
- **Active State**: Visual indication of current page
- **Tooltips**: Icon-only mode shows descriptive tooltips

### Status Management
- **Agent Status**: Connected/Disconnected/Error states with animations
- **Wallet Integration**: Connect/disconnect workflow with address display
- **Real-time Updates**: Live status indicators throughout the interface

### Terminal UX
- **High Information Density**: Bloomberg-style layout optimization
- **Monospace Numbers**: Consistent financial data alignment
- **Dark Mode First**: Optimized for low-light trading environments
- **Professional Aesthetics**: Clean, functional design language

## Technical Implementation

### State Management
- Sidebar state persisted in cookies
- Mobile/desktop responsive behavior
- Context providers for shared state

### Accessibility
- Full keyboard navigation support
- Screen reader compatible
- Focus management and ARIA labels
- High contrast ratio compliance

### Performance
- Optimized icon imports from Lucide React
- Efficient re-rendering with React patterns
- Minimal bundle size with tree-shaking

## Usage

The shell is automatically applied to all pages through the root layout. Pages simply need to export their content, and the shell provides:

- Consistent navigation
- Header with status indicators
- Responsive layout container
- Theme and design system application

## Next Steps

1. **Real-time Data Integration**: Connect status indicators to actual data streams
2. **Wallet Provider**: Implement actual wallet connection logic
3. **Theme Customization**: Add user preferences for terminal colors
4. **Advanced Navigation**: Breadcrumbs and contextual navigation
5. **Dashboard Enhancement**: Real-time charts and data visualization

## File Structure

```
/offchain/src/components/layout/
├── AppShell.tsx           # Main layout wrapper
├── AppSidebar.tsx         # Navigation sidebar
├── AppHeader.tsx          # Top header with controls
└── index.ts              # Component exports

/offchain/src/components/dashboard/
├── DashboardStats.tsx     # Metrics cards
└── NetworkStatus.tsx      # Network status display

/offchain/src/components/ui/
└── badge.tsx             # Status badge component
```

The implementation provides a solid foundation for the institutional DePIN interface, ready for integration with backend services and real-time data streams.