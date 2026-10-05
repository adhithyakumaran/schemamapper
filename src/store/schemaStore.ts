import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createKatalonExampleBoard } from '../data/sampleBoard'
import { countDescendants } from '../lib/tree'
import {
  createBoardFile,
  deleteBoardFile,
  loadBoardsFromFiles,
  saveBoardToFile,
} from '../services/persistence'
import * as schema from '../services/schemaService'
import type { AppData, Board, DialogState, SchemaNode } from '../types/schema'

export type EdgeMenuState = {
  connectionId: string
  x: number
  y: number
} | null

interface SchemaStore extends AppData {
  hydrated: boolean
  filePersistence: boolean
  dialog: DialogState
  edgeMenu: EdgeMenuState
  setDialog: (dialog: DialogState) => void
  setEdgeMenu: (menu: EdgeMenuState) => void
  hydrateFromProjectFiles: () => Promise<void>
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

const sample = createKatalonExampleBoard()
const sampleFile = 'katalon-example.json'

let persistTimer: ReturnType<typeof setTimeout> | null = null

function schedulePersistBoard(
  board: Board,
  file: string | undefined,
  filePersistence: boolean,
) {
  if (!filePersistence || !file) return
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    void saveBoardToFile(board, file)
  }, 400)
}

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

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set, get) => ({
      boards: [sample],
      activeBoardId: sample.id,
      boardFiles: { [sample.id]: sampleFile },
      hydrated: false,
      filePersistence: false,
      dialog: null,
      edgeMenu: null,

      setDialog: (dialog) => set({ dialog }),
      setEdgeMenu: (edgeMenu) => set({ edgeMenu }),

      hydrateFromProjectFiles: async () => {
        const loaded = await loadBoardsFromFiles()
        if (loaded && loaded.boards.length > 0) {
          set({
            boards: loaded.boards,
            boardFiles: loaded.boardFiles,
            activeBoardId:
              get().activeBoardId &&
              loaded.boards.some((b) => b.id === get().activeBoardId)
                ? get().activeBoardId
                : loaded.boards[0].id,
            hydrated: true,
            filePersistence: true,
          })
          return
        }
        set({ hydrated: true, filePersistence: false })
      },

      createBoard: (name) => {
        const board = schema.createBoard(name)
        const file = uniqueFilename(board.name, get().boardFiles)
        set((state) => ({
          boards: [...state.boards, board],
          activeBoardId: board.id,
          boardFiles: { ...state.boardFiles, [board.id]: file },
        }))
        if (get().filePersistence) {
          void createBoardFile(board, file)
        }
      },

      renameBoard: (boardId, name) => {
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) =>
            schema.renameBoard(b, name),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === boardId)
        if (board) schedulePersistBoard(board, boardFiles[boardId], filePersistence)
      },

      deleteBoard: (boardId) => {
        const file = get().boardFiles[boardId]
        const filePersistence = get().filePersistence
        set((state) => {
          const boards = state.boards.filter((b) => b.id !== boardId)
          const { [boardId]: _, ...boardFiles } = state.boardFiles
          let activeBoardId = state.activeBoardId
          if (activeBoardId === boardId) {
            activeBoardId = boards[0]?.id ?? null
          }
          return { boards, activeBoardId, boardFiles }
        })
        if (filePersistence && file) void deleteBoardFile(file)
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
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === activeBoardId)
        if (board) schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },

      updateNode: (nodeId, patch) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.updateNode(b, nodeId, patch),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === activeBoardId)
        if (board) schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },

      updateNodePosition: (nodeId, x, y) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.moveNode(b, nodeId, x, y),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === activeBoardId)
        if (board) schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },

      addScreenshots: (nodeId, screenshots) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.addScreenshots(b, nodeId, screenshots),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === activeBoardId)
        if (board) schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },

      removeScreenshotAt: (nodeId, index) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.removeScreenshotAt(b, nodeId, index),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === activeBoardId)
        if (board) schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },

      addConnection: (source, target) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.addConnection(b, source, target),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === activeBoardId)
        if (board) schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },

      removeConnection: (connectionId) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.removeConnection(b, connectionId),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === activeBoardId)
        if (board) schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },

      setBoardColor: (boardId, color) => {
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, boardId, (b) =>
            schema.setBoardColor(b, color),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === boardId)
        if (board) schedulePersistBoard(board, boardFiles[boardId], filePersistence)
      },

      deleteNode: (nodeId) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, (b) =>
            schema.deleteNode(b, nodeId),
          ),
        }))
        const { boards, boardFiles, filePersistence } = get()
        const board = boards.find((b) => b.id === activeBoardId)
        if (board) schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },

      importBoard: (rawBoard) => {
        const board = schema.normalizeImportedBoard(rawBoard)
        const file = uniqueFilename(board.name, get().boardFiles)
        set((state) => ({
          boards: [...state.boards, board],
          activeBoardId: board.id,
          boardFiles: { ...state.boardFiles, [board.id]: file },
        }))
        if (get().filePersistence) void createBoardFile(board, file)
      },

      replaceActiveBoard: (rawBoard) => {
        const normalized = schema.normalizeImportedBoard(rawBoard)
        const { activeBoardId } = get()
        if (!activeBoardId) {
          get().importBoard(normalized)
          return
        }
        const board = { ...normalized, id: activeBoardId }
        set((state) => ({
          boards: schema.updateBoardInList(state.boards, activeBoardId, () => board),
        }))
        const { boardFiles, filePersistence } = get()
        schedulePersistBoard(board, boardFiles[activeBoardId], filePersistence)
      },
    }),
    {
      name: 'schema-mapper-v3',
      partialize: (state) => ({
        boards: state.boards,
        activeBoardId: state.activeBoardId,
        boardFiles: state.boardFiles,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppData> | undefined
        return {
          ...current,
          ...p,
          boards: (p?.boards?.length ? p.boards : current.boards).map((b) =>
            schema.normalizeImportedBoard(b),
          ),
          boardFiles: p?.boardFiles ?? current.boardFiles,
          hydrated: false,
        }
      },
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
