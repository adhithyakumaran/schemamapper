import { useState } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import type { SchemaNode } from '../../types/schema'
import { Modal } from './Modal'

function NoteDialogInner({ node }: { node: SchemaNode }) {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const updateNode = useSchemaStore((s) => s.updateNode)
  const [note, setNote] = useState(node.note)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    updateNode(node.id, { note })
    setDialog(null)
  }

  return (
    <Modal title="Note" onClose={() => setDialog(null)}>
      <form onSubmit={submit} className="space-y-4">
        <textarea
          autoFocus
          className="themed-input w-full min-h-[120px] rounded-md px-3 py-2 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Captured from Katalon Studio 11.5 screenshot."
        />
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
    </Modal>
  )
}

export function NoteDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  if (dialog?.type !== 'note' || !board) return null
  const node = board.nodes.find((n) => n.id === dialog.nodeId)
  if (!node) return null
  return <NoteDialogInner node={node} key={node.id} />
}
