import { useState } from 'react'
import {
  workspaceItemLabel,
  workspaceLeadingGlyph,
} from '../lib/nodePresentation'
import { isFolderExpanded } from '../lib/workspaceTree'
import type { WorkspaceTreeNode } from '../types/workspace'
import { EMPTY_WORKSPACE_TREE } from '../store/stableDefaults'
import { useSchemaStore } from '../store/schemaStore'

function WorkspaceItem({
  node,
  depth,
}: {
  node: WorkspaceTreeNode
  depth: number
}) {
  const selection = useSchemaStore((s) => s.selection)
  const setSelection = useSchemaStore((s) => s.setSelection)
  const toggleFolder = useSchemaStore((s) => s.toggleWorkspaceFolder)
  const moveItem = useSchemaStore((s) => s.moveWorkspaceItem)
  const deleteItem = useSchemaStore((s) => s.deleteWorkspaceItem)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const [dragOver, setDragOver] = useState(false)

  const isSelected =
    (node.type === 'board' &&
      selection?.kind === 'board' &&
      selection.boardId === node.boardId) ||
    ((node.type === 'markdown' || node.type === 'pdf') &&
      selection?.kind === node.type &&
      selection.documentId === node.documentId)

  const open = () => {
    if (node.type === 'board' && node.boardId) {
      setSelection({ kind: 'board', boardId: node.boardId })
      return
    }
    if (node.type === 'markdown' && node.documentId) {
      setSelection({ kind: 'markdown', documentId: node.documentId })
      return
    }
    if (node.type === 'pdf' && node.documentId) {
      setSelection({ kind: 'pdf', documentId: node.documentId })
    }
  }

  const onDropTarget = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const dragged = e.dataTransfer.getData('text/workspace-item')
    if (!dragged || dragged === node.id) return
    if (node.type === 'folder') {
      moveItem(dragged, node.id, (node.children ?? []).length)
    }
  }

  const folderExpanded = node.type === 'folder' && isFolderExpanded(node)

  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded-md px-1 py-0.5 ${
          isSelected ? 'sidebar-board-item active' : 'sidebar-board-item'
        } ${dragOver ? 'ring-1 ring-[var(--text-secondary)]' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        draggable={node.type !== 'folder'}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/workspace-item', node.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragOver={(e) => {
          if (node.type === 'folder') {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(true)
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropTarget}
        onContextMenu={(e) => {
          if (node.type !== 'folder') return
          e.preventDefault()
          setDialog({ type: 'folder', mode: 'rename', folderId: node.id })
        }}
      >
        {node.type === 'folder' ? (
          <button
            type="button"
            className="w-4 shrink-0 text-xs themed-muted"
            onClick={(e) => {
              e.stopPropagation()
              toggleFolder(node.id)
            }}
          >
            {folderExpanded ? '▾' : '▸'}
          </button>
        ) : workspaceLeadingGlyph(node) ? (
          <span
            className="ui-glyph w-4 shrink-0 text-center"
            aria-hidden
          >
            {workspaceLeadingGlyph(node)}
          </span>
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          className={`flex-1 truncate text-left ${
            node.type === 'folder'
              ? 'text-sm font-semibold'
              : 'text-sm font-normal'
          }`}
          onClick={() => open()}
          onDoubleClick={() => {
            if (node.type === 'folder') {
              setDialog({ type: 'folder', mode: 'rename', folderId: node.id })
            } else open()
          }}
        >
          {node.type === 'folder' ? (
            <>
              <span className="ui-glyph" aria-hidden>📁 </span>
              {node.name}
            </>
          ) : (
            workspaceItemLabel(node)
          )}
        </button>
        {node.type === 'board' && node.boardId ? (
          <button
            type="button"
            title="Rename board"
            className="sidebar-board-action hidden rounded px-1 text-xs group-hover:inline"
            onClick={() =>
              setDialog({
                type: 'board',
                mode: 'rename',
                boardId: node.boardId,
              })
            }
          >
            ✎
          </button>
        ) : null}
        {node.type === 'folder' ? (
          <button
            type="button"
            title="Rename folder"
            className="sidebar-board-action hidden rounded px-1 text-xs group-hover:inline"
            onClick={() =>
              setDialog({ type: 'folder', mode: 'rename', folderId: node.id })
            }
          >
            ✎
          </button>
        ) : null}
        <button
          type="button"
          title="Remove"
          className="sidebar-board-action hidden rounded px-1 text-xs text-red-500 group-hover:inline"
          onClick={() => {
            if (confirm(`Remove "${node.name}" from workspace?`)) {
              deleteItem(node.id)
            }
          }}
        >
          ×
        </button>
      </div>
      {node.type === 'folder' && folderExpanded && node.children?.length ? (
        <ul className="mt-0.5">
          {node.children.map((child) => (
            <WorkspaceItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function WorkspaceExplorer() {
  const tree = useSchemaStore((s) => s.workspaceTree ?? EMPTY_WORKSPACE_TREE)
  const moveItem = useSchemaStore((s) => s.moveWorkspaceItem)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const [rootDrag, setRootDrag] = useState(false)

  return (
    <aside className="app-sidebar flex w-60 shrink-0 flex-col border-r">
      <div
        className="border-b px-3 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide themed-muted">
          <span className="ui-glyph" aria-hidden>🗂️ </span>
          Workspace
        </p>
        <button
          type="button"
          className="sidebar-new-board mt-2 w-full rounded-md border border-dashed px-2 py-1.5 text-left text-sm"
          onClick={() => setDialog({ type: 'newWorkspace' })}
        >
          + New
        </button>
      </div>
      <ul
        className={`flex-1 overflow-y-auto p-2 ${rootDrag ? 'bg-[var(--surface-secondary)]' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setRootDrag(true)
        }}
        onDragLeave={() => setRootDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setRootDrag(false)
          const dragged = e.dataTransfer.getData('text/workspace-item')
          if (!dragged) return
          moveItem(dragged, null, tree.length)
        }}
      >
        {tree.map((node) => (
          <WorkspaceItem key={node.id} node={node} depth={0} />
        ))}
      </ul>
    </aside>
  )
}
