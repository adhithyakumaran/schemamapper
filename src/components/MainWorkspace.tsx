import { normalizeBoardLayout, isGraphLayout } from '../types/layout'
import { Canvas } from './Canvas'
import { MarkdownPanel } from './MarkdownPanel'
import { PdfPanel } from './PdfPanel'
import { NestedTreeView } from './tree/NestedTreeView'
import { useSchemaStore } from '../store/schemaStore'

export function MainWorkspace() {
  const selection = useSchemaStore((s) => s.selection)
  const board = useSchemaStore((s) =>
    selection?.kind === 'board'
      ? s.boards.find((b) => b.id === selection.boardId) ?? null
      : null,
  )

  if (!selection) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm themed-muted">
        Select a board or document from the workspace.
      </div>
    )
  }

  if (selection.kind === 'markdown') {
    return <MarkdownPanel documentId={selection.documentId} />
  }

  if (selection.kind === 'pdf') {
    return <PdfPanel documentId={selection.documentId} />
  }

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm themed-muted">
        Board not found.
      </div>
    )
  }

  const layout = normalizeBoardLayout(board.layout)
  if (isGraphLayout(layout) || layout === 'freeform') {
    return <Canvas />
  }

  return <NestedTreeView board={board} />
}
