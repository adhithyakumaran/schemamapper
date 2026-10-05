import { useState } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import type { SchemaNode } from '../../types/schema'
import { Modal } from './Modal'

function EditNodeDialogInner({ node }: { node: SchemaNode }) {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const updateNode = useSchemaStore((s) => s.updateNode)
  const [name, setName] = useState(node.name)
  const [note, setNote] = useState(node.note)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    updateNode(node.id, { name: name.trim() || node.name, note })
    setDialog(null)
  }

  return (
    <Modal title="Edit node" onClose={() => setDialog(null)}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Name
          </label>
          <input
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Note (optional)
          </label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
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
  return <EditNodeDialogInner node={node} key={node.id} />
}
