"use client"

import { nodeTemplates } from './custom-nodes'
import { useWorkflowStore } from '@/lib/workflow-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NodePalette() {
  const addNode = useWorkflowStore(state => state.addNode)

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, nodeData }))
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleAddNode = (nodeData: any) => {
    // Add node to a random position for click-to-add functionality
    const position = {
      x: Math.random() * 300 + 100,
      y: Math.random() * 300 + 100
    }

    addNode({
      type: nodeData.type,
      position,
      data: nodeData,
      category: nodeData.category
    })
  }

  const sections = [
    { title: 'Triggers', items: nodeTemplates.triggers },
    { title: 'Logic', items: nodeTemplates.logic },
    { title: 'Providers', items: nodeTemplates.providers },
    { title: 'Settlement', items: nodeTemplates.settlement },
  ]

  return (
    <div className="w-64 bg-card border-r border-border h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Node Palette</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag nodes to canvas or click to add
        </p>
      </div>

      <div className="p-4 space-y-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-sidebar-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-accent hover:border-accent-foreground/20 transition-colors"
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type, item)}
                    onClick={() => handleAddNode(item)}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}