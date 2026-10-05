export type WorkspaceItemType = 'folder' | 'board' | 'markdown' | 'pdf'

export interface WorkspaceTreeNode {
  id: string
  type: WorkspaceItemType
  name: string
  /** Board document id when type === 'board' */
  boardId?: string
  /** Document id when type === 'markdown' | 'pdf' */
  documentId?: string
  children?: WorkspaceTreeNode[]
  collapsed?: boolean
}

export interface WorkspaceDocument {
  id: string
  type: 'markdown' | 'pdf'
  name: string
  /** Markdown source or PDF data URL */
  content: string
}

export type WorkspaceSelection =
  | { kind: 'board'; boardId: string }
  | { kind: 'markdown'; documentId: string }
  | { kind: 'pdf'; documentId: string }
  | null
