import * as pdfjs from 'pdfjs-dist'
import { useEffect, useRef, useState } from 'react'
import { useSchemaStore } from '../store/schemaStore'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export function PdfPanel({ documentId }: { documentId: string }) {
  const doc = useSchemaStore((s) => s.workspaceDocuments[documentId])
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!doc || doc.type !== 'pdf') return
    let cancelled = false
    void (async () => {
      const loading = await pdfjs.getDocument({ url: doc.content }).promise
      if (cancelled) return
      setPdf(loading)
      setNumPages(loading.numPages)
      setPage(1)
    })()
    return () => {
      cancelled = true
    }
  }, [doc?.content, doc?.type])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    void (async () => {
      const pdfPage = await pdf.getPage(page)
      const viewport = pdfPage.getViewport({ scale: zoom * 1.35 })
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      canvas.height = viewport.height
      canvas.width = viewport.width
      await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise
    })()
  }, [pdf, page, zoom])

  if (!doc || doc.type !== 'pdf') {
    return (
      <div className="flex flex-1 items-center justify-center text-sm themed-muted">
        PDF not found.
      </div>
    )
  }

  return (
    <div className="pdf-viewer flex min-h-0 flex-1 flex-col">
      <div
        className="flex flex-wrap items-center gap-2 border-b px-4 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-sm font-medium">📕 {doc.name}</span>
        <span className="flex-1" />
        <button
          type="button"
          className="toolbar-btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span className="text-xs themed-muted">
          {page} / {numPages || '—'}
        </span>
        <button
          type="button"
          className="toolbar-btn"
          disabled={page >= numPages}
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
        >
          Next
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
        >
          +
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
        >
          −
        </button>
        <button type="button" className="toolbar-btn" onClick={() => setZoom(1)}>
          Fit page
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setZoom(1.25)}
        >
          Fit width
        </button>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside
          className="pdf-viewer-sidebar w-16 shrink-0 overflow-y-auto border-r p-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="mb-2 text-[10px] font-semibold uppercase themed-muted">
            Pages
          </p>
          {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`mb-1 w-full rounded px-1 py-1 text-xs ${
                n === page ? 'nested-tree-row-selected' : 'toolbar-btn'
              }`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
        </aside>
        <div
          className="min-h-0 flex-1 overflow-auto p-6"
          style={{ background: 'var(--surface-secondary)' }}
        >
          <canvas
            ref={canvasRef}
            className="mx-auto block rounded shadow-md"
            style={{ background: '#fff' }}
          />
        </div>
      </div>
    </div>
  )
}
