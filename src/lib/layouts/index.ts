import type { Board } from '../../types/schema'
import type { BoardLayoutType } from '../../types/layout'
import { layoutCompactTree } from './compactTree'
import {
  layoutHorizontalTree,
  layoutOrgChart,
  layoutVerticalTree,
} from './dagreLayout'
import { layoutMindMap } from './mindMap'
import { layoutRadial } from './radial'

export function layoutBoard(board: Board, layout: BoardLayoutType): Board {
  switch (layout) {
    case 'freeform':
      return board
    case 'vertical-tree':
      return layoutVerticalTree(board)
    case 'horizontal-tree':
      return layoutHorizontalTree(board)
    case 'compact-tree':
      return layoutCompactTree(board)
    case 'radial':
      return layoutRadial(board)
    case 'mind-map':
      return layoutMindMap(board)
    case 'org-chart':
      return layoutOrgChart(board)
    default:
      return layoutVerticalTree(board)
  }
}

export function boardNeedsInitialLayout(board: Board): boolean {
  if (board.nodes.length === 0) return false
  if (board.layout === 'freeform') return false

  const allZero = board.nodes.every(
    (n) => n.position.x === 0 && n.position.y === 0,
  )
  if (allZero) return true

  const xs = board.nodes.map((n) => n.position.x)
  const spreadX = Math.max(...xs) - Math.min(...xs)
  const spreadY =
    Math.max(...board.nodes.map((n) => n.position.y)) -
    Math.min(...board.nodes.map((n) => n.position.y))

  if (spreadX > 3500 && board.nodes.length < 80) return true
  if (spreadX > spreadY * 8 && spreadX > 2000) return true

  return false
}

