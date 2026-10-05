import type { Board } from '../../types/schema'

export const NODE_MIN_WIDTH = 150
export const NODE_MAX_WIDTH = 240
const NODE_BASE_HEIGHT = 56
const LINE_HEIGHT = 18
const HORIZONTAL_PADDING = 24

export function estimateNodeSize(name: string): { width: number; height: number } {
  const width = NODE_MAX_WIDTH
  const charsPerLine = Math.floor((width - HORIZONTAL_PADDING) / 7.2)
  const lines = Math.max(1, Math.ceil(name.length / charsPerLine))
  const height = NODE_BASE_HEIGHT + (lines - 1) * LINE_HEIGHT
  return { width, height }
}

export function buildChildrenMap(board: Board): Map<string, string[]> {
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

export function getRootIds(childrenMap: Map<string, string[]>): string[] {
  return childrenMap.get('__root__') ?? []
}

export function applyPositions(
  board: Board,
  positions: Map<string, { x: number; y: number }>,
): Board {
  const nodes = board.nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }))
  return { ...board, nodes }
}
