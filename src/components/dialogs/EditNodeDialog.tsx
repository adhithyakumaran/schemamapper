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
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Name
          </label>
          <input
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Note
          </label>
          <textarea
            className="w-full min-h-[72px] rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Textual observation about this node."
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600">
              Evidence / Screenshots
            </label>
            <button
              type="button"
              disabled={busy}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
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
            <p className="text-xs text-slate-500">No evidence attached.</p>
          ) : (
            <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto rounded-md border border-slate-100 bg-slate-50/50 p-2">
              {screenshots.map((src, index) => (
                <div key={`${index}-${src.slice(0, 20)}`} className="relative">
                  <button
                    type="button"
                    className="block w-full overflow-hidden rounded border border-slate-200"
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
                    className="absolute right-0.5 top-0.5 rounded bg-white/95 px-1 text-[10px] text-red-600 shadow"
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
            className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            onClick={() => setDialog(null)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
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
