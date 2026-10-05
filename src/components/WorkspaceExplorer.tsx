import { useRef, useState } from 'react'
import type { WorkspaceTreeNode } from '../types/workspace'
import { useSchemaStore } from '../store/schemaStore'

function itemIcon(node: WorkspaceTreeNode): string {
  switch (node.type) {
    case 'folder':
      return '📁'
    case 'board':
      return '◇'
    case 'markdown':
      return '📄'
    case 'pdf':
      return '📕'
    default:
      return '•'
  }
}

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
  const dragId = useRef<string | null>(null)

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
    setDragOver(false)
    const dragged = e.dataTransfer.getData('text/workspace-item')
    if (!dragged || dragged === node.id) return
    if (node.type === 'folder') {
      moveItem(dragged, node.id, (node.children ?? []).length)
    }
  }

  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded-md px-1 py-1 ${
          isSelected ? 'sidebar-board-item active' : 'sidebar-board-item'
        } ${dragOver ? 'ring-1 ring-[var(--text-secondary)]' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        draggable
        onDragStart={(e) => {
          dragId.current = node.id
          e.dataTransfer.setData('text/workspace-item', node.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragOver={(e) => {
          if (node.type === 'folder') {
            e.preventDefault()
            setDragOver(true)
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropTarget}
      >
        {node.type === 'folder' ? (
          <button
            type="button"
            className="w-4 shrink-0 text-xs themed-muted"
            onClick={() => toggleFolder(node.id)}
          >
            {node.collapsed ? '▸' : '▾'}
          </button>
        ) : (
          <span className="w-4 shrink-0 text-center text-xs" aria-hidden>
            {itemIcon(node)}
          </span>
        )}
        <button
          type="button"
          className="flex-1 truncate text-left text-sm"
          onClick={() => {
            if (node.type === 'folder') toggleFolder(node.id)
            else open()
          }}
          onDoubleClick={() => open()}
        >
          {node.name}
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
      {node.type === 'folder' && !node.collapsed && node.children?.length ? (
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
  const tree = useSchemaStore((s) => s.workspaceTree)
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
