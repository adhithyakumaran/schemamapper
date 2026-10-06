import { lazy, Suspense } from 'react'
import { normalizeBoardLayout, isGraphLayout } from '../types/layout'
import { Canvas } from './Canvas'
import { NestedTreeView } from './tree/NestedTreeView'
import { useSchemaStore } from '../store/schemaStore'

const MarkdownPanel = lazy(() =>
  import('./MarkdownPanel').then((m) => ({ default: m.MarkdownPanel })),
)
const PdfPanel = lazy(() =>
  import('./PdfPanel').then((m) => ({ default: m.PdfPanel })),
)

function DocFallback() {
  return (
    <div className="flex flex-1 items-center justify-center text-sm themed-muted">
      Loading document…
    </div>
  )
}

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
    return (
      <Suspense fallback={<DocFallback />}>
        <MarkdownPanel documentId={selection.documentId} />
      </Suspense>
    )
  }

  if (selection.kind === 'pdf') {
    return (
      <Suspense fallback={<DocFallback />}>
        <PdfPanel documentId={selection.documentId} />
      </Suspense>
    )
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
