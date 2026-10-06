import { useEffect, useState } from 'react'
import { WorkspaceExplorer } from './components/WorkspaceExplorer'
import { MainWorkspace } from './components/MainWorkspace'
import { FolderDialog } from './components/dialogs/FolderDialog'
import { NewWorkspaceDialog } from './components/dialogs/NewWorkspaceDialog'
import { SyncStatusBar } from './components/SyncStatusBar'
import { ThemeToggle } from './components/ThemeToggle'
import { WorkspaceSearch } from './components/workspace/WorkspaceSearch'
import { useSchemaStore } from './store/schemaStore'

function AppHeader() {
  const setDialog = useSchemaStore((s) => s.setDialog)

  return (
    <header className="app-header flex h-12 shrink-0 items-center justify-between border-b px-4 shadow-sm">
      <div className="min-w-0 truncate text-sm font-semibold tracking-tight">
        Schema Mapper
      </div>
      <div className="flex items-center gap-3">
        <WorkspaceSearch />
        <ThemeToggle />
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
      <FolderDialog />
      <NewWorkspaceDialog />
    </div>
  )
}
