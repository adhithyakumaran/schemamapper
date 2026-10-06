import { resolveBoardCanvasColor } from '../../lib/boardCanvasColor'
import { boardUiForBoard } from '../../store/stableDefaults'
import { useSchemaStore } from '../../store/schemaStore'
import { useThemeStore } from '../../store/themeStore'
import { DEFAULT_BOARD_COLOR, type Board } from '../../types/schema'
import { SchemaBoardToolbar } from '../SchemaBoardToolbar'
import { EvidenceDetailPanel } from './EvidenceDetailPanel'

export function BoardResearchWorkspace({
  board,
  children,
}: {
  board: Board
  children: React.ReactNode
}) {
  const dark = useThemeStore((s) => s.theme === 'dark')
  const detailPanel = useSchemaStore(
    (s) => boardUiForBoard(s.boardUiState, board.id).detailPanel ?? null,
  )
  const canvasColor = resolveBoardCanvasColor(
    board.color ?? DEFAULT_BOARD_COLOR,
    dark,
  )

  return (
    <div className="board-research-workspace flex min-h-0 flex-1 flex-col">
      <SchemaBoardToolbar />
      <div className="flex min-h-0 flex-1">
        <div
          className="board-canvas dotted-board-canvas flex min-h-0 min-w-0 flex-1 flex-col"
          style={{ '--board-canvas-color': canvasColor } as React.CSSProperties}
        >
          {children}
        </div>
        {detailPanel?.kind === 'evidence' ? (
          <EvidenceDetailPanel
            board={board}
            nodeId={detailPanel.nodeId}
            initialIndex={detailPanel.imageIndex ?? 0}
          />
        ) : null}
      </div>
    </div>
  )
}
