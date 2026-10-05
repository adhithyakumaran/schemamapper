import type { Board } from '../../types/schema'
import {
  applyPositions,
  buildChildrenMap,
  estimateNodeSize,
  getRootIds,
} from './shared'

const BRANCH_X = 220
const BRANCH_Y = 72
const MARGIN = 80

function placeBranch(
  board: Board,
  nodeId: string,
  x: number,
  y: number,
  direction: 1 | -1,
  childrenMap: Map<string, string[]>,
  positions: Map<string, { x: number; y: number }>,
): number {
  const size = estimateNodeSize(
    board.nodes.find((n) => n.id === nodeId)?.name ?? 'Node',
  )
  positions.set(nodeId, { x, y })

  const kids = childrenMap.get(nodeId) ?? []
  if (kids.length === 0) return size.height

  let childY = y
  let maxSpan = 0
  kids.forEach((kidId, index) => {
    const childDir = index % 2 === 0 ? direction : (-direction as 1 | -1)
    const childX = x + childDir * BRANCH_X
    const span = placeBranch(
      board,
      kidId,
      childX,
      childY,
      childDir,
      childrenMap,
      positions,
    )
    childY += span + BRANCH_Y
    maxSpan = Math.max(maxSpan, span)
  })

  return Math.max(size.height, childY - y - BRANCH_Y + size.height)
}

export function layoutMindMap(board: Board): Board {
  if (board.nodes.length === 0) return board
  const childrenMap = buildChildrenMap(board)
  const roots = getRootIds(childrenMap)
  const positions = new Map<string, { x: number; y: number }>()

  let offsetY = MARGIN
  for (const rootId of roots) {
    const rootSize = estimateNodeSize(
      board.nodes.find((n) => n.id === rootId)?.name ?? '',
    )
    const centerX = MARGIN + 320
    placeBranch(
      board,
      rootId,
      centerX - rootSize.width / 2,
      offsetY,
      1,
      childrenMap,
      positions,
    )
    offsetY += 400
  }

  return applyPositions(board, positions)
}
