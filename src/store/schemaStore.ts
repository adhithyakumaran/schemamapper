import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createKatalonExampleBoard } from '../data/sampleBoard'
import { createId } from '../lib/ids'
import {
  countDescendants,
  getDescendantIds,
  syncEdgesFromParents,
} from '../lib/tree'
import type {
  AppData,
  Board,
  DialogState,
  SchemaNode,
} from '../types/schema'

interface SchemaStore extends AppData {
  dialog: DialogState
  setDialog: (dialog: DialogState) => void
  createBoard: (name: string) => void
  renameBoard: (boardId: string, name: string) => void
  deleteBoard: (boardId: string) => void
  setActiveBoard: (boardId: string) => void
  getActiveBoard: () => Board | null
  addNode: (
    name: string,
    parentId: string | null,
    position?: { x: number; y: number },
  ) => void
  updateNode: (
    nodeId: string,
    patch: Partial<Pick<SchemaNode, 'name' | 'note' | 'image' | 'parentId'>>,
  ) => void
  updateNodePosition: (nodeId: string, x: number, y: number) => void
  deleteNode: (nodeId: string) => void
  importBoard: (board: Board) => void
  replaceActiveBoard: (board: Board) => void
}

function withSyncedEdges(board: Board): Board {
  return {
    ...board,
    edges: syncEdgesFromParents(board.nodes),
  }
}

function updateBoard(
  boards: Board[],
  boardId: string,
  updater: (board: Board) => Board,
): Board[] {
  return boards.map((b) => (b.id === boardId ? updater(b) : b))
}

const sample = createKatalonExampleBoard()

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set, get) => ({
      boards: [sample],
      activeBoardId: sample.id,
      dialog: null,

      setDialog: (dialog) => set({ dialog }),

      createBoard: (name) => {
        const board: Board = {
          id: createId('board'),
          name: name.trim() || 'Untitled Board',
          nodes: [],
          edges: [],
        }
        set((state) => ({
          boards: [...state.boards, board],
          activeBoardId: board.id,
        }))
      },

      renameBoard: (boardId, name) => {
        set((state) => ({
          boards: updateBoard(state.boards, boardId, (b) => ({
            ...b,
            name: name.trim() || b.name,
          })),
        }))
      },

      deleteBoard: (boardId) => {
        set((state) => {
          const boards = state.boards.filter((b) => b.id !== boardId)
          let activeBoardId = state.activeBoardId
          if (activeBoardId === boardId) {
            activeBoardId = boards[0]?.id ?? null
          }
          return { boards, activeBoardId }
        })
      },

      setActiveBoard: (boardId) => set({ activeBoardId: boardId }),

      getActiveBoard: () => {
        const { boards, activeBoardId } = get()
        if (!activeBoardId) return null
        return boards.find((b) => b.id === activeBoardId) ?? null
      },

      addNode: (name, parentId, position) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return

        const trimmed = name.trim()
        if (!trimmed) return

        set((state) => ({
          boards: updateBoard(state.boards, activeBoardId, (board) => {
            let x = 120
            let y = 120
            if (parentId) {
              const parent = board.nodes.find((n) => n.id === parentId)
              if (parent) {
                const siblings = board.nodes.filter(
                  (n) => n.parentId === parentId,
                )
                x = parent.position.x + siblings.length * 40
                y = parent.position.y + 140
              }
            } else if (position) {
              x = position.x
              y = position.y
            }

            const newNode: SchemaNode = {
              id: createId('node'),
              name: trimmed,
              parentId,
              position: { x, y },
              note: '',
              image: null,
            }

            const nodes = [...board.nodes, newNode]
            return withSyncedEdges({ ...board, nodes })
          }),
        }))
      },

      updateNode: (nodeId, patch) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: updateBoard(state.boards, activeBoardId, (board) => {
            if (patch.parentId !== undefined) {
              const invalid =
                patch.parentId === nodeId ||
                (patch.parentId !== null &&
                  getDescendantIds(board.nodes, nodeId).includes(
                    patch.parentId,
                  ))
              if (invalid) return board
            }
            const nodes = board.nodes.map((n) =>
              n.id === nodeId ? { ...n, ...patch } : n,
            )
            const next = { ...board, nodes }
            return patch.parentId !== undefined
              ? withSyncedEdges(next)
              : next
          }),
        }))
      },

      updateNodePosition: (nodeId, x, y) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: updateBoard(state.boards, activeBoardId, (board) => ({
            ...board,
            nodes: board.nodes.map((n) =>
              n.id === nodeId ? { ...n, position: { x, y } } : n,
            ),
          })),
        }))
      },

      deleteNode: (nodeId) => {
        const { activeBoardId } = get()
        if (!activeBoardId) return
        set((state) => ({
          boards: updateBoard(state.boards, activeBoardId, (board) => {
            const toRemove = new Set([nodeId, ...getDescendantIds(board.nodes, nodeId)])
            const nodes = board.nodes.filter((n) => !toRemove.has(n.id))
            return withSyncedEdges({ ...board, nodes })
          }),
        }))
      },

      importBoard: (board) => {
        const normalized = withSyncedEdges({
          ...board,
          id: board.id || createId('board'),
        })
        set((state) => ({
          boards: [...state.boards, normalized],
          activeBoardId: normalized.id,
        }))
      },

      replaceActiveBoard: (board) => {
        const { activeBoardId } = get()
        if (!activeBoardId) {
          get().importBoard(board)
          return
        }
        const normalized = withSyncedEdges(board)
        set((state) => ({
          boards: updateBoard(state.boards, activeBoardId, () => ({
            ...normalized,
            id: activeBoardId,
          })),
        }))
      },
    }),
    {
      name: 'schema-mapper-v1',
      partialize: (state) => ({
        boards: state.boards,
        activeBoardId: state.activeBoardId,
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
