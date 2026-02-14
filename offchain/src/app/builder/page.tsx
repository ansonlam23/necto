"use client"

import { Boxes, Save, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReactFlowProvider } from '@xyflow/react'
import { NodePalette } from "@/components/workflow/node-palette"
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas"
import { TestCanvas } from "@/components/workflow/test-canvas"
import { ConfigPanel } from "@/components/workflow/config-panel"
import { useWorkflowStore } from "@/lib/workflow-store"

export default function WorkflowBuilderPage() {
  const { nodes, edges } = useWorkflowStore()

  const handleSave = () => {
    console.log('Saving workflow:', { nodes, edges })
    // TODO: Implement save functionality
  }

  const handleDeploy = () => {
    console.log('Deploying workflow:', { nodes, edges })
    // TODO: Implement deployment functionality
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Boxes className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Workflow Builder</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm" onClick={handleDeploy}>
            <Play className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>

      {/* Main Content - Wrapped in ReactFlowProvider */}
      <ReactFlowProvider>
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar - Node Palette */}
          <NodePalette />

          {/* Main Canvas */}
          <WorkflowCanvas />

          {/* Right Sidebar - Configuration Panel */}
          <ConfigPanel />
        </div>
      </ReactFlowProvider>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Nodes: <span className="terminal-data">{nodes.length}</span></span>
          <span>Connections: <span className="terminal-data">{edges.length}</span></span>
        </div>
        <div>
          Ready • Drag nodes from palette or click to add
        </div>
      </div>
    </div>
  )
}