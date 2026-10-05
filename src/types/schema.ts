export interface NodePosition {
  x: number
  y: number
}

export interface SchemaConnection {
  id: string
  source: string
  target: string
}

/** Canonical node shape stored in JSON and edited by tooling (e.g. Cursor). */
export interface SchemaNode {
  id: string
  name: string
  parentId: string | null
  position: NodePosition
  note: string
  screenshots: string[]
}

export const DEFAULT_BOARD_COLOR = '#F8FAFC'

export const BOARD_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: 'Light Grey', value: '#F8FAFC' },
  { label: 'Light Green', value: '#E8F5E9' },
  { label: 'Light Pink', value: '#FCE4EC' },
  { label: 'Light Blue', value: '#E3F2FD' },
  { label: 'Light Purple', value: '#F3E5F5' },
  { label: 'Light Yellow', value: '#FFFDE7' },
  { label: 'Light Peach', value: '#FFF3E0' },
]

/** Board document — hierarchy in nodes[].parentId; relationships in connections[]. */
export interface BoardDocument {
  id: string
  name: string
  color: string
  nodes: SchemaNode[]
  connections: SchemaConnection[]
}

export type Board = BoardDocument

export interface BoardRegistry {
  entries: { boardId: string; file: string }[]
}

export interface AppData {
  boards: Board[]
  activeBoardId: string | null
  boardFiles: Record<string, string>
}

export type DialogState =
  | { type: 'board'; mode: 'create' | 'rename'; boardId?: string }
  | { type: 'addChild'; parentId: string }
  | { type: 'addRoot' }
  | { type: 'edit'; nodeId: string }
  | { type: 'note'; nodeId: string }
  | { type: 'evidence'; nodeId: string }
  | { type: 'deleteNode'; nodeId: string }
  | { type: 'nodeMenu'; nodeId: string; x: number; y: number }
  | null
