import { createId } from '../lib/ids'
import { getDescendantIds } from '../lib/tree'
import {
  DEFAULT_BOARD_LAYOUT,
  normalizeBoardLayout,
  type BoardLayoutType,
} from '../types/layout'
import {
  DEFAULT_BOARD_COLOR,
  type Board,
  type BoardDocument,
  type SchemaConnection,
  type SchemaNode,
} from '../types/schema'

export function slugifyBoardName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'board'
}

function normalizeNode(raw: Record<string, unknown>): SchemaNode {
  const legacyImage = raw.image as string | null | undefined
  const legacyScreenshot = raw.screenshot as string | null | undefined
  let screenshots: string[] = []
  if (Array.isArray(raw.screenshots)) {
    screenshots = (raw.screenshots as unknown[])
      .filter((s) => typeof s === 'string' && s.length > 0)
      .map(String)
  } else if (legacyScreenshot) {
    screenshots = [legacyScreenshot]
  } else if (legacyImage) {
    screenshots = [legacyImage]
  }

  return {
    id: String(raw.id),
    name: String(raw.name),
    parentId:
      raw.parentId === null || raw.parentId === undefined
        ? null
        : String(raw.parentId),
    position: {
      x: Number((raw.position as { x?: number })?.x ?? 0),
      y: Number((raw.position as { y?: number })?.y ?? 0),
    },
    note: String(raw.note ?? ''),
    screenshots,
  }
}

function normalizeConnections(raw: unknown): SchemaConnection[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((c) => c as Record<string, unknown>)
    .filter((c) => c.source && c.target)
    .map((c) => ({
      id: String(c.id ?? createId('connection')),
      source: String(c.source),
      target: String(c.target),
    }))
}

export function boardToDocument(board: Board): BoardDocument {
  return {
    id: board.id,
    name: board.name,
    color: board.color ?? DEFAULT_BOARD_COLOR,
    layout: board.layout ?? DEFAULT_BOARD_LAYOUT,
    ...(board.freeformPositions
      ? { freeformPositions: { ...board.freeformPositions } }
      : {}),
    nodes: board.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      parentId: n.parentId,
      position: { ...n.position },
      note: n.note ?? '',
      screenshots: [...(n.screenshots ?? [])],
    })),
    connections: (board.connections ?? []).map((c) => ({
      id: c.id,
      source: c.source,
      target: c.target,
    })),
  }
}

export function exportBoardJson(board: Board): string {
  return JSON.stringify(boardToDocument(board), null, 2)
}

export function normalizeImportedBoard(raw: unknown): Board {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid board JSON')
  }
  const obj = raw as Record<string, unknown>
  if (!obj.name || !Array.isArray(obj.nodes)) {
    throw new Error('Board must include name and nodes')
  }

  const nodes = (obj.nodes as Record<string, unknown>[]).map(normalizeNode)

  const layout = normalizeBoardLayout(
    typeof obj.layout === 'string' ? obj.layout : undefined,
  )

  let freeformPositions: Record<string, { x: number; y: number }> | undefined
  if (obj.freeformPositions && typeof obj.freeformPositions === 'object') {
    freeformPositions = {}
    for (const [key, val] of Object.entries(
      obj.freeformPositions as Record<string, unknown>,
    )) {
      const pos = val as { x?: number; y?: number }
      freeformPositions[key] = {
        x: Number(pos.x ?? 0),
        y: Number(pos.y ?? 0),
      }
    }
  }

  return {
    id: String(obj.id ?? createId('board')),
    name: String(obj.name),
    color: String(obj.color ?? DEFAULT_BOARD_COLOR),
    layout: layout as BoardLayoutType,
    freeformPositions,
    nodes,
    connections: normalizeConnections(obj.connections),
  }
}

export function createBoard(name: string, id?: string): Board {
  return {
    id: id ?? createId('board'),
    name: name.trim() || 'Untitled Board',
    color: DEFAULT_BOARD_COLOR,
    layout: DEFAULT_BOARD_LAYOUT,
    nodes: [],
    connections: [],
  }
}

export function snapshotFreeformPositions(board: Board): Board {
  const freeformPositions: Record<string, { x: number; y: number }> = {}
  for (const node of board.nodes) {
    freeformPositions[node.id] = { ...node.position }
  }
  return { ...board, freeformPositions }
}

export function restoreFreeformPositions(board: Board): Board {
  if (!board.freeformPositions) return board
  const nodes = board.nodes.map((n) => ({
    ...n,
    position: board.freeformPositions![n.id] ?? n.position,
  }))
  return { ...board, nodes }
}

export function setBoardColor(board: Board, color: string): Board {
  return { ...board, color: color || DEFAULT_BOARD_COLOR }
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
    screenshots: [],
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
  patch: Partial<
    Pick<SchemaNode, 'name' | 'note' | 'screenshots' | 'parentId'>
  >,
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

export function addScreenshots(
  board: Board,
  nodeId: string,
  screenshots: string[],
): Board {
  const node = board.nodes.find((n) => n.id === nodeId)
  if (!node || screenshots.length === 0) return board
  return updateNode(board, nodeId, {
    screenshots: [...node.screenshots, ...screenshots],
  })
}

export function removeScreenshotAt(
  board: Board,
  nodeId: string,
  index: number,
): Board {
  const node = board.nodes.find((n) => n.id === nodeId)
  if (!node) return board
  const screenshots = node.screenshots.filter((_, i) => i !== index)
  return updateNode(board, nodeId, { screenshots })
}

export function replaceScreenshotAt(
  board: Board,
  nodeId: string,
  index: number,
  dataUrl: string,
): Board {
  const node = board.nodes.find((n) => n.id === nodeId)
  if (!node) return board
  const screenshots = [...node.screenshots]
  if (index < 0 || index >= screenshots.length) return board
  screenshots[index] = dataUrl
  return updateNode(board, nodeId, { screenshots })
}

export function addConnection(
  board: Board,
  source: string,
  target: string,
): Board {
  if (source === target) return board
  if (!board.nodes.some((n) => n.id === source)) return board
  if (!board.nodes.some((n) => n.id === target)) return board
  const exists = (board.connections ?? []).some(
    (c) => c.source === source && c.target === target,
  )
  if (exists) return board
  const connection: SchemaConnection = {
    id: createId('connection'),
    source,
    target,
  }
  return {
    ...board,
    connections: [...(board.connections ?? []), connection],
  }
}

export function removeConnection(board: Board, connectionId: string): Board {
  return {
    ...board,
    connections: (board.connections ?? []).filter((c) => c.id !== connectionId),
  }
}

export function deleteNode(board: Board, nodeId: string): Board {
  const toRemove = new Set([nodeId, ...getDescendantIds(board.nodes, nodeId)])
  const nodes = board.nodes.filter((n) => !toRemove.has(n.id))
  const connections = (board.connections ?? []).filter(
    (c) => !toRemove.has(c.source) && !toRemove.has(c.target),
  )
  return { ...board, nodes, connections }
}

export function updateBoardInList(
  boards: Board[],
  boardId: string,
  updater: (board: Board) => Board,
): Board[] {
  return boards.map((b) => (b.id === boardId ? updater(b) : b))
}
