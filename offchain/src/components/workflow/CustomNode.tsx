"use client"

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import {
  Webhook, Clock, Link, FileUp, Zap,
  Brain, Shield, DollarSign, Filter, Code, Database,
  Server, Cloud, HardDrive,
  CreditCard, FileText, Bell, Archive, Send,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Icon mapping for node types
const iconMap: Record<string, LucideIcon> = {
  // Triggers
  webhook: Webhook,
  schedule: Clock,
  'onchain-event': Link,
  'api-call': Zap,
  'file-upload': FileUp,

  // Logic
  'ai-router': Brain,
  'compliance-gate': Shield,
  'budget-guard': DollarSign,
  'data-filter': Filter,
  transformer: Code,
  aggregator: Database,

  // Providers
  'akash-network': Server,
  render: Cloud,
  'io-net': Server,
  'lambda-labs': Cloud,
  'vast-ai': HardDrive,
  runpod: Server,

  // Settlement
  'usdc-payment': CreditCard,
  'audit-log': FileText,
  notification: Bell,
  'database-write': Archive,
  'webhook-out': Send,
}

// Color mapping for categories
const categoryColors = {
  trigger: {
    border: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
    icon: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-500/30',
  },
  logic: {
    border: 'border-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950',
    icon: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-purple-500/30',
  },
  provider: {
    border: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
    icon: 'text-green-600 dark:text-green-400',
    glow: 'shadow-green-500/30',
  },
  settlement: {
    border: 'border-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950',
    icon: 'text-orange-600 dark:text-orange-400',
    glow: 'shadow-orange-500/30',
  },
}

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const { label, type, category, config, status } = data
  const Icon = iconMap[type] || Server
  const colors = categoryColors[category as keyof typeof categoryColors] || categoryColors.trigger

  // Determine which handles to show based on category
  const showLeftHandle = category !== 'trigger'
  const showRightHandle = category !== 'settlement'

  return (
    <>
      {showLeftHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-slate-500 !border-2 !border-slate-700"
        />
      )}

      <div
        className={cn(
          'px-4 py-3 rounded-lg border-2 min-w-[160px] transition-all',
          'bg-card hover:shadow-lg cursor-pointer',
          colors.border,
          colors.bg,
          selected && `ring-2 ring-offset-2 ring-offset-background ${colors.border}`,
          selected && `shadow-lg ${colors.glow}`,
          status === 'running' && 'animate-pulse'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-md bg-background/50', colors.icon)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{label}</span>
            {config && Object.keys(config).length > 0 && (
              <span className="text-xs text-muted-foreground">Configured</span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        {status && (
          <div className="absolute -top-1 -right-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              status === 'running' && 'bg-blue-500 animate-pulse',
              status === 'success' && 'bg-green-500',
              status === 'error' && 'bg-red-500'
            )} />
          </div>
        )}
      </div>

      {showRightHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-slate-500 !border-2 !border-slate-700"
        />
      )}
    </>
  )
})

CustomNode.displayName = 'CustomNode'