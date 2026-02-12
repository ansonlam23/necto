"use client"

import { ReactFlow, Background, BackgroundVariant, Controls, Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: 'Test Node 1' },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 300, y: 200 },
    data: { label: 'Test Node 2' },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
]

export function TestCanvas() {
  console.log('TestCanvas rendering with hardcoded nodes')
  console.log('Test nodes:', initialNodes)

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '500px', backgroundColor: '#ffffff', position: 'relative', flex: 1 }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, color: 'black', backgroundColor: 'yellow', padding: '5px' }}>
        TestCanvas Active - Should see 2 nodes
      </div>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
        style={{ backgroundColor: '#ffffff' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls />
      </ReactFlow>
    </div>
  )
}