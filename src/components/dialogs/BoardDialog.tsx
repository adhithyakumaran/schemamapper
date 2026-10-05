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
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Board name
          </label>
          <input
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Katalon Studio"
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
