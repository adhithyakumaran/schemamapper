import { useEffect, useState } from 'react'
import { BoardColorPicker } from './components/BoardColorPicker'
import { WorkspaceExplorer } from './components/WorkspaceExplorer'
import { MainWorkspace } from './components/MainWorkspace'
import { EdgeContextMenu } from './components/EdgeContextMenu'
import { NodeMenu } from './components/NodeMenu'
import { AddNodeDialog } from './components/dialogs/AddNodeDialog'
import { BoardDialog } from './components/dialogs/BoardDialog'
import { DeleteNodeDialog } from './components/dialogs/DeleteNodeDialog'
import { EditNodeDialog } from './components/dialogs/EditNodeDialog'
import { FolderDialog } from './components/dialogs/FolderDialog'
import { NewWorkspaceDialog } from './components/dialogs/NewWorkspaceDialog'
import { NoteDialog } from './components/dialogs/NoteDialog'
import { SyncStatusBar } from './components/SyncStatusBar'
import { ThemeToggle } from './components/ThemeToggle'
import { EMPTY_WORKSPACE_DOCUMENTS } from './store/stableDefaults'
import { useSchemaStore } from './store/schemaStore'

function AppHeader() {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const selection = useSchemaStore((s) => s.selection)
  const board = useSchemaStore((s) =>
    selection?.kind === 'board'
      ? s.boards.find((b) => b.id === selection.boardId) ?? null
      : null,
  )
  const md = useSchemaStore((s) =>
    selection?.kind === 'markdown' && selection.documentId
      ? (s.workspaceDocuments ?? EMPTY_WORKSPACE_DOCUMENTS)[
          selection.documentId
        ]
      : null,
  )
  const pdf = useSchemaStore((s) =>
    selection?.kind === 'pdf' && selection.documentId
      ? (s.workspaceDocuments ?? EMPTY_WORKSPACE_DOCUMENTS)[
          selection.documentId
        ]
      : null,
  )

  return (
    <header className="app-header flex h-12 shrink-0 items-center justify-between border-b px-4 shadow-sm">
      <div className="min-w-0 truncate text-sm font-semibold tracking-tight">
        {board ? board.name : md ? `📄 ${md.name}` : pdf ? `📕 ${pdf.name}` : 'Schema Mapper'}
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {board ? <BoardColorPicker /> : null}
        <button
          type="button"
          className="btn-primary rounded-md px-3 py-1.5 text-sm font-medium"
          onClick={() => setDialog({ type: 'newWorkspace' })}
        >
          + New
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const hydrate = useSchemaStore((s) => s.hydrateFromServer)
  const hydrated = useSchemaStore((s) => s.hydrated)
  const [bootError, setBootError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = () => {
      if (cancelled) return
      void hydrate().catch(() => {
        if (cancelled) return
        setBootError('Failed to load workspace data.')
        useSchemaStore.setState({ hydrated: true })
      })
    }
    const unsub = useSchemaStore.persist.onFinishHydration(() => {
      run()
    })
    if (useSchemaStore.persist.hasHydrated()) {
      run()
    }
    const timeout = window.setTimeout(() => {
      if (!useSchemaStore.getState().hydrated) {
        setBootError(
          'Loading is taking longer than expected. You can reset local data below.',
        )
        useSchemaStore.setState({ hydrated: true })
      }
    }, 12_000)
    return () => {
      cancelled = true
      unsub()
      window.clearTimeout(timeout)
    }
  }, [hydrate])

  if (!hydrated) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center bg-[var(--bg)] text-sm text-[var(--text-secondary)]"
      >
        Loading workspace…
      </div>
    )
  }

  if (bootError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm themed-muted">{bootError}</p>
        <button
          type="button"
          className="btn-primary rounded-md px-3 py-1.5 text-sm"
          onClick={() => {
            localStorage.removeItem('schema-mapper-data-v2')
            window.location.reload()
          }}
        >
          Reset local data & reload
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <SyncStatusBar />
      <div className="flex min-h-0 flex-1">
        <WorkspaceExplorer />
        <MainWorkspace />
      </div>
      <BoardDialog />
      <FolderDialog />
      <NewWorkspaceDialog />
      <AddNodeDialog />
      <EditNodeDialog />
      <NoteDialog />
      <DeleteNodeDialog />
      <NodeMenu />
      <EdgeContextMenu />
    </div>
  )
}
