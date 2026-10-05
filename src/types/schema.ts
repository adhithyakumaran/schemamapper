export interface NodePosition {
  x: number
  y: number
}

export interface SchemaNode {
  id: string
  name: string
  parentId: string | null
  position: NodePosition
  note: string
  image: string | null
}

export interface SchemaEdge {
  id: string
  source: string
  target: string
}

export interface Board {
  id: string
  name: string
  nodes: SchemaNode[]
  edges: SchemaEdge[]
}

export interface AppData {
  boards: Board[]
  activeBoardId: string | null
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
