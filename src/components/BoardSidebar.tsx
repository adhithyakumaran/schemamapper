import { useSchemaStore } from '../store/schemaStore'

export function BoardSidebar() {
  const boards = useSchemaStore((s) => s.boards)
  const activeBoardId = useSchemaStore((s) => s.activeBoardId)
  const setActiveBoard = useSchemaStore((s) => s.setActiveBoard)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const deleteBoard = useSchemaStore((s) => s.deleteBoard)

  return (
    <aside className="app-sidebar flex w-56 shrink-0 flex-col border-r">
      <div className="border-b px-3 py-3" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide themed-muted">
          Boards
        </p>
        <button
          type="button"
          className="sidebar-new-board mt-2 w-full rounded-md border border-dashed px-2 py-1.5 text-left text-sm"
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
                className={`group flex items-center gap-1 rounded-md border px-2 py-1.5 ${
                  active ? 'sidebar-board-item active shadow-sm' : 'sidebar-board-item'
                }`}
              >
                <button
                  type="button"
                  className="flex-1 truncate text-left text-sm"
                  onClick={() => setActiveBoard(board.id)}
                >
                  {board.name}
                </button>
                <button
                  type="button"
                  title="Rename"
                  className="sidebar-board-action hidden rounded px-1 text-xs group-hover:inline"
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
                  className="sidebar-board-action hidden rounded px-1 text-xs text-red-500 group-hover:inline"
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
