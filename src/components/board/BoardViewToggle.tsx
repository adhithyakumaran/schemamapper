import { boardUiForBoard } from '../../store/stableDefaults'
import { useSchemaStore } from '../../store/schemaStore'

export function BoardViewToggle({ boardId }: { boardId: string }) {
  const viewMode = useSchemaStore(
    (s) => boardUiForBoard(s.boardUiState, boardId).viewMode ?? 'table',
  )
  const setBoardViewMode = useSchemaStore((s) => s.setBoardViewMode)

  return (
    <div className="board-view-toggle flex rounded-md border p-0.5 text-xs" style={{ borderColor: 'var(--border)' }}>
      <button
        type="button"
        className={`rounded px-2.5 py-1 ${viewMode === 'table' ? 'board-view-toggle-active' : ''}`}
        onClick={() => setBoardViewMode(boardId, 'table')}
      >
        📊 Table
      </button>
      <button
        type="button"
        className={`rounded px-2.5 py-1 ${viewMode === 'tree' ? 'board-view-toggle-active' : ''}`}
        onClick={() => setBoardViewMode(boardId, 'tree')}
      >
        🌳 Tree
      </button>
    </div>
  )
}
