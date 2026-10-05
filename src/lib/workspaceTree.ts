import { createId } from './ids'
import type {
  WorkspaceDocument,
  WorkspaceSelection,
  WorkspaceTreeNode,
} from '../types/workspace'

export function createFolderNode(name: string): WorkspaceTreeNode {
  return {
    id: createId('folder'),
    type: 'folder',
    name: name.trim() || 'New Folder',
    children: [],
    collapsed: false,
  }
}

export function createBoardRefNode(
  boardId: string,
  name: string,
): WorkspaceTreeNode {
  return {
    id: createId('ws'),
    type: 'board',
    name,
    boardId,
  }
}

export function createDocumentRefNode(
  doc: WorkspaceDocument,
): WorkspaceTreeNode {
  return {
    id: createId('ws'),
    type: doc.type,
    name: doc.name,
    documentId: doc.id,
  }
}

function cloneTree(nodes: WorkspaceTreeNode[]): WorkspaceTreeNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined,
  }))
}

export function findNode(
  nodes: WorkspaceTreeNode[],
  id: string,
): WorkspaceTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

export function mapTree(
  nodes: WorkspaceTreeNode[],
  fn: (node: WorkspaceTreeNode) => WorkspaceTreeNode,
): WorkspaceTreeNode[] {
  return nodes.map((n) => {
    const next = fn(n)
    if (next.children) {
      return { ...next, children: mapTree(next.children, fn) }
    }
    return next
  })
}

export function removeNode(
  nodes: WorkspaceTreeNode[],
  id: string,
): { tree: WorkspaceTreeNode[]; removed: WorkspaceTreeNode | null } {
  let removed: WorkspaceTreeNode | null = null
  const tree = nodes
    .filter((n) => {
      if (n.id === id) {
        removed = n
        return false
      }
      return true
    })
    .map((n) => {
      if (!n.children) return n
      const child = removeNode(n.children, id)
      if (child.removed) removed = child.removed
      return { ...n, children: child.tree }
    })
  return { tree, removed }
}

export function insertNode(
  nodes: WorkspaceTreeNode[],
  parentId: string | null,
  node: WorkspaceTreeNode,
  index?: number,
): WorkspaceTreeNode[] {
  if (!parentId) {
    const tree = cloneTree(nodes)
    const i = index ?? tree.length
    tree.splice(i, 0, node)
    return tree
  }
  return mapTree(nodes, (n) => {
    if (n.id !== parentId || n.type !== 'folder') return n
    const children = [...(n.children ?? [])]
    children.splice(index ?? children.length, 0, node)
    return { ...n, children }
  })
}

export function moveNodeInTree(
  nodes: WorkspaceTreeNode[],
  nodeId: string,
  targetParentId: string | null,
  targetIndex: number,
): WorkspaceTreeNode[] {
  const { tree: without, removed } = removeNode(nodes, nodeId)
  if (!removed) return nodes
  return insertNode(without, targetParentId, removed, targetIndex)
}

export function toggleFolderCollapsed(
  nodes: WorkspaceTreeNode[],
  folderId: string,
): WorkspaceTreeNode[] {
  return mapTree(nodes, (n) =>
    n.id === folderId && n.type === 'folder'
      ? { ...n, collapsed: !n.collapsed }
      : n,
  )
}

export function renameNode(
  nodes: WorkspaceTreeNode[],
  id: string,
  name: string,
): WorkspaceTreeNode[] {
  return mapTree(nodes, (n) => (n.id === id ? { ...n, name } : n))
}

export function selectionFromBoard(boardId: string): WorkspaceSelection {
  return { kind: 'board', boardId }
}

export function collectBoardIds(nodes: WorkspaceTreeNode[]): string[] {
  const ids: string[] = []
  const walk = (list: WorkspaceTreeNode[]) => {
    for (const n of list) {
      if (n.type === 'board' && n.boardId) ids.push(n.boardId)
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return ids
}
