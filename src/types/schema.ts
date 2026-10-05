export interface NodePosition {
  x: number
  y: number
}

/** Canonical node shape stored in JSON and edited by tooling (e.g. Cursor). */
export interface SchemaNode {
  id: string
  name: string
  parentId: string | null
  position: NodePosition
  note: string
  screenshot: string | null
}

/** Board document — hierarchy lives in nodes[].parentId; no edges on disk. */
export interface BoardDocument {
  id: string
  name: string
  nodes: SchemaNode[]
}

/** Runtime board (same as document; edges are derived only for rendering). */
export type Board = BoardDocument

export interface BoardRegistry {
  entries: { boardId: string; file: string }[]
}

export interface AppData {
  boards: Board[]
  activeBoardId: string | null
  /** Maps board id → filename under data/boards/ */
  boardFiles: Record<string, string>
}

export type DialogState =
  | { type: 'board'; mode: 'create' | 'rename'; boardId?: string }
  | { type: 'addChild'; parentId: string }
  | { type: 'addRoot' }
  | { type: 'edit'; nodeId: string }
  | { type: 'note'; nodeId: string }
  | { type: 'screenshot'; nodeId: string }
  | { type: 'deleteNode'; nodeId: string }
  | { type: 'nodeMenu'; nodeId: string; x: number; y: number }
  | null
