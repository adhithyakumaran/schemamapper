import { ImportExportButtons } from './ImportExport'
import { LayoutSelector } from './LayoutSelector'
import { useSchemaStore } from '../store/schemaStore'

export function SchemaBoardToolbar() {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const syncToSupabase = useSchemaStore((s) => s.syncToSupabase)
  const persistenceMode = useSchemaStore((s) => s.persistenceMode)

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b px-3 py-2"
      style={{ borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => setDialog({ type: 'addRoot' })}
      >
        + Node
      </button>
      <LayoutSelector />
      <ImportExportButtons />
      {persistenceMode === 'supabase' && (
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => void syncToSupabase()}
        >
          Sync to Supabase
        </button>
      )}
    </div>
  )
}
