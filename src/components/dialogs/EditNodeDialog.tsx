import { useRef, useState } from 'react'
import { optimizeImageFiles } from '../../lib/imageOptimize'
import { useSchemaStore } from '../../store/schemaStore'
import type { SchemaNode } from '../../types/schema'
import { Modal } from './Modal'

function EditNodeDialogInner({ node }: { node: SchemaNode }) {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const updateNode = useSchemaStore((s) => s.updateNode)
  const [name, setName] = useState(node.name)
  const [note, setNote] = useState(node.note)
  const [screenshots, setScreenshots] = useState<string[]>([...node.screenshots])
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const onAddEvidence = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setBusy(true)
    try {
      const added = await optimizeImageFiles(Array.from(fileList))
      if (added.length) setScreenshots((prev) => [...prev, ...added])
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    updateNode(node.id, {
      name: name.trim() || node.name,
      note,
      screenshots,
    })
    setDialog(null)
  }

  return (
    <Modal title="Edit node" onClose={() => setDialog(null)} widthClass="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="themed-label">Name</label>
          <input
            autoFocus
            className="themed-input w-full rounded-md px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="themed-label">Note</label>
          <textarea
            className="themed-input w-full min-h-[72px] rounded-md px-3 py-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Textual observation about this node."
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="themed-label mb-0">Evidence / Screenshots</label>
            <button
              type="button"
              disabled={busy}
              className="themed-input rounded-md px-2 py-1 text-xs disabled:opacity-50"
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'Processing…' : '+ Add Evidence'}
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => onAddEvidence(e.target.files)}
          />
          {screenshots.length === 0 ? (
            <p className="text-xs themed-muted">No evidence attached.</p>
          ) : (
            <div className="evidence-grid grid max-h-40 grid-cols-4 gap-2 overflow-y-auto rounded-md border p-2">
              {screenshots.map((src, index) => (
                <div key={`${index}-${src.slice(0, 20)}`} className="relative">
                  <button
                    type="button"
                    className="evidence-thumb block w-full overflow-hidden rounded border"
                    onClick={() => setLightbox(index)}
                  >
                    <img
                      src={src}
                      alt={`Evidence ${index + 1}`}
                      className="h-16 w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    className="evidence-delete absolute right-0.5 top-0.5 rounded px-1 text-[10px] shadow"
                    onClick={() =>
                      setScreenshots((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setDialog(null)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary rounded-md px-3 py-1.5 text-sm"
          >
            Save
          </button>
        </div>
      </form>
      {lightbox !== null && screenshots[lightbox] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightbox(null)}
        >
          <img
            src={screenshots[lightbox]}
            alt="Evidence preview"
            className="max-h-full max-w-full rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Modal>
  )
}

export function EditNodeDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  if (dialog?.type !== 'edit' || !board) return null
  const node = board.nodes.find((n) => n.id === dialog.nodeId)
  if (!node) return null
  return (
    <EditNodeDialogInner
      node={node}
      key={`${node.id}-${node.screenshots.length}-${node.note}`}
    />
  )
}
