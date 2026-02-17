"use client"

import { useState, useCallback } from 'react'
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, Node, Edge, addEdge, Connection, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Save, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Initial nodes to show the canvas is working
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: { label: 'Start' },
    style: {
      backgroundColor: '#1e293b',
      color: '#fff',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '10px',
    }
  },
  {
    id: '2',
    type: 'default',
    position: { x: 250, y: 400 },
    data: { label: 'End' },
    style: {
      backgroundColor: '#1e293b',
      color: '#fff',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      padding: '10px',
    }
  },
]

const initialEdges: Edge[] = []

// Node templates for the palette - organized by category
const nodeTemplates = [
  // Triggers (Blue)
  { id: 'webhook', label: 'Webhook', color: '#3b82f6', category: 'Triggers' },
  { id: 'schedule', label: 'Schedule (Cron)', color: '#3b82f6', category: 'Triggers' },
  { id: 'onchain-event', label: 'On-Chain Event', color: '#3b82f6', category: 'Triggers' },
  { id: 'api-call', label: 'API Call', color: '#3b82f6', category: 'Triggers' },
  { id: 'file-upload', label: 'File Upload', color: '#3b82f6', category: 'Triggers' },

  // Logic & Processing (Purple)
  { id: 'ai-router', label: 'AI Router', color: '#8b5cf6', category: 'Logic' },
  { id: 'compliance', label: 'Compliance Gate', color: '#8b5cf6', category: 'Logic' },
  { id: 'budget-guard', label: 'Budget Guard', color: '#8b5cf6', category: 'Logic' },
  { id: 'filter', label: 'Data Filter', color: '#8b5cf6', category: 'Logic' },
  { id: 'transformer', label: 'Transformer', color: '#8b5cf6', category: 'Logic' },
  { id: 'aggregator', label: 'Aggregator', color: '#8b5cf6', category: 'Logic' },

  // Compute Providers (Green)
  { id: 'akash', label: 'Akash Network', color: '#10b981', category: 'Providers' },
  { id: 'render', label: 'Render', color: '#10b981', category: 'Providers' },
  { id: 'io-net', label: 'io.net', color: '#10b981', category: 'Providers' },
  { id: 'lambda', label: 'Lambda Labs', color: '#10b981', category: 'Providers' },
  { id: 'vast-ai', label: 'Vast.ai', color: '#10b981', category: 'Providers' },
  { id: 'runpod', label: 'RunPod', color: '#10b981', category: 'Providers' },

  // Settlement & Output (Orange)
  { id: 'payment', label: 'USDC Payment', color: '#f59e0b', category: 'Settlement' },
  { id: 'audit', label: '0G Audit Log', color: '#f59e0b', category: 'Settlement' },
  { id: 'notification', label: 'Notification', color: '#f59e0b', category: 'Settlement' },
  { id: 'database', label: 'Database Write', color: '#f59e0b', category: 'Settlement' },
  { id: 'webhook-out', label: 'Webhook Out', color: '#f59e0b', category: 'Settlement' },
]

function TestBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [nextId, setNextId] = useState(3)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = event.currentTarget.getBoundingClientRect()
      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      const template = nodeTemplates.find(t => t.id === type)
      if (!template) return

      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 20,
      }

      const newNode: Node = {
        id: `${nextId}`,
        type: 'default',
        position,
        data: { label: template.label },
        style: {
          backgroundColor: '#1e293b',
          color: '#fff',
          border: `2px solid ${template.color}`,
          borderRadius: '8px',
          padding: '10px',
        }
      }

      setNodes((nds) => nds.concat(newNode))
      setNextId(nextId + 1)
    },
    [nextId, setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const addNodeOnClick = (templateId: string) => {
    const template = nodeTemplates.find(t => t.id === templateId)
    if (!template) return

    const newNode: Node = {
      id: `${nextId}`,
      type: 'default',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: template.label },
      style: {
        backgroundColor: '#1e293b',
        color: '#fff',
        border: `2px solid ${template.color}`,
        borderRadius: '8px',
        padding: '10px',
      }
    }

    setNodes((nds) => nds.concat(newNode))
    setNextId(nextId + 1)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <h1 className="text-2xl font-bold">Test Builder (Working)</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm">
            <Play className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <div className="w-64 bg-card border-r border-border overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-lg mb-4">Node Palette</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Drag to canvas or click to add
            </p>

            {/* Group nodes by category */}
            {['Triggers', 'Logic', 'Providers', 'Settlement'].map((category) => (
              <div key={category} className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {nodeTemplates
                    .filter(template => template.category === category)
                    .map((template) => (
                      <div
                        key={template.id}
                        className="p-2 rounded-md border border-border cursor-pointer hover:bg-accent transition-colors text-sm"
                        draggable
                        onDragStart={(e) => onDragStart(e, template.id)}
                        onClick={() => addNodeOnClick(template.id)}
                        style={{ borderLeftColor: template.color, borderLeftWidth: '3px' }}
                      >
                        {template.label}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            style={{ backgroundColor: '#ffffff' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
            <Controls />
          </ReactFlow>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-card border-l border-border">
          <div className="p-4">
            <h2 className="font-semibold text-lg mb-4">Properties</h2>
            <p className="text-sm text-muted-foreground">
              {nodes.length} nodes • {edges.length} connections
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2 bg-background rounded">
                <strong>Tips:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Click nodes to add them</li>
                  <li>• Drag nodes to reposition</li>
                  <li>• Connect nodes by dragging handles</li>
                  <li>• Delete with Backspace key</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestBuilderPage() {
  return (
    <ReactFlowProvider>
      <TestBuilderContent />
    </ReactFlowProvider>
  )
}