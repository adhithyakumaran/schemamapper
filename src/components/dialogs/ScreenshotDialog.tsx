import { useRef, useState } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import type { SchemaNode } from '../../types/schema'
import { Modal } from './Modal'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function ScreenshotDialogInner({ node }: { node: SchemaNode }) {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const updateNode = useSchemaStore((s) => s.updateNode)
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const current = preview ?? node.screenshot

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const dataUrl = await readFileAsDataUrl(file)
    setPreview(dataUrl)
    updateNode(node.id, { screenshot: dataUrl })
  }

  return (
    <Modal title="Screenshot" onClose={() => setDialog(null)} widthClass="max-w-lg">
      <div className="space-y-4">
        {current ? (
          <img
            src={current}
            alt="Screenshot attachment"
            className="max-h-64 w-full rounded border border-slate-200 object-contain bg-slate-50"
          />
        ) : (
          <p className="text-sm text-slate-500">No screenshot attached.</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={() => inputRef.current?.click()}
          >
            {current ? 'Replace image' : 'Upload image'}
          </button>
          {current && (
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setPreview(null)
                updateNode(node.id, { screenshot: null })
              }}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            className="ml-auto rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
            onClick={() => setDialog(null)}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function ScreenshotDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  if (dialog?.type !== 'screenshot' || !board) return null
  const node = board.nodes.find((n) => n.id === dialog.nodeId)
  if (!node) return null
  return <ScreenshotDialogInner node={node} key={node.id} />
}
