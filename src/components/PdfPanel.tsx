import { useState } from 'react'
import { useSchemaStore } from '../store/schemaStore'

export function PdfPanel({ documentId }: { documentId: string }) {
  const doc = useSchemaStore((s) => s.workspaceDocuments[documentId])
  const [zoom, setZoom] = useState(1)

  if (!doc || doc.type !== 'pdf') {
    return (
      <div className="flex flex-1 items-center justify-center text-sm themed-muted">
        PDF not found.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex flex-wrap items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
        >
          Zoom In
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
        >
          Zoom Out
        </button>
        <button type="button" className="toolbar-btn" onClick={() => setZoom(1)}>
          Fit Page
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setZoom(1.25)}
        >
          Fit Width
        </button>
        <span className="text-xs themed-muted">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4" style={{ background: 'var(--surface-secondary)' }}>
        <div
          className="mx-auto origin-top"
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        >
          <embed
            src={doc.content}
            type="application/pdf"
            className="h-[80vh] w-full rounded-md border shadow-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          />
        </div>
      </div>
    </div>
  )
}
