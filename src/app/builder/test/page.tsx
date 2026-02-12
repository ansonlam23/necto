"use client"

import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const nodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: { label: 'Simple Node' },
    style: { backgroundColor: '#333', color: '#fff', border: '1px solid #222', borderRadius: '5px', padding: '10px' }
  },
]

export default function TestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'white' }}>
      <h1 style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, color: 'black' }}>
        React Flow Test Page
      </h1>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          fitView
          style={{ backgroundColor: '#ffffff' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#888" />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}