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
          <label className="themed-label">Node name</label>
          <input
            autoFocus
            className="themed-input w-full rounded-md px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
