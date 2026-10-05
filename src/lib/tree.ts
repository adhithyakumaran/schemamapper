import type { SchemaNode } from '../types/schema'

export function getDescendantIds(
  nodes: SchemaNode[],
  rootId: string,
): string[] {
  const childrenByParent = new Map<string | null, SchemaNode[]>()
  for (const node of nodes) {
    const list = childrenByParent.get(node.parentId) ?? []
    list.push(node)
    childrenByParent.set(node.parentId, list)
  }

  const result: string[] = []
  const stack = [rootId]
  while (stack.length > 0) {
    const id = stack.pop()!
    const children = childrenByParent.get(id) ?? []
    for (const child of children) {
      result.push(child.id)
      stack.push(child.id)
    }
  }
  return result
}

export function countDescendants(nodes: SchemaNode[], rootId: string): number {
  return getDescendantIds(nodes, rootId).length
}

/** Simple top-down tree layout for seed / import data. */
export function layoutSubtree(
  nodes: SchemaNode[],
  rootId: string,
  originX = 0,
  originY = 0,
): SchemaNode[] {
  const byId = new Map(nodes.map((n) => [n.id, { ...n }]))
  const childrenOf = (parentId: string | null) =>
    nodes.filter((n) => n.parentId === parentId)

  const subtreeWidth = (id: string): number => {
    const kids = childrenOf(id)
    if (kids.length === 0) return 1
    return kids.reduce((sum, c) => sum + subtreeWidth(c.id), 0)
  }

  const place = (id: string, x: number, y: number): number => {
    const node = byId.get(id)!
    node.position = { x, y }
    const kids = childrenOf(id)
    if (kids.length === 0) return x + 220

    let cursor = x
    for (const child of kids) {
      const w = subtreeWidth(child.id) * 220
      const childX = cursor + w / 2 - 110
      place(child.id, childX, y + 140)
      cursor += w
    }
    return cursor
  }

  const roots = nodes.filter((n) => n.id === rootId)
  if (roots.length === 0) return nodes.map((n) => byId.get(n.id)!)

  place(rootId, originX, originY)
  return nodes.map((n) => byId.get(n.id)!)
}

export function syncEdgesFromParents(
  nodes: SchemaNode[],
): { id: string; source: string; target: string }[] {
  return nodes
    .filter((n) => n.parentId !== null)
    .map((n) => ({
      id: `edge-${n.parentId}-${n.id}`,
      source: n.parentId!,
      target: n.id,
    }))
}
