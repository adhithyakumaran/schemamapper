import type { ReactFlowInstance } from '@xyflow/react'
import { useSchemaStore } from '../store/schemaStore'
import { ImportExportButtons } from './ImportExport'
import { LayoutSelector } from './LayoutSelector'

interface CanvasToolbarProps {
  rf: ReactFlowInstance | null
  onAddNode: () => void
}

export function CanvasToolbar({ rf, onAddNode }: CanvasToolbarProps) {
  const reloadFromServer = useSchemaStore((s) => s.reloadFromServer)
  const applyLayout = useSchemaStore((s) => s.applyActiveBoardLayout)
  const persistenceMode = useSchemaStore((s) => s.persistenceMode)

  return (
    <div className="app-toolbar absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1 rounded-md border p-1 shadow-sm">
      <button type="button" className="toolbar-btn" onClick={onAddNode}>
        + Node
      </button>
      <LayoutSelector />
      <button
        type="button"
        className="toolbar-btn"
        title="Re-apply current layout"
        onClick={() => applyLayout()}
      >
        Auto Layout
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => rf?.zoomIn({ duration: 150 })}
      >
        Zoom In
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => rf?.zoomOut({ duration: 150 })}
      >
        Zoom Out
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => rf?.fitView({ padding: 0.2, duration: 200 })}
      >
        Fit
      </button>
      <ImportExportButtons />
      {persistenceMode === 'supabase' && (
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => void reloadFromServer()}
        >
          Reload
        </button>
      )}
    </div>
  )
}
