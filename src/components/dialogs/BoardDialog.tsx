import { useState } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import { Modal } from './Modal'

function BoardDialogInner({
  mode,
  boardId,
}: {
  mode: 'create' | 'rename'
  boardId?: string
}) {
  const setDialog = useSchemaStore((s) => s.setDialog)
  const createBoard = useSchemaStore((s) => s.createBoard)
  const renameBoard = useSchemaStore((s) => s.renameBoard)
  const boards = useSchemaStore((s) => s.boards)

  const isRename = mode === 'rename'
  const existing = isRename ? boards.find((b) => b.id === boardId) : null
  const [name, setName] = useState(existing?.name ?? '')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isRename && boardId) {
      renameBoard(boardId, name)
    } else {
      createBoard(name)
    }
    setDialog(null)
  }

  return (
    <Modal
      title={isRename ? 'Rename board' : 'New board'}
      onClose={() => setDialog(null)}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="themed-label">Board name</label>
          <input
            autoFocus
            className="themed-input w-full rounded-md px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Katalon Studio"
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
            {isRename ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function BoardDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  if (dialog?.type !== 'board') return null
  return (
    <BoardDialogInner mode={dialog.mode} boardId={dialog.boardId} key={dialog.boardId ?? 'new'} />
  )
}
