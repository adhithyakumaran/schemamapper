import { useEffect } from 'react'
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
      ? s.workspaceDocuments[selection.documentId]
      : null,
  )
  const pdf = useSchemaStore((s) =>
    selection?.kind === 'pdf' && selection.documentId
      ? s.workspaceDocuments[selection.documentId]
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

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center text-sm themed-muted">
        Loading workspace…
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
