import { useState } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import { Modal } from './Modal'

function AddNodeDialogInner({ parentId }: { parentId: string | null }) {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const addNode = useSchemaStore((s) => s.addNode)
  const [name, setName] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addNode(name, parentId)
    setDialog(null)
  }

  return (
    <Modal
      title={parentId ? 'Add child node' : 'Add node'}
      onClose={() => setDialog(null)}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Node name
          </label>
          <input
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            Add
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function AddNodeDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  if (dialog?.type !== 'addChild' && dialog?.type !== 'addRoot') return null
  const parentId = dialog.type === 'addChild' ? dialog.parentId : null
  return <AddNodeDialogInner parentId={parentId} key={parentId ?? 'root'} />
}
