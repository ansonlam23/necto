"use client"

import { useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  getOutgoers,
  getIncomers,
  ReactFlowInstance
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Play, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomNode } from '@/components/workflow/CustomNode'
import { Sidebar } from '@/components/workflow/Sidebar'
import { ConfigPanel } from '@/components/workflow/ConfigPanel'

// Define node types
const nodeTypes = {
  trigger: CustomNode,
  logic: CustomNode,
  provider: CustomNode,
  settlement: CustomNode,
}

// Initial nodes - empty canvas
const initialNodes: Node[] = []
const initialEdges: Edge[] = []

function WorkflowContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [animatedEdges, setAnimatedEdges] = useState<Set<string>>(new Set())
  const [nextId, setNextId] = useState(1)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  // Handle node connection
  const onConnect = useCallback(
    (params: Connection) => {
      const edge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        animated: false,
        style: { stroke: '#64748b', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
        },
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges]
  )

  // Handle node click - open config panel
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setIsConfigOpen(true)
  }, [])

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowInstance) return

      const type = event.dataTransfer.getData('nodeType')
      const data = JSON.parse(event.dataTransfer.getData('nodeData'))

      if (!type || !data) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `${type}-${nextId}`,
        type: data.category,
        position,
        data: {
          ...data,
          id: `${type}-${nextId}`,
        },
      }

      setNodes((nds) => nds.concat(newNode))
      setNextId(nextId + 1)
    },
    [reactFlowInstance, nextId, setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle add node from sidebar click
  const handleAddNode = useCallback(
    (nodeData: any) => {
      const position = {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      }

      const newNode: Node = {
        id: `${nodeData.type}-${nextId}`,
        type: nodeData.category,
        position,
        data: {
          ...nodeData,
          id: `${nodeData.type}-${nextId}`,
        },
      }

      setNodes((nds) => nds.concat(newNode))
      setNextId(nextId + 1)
    },
    [nextId, setNodes]
  )

  // Update node configuration
  const updateNodeConfig = useCallback(
    (nodeId: string, config: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                config,
              },
            }
          }
          return node
        })
      )
    },
    [setNodes]
  )

  // Animate workflow execution
  const runWorkflow = useCallback(async () => {
    if (nodes.length === 0) return

    setIsRunning(true)
    setAnimatedEdges(new Set())

    // Find trigger nodes (nodes with no incoming edges)
    const triggerNodes = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    )

    // Simple BFS traversal for animation
    const queue = [...triggerNodes]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const currentNode = queue.shift()
      if (!currentNode || visited.has(currentNode.id)) continue

      visited.add(currentNode.id)

      // Animate outgoing edges
      const outgoingEdges = edges.filter((e) => e.source === currentNode.id)

      for (const edge of outgoingEdges) {
        setAnimatedEdges((prev) => new Set([...prev, edge.id]))

        // Animate the edge
        setEdges((eds) =>
          eds.map((e) => {
            if (e.id === edge.id) {
              return { ...e, animated: true }
            }
            return e
          })
        )

        // Add delay for visual effect
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Add target node to queue
        const targetNode = nodes.find((n) => n.id === edge.target)
        if (targetNode) {
          queue.push(targetNode)
        }
      }
    }

    // Reset animation after completion
    setTimeout(() => {
      setEdges((eds) =>
        eds.map((e) => ({ ...e, animated: false }))
      )
      setAnimatedEdges(new Set())
      setIsRunning(false)
    }, 1000)
  }, [nodes, edges, setEdges])

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Node Palette */}
      <Sidebar onAddNode={handleAddNode} />

      {/* Main Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/20"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#94a3b8"
            className="bg-muted/20"
          />
          <Controls />
        </ReactFlow>

        {/* Run Workflow Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={runWorkflow}
            disabled={isRunning || nodes.length === 0}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run Workflow'}
          </Button>
        </div>
      </div>

      {/* Right Config Panel */}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        selectedNode={selectedNode}
        updateNodeConfig={updateNodeConfig}
      />
    </div>
  )
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <WorkflowContent />
    </ReactFlowProvider>
  )
}