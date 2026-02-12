"use client"

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useWorkflowStore } from '@/lib/workflow-store'
import { nodeTypes } from './custom-nodes'

export function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
  } = useWorkflowStore()
  const { screenToFlowPosition } = useReactFlow()

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const data = event.dataTransfer.getData('application/reactflow')

      if (typeof data === 'undefined' || !data) {
        return
      }

      const { nodeType, nodeData } = JSON.parse(data)

      // Use screenToFlowPosition for accurate positioning
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addNode({
        type: nodeType,
        position,
        data: nodeData,
        category: nodeData.category
      })
    },
    [addNode, screenToFlowPosition]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    selectNode(node.id)
  }, [selectNode])

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  return (
    <div className="flex-1 h-full bg-white">
      {/* Canvas placeholder text */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-4xl font-mono text-gray-400 select-none">
            canvas
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-white workflow-canvas-white"
        style={{ backgroundColor: '#ffffff !important' }}
        defaultEdgeOptions={{
          style: { stroke: '#475569', strokeWidth: 2 },
          type: 'smoothstep',
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#9ca3af"
        />
        <Controls
          className="bg-card border-border"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
          }}
        />
        <MiniMap
          className="bg-card border-border"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
          }}
          nodeStrokeWidth={3}
          nodeColor="#475569"
          maskColor="hsl(var(--card) / 0.9)"
        />
      </ReactFlow>
    </div>
  )
}