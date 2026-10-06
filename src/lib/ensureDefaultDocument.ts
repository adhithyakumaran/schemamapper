import { createId } from './ids'
import { findFirstDocumentInTree } from './workspaceDisplay'
import { createDocumentRefNode, insertNode } from './workspaceTree'
import { DEFAULT_WORKSPACE_UI } from '../store/stableDefaults'
import type { WorkspaceDocument, WorkspaceSelection, WorkspaceTreeNode, WorkspaceUiState } from '../types/workspace'

export const DEFAULT_STARTER_DOCUMENT_NAME = 'Untitled'

export type WorkspaceSnapshot = {
  workspaceDocuments: Record<string, WorkspaceDocument>
  workspaceTree: WorkspaceTreeNode[]
  workspaceUi: WorkspaceUiState
  selection: WorkspaceSelection
}

function openDocument(
  snapshot: WorkspaceSnapshot,
  documentId: string,
  kind: 'markdown' | 'pdf',
): WorkspaceSnapshot {
  const ui = snapshot.workspaceUi ?? DEFAULT_WORKSPACE_UI
  const has = ui.tabs.some((t) => t.documentId === documentId)
  const tabs = has ? ui.tabs : [...ui.tabs, { documentId, kind }]
  return {
    ...snapshot,
    workspaceUi: {
      ...ui,
      tabs,
      activeDocumentId: documentId,
    },
    selection:
      kind === 'markdown'
        ? { kind: 'markdown', documentId }
        : { kind: 'pdf', documentId },
  }
}

function createStarterDocument(): WorkspaceDocument {
  const now = Date.now()
  return {
    id: createId('doc'),
    type: 'markdown',
    name: DEFAULT_STARTER_DOCUMENT_NAME,
    content: '',
    createdAt: now,
    updatedAt: now,
    isDefaultStarter: true,
  }
}

function documentNodeInTree(
  tree: WorkspaceTreeNode[],
  documentId: string,
): boolean {
  const walk = (nodes: WorkspaceTreeNode[]): boolean => {
    for (const n of nodes) {
      if (n.documentId === documentId) return true
      if (n.children && walk(n.children)) return true
    }
    return false
  }
  return walk(tree)
}

/**
 * Ensures a writable default document exists and restores last-active tab when possible.
 * Idempotent: never creates a second starter while documents already exist.
 */
export function ensureDefaultWorkspace(
  input: WorkspaceSnapshot,
): WorkspaceSnapshot {
  const docIds = Object.keys(input.workspaceDocuments)

  if (docIds.length === 0) {
    const doc = createStarterDocument()
    const workspaceDocuments = { [doc.id]: doc }
    const workspaceTree = insertNode(
      input.workspaceTree,
      null,
      createDocumentRefNode(doc),
    )
    return openDocument(
      {
        ...input,
        workspaceDocuments,
        workspaceTree,
      },
      doc.id,
      'markdown',
    )
  }

  const ui = input.workspaceUi ?? DEFAULT_WORKSPACE_UI
  const activeId = ui.activeDocumentId
  if (activeId && input.workspaceDocuments[activeId]) {
    const kind =
      input.workspaceDocuments[activeId].type === 'pdf' ? 'pdf' : 'markdown'
    let tree = input.workspaceTree
    if (!documentNodeInTree(tree, activeId)) {
      tree = insertNode(
        tree,
        null,
        createDocumentRefNode(input.workspaceDocuments[activeId]),
      )
    }
    return openDocument({ ...input, workspaceTree: tree }, activeId, kind)
  }

  if (
    input.selection &&
    input.selection.kind !== 'board' &&
    input.workspaceDocuments[input.selection.documentId]
  ) {
    const kind = input.selection.kind
    return openDocument(input, input.selection.documentId, kind)
  }

  const starter = Object.values(input.workspaceDocuments).find(
    (d) => d.isDefaultStarter,
  )
  if (starter) {
    let tree = input.workspaceTree
    if (!documentNodeInTree(tree, starter.id)) {
      tree = insertNode(tree, null, createDocumentRefNode(starter))
    }
    return openDocument(
      { ...input, workspaceTree: tree },
      starter.id,
      'markdown',
    )
  }

  const first = findFirstDocumentInTree(input.workspaceTree)
  if (first && input.workspaceDocuments[first.documentId]) {
    return openDocument(input, first.documentId, first.kind)
  }

  const fallback = input.workspaceDocuments[docIds[0]]
  if (fallback) {
    const kind = fallback.type === 'pdf' ? 'pdf' : 'markdown'
    let tree = input.workspaceTree
    if (!documentNodeInTree(tree, fallback.id)) {
      tree = insertNode(tree, null, createDocumentRefNode(fallback))
    }
    return openDocument(
      { ...input, workspaceTree: tree },
      fallback.id,
      kind,
    )
  }

  return input
}
