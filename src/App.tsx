import { useEffect } from 'react'
import { BoardColorPicker } from './components/BoardColorPicker'
import { BoardSidebar } from './components/BoardSidebar'
import { Canvas } from './components/Canvas'
import { EdgeContextMenu } from './components/EdgeContextMenu'
import { NodeMenu } from './components/NodeMenu'
import { AddNodeDialog } from './components/dialogs/AddNodeDialog'
import { BoardDialog } from './components/dialogs/BoardDialog'
import { DeleteNodeDialog } from './components/dialogs/DeleteNodeDialog'
import { EditNodeDialog } from './components/dialogs/EditNodeDialog'
import { NoteDialog } from './components/dialogs/NoteDialog'
import { SyncStatusBar } from './components/SyncStatusBar'
import { ThemeToggle } from './components/ThemeToggle'
import { useSchemaStore } from './store/schemaStore'

function AppHeader() {
  const setDialog = useSchemaStore((s) => s.setDialog)

  return (
    <header className="app-header flex h-12 shrink-0 items-center justify-between border-b px-4 shadow-sm">
      <h1 className="text-sm font-semibold tracking-tight">Schema Mapper</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <BoardColorPicker />
        <button
          type="button"
          className="btn-primary rounded-md px-3 py-1.5 text-sm font-medium"
          onClick={() => setDialog({ type: 'board', mode: 'create' })}
        >
          + New Board
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const hydrate = useSchemaStore((s) => s.hydrateFromServer)
  const hydrated = useSchemaStore((s) => s.hydrated)

  useEffect(() => {
    const run = () => void hydrate()
    if (useSchemaStore.persist.hasHydrated()) {
      run()
    } else {
      useSchemaStore.persist.onFinishHydration(run)
    }
  }, [hydrate])

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center text-sm themed-muted">
        Loading schema…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <SyncStatusBar />
      <div className="flex min-h-0 flex-1">
        <BoardSidebar />
        <Canvas />
      </div>
      <BoardDialog />
      <AddNodeDialog />
      <EditNodeDialog />
      <NoteDialog />
      <DeleteNodeDialog />
      <NodeMenu />
      <EdgeContextMenu />
    </div>
  )
}
