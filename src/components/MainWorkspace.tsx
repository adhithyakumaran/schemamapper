import { Canvas } from './Canvas'
import { MarkdownPanel } from './MarkdownPanel'
import { PdfPanel } from './PdfPanel'
import { useSchemaStore } from '../store/schemaStore'

export function MainWorkspace() {
  const selection = useSchemaStore((s) => s.selection)

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

  return <Canvas />
}
