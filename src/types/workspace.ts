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
  /** @deprecated use expanded */
  collapsed?: boolean
  /** Default true when omitted */
  expanded?: boolean
}

export interface WorkspaceDocument {
  id: string
  type: 'markdown' | 'pdf'
  name: string
  /**
   * Markdown interchange / search text (updated on save).
   * Legacy notes may only have this field.
   */
  content: string
  /** Canonical BlockNote document JSON (stringified blocks). */
  editorContent?: string
  createdAt?: number
  updatedAt?: number
  /** Subtle document accent (not board color). */
  accentColor?: string
  /** Auto-created blank starter (identity stable across renames). */
  isDefaultStarter?: boolean
}

export type WorkspaceTab = {
  documentId: string
  kind: 'markdown' | 'pdf'
}

export type WorkspaceSaveStatus = 'idle' | 'saving' | 'saved'

export interface WorkspaceUiState {
  tabs: WorkspaceTab[]
  activeDocumentId: string | null
  selectedFolderId: string | null
  saveStatus: WorkspaceSaveStatus
}

export type WorkspaceSelection =
  | { kind: 'board'; boardId: string }
  | { kind: 'markdown'; documentId: string }
  | { kind: 'pdf'; documentId: string }
  | null
