import { childrenOf } from './hierarchyTree'
import type { Board, SchemaNode } from '../types/schema'

export interface ResearchTableRow {
  index: number
  level: number
  node: SchemaNode
  parentName: string
}

export function orderedResearchRows(board: Board): ResearchTableRow[] {
  const nameById = new Map(board.nodes.map((n) => [n.id, n.name]))
  const rows: ResearchTableRow[] = []

  const walk = (parentId: string | null, level: number) => {
    for (const node of childrenOf(board.nodes, parentId)) {
      const parentName =
        node.parentId === null
          ? '—'
          : (nameById.get(node.parentId) ?? '—')
      rows.push({
        index: rows.length + 1,
        level,
        node,
        parentName,
      })
      walk(node.id, level + 1)
    }
  }

  walk(null, 0)
  return rows
}

export function resolveParentIdByName(
  board: Board,
  nodeId: string,
  parentName: string,
): string | null {
  const trimmed = parentName.trim()
  if (!trimmed || trimmed === '—' || trimmed === '-') return null
  const match = board.nodes.find(
    (n) => n.id !== nodeId && n.name.toLowerCase() === trimmed.toLowerCase(),
  )
  return match?.id ?? null
}
