import { useSchemaStore } from '../store/schemaStore'

export function BoardSidebar() {
  const boards = useSchemaStore((s) => s.boards)
  const activeBoardId = useSchemaStore((s) => s.activeBoardId)
  const setActiveBoard = useSchemaStore((s) => s.setActiveBoard)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const deleteBoard = useSchemaStore((s) => s.deleteBoard)

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Boards
        </p>
        <button
          type="button"
          className="mt-2 w-full rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => setDialog({ type: 'board', mode: 'create' })}
        >
          + New Board
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {boards.map((board) => {
          const active = board.id === activeBoardId
          return (
            <li key={board.id} className="mb-1">
              <div
                className={`group flex items-center gap-1 rounded-md px-2 py-1.5 ${
                  active ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  className="flex-1 truncate text-left text-sm text-slate-800"
                  onClick={() => setActiveBoard(board.id)}
                >
                  {board.name}
                </button>
                <button
                  type="button"
                  title="Rename"
                  className="hidden rounded px-1 text-xs text-slate-500 group-hover:inline hover:bg-white"
                  onClick={() =>
                    setDialog({
                      type: 'board',
                      mode: 'rename',
                      boardId: board.id,
                    })
                  }
                >
                  ✎
                </button>
                <button
                  type="button"
                  title="Delete board"
                  className="hidden rounded px-1 text-xs text-red-500 group-hover:inline hover:bg-white"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete board "${board.name}"? This cannot be undone.`,
                      )
                    ) {
                      deleteBoard(board.id)
                    }
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
