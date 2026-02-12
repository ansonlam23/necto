"use client"

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useWorkflowStore } from '@/lib/workflow-store'
import { nodeTypes } from './custom-nodes'

// Main component - no need for wrapper since we're inside ReactFlowProvider
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

  console.log('WorkflowCanvas rendering with nodes:', nodes)
  console.log('WorkflowCanvas nodes count:', nodes.length)

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      console.log('Drop event triggered')

      const data = event.dataTransfer.getData('application/reactflow')
      console.log('Drag data received:', data)

      if (typeof data === 'undefined' || !data) {
        console.log('No drag data found')
        return
      }

      try {
        const { nodeType, nodeData } = JSON.parse(data)
        console.log('Parsed node data:', { nodeType, nodeData })

        // Calculate position relative to the canvas
        const bounds = event.currentTarget.getBoundingClientRect()
        const position = {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        }
        console.log('Calculated position:', position)

        addNode({
          type: nodeType,
          position,
          data: nodeData,
          category: nodeData.category
        })
        console.log('Node added to store')
      } catch (error) {
        console.error('Error parsing drag data:', error)
      }
    },
    [addNode]
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

  // Use default nodes for testing if custom nodes aren't working
  const displayNodes = nodes.map(node => ({
    ...node,
    type: 'default', // Force default type for now
    style: {
      backgroundColor: '#1e293b',
      color: '#fff',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
    }
  }))

  return (
    <div
      className="flex-1 h-full overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ backgroundColor: '#ffffff', width: '100%', height: '100%' }}
        defaultEdgeOptions={{
          style: { stroke: '#374151', strokeWidth: 2 },
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e5e7eb"
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
          nodeColor="#374151"
          maskColor="hsl(var(--card) / 0.9)"
        />
      </ReactFlow>
    </div>
  )
}