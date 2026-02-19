"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Webhook, Clock, Link, FileUp, Zap,
  Brain, Shield, DollarSign, Filter, Code, Database,
  Server, Cloud, HardDrive,
  CreditCard, FileText, Bell, Archive, Send
} from 'lucide-react'

interface NodeTemplate {
  type: string
  label: string
  category: string
  icon: any
  description?: string
}

const nodeTemplates: Record<string, NodeTemplate[]> = {
  Triggers: [
    { type: 'webhook', label: 'Webhook', category: 'trigger', icon: Webhook, description: 'HTTP endpoint trigger' },
    { type: 'schedule', label: 'Schedule (Cron)', category: 'trigger', icon: Clock, description: 'Time-based trigger' },
    { type: 'onchain-event', label: 'On-Chain Event', category: 'trigger', icon: Link, description: 'Blockchain events' },
    { type: 'api-call', label: 'API Call', category: 'trigger', icon: Zap, description: 'External API trigger' },
    { type: 'file-upload', label: 'File Upload', category: 'trigger', icon: FileUp, description: 'File input trigger' },
  ],
  Logic: [
    { type: 'ai-router', label: 'AI Router', category: 'logic', icon: Brain, description: 'AI-powered routing' },
    { type: 'compliance-gate', label: 'Compliance Gate', category: 'logic', icon: Shield, description: 'Compliance checks' },
    { type: 'budget-guard', label: 'Budget Guard', category: 'logic', icon: DollarSign, description: 'Cost control' },
    { type: 'data-filter', label: 'Data Filter', category: 'logic', icon: Filter, description: 'Filter data' },
    { type: 'transformer', label: 'Transformer', category: 'logic', icon: Code, description: 'Transform data' },
    { type: 'aggregator', label: 'Aggregator', category: 'logic', icon: Database, description: 'Aggregate data' },
  ],
  Providers: [
    { type: 'akash-network', label: 'Akash Network', category: 'provider', icon: Server, description: 'Decentralized compute' },
    { type: 'render', label: 'Render', category: 'provider', icon: Cloud, description: 'Cloud rendering' },
    { type: 'io-net', label: 'io.net', category: 'provider', icon: Server, description: 'GPU clusters' },
    { type: 'lambda-labs', label: 'Lambda Labs', category: 'provider', icon: Cloud, description: 'GPU cloud' },
    { type: 'vast-ai', label: 'Vast.ai', category: 'provider', icon: HardDrive, description: 'GPU marketplace' },
    { type: 'runpod', label: 'RunPod', category: 'provider', icon: Server, description: 'Serverless GPUs' },
  ],
  Settlement: [
    { type: 'usdc-payment', label: 'USDC Payment', category: 'settlement', icon: CreditCard, description: 'Crypto payment' },
    { type: 'audit-log', label: '0G Audit Log', category: 'settlement', icon: FileText, description: 'Immutable logs' },
    { type: 'notification', label: 'Notification', category: 'settlement', icon: Bell, description: 'Send alerts' },
    { type: 'database-write', label: 'Database Write', category: 'settlement', icon: Archive, description: 'Store data' },
    { type: 'webhook-out', label: 'Webhook Out', category: 'settlement', icon: Send, description: 'Send webhook' },
  ],
}

interface SidebarProps {
  onAddNode: (nodeData: NodeTemplate) => void
}

export function Sidebar({ onAddNode }: SidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeTemplate: NodeTemplate) => {
    event.dataTransfer.setData('nodeType', nodeTemplate.type)
    event.dataTransfer.setData('nodeData', JSON.stringify(nodeTemplate))
    event.dataTransfer.effectAllowed = 'move'
  }

  const categoryColors = {
    Triggers: 'border-blue-500/20 hover:border-blue-500/40',
    Logic: 'border-purple-500/20 hover:border-purple-500/40',
    Providers: 'border-green-500/20 hover:border-green-500/40',
    Settlement: 'border-orange-500/20 hover:border-orange-500/40',
  }

  return (
    <div className="w-64 border-r bg-card/50 backdrop-blur flex-shrink-0">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Workflow Nodes</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag or click to add nodes
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-4">
          {Object.entries(nodeTemplates).map(([category, templates]) => (
            <Card key={category} className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => {
                  const Icon = template.icon
                  return (
                    <div
                      key={template.type}
                      className={`
                        flex items-center gap-3 p-2.5 rounded-lg border cursor-move
                        bg-card hover:bg-accent/50 transition-all
                        ${categoryColors[category as keyof typeof categoryColors]}
                      `}
                      draggable
                      onDragStart={(e) => onDragStart(e, template)}
                      onClick={() => onAddNode(template)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{template.label}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}