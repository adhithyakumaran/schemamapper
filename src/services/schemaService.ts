import { createId } from '../lib/ids'
import { getDescendantIds } from '../lib/tree'
import type { Board, BoardDocument, SchemaNode } from '../types/schema'

export function slugifyBoardName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'board'
}

export function boardToDocument(board: Board): BoardDocument {
  return {
    id: board.id,
    name: board.name,
    nodes: board.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      parentId: n.parentId,
      position: { ...n.position },
      note: n.note ?? '',
      screenshot: n.screenshot ?? null,
    })),
  }
}

export function exportBoardJson(board: Board): string {
  return JSON.stringify(boardToDocument(board), null, 2)
}

/** Accept exported JSON or legacy shapes (image field, optional edges). */
export function normalizeImportedBoard(raw: unknown): Board {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid board JSON')
  }
  const obj = raw as Record<string, unknown>
  if (!obj.name || !Array.isArray(obj.nodes)) {
    throw new Error('Board must include name and nodes')
  }

  const nodes: SchemaNode[] = (obj.nodes as Record<string, unknown>[]).map(
    (n) => {
      const legacyImage = n.image as string | null | undefined
      const screenshot =
        (n.screenshot as string | null | undefined) ?? legacyImage ?? null
      return {
        id: String(n.id),
        name: String(n.name),
        parentId: n.parentId === null || n.parentId === undefined
          ? null
          : String(n.parentId),
        position: {
          x: Number((n.position as { x?: number })?.x ?? 0),
          y: Number((n.position as { y?: number })?.y ?? 0),
        },
        note: String(n.note ?? ''),
        screenshot,
      }
    },
  )

  return {
    id: String(obj.id ?? createId('board')),
    name: String(obj.name),
    nodes,
  }
}

export function createBoard(name: string, id?: string): Board {
  return {
    id: id ?? createId('board'),
    name: name.trim() || 'Untitled Board',
    nodes: [],
  }
}

export function renameBoard(board: Board, name: string): Board {
  return { ...board, name: name.trim() || board.name }
}

export function createNode(
  name: string,
  parentId: string | null,
  position: { x: number; y: number },
  id?: string,
): SchemaNode {
  return {
    id: id ?? createId('node'),
    name: name.trim(),
    parentId,
    position,
    note: '',
    screenshot: null,
  }
}

export function defaultChildPosition(
  board: Board,
  parentId: string | null,
  explicit?: { x: number; y: number },
): { x: number; y: number } {
  if (explicit) return explicit
  if (!parentId) return { x: 120, y: 120 }
  const parent = board.nodes.find((n) => n.id === parentId)
  if (!parent) return { x: 120, y: 120 }
  const siblings = board.nodes.filter((n) => n.parentId === parentId)
  return {
    x: parent.position.x + siblings.length * 40,
    y: parent.position.y + 140,
  }
}

export function addNode(
  board: Board,
  name: string,
  parentId: string | null,
  position?: { x: number; y: number },
): Board {
  const trimmed = name.trim()
  if (!trimmed) return board
  const pos = defaultChildPosition(board, parentId, position)
  const node = createNode(trimmed, parentId, pos)
  return { ...board, nodes: [...board.nodes, node] }
}

export function addChildNode(board: Board, parentId: string, name: string): Board {
  return addNode(board, name, parentId)
}

export function updateNode(
  board: Board,
  nodeId: string,
  patch: Partial<Pick<SchemaNode, 'name' | 'note' | 'screenshot' | 'parentId'>>,
): Board {
  if (patch.parentId !== undefined) {
    const invalid =
      patch.parentId === nodeId ||
      (patch.parentId !== null &&
        getDescendantIds(board.nodes, nodeId).includes(patch.parentId))
    if (invalid) return board
  }
  return {
    ...board,
    nodes: board.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
  }
}

export function moveNode(
  board: Board,
  nodeId: string,
  x: number,
  y: number,
): Board {
  return {
    ...board,
    nodes: board.nodes.map((n) =>
      n.id === nodeId ? { ...n, position: { x, y } } : n,
    ),
  }
}

export function addNote(board: Board, nodeId: string, note: string): Board {
  return updateNode(board, nodeId, { note })
}

export function attachScreenshot(
  board: Board,
  nodeId: string,
  screenshot: string,
): Board {
  return updateNode(board, nodeId, { screenshot })
}

export function removeScreenshot(board: Board, nodeId: string): Board {
  return updateNode(board, nodeId, { screenshot: null })
}

export function deleteNode(board: Board, nodeId: string): Board {
  const toRemove = new Set([nodeId, ...getDescendantIds(board.nodes, nodeId)])
  return {
    ...board,
    nodes: board.nodes.filter((n) => !toRemove.has(n.id)),
  }
}

export function updateBoardInList(
  boards: Board[],
  boardId: string,
  updater: (board: Board) => Board,
): Board[] {
  return boards.map((b) => (b.id === boardId ? updater(b) : b))
}
