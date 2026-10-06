import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { resolveBoardCanvasColor } from '../lib/boardCanvasColor'
import { syncEdgesFromParents } from '../lib/tree'
import { useThemeStore } from '../store/themeStore'
import { useSchemaStore } from '../store/schemaStore'
import { CanvasToolbar } from './CanvasToolbar'
import { SchemaNode, type SchemaNodeData } from './nodes/SchemaNode'

const nodeTypes = { schema: SchemaNode }

function isHierarchyEdgeId(id: string): boolean {
  return id.startsWith('edge-')
}

export function Canvas() {
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  const layoutFitTick = useSchemaStore((s) => s.layoutFitTick)
  const updateNodePosition = useSchemaStore((s) => s.updateNodePosition)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const addConnection = useSchemaStore((s) => s.addConnection)
  const removeConnection = useSchemaStore((s) => s.removeConnection)
  const setEdgeMenu = useSchemaStore((s) => s.setEdgeMenu)
  const theme = useThemeStore((s) => s.theme)

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
        evidenceCount: n.screenshots?.length ?? 0,
      } satisfies SchemaNodeData,
    }))
  }, [board])

  const flowEdges: Edge[] = useMemo(() => {
    if (!board) return []
    const hierarchy = syncEdgesFromParents(board.nodes).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: 'hierarchy-out',
      targetHandle: 'hierarchy-in',
      type: 'smoothstep',
      deletable: false,
      selectable: true,
      focusable: false,
      className: 'hierarchy-edge',
    }))
    const relations = (board.connections ?? []).map((c) => ({
      id: c.id,
      source: c.source,
      target: c.target,
      sourceHandle: 'rel-source',
      targetHandle: 'rel-target',
      type: 'default',
      deletable: true,
      selectable: true,
      className: 'relationship-edge',
    }))
    return [...hierarchy, ...relations]
  }, [board])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type !== 'position' || !change.position) continue
        // Persist only when drag ends — updating the store every frame causes a render loop (React #185).
        if (change.dragging) continue
        updateNodePosition(change.id, change.position.x, change.position.y)
      }
    },
    [updateNodePosition],
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'remove' && !isHierarchyEdgeId(change.id)) {
          removeConnection(change.id)
        }
      }
    },
    [removeConnection],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) return
      if (
        connection.sourceHandle !== 'rel-source' ||
        connection.targetHandle !== 'rel-target'
      ) {
        return
      }
      addConnection(connection.source, connection.target)
    },
    [addConnection],
  )

  const isValidConnection = useCallback((connection: Edge | Connection) => {
    return (
      connection.sourceHandle === 'rel-source' &&
      connection.targetHandle === 'rel-target'
    )
  }, [])

  useEffect(() => {
    if (rf && board && board.nodes.length > 0) {
      const t = window.setTimeout(() => {
        rf.fitView({ padding: 0.18, duration: 280, maxZoom: 1.15 })
      }, 50)
      return () => window.clearTimeout(t)
    }
  }, [board?.id, rf])

  useEffect(() => {
    if (!rf || !layoutFitTick) return
    const t = window.setTimeout(() => {
      rf.fitView({ padding: 0.18, duration: 320, maxZoom: 1.15 })
    }, 40)
    return () => window.clearTimeout(t)
  }, [layoutFitTick, rf])

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-secondary)]">
        Create a board to get started.
      </div>
    )
  }

  const bgColor = resolveBoardCanvasColor(board.color ?? '#F8FAFC', theme === 'dark')

  return (
    <div className="relative flex-1" style={{ backgroundColor: bgColor }}>
      <CanvasToolbar
        rf={rf}
        onAddNode={() => setDialog({ type: 'addRoot' })}
      />
      <ReactFlow
        colorMode={theme}
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onInit={setRf}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onEdgeContextMenu={(e, edge) => {
          e.preventDefault()
          if (isHierarchyEdgeId(edge.id)) return
          setEdgeMenu({
            connectionId: edge.id,
            x: e.clientX,
            y: e.clientY,
          })
        }}
        onEdgesDelete={(edges) => {
          for (const edge of edges) {
            if (!isHierarchyEdgeId(edge.id)) removeConnection(edge.id)
          }
        }}
        onNodeDoubleClick={(_, node) =>
          setDialog({ type: 'edit', nodeId: node.id })
        }
        fitView
        minZoom={0.15}
        maxZoom={2}
        edgesFocusable
        deleteKeyCode={['Backspace', 'Delete']}
        onBeforeDelete={async ({ nodes, edges }) => {
          if (nodes.length > 0) return false
          return edges.every((e) => !isHierarchyEdgeId(e.id))
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={2.2}
          color="var(--canvas-dot)"
        />
        <Controls showInteractive={false} className="!shadow-sm" />
      </ReactFlow>
    </div>
  )
}
