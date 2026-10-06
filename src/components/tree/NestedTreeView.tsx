import { useCallback, useMemo, useState } from 'react'
import { childrenOf } from '../../lib/hierarchyTree'
import { nodeDisplayIcon } from '../../lib/nodePresentation'
import { useSchemaStore } from '../../store/schemaStore'
import type { Board, SchemaNode } from '../../types/schema'
import { SchemaBoardToolbar } from '../SchemaBoardToolbar'

function connectionCount(board: Board, nodeId: string): number {
  return (board.connections ?? []).filter(
    (c) => c.source === nodeId || c.target === nodeId,
  ).length
}

function TreeNodeRow({
  board,
  node,
  depth,
  collapsedIds,
  selectedId,
  onToggle,
  onSelect,
  onMove,
}: {
  board: Board
  node: SchemaNode
  depth: number
  collapsedIds: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onMove: (
    dragId: string,
    targetId: string,
    mode: 'child' | 'before',
  ) => void
}) {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const kids = childrenOf(board.nodes, node.id)
  const expanded = kids.length > 0 && !collapsedIds.has(node.id)
  const selected = selectedId === node.id
  const icon = nodeDisplayIcon(node.name)
  const rels = connectionCount(board, node.id)
  const [dropHint, setDropHint] = useState<'child' | 'before' | null>(null)

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setDialog({
      type: 'nodeMenu',
      nodeId: node.id,
      x: e.clientX,
      y: e.clientY,
    })
  }

  return (
    <div className="nested-tree-node">
      <div
        className={`nested-tree-row group ${selected ? 'nested-tree-row-selected' : ''} ${dropHint ? 'nested-tree-row-drop' : ''}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/schema-node', node.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragOver={(e) => {
          e.preventDefault()
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const mode = e.clientY < rect.top + rect.height * 0.35 ? 'before' : 'child'
          setDropHint(mode)
        }}
        onDragLeave={() => setDropHint(null)}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const dragId = e.dataTransfer.getData('text/schema-node')
          if (!dragId || dragId === node.id) return
          const mode = dropHint ?? 'child'
          onMove(dragId, node.id, mode)
          setDropHint(null)
        }}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => setDialog({ type: 'edit', nodeId: node.id })}
        onContextMenu={onContextMenu}
      >
        <span className="nested-tree-gutter" aria-hidden />
        {kids.length > 0 ? (
          <button
            type="button"
            className="nested-tree-chevron"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="nested-tree-chevron nested-tree-chevron-leaf">◇</span>
        )}
        {icon ? (
          <span className="nested-tree-icon" aria-hidden>{icon}</span>
        ) : null}
        <span className="nested-tree-label">{node.name}</span>
        {node.note?.trim() ? (
          <span className="nested-tree-meta" title="Has note">📝</span>
        ) : null}
        {(node.screenshots?.length ?? 0) > 0 ? (
          <span className="nested-tree-meta" title="Evidence">
            📷 {node.screenshots.length}
          </span>
        ) : null}
        {rels > 0 ? (
          <span className="nested-tree-rel" title="Relationship links">
            ↔ {rels}
          </span>
        ) : null}
        <button
          type="button"
          className="nested-tree-add"
          title="Add child"
          onClick={(e) => {
            e.stopPropagation()
            setDialog({ type: 'addChild', parentId: node.id })
          }}
        >
          +
        </button>
      </div>
      {expanded &&
        kids.map((child) => (
          <TreeNodeRow
            key={child.id}
            board={board}
            node={child}
            depth={depth + 1}
            collapsedIds={collapsedIds}
            selectedId={selectedId}
            onToggle={onToggle}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
    </div>
  )
}

export function NestedTreeView({ board }: { board: Board }) {
  const toggleCollapsed = useSchemaStore((s) => s.toggleTreeNodeCollapsed)
  const setSelected = useSchemaStore((s) => s.setTreeSelectedNode)
  const moveHierarchyNode = useSchemaStore((s) => s.moveHierarchyNode)
  const ui = useSchemaStore(
    (s) => s.boardUiState[board.id] ?? { collapsedNodeIds: [] },
  )

  const collapsedIds = useMemo(
    () => new Set(ui.collapsedNodeIds),
    [ui.collapsedNodeIds],
  )
  const roots = useMemo(
    () => childrenOf(board.nodes, null),
    [board.nodes],
  )

  const onMove = useCallback(
    (dragId: string, targetId: string, mode: 'child' | 'before') => {
      if (mode === 'child') {
        moveHierarchyNode(board.id, dragId, targetId)
      } else {
        const target = board.nodes.find((n) => n.id === targetId)
        moveHierarchyNode(board.id, dragId, target?.parentId ?? null, targetId)
      }
    },
    [board.id, board.nodes, moveHierarchyNode],
  )

  return (
    <div className="nested-tree-panel flex min-h-0 flex-1 flex-col">
      <SchemaBoardToolbar />
      <div className="nested-tree-scroll min-h-0 flex-1 overflow-auto p-4 md:p-6">
        <div className="nested-tree-root mx-auto max-w-3xl">
          {roots.length === 0 ? (
            <p className="text-sm themed-muted">No nodes yet. Use + Node to add a root.</p>
          ) : (
            roots.map((root) => (
              <TreeNodeRow
                key={root.id}
                board={board}
                node={root}
                depth={0}
                collapsedIds={collapsedIds}
                selectedId={ui.selectedNodeId ?? null}
                onToggle={(id) => toggleCollapsed(board.id, id)}
                onSelect={(id) => setSelected(board.id, id)}
                onMove={onMove}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
