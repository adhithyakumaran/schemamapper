import type { BoardLayoutType } from './layout'
import type {
  WorkspaceDocument,
  WorkspaceSelection,
  WorkspaceTreeNode,
} from './workspace'

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
  /** Editable research metadata (type, source, custom columns). */
  research?: Record<string, string>
}

export interface ResearchColumnDef {
  id: string
  label: string
  builtIn?: boolean
}

export type BoardViewMode = 'table' | 'tree'

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
  /** Visualization preference (optional in imported JSON). */
  layout?: BoardLayoutType
  /** Saved manual positions when using freeform layout. */
  freeformPositions?: Record<string, NodePosition>
  /** Custom research columns (built-ins are always available). */
  researchColumns?: ResearchColumnDef[]
}

export type Board = BoardDocument

export interface BoardRegistry {
  entries: { boardId: string; file: string }[]
}

export interface BoardDetailPanelState {
  kind: 'evidence' | 'note'
  nodeId: string
  imageIndex?: number
}

export interface BoardUiState {
  /** Collapsed node ids (UI only — not schema). */
  collapsedNodeIds: string[]
  selectedNodeId?: string | null
  viewMode?: BoardViewMode
  detailPanel?: BoardDetailPanelState | null
  columnWidths?: Record<string, number>
}

export interface AppData {
  boards: Board[]
  activeBoardId: string | null
  boardFiles: Record<string, string>
  workspaceTree: WorkspaceTreeNode[]
  workspaceDocuments: Record<string, WorkspaceDocument>
  selection: WorkspaceSelection
  boardUiState: Record<string, BoardUiState>
}

export type DialogState =
  | { type: 'newWorkspace' }
  | {
      type: 'folder'
      mode: 'create' | 'rename'
      folderId?: string
      parentFolderId?: string | null
    }
  | { type: 'board'; mode: 'create' | 'rename'; boardId?: string }
  | { type: 'addChild'; parentId: string }
  | { type: 'addRoot' }
  | { type: 'edit'; nodeId: string }
  | { type: 'note'; nodeId: string }
  | { type: 'deleteNode'; nodeId: string }
  | { type: 'nodeMenu'; nodeId: string; x: number; y: number }
  | null
