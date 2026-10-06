import type { BoardUiState } from '../types/schema'
import type { WorkspaceDocument, WorkspaceTreeNode } from '../types/workspace'

export const EMPTY_COLLAPSED_NODE_IDS: string[] = []

export const DEFAULT_BOARD_UI_STATE: BoardUiState = {
  collapsedNodeIds: EMPTY_COLLAPSED_NODE_IDS,
  selectedNodeId: null,
  viewMode: 'table',
  detailPanel: null,
}

export const EMPTY_WORKSPACE_TREE: WorkspaceTreeNode[] = []

export const EMPTY_WORKSPACE_DOCUMENTS: Record<string, WorkspaceDocument> = {}

export function boardUiForBoard(
  boardUiState: Record<string, BoardUiState> | undefined,
  boardId: string,
): BoardUiState {
  return boardUiState?.[boardId] ?? DEFAULT_BOARD_UI_STATE
}
