import { useEffect, useRef, useState } from 'react'
import { optimizeImageFiles } from '../../lib/imageOptimize'
import { useSchemaStore } from '../../store/schemaStore'
import type { Board } from '../../types/schema'

export function EvidenceDetailPanel({
  board,
  nodeId,
  initialIndex = 0,
}: {
  board: Board
  nodeId: string
  initialIndex?: number
}) {
  const node = board.nodes.find((n) => n.id === nodeId)
  const setDetailPanel = useSchemaStore((s) => s.setBoardDetailPanel)
  const addScreenshots = useSchemaStore((s) => s.addScreenshots)
  const removeScreenshotAt = useSchemaStore((s) => s.removeScreenshotAt)
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex, nodeId])

  if (!node) return null

  const shots = node.screenshots
  const safeIndex = shots.length ? Math.min(index, shots.length - 1) : 0
  const src = shots[safeIndex]

  const close = () => setDetailPanel(board.id, null)

  const onAdd = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const added = await optimizeImageFiles(Array.from(files))
      if (added.length) {
        addScreenshots(nodeId, added)
        setIndex(node.screenshots.length)
      }
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <aside className="evidence-panel flex w-[min(42%,520px)] min-w-[280px] shrink-0 flex-col border-l">
      <div className="evidence-panel-header flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide themed-muted">
            Evidence
          </p>
          <p className="truncate text-sm font-semibold">{node.name}</p>
        </div>
        <button type="button" className="toolbar-btn text-xs" onClick={close}>
          Close
        </button>
      </div>
      <div className="evidence-panel-body flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="evidence-panel-stage relative flex min-h-[200px] flex-1 items-center justify-center overflow-hidden rounded-lg border">
          {src ? (
            <img
              src={src}
              alt={`Evidence ${safeIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <p className="text-sm themed-muted">No evidence yet.</p>
          )}
        </div>
        {shots.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {shots.map((thumb, i) => (
              <button
                key={`${i}-${thumb.slice(0, 12)}`}
                type="button"
                className={`evidence-thumb-btn ${i === safeIndex ? 'evidence-thumb-btn-active' : ''}`}
                onClick={() => setIndex(i)}
              >
                <img src={thumb} alt="" className="h-10 w-10 object-cover" />
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="toolbar-btn text-xs"
            disabled={safeIndex <= 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="toolbar-btn text-xs"
            disabled={safeIndex >= shots.length - 1}
            onClick={() => setIndex((i) => Math.min(shots.length - 1, i + 1))}
          >
            Next
          </button>
          <button
            type="button"
            className="toolbar-btn text-xs"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          >
            Zoom +
          </button>
          <button
            type="button"
            className="toolbar-btn text-xs"
            onClick={() => setZoom(1)}
          >
            Fit
          </button>
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            className="btn-primary rounded-md px-3 py-1.5 text-xs"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'Processing…' : '+ Add Evidence'}
          </button>
          <button
            type="button"
            className="toolbar-btn text-xs"
            disabled={!src}
            onClick={() => {
              removeScreenshotAt(nodeId, safeIndex)
              setIndex(Math.max(0, safeIndex - 1))
            }}
          >
            Delete
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void onAdd(e.target.files)}
          />
        </div>
      </div>
    </aside>
  )
}
