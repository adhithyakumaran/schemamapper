import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { boardUiForBoard } from './stableDefaults'
import { boardNeedsInitialLayout, layoutBoard } from '../lib/layouts'
import { createId } from '../lib/ids'
import { countDescendants } from '../lib/tree'
import {
  collectBoardIds,
  createBoardRefNode,
  createDocumentRefNode,
  createFolderNode,
  insertNode,
  moveNodeInTree,
  removeNode,
  renameNode,
  toggleFolderCollapsed,
} from '../lib/workspaceTree'
import {
  loadBoardsFromServer,
  loadSeedBoards,
  type PersistenceMode,
} from '../services/boardLoader'
import {
  createBoardFile,
  deleteBoardFile,
  saveBoardToFile,
} from '../services/persistence'
import * as schema from '../services/schemaService'
import {
  deleteBoardFromSupabase,
  syncNodeScreenshots,
  upsertFullBoardToSupabase,
} from '../services/supabaseBoardService'
import { moveNodeInHierarchy } from '../lib/hierarchyTree'
import {
  DEFAULT_BOARD_LAYOUT,
  isGraphLayout,
  normalizeBoardLayout,
  type BoardLayoutType,
} from '../types/layout'
import type {
  AppData,
  Board,
  DialogState,
  SchemaNode,
} from '../types/schema'
import type {
  WorkspaceDocument,
  WorkspaceSelection,
  WorkspaceTreeNode,
} from '../types/workspace'

export type EdgeMenuState = {
  connectionId: string
  x: number
  y: number
} | null

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SchemaStore extends AppData {
  hydrated: boolean
  persistenceMode: PersistenceMode
  syncStatus: SyncStatus
  syncError: string | null
  layoutFitTick: number
  dialog: DialogState
  edgeMenu: EdgeMenuState
  setDialog: (dialog: DialogState) => void
  setEdgeMenu: (menu: EdgeMenuState) => void
  setSelection: (selection: WorkspaceSelection) => void
  hydrateFromServer: () => Promise<void>
  reloadFromServer: () => Promise<void>
  applyActiveBoardLayout: () => void
  setBoardLayout: (boardId: string, layout: BoardLayoutType) => void
  createBoard: (name: string) => void
  createFolder: (name: string, parentFolderId?: string | null) => void
  renameBoard: (boardId: string, name: string) => void
  renameWorkspaceItem: (itemId: string, name: string) => void
  deleteBoard: (boardId: string) => void
  deleteWorkspaceItem: (itemId: string) => void
  toggleWorkspaceFolder: (folderId: string) => void
  moveWorkspaceItem: (
    itemId: string,
    targetParentId: string | null,
    targetIndex: number,
  ) => void
  setActiveBoard: (boardId: string) => void
  addNode: (
    name: string,
    parentId: string | null,
    position?: { x: number; y: number },
  ) => void
  updateNode: (
    nodeId: string,
    patch: Partial<
      Pick<SchemaNode, 'name' | 'note' | 'screenshots' | 'parentId' | 'research'>
    >,
  ) => void
  updateNodePosition: (nodeId: string, x: number, y: number) => void
  addScreenshots: (nodeId: string, screenshots: string[]) => void
  removeScreenshotAt: (nodeId: string, index: number) => void
  addConnection: (source: string, target: string) => void
  removeConnection: (connectionId: string) => void
  setBoardColor: (boardId: string, color: string) => void
  deleteNode: (nodeId: string) => void
  importBoard: (board: Board) => void
  importMarkdownFile: (file: File) => Promise<void>
  importPdfFile: (file: File) => Promise<void>
  updateMarkdownDocument: (documentId: string, content: string) => void
  replaceActiveBoard: (board: Board) => void
  toggleTreeNodeCollapsed: (boardId: string, nodeId: string) => void
  setTreeSelectedNode: (boardId: string, nodeId: string | null) => void
  moveHierarchyNode: (
    boardId: string,
    nodeId: string,
    newParentId: string | null,
    beforeNodeId?: string | null,
  ) => void
  setBoardViewMode: (boardId: string, viewMode: import('../types/schema').BoardViewMode) => void
  setBoardDetailPanel: (
    boardId: string,
    panel: import('../types/schema').BoardDetailPanelState | null,
  ) => void
  updateNodeResearch: (nodeId: string, fields: Record<string, string>) => void
  addResearchColumn: (boardId: string, label: string) => void
  setColumnWidth: (boardId: string, columnId: string, width: number) => void
  syncToSupabase: () => Promise<void>
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

function uniqueFilename(
  name: string,
  boardFiles: Record<string, string>,
): string {
  let base = schema.slugifyBoardName(name)
  let file = `${base}.json`
  let i = 2
  const used = new Set(Object.values(boardFiles))
  while (used.has(file)) {
    file = `${base}-${i}.json`
    i += 1
  }
  return file
}

function ensureWorkspaceTree(
  boards: Board[],
  tree: WorkspaceTreeNode[],
): WorkspaceTreeNode[] {
  const refs = new Set(collectBoardIds(tree))
  let next = tree.length > 0 ? tree : []
  for (const board of boards) {
    if (!refs.has(board.id)) {
      next = insertNode(next, null, createBoardRefNode(board.id, board.name))
    }
  }
  return next
}

function selectionBoardId(selection: WorkspaceSelection): string | null {
  return selection?.kind === 'board' ? selection.boardId : null
}

function applyLayout(board: Board, layout: BoardLayoutType): Board {
  if (layout === 'nested-tree') return board
  if (layout === 'freeform') return schema.restoreFreeformPositions(board)
  if (isGraphLayout(layout)) return layoutBoard(board, layout)
  return board
}

function transitionLayout(board: Board, next: BoardLayoutType): Board {
  const current = normalizeBoardLayout(board.layout)
  let b = board
  if (current === 'freeform' && next !== 'freeform') {
    b = schema.snapshotFreeformPositions(b)
  }
  b = { ...b, layout: next }
  return applyLayout(b, next)
}

function boardUi(
  state: { boardUiState?: Record<string, import('../types/schema').BoardUiState> },
  boardId: string,
) {
  return boardUiForBoard(state.boardUiState, boardId)
}

let hydrateInFlight: Promise<void> | null = null

function schedulePersist(
  get: () => SchemaStore,
  set: (partial: Partial<SchemaStore>) => void,
  boardId: string,
) {
  const { persistenceMode, boardFiles, boards } = get()
  const board = boards.find((b) => b.id === boardId)
  if (!board) return

  if (persistTimer) clearTimeout(persistTimer)

  if (persistenceMode === 'supabase') {
    persistTimer = setTimeout(() => {
      void (async () => {
        set({ syncStatus: 'saving', syncError: null })
        try {
          await upsertFullBoardToSupabase(board)
          set({ syncStatus: 'saved', syncError: null })
        } catch {
          set({
            syncStatus: 'error',
            syncError:
              'Unable to save changes. Your changes have not been synchronized.',
          })
        }
      })()
    }, 450)
    return
  }

  if (persistenceMode === 'file') {
    const file = boardFiles[boardId]
    if (!file) return
    persistTimer = setTimeout(() => {
      void saveBoardToFile(board, file)
    }, 400)
  }
}

function registerBoardInWorkspace(
  tree: WorkspaceTreeNode[],
  board: Board,
  parentFolderId?: string | null,
): WorkspaceTreeNode[] {
  const refs = collectBoardIds(tree)
  if (refs.includes(board.id)) return tree
  return insertNode(
    tree,
    parentFolderId ?? null,
    createBoardRefNode(board.id, board.name),
  )
}

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoardId: null,
      boardFiles: {},
      workspaceTree: [],
      workspaceDocuments: {},
      selection: null,
      boardUiState: {},
      hydrated: false,
      persistenceMode: 'local',
      syncStatus: 'idle',
      syncError: null,
      layoutFitTick: 0,
      dialog: null,
      edgeMenu: null,

      setDialog: (dialog) => set({ dialog }),
      setEdgeMenu: (edgeMenu) => set({ edgeMenu }),

      setSelection: (selection) =>
        set({
          selection,
          activeBoardId: selectionBoardId(selection),
        }),

      hydrateFromServer: async () => {
        if (get().hydrated) return
        if (hydrateInFlight) return hydrateInFlight
        hydrateInFlight = (async () => {
        try {
          const existing = get().boards
          let { boards, boardFiles, mode } =
            await loadBoardsFromServer(existing)
          let layoutFitTick = 0
          boards = boards.map((b) => {
            const layout = normalizeBoardLayout(b.layout)
            const withLayout = { ...b, layout }
            if (!boardNeedsInitialLayout(withLayout)) return withLayout
            if (layout === 'freeform' || layout === 'nested-tree') return withLayout
            if (!isGraphLayout(layout)) return withLayout
            layoutFitTick = Date.now()
            return { ...layoutBoard(withLayout, layout), layout }
          })

          const workspaceTree = ensureWorkspaceTree(
            boards,
            get().workspaceTree,
          )
          const prev = get().selection
          const selectionValid =
            prev &&
            ((prev.kind === 'board' &&
              boards.some((b) => b.id === prev.boardId)) ||
              (prev.kind === 'markdown' &&
                Boolean(get().workspaceDocuments[prev.documentId])) ||
              (prev.kind === 'pdf' &&
                Boolean(get().workspaceDocuments[prev.documentId])))
          const selection: WorkspaceSelection = selectionValid
            ? prev
            : boards[0]
              ? { kind: 'board' as const, boardId: boards[0].id }
              : null

          set({
            boards,
            boardFiles: existing.length ? get().boardFiles : boardFiles,
            workspaceTree,
            selection,
            activeBoardId: selectionBoardId(selection),
            persistenceMode: mode,
            hydrated: true,
            syncError: null,
            layoutFitTick,
          })
        } catch {
          const seed = await loadSeedBoards()
          const board = seed[0]
          set({
            boards: board ? [board] : [],
            activeBoardId: board?.id ?? null,
            selection: board
              ? { kind: 'board' as const, boardId: board.id }
              : null,
            workspaceTree: board
              ? [createBoardRefNode(board.id, board.name)]
              : [],
            persistenceMode: 'local',
            hydrated: true,
            syncError: null,
          })
        }
        })()
        try {
          await hydrateInFlight
        } finally {
          hydrateInFlight = null
        }
      },

      reloadFromServer: async () => {
        if (get().persistenceMode !== 'supabase') return
        set({ syncStatus: 'saving', syncError: null })
        try {
          const { boards, boardFiles, mode } = await loadBoardsFromServer([])
          const selection = get().selection
          set({
            boards,
            boardFiles,
            persistenceMode: mode,
            syncStatus: 'saved',
            syncError: null,
            workspaceTree: ensureWorkspaceTree(boards, get().workspaceTree),
            activeBoardId:
              selection?.kind === 'board' ? selection.boardId : boards[0]?.id,
          })
        } catch {
          set({
            syncStatus: 'error',
            syncError: 'Unable to reload from server.',
          })
        }
      },

      applyActiveBoardLayout: () => {
        const boardId = get().activeBoardId
        if (!boardId) return
        const board = get().boards.find((b) => b.id === boardId)
        if (!board) return
        const layout = normalizeBoardLayout(board.layout)
        if (layout === 'nested-tree') return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) =>
            applyLayout(b, layout),
          ),
          layoutFitTick: Date.now(),
        }))
        schedulePersist(get, set, boardId)
      },

      setBoardLayout: (boardId, layout) => {
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) =>
            transitionLayout(b, layout),
          ),
          layoutFitTick: Date.now(),
        }))
        schedulePersist(get, set, boardId)
      },

      createBoard: (name) => {
        const board = schema.createBoard(name)
        const file = uniqueFilename(board.name, get().boardFiles)
        set((state) => ({
          boards: [...state.boards, board],
          activeBoardId: board.id,
          selection: { kind: 'board', boardId: board.id },
          boardFiles: { ...state.boardFiles, [board.id]: file },
          workspaceTree: registerBoardInWorkspace(state.workspaceTree, board),
          boardUiState: {
            ...(state.boardUiState ?? {}),
            [board.id]: {
              ...boardUi(state, board.id),
              viewMode: 'table',
              detailPanel: null,
            },
          },
        }))
        const mode = get().persistenceMode
        if (mode === 'supabase') {
          void upsertFullBoardToSupabase(board).catch(() => {})
        } else if (mode === 'file') {
          void createBoardFile(board, file)
        }
      },

      createFolder: (name, parentFolderId = null) => {
        const folder = createFolderNode(name)
        set((state) => ({
          workspaceTree: insertNode(
            state.workspaceTree,
            parentFolderId,
            folder,
          ),
        }))
      },

      renameBoard: (boardId, name) => {
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) =>
            schema.renameBoard(b, name),
          ),
          workspaceTree: mapBoardNames(state.workspaceTree, boardId, name),
        }))
        schedulePersist(get, set, boardId)
      },

      renameWorkspaceItem: (itemId, name) => {
        set((state) => ({
          workspaceTree: renameNode(state.workspaceTree, itemId, name),
        }))
      },

      deleteBoard: (boardId) => {
        const file = get().boardFiles[boardId]
        const mode = get().persistenceMode
        set((state) => {
          const boards = state.boards.filter((b) => b.id !== boardId)
          const { [boardId]: _, ...boardFiles } = state.boardFiles
          let tree = state.workspaceTree
          const walkRemove = (nodes: WorkspaceTreeNode[]): WorkspaceTreeNode[] =>
            nodes
              .filter((n) => !(n.type === 'board' && n.boardId === boardId))
              .map((n) =>
                n.children
                  ? { ...n, children: walkRemove(n.children) }
                  : n,
              )
          tree = walkRemove(tree)
          let selection: WorkspaceSelection = state.selection
          if (
            state.selection?.kind === 'board' &&
            state.selection.boardId === boardId
          ) {
            selection = boards[0]
              ? { kind: 'board', boardId: boards[0].id }
              : null
          }
          return {
            boards,
            boardFiles,
            workspaceTree: tree,
            selection,
            activeBoardId: selectionBoardId(selection),
          }
        })
        if (mode === 'supabase') {
          void deleteBoardFromSupabase(boardId).catch(() => {})
        } else if (mode === 'file' && file) {
          void deleteBoardFile(file)
        }
      },

      deleteWorkspaceItem: (itemId) => {
        const node = findInTree(get().workspaceTree, itemId)
        if (!node) return
        if (node.type === 'board' && node.boardId) {
          get().deleteBoard(node.boardId)
          return
        }
        if (
          (node.type === 'markdown' || node.type === 'pdf') &&
          node.documentId
        ) {
          const docId = node.documentId
          set((state) => {
            const { tree } = removeNode(state.workspaceTree, itemId)
            const { [docId]: _, ...docs } = state.workspaceDocuments
            let selection: WorkspaceSelection = state.selection
            if (
              state.selection &&
              state.selection.kind !== 'board' &&
              state.selection.documentId === docId
            ) {
              selection = null
            }
            return {
              workspaceTree: tree,
              workspaceDocuments: docs,
              selection,
              activeBoardId: selectionBoardId(selection),
            }
          })
          return
        }
        set((state) => ({
          workspaceTree: removeNode(state.workspaceTree, itemId).tree,
        }))
      },

      toggleWorkspaceFolder: (folderId) => {
        set((state) => ({
          workspaceTree: toggleFolderCollapsed(state.workspaceTree, folderId),
        }))
      },

      moveWorkspaceItem: (itemId, targetParentId, targetIndex) => {
        set((state) => ({
          workspaceTree: moveNodeInTree(
            state.workspaceTree,
            itemId,
            targetParentId,
            targetIndex,
          ),
        }))
      },

      setActiveBoard: (boardId) =>
        set({
          activeBoardId: boardId,
          selection: { kind: 'board', boardId },
        }),

      addNode: (name, parentId, position) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.addNode(b, name, parentId, position),
          ),
        }))
        schedulePersist(get, set, activeBoardId)
      },

      updateNode: (nodeId, patch) => {
        const { activeBoardId, persistenceMode } = get()
        if (!activeBoardId) return

        const apply = (screenshots?: string[]) => {
          set((state) => ({
            boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
              schema.updateNode(b, nodeId, {
                ...patch,
                ...(screenshots ? { screenshots } : {}),
              }),
            ),
          }))
          schedulePersist(get, set, activeBoardId)
        }

        if (patch.screenshots && persistenceMode === 'supabase') {
          const board = get().boards.find((b) => b.id === activeBoardId)
          const node = board?.nodes.find((n) => n.id === nodeId)
          if (!node) return
          void (async () => {
            set({ syncStatus: 'saving', syncError: null })
            try {
              const urls = await syncNodeScreenshots(
                activeBoardId,
                nodeId,
                node.screenshots,
                patch.screenshots!,
              )
              apply(urls)
              set({ syncStatus: 'saved' })
            } catch {
              set({
                syncStatus: 'error',
                syncError:
                  'Unable to save evidence. Your changes have not been synchronized.',
              })
            }
          })()
          return
        }

        apply()
      },

      updateNodePosition: (nodeId, x, y) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) => {
            let next = schema.moveNode(b, nodeId, x, y)
            if ((b.layout ?? DEFAULT_BOARD_LAYOUT) === 'freeform') {
              next = schema.snapshotFreeformPositions(next)
            }
            return next
          }),
        }))
        schedulePersist(get, set, activeBoardId)
      },

      addScreenshots: (nodeId, screenshots) => {
        const board = get().boards.find((b) => b.id === get().activeBoardId)
        const node = board?.nodes.find((n) => n.id === nodeId)
        if (!node) return
        get().updateNode(nodeId, {
          screenshots: [...node.screenshots, ...screenshots],
        })
      },

      removeScreenshotAt: (nodeId, index) => {
        const board = get().boards.find((b) => b.id === get().activeBoardId)
        const node = board?.nodes.find((n) => n.id === nodeId)
        if (!node) return
        get().updateNode(nodeId, {
          screenshots: node.screenshots.filter((_, i) => i !== index),
        })
      },

      addConnection: (source, target) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.addConnection(b, source, target),
          ),
        }))
        schedulePersist(get, set, activeBoardId)
      },

      removeConnection: (connectionId) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.removeConnection(b, connectionId),
          ),
        }))
        schedulePersist(get, set, activeBoardId)
      },

      setBoardColor: (boardId, color) => {
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) =>
            schema.setBoardColor(b, color),
          ),
        }))
        schedulePersist(get, set, boardId)
      },

      deleteNode: (nodeId) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.deleteNode(b, nodeId),
          ),
        }))
        schedulePersist(get, set, activeBoardId)
      },

      importBoard: (rawBoard) => {
        const board = schema.normalizeImportedBoard(rawBoard)
        const layout = normalizeBoardLayout(board.layout)
        const laid =
          layout === 'freeform' || layout === 'nested-tree'
            ? board
            : isGraphLayout(layout)
              ? layoutBoard(board, layout)
              : board
        const file = uniqueFilename(laid.name, get().boardFiles)
        const mode = get().persistenceMode

        const finish = () => {
          set((state) => {
            const prevUi = boardUi(state, laid.id)
            return {
              boards: [
                ...state.boards.filter((b) => b.id !== laid.id),
                laid,
              ],
              activeBoardId: laid.id,
              selection: { kind: 'board', boardId: laid.id },
              boardFiles: { ...state.boardFiles, [laid.id]: file },
              workspaceTree: registerBoardInWorkspace(state.workspaceTree, laid),
              layoutFitTick: Date.now(),
              syncStatus: 'saved',
              boardUiState: {
                ...(state.boardUiState ?? {}),
                [laid.id]: {
                  ...prevUi,
                  viewMode: 'table',
                  detailPanel: null,
                },
              },
            }
          })
        }

        if (mode === 'supabase') {
          void upsertFullBoardToSupabase(laid)
            .then(finish)
            .catch(() => {
              set({
                syncStatus: 'error',
                syncError: 'Import failed — board was not saved to the server.',
              })
            })
          return
        }
        if (mode === 'file') {
          void createBoardFile(laid, file).then(finish)
          return
        }
        finish()
      },

      importMarkdownFile: async (file) => {
        const text = await file.text()
        const doc: WorkspaceDocument = {
          id: createId('doc'),
          type: 'markdown',
          name: file.name,
          content: text,
        }
        set((state) => ({
          workspaceDocuments: { ...state.workspaceDocuments, [doc.id]: doc },
          workspaceTree: insertNode(
            state.workspaceTree,
            null,
            createDocumentRefNode(doc),
          ),
          selection: { kind: 'markdown', documentId: doc.id },
          activeBoardId: null,
        }))
      },

      importPdfFile: async (file) => {
        const buffer = await file.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            '',
          ),
        )
        const doc: WorkspaceDocument = {
          id: createId('doc'),
          type: 'pdf',
          name: file.name,
          content: `data:application/pdf;base64,${base64}`,
        }
        set((state) => ({
          workspaceDocuments: { ...state.workspaceDocuments, [doc.id]: doc },
          workspaceTree: insertNode(
            state.workspaceTree,
            null,
            createDocumentRefNode(doc),
          ),
          selection: { kind: 'pdf', documentId: doc.id },
          activeBoardId: null,
        }))
      },

      updateMarkdownDocument: (documentId, content) => {
        set((state) => {
          const doc = state.workspaceDocuments[documentId]
          if (!doc || doc.type !== 'markdown') return state
          return {
            workspaceDocuments: {
              ...state.workspaceDocuments,
              [documentId]: { ...doc, content },
            },
          }
        })
      },

      replaceActiveBoard: (rawBoard) => {
        get().importBoard(rawBoard)
      },

      toggleTreeNodeCollapsed: (boardId, nodeId) => {
        set((state) => {
          const ui = boardUi(state, boardId)
          const next = new Set(ui.collapsedNodeIds)
          if (next.has(nodeId)) next.delete(nodeId)
          else next.add(nodeId)
          return {
            boardUiState: {
              ...(state.boardUiState ?? {}),
              [boardId]: { ...ui, collapsedNodeIds: [...next] },
            },
          }
        })
      },

      setTreeSelectedNode: (boardId, nodeId) => {
        set((state) => {
          const ui = boardUi(state, boardId)
          return {
            boardUiState: {
              ...(state.boardUiState ?? {}),
              [boardId]: { ...ui, selectedNodeId: nodeId },
            },
          }
        })
      },

      moveHierarchyNode: (boardId, nodeId, newParentId, beforeNodeId) => {
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) =>
            moveNodeInHierarchy(b, nodeId, newParentId, beforeNodeId),
          ),
        }))
        schedulePersist(get, set, boardId)
      },

      setBoardViewMode: (boardId, viewMode) => {
        set((state) => {
          const ui = boardUi(state, boardId)
          return {
            boardUiState: {
              ...(state.boardUiState ?? {}),
              [boardId]: { ...ui, viewMode },
            },
          }
        })
      },

      setBoardDetailPanel: (boardId, panel) => {
        set((state) => {
          const ui = boardUi(state, boardId)
          return {
            boardUiState: {
              ...(state.boardUiState ?? {}),
              [boardId]: { ...ui, detailPanel: panel },
            },
          }
        })
      },

      updateNodeResearch: (nodeId, fields) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.updateNodeResearch(b, nodeId, fields),
          ),
        }))
        schedulePersist(get, set, activeBoardId)
      },

      addResearchColumn: (boardId, label) => {
        const trimmed = label.trim()
        if (!trimmed) return
        const col = { id: createId('col'), label: trimmed }
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) => ({
            ...b,
            researchColumns: [...(b.researchColumns ?? []), col],
          })),
        }))
        schedulePersist(get, set, boardId)
      },

      setColumnWidth: (boardId, columnId, width) => {
        set((state) => {
          const ui = boardUi(state, boardId)
          return {
            boardUiState: {
              ...(state.boardUiState ?? {}),
              [boardId]: {
                ...ui,
                columnWidths: {
                  ...(ui.columnWidths ?? {}),
                  [columnId]: width,
                },
              },
            },
          }
        })
      },

      syncToSupabase: async () => {
        if (get().persistenceMode !== 'supabase') return
        set({ syncStatus: 'saving', syncError: null })
        try {
          for (const board of get().boards) {
            await upsertFullBoardToSupabase(board)
          }
          set({ syncStatus: 'saved', syncError: null })
        } catch {
          set({
            syncStatus: 'error',
            syncError: 'Sync to Supabase failed.',
          })
        }
      },
    }),
    {
      name: 'schema-mapper-data-v2',
      merge: (persisted, current) => {
        const p = persisted as Partial<AppData> | undefined
        return {
          ...current,
          ...p,
          boards: p?.boards ?? current.boards,
          boardFiles: p?.boardFiles ?? current.boardFiles,
          workspaceTree: p?.workspaceTree ?? current.workspaceTree,
          workspaceDocuments: p?.workspaceDocuments ?? current.workspaceDocuments,
          boardUiState: p?.boardUiState ?? current.boardUiState ?? {},
          selection: p?.selection ?? current.selection,
          activeBoardId: p?.activeBoardId ?? current.activeBoardId,
          hydrated: false,
        }
      },
      partialize: (state) => ({
        boards: state.boards,
        boardFiles: state.boardFiles,
        workspaceTree: state.workspaceTree,
        workspaceDocuments: state.workspaceDocuments,
        selection: state.selection,
        activeBoardId: state.activeBoardId,
        boardUiState: state.boardUiState ?? {},
      }),
    },
  ),
)

function mapBoardNames(
  nodes: WorkspaceTreeNode[],
  boardId: string,
  name: string,
): WorkspaceTreeNode[] {
  return nodes.map((n) => {
    const next =
      n.type === 'board' && n.boardId === boardId ? { ...n, name } : n
    if (next.children) {
      return { ...next, children: mapBoardNames(next.children, boardId, name) }
    }
    return next
  })
}

function findInTree(
  nodes: WorkspaceTreeNode[],
  id: string,
): WorkspaceTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findInTree(n.children, id)
      if (found) return found
    }
  }
  return null
}

export function getDeleteNodeMessage(nodes: SchemaNode[], nodeId: string): string {
  const count = countDescendants(nodes, nodeId)
  if (count === 0) {
    return 'Delete this node?'
  }
  return `This node has ${count} child node${count === 1 ? '' : 's'}. Delete this node and its children?`
}
