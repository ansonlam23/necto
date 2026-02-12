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
    icon: LucideIcon
    category: NodeCategory
  }
  selected: boolean
}

function getNodeStyle(category: NodeCategory, selected: boolean) {
  const baseClasses = "px-4 py-3 rounded-lg border-2 bg-card min-w-[140px] transition-all duration-200"

  const categoryStyles = {
    trigger: "border-blue-500 shadow-blue-500/20",
    logic: "border-blue-500 shadow-blue-500/20",
    provider: "border-purple-500 shadow-purple-500/20",
    settlement: "border-emerald-500 shadow-emerald-500/20"
  }

  const selectedGlow = selected ? "shadow-lg" : "shadow-md"

  return `${baseClasses} ${categoryStyles[category]} ${selectedGlow}`
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  const { label, icon: Icon, category } = data

  const showInputHandle = category !== 'trigger'
  const showOutputHandle = category !== 'settlement'

  return (
    <div className={getNodeStyle(category, selected)}>
      {showInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !border-2 !border-slate-400 !bg-slate-800"
        />
      )}

      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      {showOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !border-2 !border-slate-400 !bg-slate-800"
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
}

// Node templates for the palette
export const nodeTemplates = {
  triggers: [
    { type: 'trigger', label: 'Webhook', icon: Webhook, category: 'trigger' as NodeCategory },
    { type: 'trigger', label: 'Schedule (Cron)', icon: Clock, category: 'trigger' as NodeCategory },
    { type: 'trigger', label: 'On-Chain Event', icon: Activity, category: 'trigger' as NodeCategory },
  ],
  logic: [
    { type: 'logic', label: 'AI Router', icon: Brain, category: 'logic' as NodeCategory },
    { type: 'logic', label: 'Compliance Gate', icon: Shield, category: 'logic' as NodeCategory },
    { type: 'logic', label: 'Budget Guard', icon: DollarSign, category: 'logic' as NodeCategory },
  ],
  providers: [
    { type: 'provider', label: 'Akash Group', icon: Server, category: 'provider' as NodeCategory },
    { type: 'provider', label: 'io.net Cluster', icon: Cpu, category: 'provider' as NodeCategory },
    { type: 'provider', label: 'Render Node', icon: Cloud, category: 'provider' as NodeCategory },
  ],
  settlement: [
    { type: 'settlement', label: 'ADI Payment', icon: CreditCard, category: 'settlement' as NodeCategory },
    { type: 'settlement', label: '0G Audit Log', icon: FileCheck, category: 'settlement' as NodeCategory },
  ],
}