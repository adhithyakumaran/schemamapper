import { getDeleteNodeMessage, useSchemaStore } from '../../store/schemaStore'
import { Modal } from './Modal'

export function DeleteNodeDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const deleteNode = useSchemaStore((s) => s.deleteNode)
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )

  if (dialog?.type !== 'deleteNode' || !board) return null

  const node = board.nodes.find((n) => n.id === dialog.nodeId)
  if (!node) return null

  const message = getDeleteNodeMessage(board.nodes, node.id)

  return (
    <Modal title="Delete node" onClose={() => setDialog(null)}>
      <p className="mb-4 text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          onClick={() => setDialog(null)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500"
          onClick={() => {
            deleteNode(node.id)
            setDialog(null)
          }}
        >
          Delete
        </button>
      </div>
    </Modal>
  )
}
