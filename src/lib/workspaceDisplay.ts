import type { WorkspaceTreeNode } from '../types/workspace'

/** Hide legacy board entries from the document-first workspace UI. */
export function filterBoardNodesFromTree(
  nodes: WorkspaceTreeNode[],
): WorkspaceTreeNode[] {
  return nodes
    .filter((n) => n.type !== 'board')
    .map((n) =>
      n.type === 'folder' && n.children
        ? { ...n, children: filterBoardNodesFromTree(n.children) }
        : n,
    )
}

export function findFirstDocumentInTree(
  nodes: WorkspaceTreeNode[],
): { documentId: string; kind: 'markdown' | 'pdf' } | null {
  for (const node of nodes) {
    if (node.type === 'board') continue
    if (
      (node.type === 'markdown' || node.type === 'pdf') &&
      node.documentId
    ) {
      return { documentId: node.documentId, kind: node.type }
    }
    if (node.children) {
      const found = findFirstDocumentInTree(node.children)
      if (found) return found
    }
  }
  return null
}
