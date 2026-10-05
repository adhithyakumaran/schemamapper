import type { Board } from '../types/schema'

export const NODE_MIN_WIDTH = 150
export const NODE_MAX_WIDTH = 240
const NODE_BASE_HEIGHT = 56
const LINE_HEIGHT = 18
const HORIZONTAL_PADDING = 24

const SIBLING_GAP_X = 36
const ROW_GAP_Y = 88
const ROOT_GAP_X = 72
const MARGIN = 48
const MAX_SIBLING_COLS = 5

function estimateNodeSize(name: string): { width: number; height: number } {
  const width = NODE_MAX_WIDTH
  const charsPerLine = Math.floor((width - HORIZONTAL_PADDING) / 7.2)
  const lines = Math.max(1, Math.ceil(name.length / charsPerLine))
  const height = NODE_BASE_HEIGHT + (lines - 1) * LINE_HEIGHT
  return { width, height }
}

function siblingColumns(count: number): number {
  if (count <= 1) return 1
  if (count <= 5) return count
  if (count <= 12) return 4
  return MAX_SIBLING_COLS
}

function buildChildrenMap(board: Board): Map<string, string[]> {
  const order = new Map<string, number>()
  board.nodes.forEach((n, i) => order.set(n.id, i))

  const children = new Map<string, string[]>()
  const ids = new Set(board.nodes.map((n) => n.id))

  for (const node of board.nodes) {
    const pid =
      node.parentId && ids.has(node.parentId) ? node.parentId : '__root__'
    if (!children.has(pid)) children.set(pid, [])
    children.get(pid)!.push(node.id)
  }

  for (const list of children.values()) {
    list.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
  }
  return children
}

type SubtreeMetrics = {
  width: number
  height: number
  rowHeights: number[]
}

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

/**
 * Top-to-bottom hierarchical layout from parentId.
 * Siblings wrap into compact rows (does not mutate hierarchy or connections).
 */
export function autoLayoutBoard(board: Board): Board {
  if (board.nodes.length === 0) return board

  const names = new Map(board.nodes.map((n) => [n.id, n.name]))
  const childrenMap = buildChildrenMap(board)
  const roots = childrenMap.get('__root__') ?? []

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

  const nodes = board.nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }))

  return { ...board, nodes }
}

/** True when stored positions are missing or produce an unusably wide spread. */
export function boardNeedsAutoLayout(board: Board): boolean {
  if (board.nodes.length === 0) return false

  const allZero = board.nodes.every(
    (n) => n.position.x === 0 && n.position.y === 0,
  )
  if (allZero) return true

  const xs = board.nodes.map((n) => n.position.x)
  const ys = board.nodes.map((n) => n.position.y)
  const spreadX = Math.max(...xs) - Math.min(...xs)
  const spreadY = Math.max(...ys) - Math.min(...ys)

  if (spreadX > 3500 && board.nodes.length < 80) return true
  if (spreadX > spreadY * 8 && spreadX > 2000) return true

  return false
}
