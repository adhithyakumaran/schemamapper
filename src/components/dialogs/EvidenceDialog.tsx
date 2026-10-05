import { useRef, useState } from 'react'
import { optimizeImageFiles } from '../../lib/imageOptimize'
import { useSchemaStore } from '../../store/schemaStore'
import type { SchemaNode } from '../../types/schema'
import { Modal } from './Modal'

function EvidenceDialogInner({ node }: { node: SchemaNode }) {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const addScreenshots = useSchemaStore((s) => s.addScreenshots)
  const removeScreenshotAt = useSchemaStore((s) => s.removeScreenshotAt)
  const inputRef = useRef<HTMLInputElement>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setBusy(true)
    try {
      const files = Array.from(fileList)
      const optimized = await optimizeImageFiles(files)
      if (optimized.length > 0) addScreenshots(node.id, optimized)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Modal title="Evidence" onClose={() => setDialog(null)} widthClass="max-w-2xl">
      <p className="mb-3 text-xs text-slate-500">
        Screenshot evidence for this node (PNG, JPG, WEBP). Images are resized and
        compressed before storage.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {node.screenshots.length === 0 ? (
        <p className="text-sm text-slate-500">No evidence attached yet.</p>
      ) : (
        <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {node.screenshots.map((src, index) => (
            <div key={`${index}-${src.slice(0, 24)}`} className="relative">
              <button
                type="button"
                className="block w-full overflow-hidden rounded border border-slate-200 bg-slate-50"
                onClick={() => setLightbox(index)}
              >
                <img
                  src={src}
                  alt={`Evidence ${index + 1}`}
                  className="h-24 w-full object-cover"
                />
              </button>
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-white/90 px-1.5 text-xs text-red-600 shadow"
                onClick={() => removeScreenshotAt(node.id, index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Processing…' : 'Upload images'}
        </button>
        <button
          type="button"
          className="ml-auto rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
          onClick={() => setDialog(null)}
        >
          Done
        </button>
      </div>
      {lightbox !== null && node.screenshots[lightbox] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightbox(null)}
        >
          <img
            src={node.screenshots[lightbox]}
            alt="Evidence full size"
            className="max-h-full max-w-full rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Modal>
  )
}

export function EvidenceDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  if (dialog?.type !== 'evidence' || !board) return null
  const node = board.nodes.find((n) => n.id === dialog.nodeId)
  if (!node) return null
  return <EvidenceDialogInner node={node} key={`${node.id}-${node.screenshots.length}`} />
}
