import type { Board } from '../../types/schema'
import {
  applyPositions,
  buildChildrenMap,
  estimateNodeSize,
  getRootIds,
} from './shared'

const RING_GAP = 160
const MARGIN = 80

function layoutRadialFromRoot(
  board: Board,
  rootId: string,
  centerX: number,
  centerY: number,
  positions: Map<string, { x: number; y: number }>,
) {
  const childrenMap = buildChildrenMap(board)
  const depth = new Map<string, number>()
  const queue = [rootId]
  depth.set(rootId, 0)

  while (queue.length) {
    const id = queue.shift()!
    const d = depth.get(id)!
    for (const child of childrenMap.get(id) ?? []) {
      if (!depth.has(child)) {
        depth.set(child, d + 1)
        queue.push(child)
      }
    }
  }

  const byDepth = new Map<number, string[]>()
  for (const node of board.nodes) {
    const d = depth.get(node.id)
    if (d === undefined) continue
    if (!byDepth.has(d)) byDepth.set(d, [])
    byDepth.get(d)!.push(node.id)
  }

  const rootSize = estimateNodeSize(
    board.nodes.find((n) => n.id === rootId)?.name ?? '',
  )
  positions.set(rootId, {
    x: centerX - rootSize.width / 2,
    y: centerY - rootSize.height / 2,
  })

  for (const [d, ids] of byDepth) {
    if (d === 0) continue
    const radius = d * RING_GAP
    const step = (2 * Math.PI) / Math.max(ids.length, 1)
    ids.forEach((id, i) => {
      const angle = -Math.PI / 2 + i * step
      const size = estimateNodeSize(
        board.nodes.find((n) => n.id === id)?.name ?? '',
      )
      const x = centerX + Math.cos(angle) * radius - size.width / 2
      const y = centerY + Math.sin(angle) * radius - size.height / 2
      positions.set(id, { x, y })
    })
  }
}

export function layoutRadial(board: Board): Board {
  if (board.nodes.length === 0) return board
  const childrenMap = buildChildrenMap(board)
  const roots = getRootIds(childrenMap)
  const positions = new Map<string, { x: number; y: number }>()

  let offsetX = MARGIN + 200
  for (const rootId of roots) {
    layoutRadialFromRoot(board, rootId, offsetX, MARGIN + 200, positions)
    offsetX += RING_GAP * 4
  }

  return applyPositions(board, positions)
}
