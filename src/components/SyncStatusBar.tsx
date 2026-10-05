import { useSchemaStore } from '../store/schemaStore'

export function SyncStatusBar() {
  const syncError = useSchemaStore((s) => s.syncError)
  const syncStatus = useSchemaStore((s) => s.syncStatus)
  const persistenceMode = useSchemaStore((s) => s.persistenceMode)

  if (persistenceMode !== 'supabase') return null

  if (syncError) {
    return (
      <div className="status-error border-b px-4 py-1.5 text-xs">{syncError}</div>
    )
  }

  if (syncStatus === 'saving') {
    return (
      <div className="status-saving border-b px-4 py-1 text-xs">
        Saving to server…
      </div>
    )
  }

  return null
}
