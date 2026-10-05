import katalonSeed from '../../data/boards/katalon-example.json'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Board } from '../types/schema'
import { loadBoardsFromFiles } from './persistence'
import { normalizeImportedBoard } from './schemaService'
import {
  loadAllBoardsFromSupabase,
  upsertFullBoardToSupabase,
} from './supabaseBoardService'

export type PersistenceMode = 'supabase' | 'file' | 'offline'

export function resolvePersistenceMode(): PersistenceMode {
  if (isSupabaseConfigured()) return 'supabase'
  if (import.meta.env.DEV) return 'file'
  return 'offline'
}

export async function loadBoardsFromServer(): Promise<{
  boards: Board[]
  boardFiles: Record<string, string>
  mode: PersistenceMode
}> {
  const mode = resolvePersistenceMode()

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
    return { boards, boardFiles, mode }
  }

  if (mode === 'file') {
    const loaded = await loadBoardsFromFiles()
    if (loaded && loaded.boards.length > 0) {
      return { ...loaded, mode }
    }
    const seed = normalizeImportedBoard(katalonSeed)
    return {
      boards: [seed],
      boardFiles: { [seed.id]: 'katalon-example.json' },
      mode,
    }
  }

  const seed = normalizeImportedBoard(katalonSeed)
  return {
    boards: [seed],
    boardFiles: { [seed.id]: 'katalon-example.json' },
    mode,
  }
}
