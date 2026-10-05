import {
  Background,
  Controls,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
  applyEdgeChanges,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SchemaNode, type SchemaNodeData } from './nodes/SchemaNode'
import { CanvasToolbar } from './CanvasToolbar'
import { useSchemaStore } from '../store/schemaStore'
import { syncEdgesFromParents } from '../lib/tree'

const nodeTypes = { schema: SchemaNode }

export function Canvas() {
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  const updateNodePosition = useSchemaStore((s) => s.updateNodePosition)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const updateNode = useSchemaStore((s) => s.updateNode)

  const [rf, setRf] = useState<ReactFlowInstance | null>(null)

  const flowNodes: Node[] = useMemo(() => {
    if (!board) return []
    return board.nodes.map((n) => ({
      id: n.id,
      type: 'schema',
      position: n.position,
      data: {
        label: n.name,
        schemaNodeId: n.id,
        hasNote: Boolean(n.note?.trim()),
        hasImage: Boolean(n.screenshot),
      } satisfies SchemaNodeData,
    }))
  }, [board])

  const flowEdges: Edge[] = useMemo(() => {
    if (!board) return []
    return syncEdgesFromParents(board.nodes).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    }))
  }, [board])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateNodePosition(change.id, change.position.x, change.position.y)
        }
      }
    },
    [updateNodePosition],
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'remove') {
          const edge = flowEdges.find((e) => e.id === change.id)
          if (edge) {
            updateNode(edge.target, { parentId: null })
          }
        }
      }
      applyEdgeChanges(changes, flowEdges)
    },
    [flowEdges, updateNode],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) return
      updateNode(connection.target, { parentId: connection.source })
    },
    [updateNode],
  )

  useEffect(() => {
    if (rf && board && board.nodes.length > 0) {
      const t = window.setTimeout(() => {
        rf.fitView({ padding: 0.2, duration: 200 })
      }, 50)
      return () => window.clearTimeout(t)
    }
  }, [board?.id, rf])

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        Create a board to get started.
      </div>
    )
  }

  return (
    <div className="relative flex-1 bg-[#fafafa]">
      <CanvasToolbar
        rf={rf}
        onAddNode={() => setDialog({ type: 'addRoot' })}
      />
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onInit={setRf}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={(_, node) =>
          setDialog({ type: 'edit', nodeId: node.id })
        }
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} className="!shadow-sm" />
      </ReactFlow>
    </div>
  )
}
