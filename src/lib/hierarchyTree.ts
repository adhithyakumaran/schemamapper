import { getDescendantIds } from './tree'
import type { Board, SchemaNode } from '../types/schema'

/** Children in document order (sibling order in JSON). */
export function childrenOf(
  nodes: SchemaNode[],
  parentId: string | null,
): SchemaNode[] {
  return nodes.filter((n) => n.parentId === parentId)
}

export function hasChildren(nodes: SchemaNode[], nodeId: string): boolean {
  return nodes.some((n) => n.parentId === nodeId)
}

export function moveNodeInHierarchy(
  board: Board,
  nodeId: string,
  newParentId: string | null,
  beforeNodeId?: string | null,
): Board {
  const node = board.nodes.find((n) => n.id === nodeId)
  if (!node) return board
  if (newParentId === nodeId) return board
  if (
    newParentId !== null &&
    getDescendantIds(board.nodes, nodeId).includes(newParentId)
  ) {
    return board
  }

  const rest = board.nodes.filter((n) => n.id !== nodeId)
  const updated: SchemaNode = { ...node, parentId: newParentId }

  let insertAt = rest.length
  if (beforeNodeId) {
    const idx = rest.findIndex((n) => n.id === beforeNodeId)
    insertAt = idx >= 0 ? idx : rest.length
  } else if (newParentId === null) {
    let last = -1
    rest.forEach((n, i) => {
      if (n.parentId === null) last = i
    })
    insertAt = last >= 0 ? last + 1 : 0
  } else {
    let last = -1
    rest.forEach((n, i) => {
      if (n.parentId === newParentId) last = i
    })
    if (last >= 0) {
      insertAt = last + 1
    } else {
      const parentIdx = rest.findIndex((n) => n.id === newParentId)
      insertAt = parentIdx >= 0 ? parentIdx + 1 : rest.length
    }
  }

  rest.splice(insertAt, 0, updated)
  return { ...board, nodes: rest }
}
