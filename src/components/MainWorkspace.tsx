import { lazy, Suspense } from 'react'
import { DEFAULT_WORKSPACE_UI } from '../store/stableDefaults'
import { useSchemaStore } from '../store/schemaStore'
import { NotepadEditor } from './editor/NotepadEditor'
import { WorkspaceTabs } from './workspace/WorkspaceTabs'

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
  const activeId = useSchemaStore(
    (s) => (s.workspaceUi ?? DEFAULT_WORKSPACE_UI).activeDocumentId,
  )
  const tabs = useSchemaStore(
    (s) => (s.workspaceUi ?? DEFAULT_WORKSPACE_UI).tabs,
  )
  const docs = useSchemaStore((s) => s.workspaceDocuments)

  const activeTab = tabs.find((t) => t.documentId === activeId)
  const activeDoc = activeId ? docs[activeId] : null

  return (
    <main className="document-workspace flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--bg)]">
      <WorkspaceTabs />
      {!activeTab || !activeDoc ? (
        <div className="flex flex-1 items-center justify-center text-sm themed-muted">
          Loading document…
        </div>
      ) : activeDoc.type === 'markdown' ? (
        <NotepadEditor documentId={activeDoc.id} />
      ) : (
        <Suspense fallback={<DocFallback />}>
          <PdfPanel documentId={activeDoc.id} />
        </Suspense>
      )}
    </main>
  )
}
