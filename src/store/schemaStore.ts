import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { countDescendants } from '../lib/tree'
import { loadBoardsFromServer, type PersistenceMode } from '../services/boardLoader'
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
import type { AppData, Board, DialogState, SchemaNode } from '../types/schema'
import { createKatalonExampleBoard } from '../data/sampleBoard'

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
  dialog: DialogState
  edgeMenu: EdgeMenuState
  setDialog: (dialog: DialogState) => void
  setEdgeMenu: (menu: EdgeMenuState) => void
  hydrateFromServer: () => Promise<void>
  reloadFromServer: () => Promise<void>
  createBoard: (name: string) => void
  renameBoard: (boardId: string, name: string) => void
  deleteBoard: (boardId: string) => void
  setActiveBoard: (boardId: string) => void
  addNode: (
    name: string,
    parentId: string | null,
    position?: { x: number; y: number },
  ) => void
  updateNode: (
    nodeId: string,
    patch: Partial<
      Pick<SchemaNode, 'name' | 'note' | 'screenshots' | 'parentId'>
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
  replaceActiveBoard: (board: Board) => void
}

const fallbackSample = createKatalonExampleBoard()

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

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoardId: null,
      boardFiles: {},
      hydrated: false,
      persistenceMode: 'offline',
      syncStatus: 'idle',
      syncError: null,
      dialog: null,
      edgeMenu: null,

      setDialog: (dialog) => set({ dialog }),
      setEdgeMenu: (edgeMenu) => set({ edgeMenu }),

      hydrateFromServer: async () => {
        try {
          const { boards, boardFiles, mode } = await loadBoardsFromServer()
          const active =
            get().activeBoardId &&
            boards.some((b) => b.id === get().activeBoardId)
              ? get().activeBoardId
              : boards[0]?.id ?? null
          set({
            boards,
            boardFiles,
            activeBoardId: active,
            persistenceMode: mode,
            hydrated: true,
            syncError: null,
          })
        } catch {
          set({
            boards: [fallbackSample],
            activeBoardId: fallbackSample.id,
            boardFiles: { [fallbackSample.id]: 'katalon-example.json' },
            persistenceMode: 'offline',
            hydrated: true,
            syncError:
              'Unable to load boards from server. Showing local fallback only.',
          })
        }
      },

      reloadFromServer: async () => {
        set({ syncStatus: 'saving', syncError: null })
        try {
          const { boards, boardFiles, mode } = await loadBoardsFromServer()
          const active =
            get().activeBoardId &&
            boards.some((b) => b.id === get().activeBoardId)
              ? get().activeBoardId
              : boards[0]?.id ?? null
          set({
            boards,
            boardFiles,
            activeBoardId: active,
            persistenceMode: mode,
            syncStatus: 'saved',
            syncError: null,
          })
        } catch {
          set({
            syncStatus: 'error',
            syncError: 'Unable to reload from server.',
          })
        }
      },

      createBoard: (name) => {
        const board = schema.createBoard(name)
        const file = uniqueFilename(board.name, get().boardFiles)
        set((state) => ({
          boards: [...state.boards, board],
          activeBoardId: board.id,
          boardFiles: { ...state.boardFiles, [board.id]: file },
        }))
        const mode = get().persistenceMode
        if (mode === 'supabase') {
          void upsertFullBoardToSupabase(board).catch(() => {
            set({
              syncError:
                'Unable to save changes. Your changes have not been synchronized.',
            })
          })
        } else if (mode === 'file') {
          void createBoardFile(board, file)
        }
      },

      renameBoard: (boardId, name) => {
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) =>
            schema.renameBoard(b, name),
          ),
        }))
        schedulePersist(get, set, boardId)
      },

      deleteBoard: (boardId) => {
        const file = get().boardFiles[boardId]
        const mode = get().persistenceMode
        set((state) => {
          const boards = state.boards.filter((b) => b.id !== boardId)
          const { [boardId]: _, ...boardFiles } = state.boardFiles
          let activeBoardId = state.activeBoardId
          if (activeBoardId === boardId) {
            activeBoardId = boards[0]?.id ?? null
          }
          return { boards, activeBoardId, boardFiles }
        })
        if (mode === 'supabase') {
          void deleteBoardFromSupabase(boardId).catch(() => {
            set({
              syncError:
                'Unable to save changes. Your changes have not been synchronized.',
            })
          })
        } else if (mode === 'file' && file) {
          void deleteBoardFile(file)
        }
      },

      setActiveBoard: (boardId) => set({ activeBoardId: boardId }),

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
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.moveNode(b, nodeId, x, y),
          ),
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
        const file = uniqueFilename(board.name, get().boardFiles)
        const mode = get().persistenceMode
        void (async () => {
          set({ syncStatus: 'saving', syncError: null })
          try {
            if (mode === 'supabase') {
              await upsertFullBoardToSupabase(board)
            } else if (mode === 'file') {
              await createBoardFile(board, file)
            }
            set((state) => ({
              boards: [...state.boards.filter((b) => b.id !== board.id), board],
              activeBoardId: board.id,
              boardFiles: { ...state.boardFiles, [board.id]: file },
              syncStatus: 'saved',
            }))
          } catch {
            set({
              syncStatus: 'error',
              syncError: 'Import failed — board was not saved to the server.',
            })
          }
        })()
      },

      replaceActiveBoard: (rawBoard) => {
        const normalized = schema.normalizeImportedBoard(rawBoard)
        const { activeBoardId, persistenceMode } = get()
        if (!activeBoardId) {
          get().importBoard(normalized)
          return
        }
        const board = { ...normalized, id: activeBoardId }
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, () => board),
        }))
        void (async () => {
          set({ syncStatus: 'saving', syncError: null })
          try {
            if (persistenceMode === 'supabase') {
              await upsertFullBoardToSupabase(board)
            } else if (persistenceMode === 'file') {
              const file = get().boardFiles[activeBoardId]
              if (file) await saveBoardToFile(board, file)
            }
            set({ syncStatus: 'saved' })
          } catch {
            set({
              syncStatus: 'error',
              syncError: 'Import failed — board was not saved to the server.',
            })
          }
        })()
      },
    }),
    {
      name: 'schema-mapper-ui-v1',
      partialize: (state) => ({
        activeBoardId: state.activeBoardId,
      }),
      merge: (persisted, current) => ({
        ...current,
        activeBoardId:
          (persisted as { activeBoardId?: string | null })?.activeBoardId ??
          current.activeBoardId,
        boards: [],
        hydrated: false,
      }),
    },
  ),
)

export function getDeleteNodeMessage(nodes: SchemaNode[], nodeId: string): string {
  const count = countDescendants(nodes, nodeId)
  if (count === 0) {
    return 'Delete this node?'
  }
  return `This node has ${count} child node${count === 1 ? '' : 's'}. Delete this node and its children?`
}
