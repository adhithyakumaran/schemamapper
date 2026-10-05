import { useSchemaStore } from '../store/schemaStore'

export function SyncStatusBar() {
  const syncError = useSchemaStore((s) => s.syncError)
  const syncStatus = useSchemaStore((s) => s.syncStatus)
  const persistenceMode = useSchemaStore((s) => s.persistenceMode)

  if (persistenceMode === 'offline') {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-900">
        Supabase is not configured. Changes are not synchronized to production.
        Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on Vercel.
      </div>
    )
  }

  if (syncError) {
    return (
      <div className="border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-800">
        {syncError}
      </div>
    )
  }

  if (syncStatus === 'saving') {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-1 text-xs text-slate-600">
        Saving to server…
      </div>
    )
  }

  return null
}
