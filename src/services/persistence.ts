import type { Board, BoardRegistry } from '../types/schema'
import { boardToDocument, normalizeImportedBoard } from './schemaService'

const API_BASE = '/api/schema'

export async function loadBoardsFromFiles(): Promise<{
  boards: Board[]
  boardFiles: Record<string, string>
} | null> {
  try {
    const res = await fetch(`${API_BASE}/boards`)
    if (!res.ok) return null
    const data = (await res.json()) as {
      boards: unknown[]
      boardFiles: Record<string, string>
    }
    const boards = data.boards.map((b) => normalizeImportedBoard(b))
    return { boards, boardFiles: data.boardFiles ?? {} }
  } catch {
    return null
  }
}

export async function saveBoardToFile(
  board: Board,
  file: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/boards/${encodeURIComponent(file)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boardToDocument(board), null, 2),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function deleteBoardFile(file: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/boards/${encodeURIComponent(file)}`,
      { method: 'DELETE' },
    )
    return res.ok
  } catch {
    return false
  }
}

export async function createBoardFile(
  board: Board,
  file: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, board: boardToDocument(board) }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchRegistry(): Promise<BoardRegistry | null> {
  try {
    const res = await fetch(`${API_BASE}/registry`)
    if (!res.ok) return null
    return (await res.json()) as BoardRegistry
  } catch {
    return null
  }
}
