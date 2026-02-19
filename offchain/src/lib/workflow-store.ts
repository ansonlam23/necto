import { create } from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react'

export type NodeCategory = 'trigger' | 'logic' | 'provider' | 'settlement'

export interface WorkflowNode extends Node {
  category: NodeCategory
  config?: Record<string, unknown>
}

interface WorkflowStore {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNode: WorkflowNode | null
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: Omit<WorkflowNode, 'id'> & { id?: string }) => void
  selectNode: (nodeId: string | null) => void
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges) })
  },

  addNode: (nodeData) => {
    const id = nodeData.id || `${nodeData.type}-${Date.now()}`
    const newNode: WorkflowNode = {
      id,
      type: nodeData.category || nodeData.type || 'default', // Use category as type for React Flow
      position: nodeData.position || { x: 100, y: 100 },
      data: nodeData.data || {},
      category: nodeData.category,
      config: nodeData.config || {}
    }
    const currentNodes = get().nodes
    console.log('Store: Adding node', newNode)
    console.log('Store: Current nodes count:', currentNodes.length)
    set({ nodes: [...currentNodes, newNode] })
    console.log('Store: New nodes count:', get().nodes.length)
    console.log('Store: All nodes now:', get().nodes)
  },

  selectNode: (nodeId) => {
    const node = nodeId ? get().nodes.find(n => n.id === nodeId) || null : null
    set({ selectedNode: node })
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map(node =>
        node.id === nodeId ? { ...node, config: { ...node.config, ...config } } : node
      )
    })
  }
}))