import type { ReactFlowInstance } from '@xyflow/react'
import { BoardColorPicker } from './BoardColorPicker'
import { ImportExportButtons } from './ImportExport'

interface CanvasToolbarProps {
  rf: ReactFlowInstance | null
  onAddNode: () => void
}

export function CanvasToolbar({ rf, onAddNode }: CanvasToolbarProps) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-sm">
      <button type="button" className="toolbar-btn" onClick={onAddNode}>
        + Node
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
      <BoardColorPicker />
    </div>
  )
}
