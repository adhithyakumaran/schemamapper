import type { Board } from '../../types/schema'
import {
  applyPositions,
  buildChildrenMap,
  estimateNodeSize,
  getRootIds,
} from './shared'

const SIBLING_GAP_X = 32
const ROW_GAP_Y = 72
const ROOT_GAP_X = 64
const MARGIN = 48
const MAX_SIBLING_COLS = 5

function siblingColumns(count: number): number {
  if (count <= 1) return 1
  if (count <= 5) return count
  if (count <= 12) return 4
  return MAX_SIBLING_COLS
}

type SubtreeMetrics = { width: number; height: number; rowHeights: number[] }

function measureSubtree(
  nodeId: string,
  names: Map<string, string>,
  childrenMap: Map<string, string[]>,
  cache: Map<string, SubtreeMetrics>,
): SubtreeMetrics {
  if (cache.has(nodeId)) return cache.get(nodeId)!

  const self = estimateNodeSize(names.get(nodeId) ?? 'Node')
  const kids = childrenMap.get(nodeId) ?? []

  if (kids.length === 0) {
    const m = { width: self.width, height: self.height, rowHeights: [] }
    cache.set(nodeId, m)
    return m
  }

  const cols = siblingColumns(kids.length)
  const childMetrics = kids.map((id) =>
    measureSubtree(id, names, childrenMap, cache),
  )

  const rowHeights: number[] = []
  let maxRowWidth = 0

  for (let row = 0; row < Math.ceil(kids.length / cols); row += 1) {
    let rowWidth = 0
    let rowHeight = 0
    for (let col = 0; col < cols; col += 1) {
      const idx = row * cols + col
      if (idx >= kids.length) break
      const cm = childMetrics[idx]
      rowWidth += cm.width + (col > 0 ? SIBLING_GAP_X : 0)
      rowHeight = Math.max(rowHeight, cm.height)
    }
    maxRowWidth = Math.max(maxRowWidth, rowWidth)
    rowHeights.push(rowHeight)
  }

  const childrenHeight = rowHeights.reduce(
    (sum, h, i) => sum + h + (i > 0 ? ROW_GAP_Y : 0),
    0,
  )

  const m = {
    width: Math.max(self.width, maxRowWidth),
    height: self.height + ROW_GAP_Y + childrenHeight,
    rowHeights,
  }
  cache.set(nodeId, m)
  return m
}

function placeSubtree(
  nodeId: string,
  x: number,
  y: number,
  names: Map<string, string>,
  childrenMap: Map<string, string[]>,
  metrics: Map<string, SubtreeMetrics>,
  positions: Map<string, { x: number; y: number }>,
) {
  const self = estimateNodeSize(names.get(nodeId) ?? 'Node')
  const m = metrics.get(nodeId)!
  positions.set(nodeId, { x: x + (m.width - self.width) / 2, y })

  const kids = childrenMap.get(nodeId) ?? []
  if (kids.length === 0) return

  const cols = siblingColumns(kids.length)
  let childY = y + self.height + ROW_GAP_Y

  for (let row = 0; row < Math.ceil(kids.length / cols); row += 1) {
    const rowKids: string[] = []
    let rowWidth = 0
    for (let col = 0; col < cols; col += 1) {
      const idx = row * cols + col
      if (idx >= kids.length) break
      const kidId = kids[idx]
      rowKids.push(kidId)
      const km = metrics.get(kidId)!
      rowWidth += km.width + (col > 0 ? SIBLING_GAP_X : 0)
    }

    let childX = x + (m.width - rowWidth) / 2
    for (const kidId of rowKids) {
      const km = metrics.get(kidId)!
      placeSubtree(kidId, childX, childY, names, childrenMap, metrics, positions)
      childX += km.width + SIBLING_GAP_X
    }

    childY += (m.rowHeights[row] ?? 0) + ROW_GAP_Y
  }
}

export function layoutCompactTree(board: Board): Board {
  if (board.nodes.length === 0) return board

  const names = new Map(board.nodes.map((n) => [n.id, n.name]))
  const childrenMap = buildChildrenMap(board)
  const roots = getRootIds(childrenMap)

  const metrics = new Map<string, SubtreeMetrics>()
  for (const node of board.nodes) {
    measureSubtree(node.id, names, childrenMap, metrics)
  }

  const positions = new Map<string, { x: number; y: number }>()
  let offsetX = MARGIN
  for (const rootId of roots) {
    const rm = metrics.get(rootId)!
    placeSubtree(rootId, offsetX, MARGIN, names, childrenMap, metrics, positions)
    offsetX += rm.width + ROOT_GAP_X
  }

  return applyPositions(board, positions)
}
