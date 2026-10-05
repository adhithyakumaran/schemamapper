import katalonSeed from '../../data/boards/katalon-example.json'
import { boardNeedsInitialLayout, layoutBoard } from '../lib/layouts'
import { DEFAULT_BOARD_LAYOUT } from '../types/layout'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Board } from '../types/schema'
import { createKatalonExampleBoard } from '../data/sampleBoard'
import { loadBoardsFromFiles } from './persistence'
import { normalizeImportedBoard } from './schemaService'
import {
  loadAllBoardsFromSupabase,
  upsertFullBoardToSupabase,
} from './supabaseBoardService'

export type PersistenceMode = 'local' | 'file' | 'supabase'

export function resolvePersistenceMode(): PersistenceMode {
  if (
    import.meta.env.VITE_USE_SUPABASE === 'true' &&
    isSupabaseConfigured()
  ) {
    return 'supabase'
  }
  if (import.meta.env.DEV) return 'file'
  return 'local'
}

export async function loadSeedBoards(): Promise<Board[]> {
  try {
    const res = await fetch('/data/boards/katalon-example.json')
    if (res.ok) {
      return [normalizeImportedBoard(await res.json())]
    }
  } catch {
    /* ignore */
  }
  try {
    return [normalizeImportedBoard(katalonSeed)]
  } catch {
    return [createKatalonExampleBoard()]
  }
}

function applyInitialLayoutIfNeeded(boards: Board[]): Board[] {
  return boards.map((b) => {
    if (!boardNeedsInitialLayout(b)) return b
    const layout = b.layout ?? DEFAULT_BOARD_LAYOUT
    if (layout === 'freeform') return b
    return layoutBoard(b, layout)
  })
}

export async function loadBoardsFromServer(
  existingBoards: Board[],
): Promise<{
  boards: Board[]
  boardFiles: Record<string, string>
  mode: PersistenceMode
}> {
  const mode = resolvePersistenceMode()

  if (existingBoards.length > 0) {
    return { boards: existingBoards, boardFiles: {}, mode }
  }

  if (mode === 'supabase') {
    let boards = await loadAllBoardsFromSupabase()
    if (boards.length === 0) {
      const seed = normalizeImportedBoard(katalonSeed)
      await upsertFullBoardToSupabase(seed)
      boards = await loadAllBoardsFromSupabase()
    }
    const boardFiles: Record<string, string> = {}
    if (boards.some((b) => b.id === 'board-katalon-example')) {
      boardFiles['board-katalon-example'] = 'katalon-example.json'
    }
    return {
      boards: applyInitialLayoutIfNeeded(boards),
      boardFiles,
      mode,
    }
  }

  if (mode === 'file') {
    const loaded = await loadBoardsFromFiles()
    if (loaded && loaded.boards.length > 0) {
      return {
        boards: applyInitialLayoutIfNeeded(loaded.boards),
        boardFiles: loaded.boardFiles,
        mode,
      }
    }
    const seed = await loadSeedBoards()
    return {
      boards: applyInitialLayoutIfNeeded(seed),
      boardFiles: { [seed[0].id]: 'katalon-example.json' },
      mode,
    }
  }

  const seed = await loadSeedBoards()
  return {
    boards: applyInitialLayoutIfNeeded(seed),
    boardFiles: { [seed[0].id]: 'katalon-example.json' },
    mode: 'local',
  }
}
