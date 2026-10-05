import dagre from 'dagre'
import type { Board } from '../../types/schema'
import {
  applyPositions,
  buildChildrenMap,
  estimateNodeSize,
} from './shared'

type DagreOptions = {
  rankdir: 'TB' | 'LR' | 'BT' | 'RL'
  nodesep: number
  ranksep: number
  align?: 'UL' | 'UR' | 'DL' | 'DR'
}

function layoutWithDagre(board: Board, options: DagreOptions): Board {
  if (board.nodes.length === 0) return board

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: options.rankdir,
    align: options.align ?? 'UL',
    nodesep: options.nodesep,
    ranksep: options.ranksep,
    marginx: 40,
    marginy: 40,
    ranker: 'network-simplex',
  })

  const sizes = new Map<string, { width: number; height: number }>()
  for (const node of board.nodes) {
    const size = estimateNodeSize(node.name)
    sizes.set(node.id, size)
    g.setNode(node.id, size)
  }

  const childrenMap = buildChildrenMap(board)
  for (const node of board.nodes) {
    if (!node.parentId) continue
    const kids = childrenMap.get(node.parentId)
    if (!kids?.includes(node.id)) continue
    g.setEdge(node.parentId, node.id)
  }

  dagre.layout(g)

  const positions = new Map<string, { x: number; y: number }>()
  for (const node of board.nodes) {
    const layout = g.node(node.id)
    const size = sizes.get(node.id)!
    if (!layout) continue
    positions.set(node.id, {
      x: layout.x - size.width / 2,
      y: layout.y - size.height / 2,
    })
  }

  return applyPositions(board, positions)
}

export function layoutVerticalTree(board: Board): Board {
  return layoutWithDagre(board, {
    rankdir: 'TB',
    nodesep: 28,
    ranksep: 72,
    align: 'UL',
  })
}

export function layoutHorizontalTree(board: Board): Board {
  return layoutWithDagre(board, {
    rankdir: 'LR',
    nodesep: 32,
    ranksep: 96,
    align: 'UL',
  })
}

export function layoutOrgChart(board: Board): Board {
  return layoutWithDagre(board, {
    rankdir: 'TB',
    nodesep: 48,
    ranksep: 96,
    align: 'UL',
  })
}
