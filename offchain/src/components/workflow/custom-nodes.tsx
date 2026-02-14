"use client"

import { Handle, Position } from '@xyflow/react'
import {
  Webhook, Clock, Activity,
  Brain, Shield, DollarSign,
  Server, Cpu, Cloud,
  CreditCard, FileCheck,
  LucideIcon
} from 'lucide-react'
import { NodeCategory } from '@/lib/workflow-store'

interface CustomNodeProps {
  data: {
    label: string
    icon?: LucideIcon
    iconName?: string
    category: NodeCategory
  }
  selected: boolean
}

// Map icon names to icon components
const iconMap: Record<string, LucideIcon> = {
  Webhook,
  Clock,
  Activity,
  Brain,
  Shield,
  DollarSign,
  Server,
  Cpu,
  Cloud,
  CreditCard,
  FileCheck
}

function getNodeStyle(category: NodeCategory, selected: boolean) {
  // Dark node on white canvas
  const baseClasses = "px-4 py-3 rounded-lg border-2 bg-slate-800 min-w-[140px] transition-all duration-200 text-slate-100"

  const categoryStyles = {
    trigger: "border-blue-500 shadow-blue-500/30",
    logic: "border-blue-500 shadow-blue-500/30",
    provider: "border-purple-500 shadow-purple-500/30",
    settlement: "border-emerald-500 shadow-emerald-500/30"
  }

  const selectedGlow = selected ? "shadow-xl ring-2 ring-blue-400" : "shadow-lg"

  return `${baseClasses} ${categoryStyles[category]} ${selectedGlow}`
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  const { label, icon, iconName, category } = data

  console.log('CustomNode rendering:', { label, category, selected, icon, iconName })

  // Get the icon component - try icon prop first, then iconName, then default
  let Icon = icon
  if (!Icon && iconName && iconMap[iconName]) {
    Icon = iconMap[iconName]
  }
  if (!Icon) {
    // Default icon if none provided
    Icon = Activity
  }

  const showInputHandle = category !== 'trigger'
  const showOutputHandle = category !== 'settlement'

  return (
    <div className={getNodeStyle(category, selected)}>
      {showInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !border-2 !border-slate-400 !bg-slate-600"
        />
      )}

      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-slate-100">{label}</span>
      </div>

      {showOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !border-2 !border-slate-400 !bg-slate-600"
        />
      )}
    </div>
  )
}

// Node type definitions
export const nodeTypes = {
  trigger: CustomNode,
  logic: CustomNode,
  provider: CustomNode,
  settlement: CustomNode,
  default: CustomNode,  // Add default type as fallback
}

// Node templates for the palette
export const nodeTemplates = {
  triggers: [
    { type: 'trigger', label: 'Webhook', icon: Webhook, iconName: 'Webhook', category: 'trigger' as NodeCategory },
    { type: 'trigger', label: 'Schedule (Cron)', icon: Clock, iconName: 'Clock', category: 'trigger' as NodeCategory },
    { type: 'trigger', label: 'On-Chain Event', icon: Activity, iconName: 'Activity', category: 'trigger' as NodeCategory },
  ],
  logic: [
    { type: 'logic', label: 'AI Router', icon: Brain, iconName: 'Brain', category: 'logic' as NodeCategory },
    { type: 'logic', label: 'Compliance Gate', icon: Shield, iconName: 'Shield', category: 'logic' as NodeCategory },
    { type: 'logic', label: 'Budget Guard', icon: DollarSign, iconName: 'DollarSign', category: 'logic' as NodeCategory },
  ],
  providers: [
    { type: 'provider', label: 'Akash Group', icon: Server, iconName: 'Server', category: 'provider' as NodeCategory },
    { type: 'provider', label: 'io.net Cluster', icon: Cpu, iconName: 'Cpu', category: 'provider' as NodeCategory },
    { type: 'provider', label: 'Render Node', icon: Cloud, iconName: 'Cloud', category: 'provider' as NodeCategory },
  ],
  settlement: [
    { type: 'settlement', label: 'ADI Payment', icon: CreditCard, iconName: 'CreditCard', category: 'settlement' as NodeCategory },
    { type: 'settlement', label: '0G Audit Log', icon: FileCheck, iconName: 'FileCheck', category: 'settlement' as NodeCategory },
  ],
}