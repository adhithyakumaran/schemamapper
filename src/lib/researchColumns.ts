import type { Board, ResearchColumnDef } from '../types/schema'

export const BUILTIN_RESEARCH_KEYS = [
  'type',
  'source',
  'engine',
  'platform',
  'status',
] as const

export type BuiltinResearchKey = (typeof BUILTIN_RESEARCH_KEYS)[number]

export const DEFAULT_RESEARCH_COLUMNS: ResearchColumnDef[] = [
  { id: 'type', label: 'Type', builtIn: true },
  { id: 'source', label: 'Source', builtIn: true },
  { id: 'engine', label: 'Engine', builtIn: true },
  { id: 'platform', label: 'Platform', builtIn: true },
  { id: 'status', label: 'Status', builtIn: true },
]

export function researchColumnsForBoard(board: Board): ResearchColumnDef[] {
  const custom = board.researchColumns ?? []
  const ids = new Set(DEFAULT_RESEARCH_COLUMNS.map((c) => c.id))
  const merged = [...DEFAULT_RESEARCH_COLUMNS]
  for (const col of custom) {
    if (ids.has(col.id)) continue
    merged.push(col)
  }
  return merged
}

export function researchField(
  node: { research?: Record<string, string> },
  key: string,
): string {
  return node.research?.[key] ?? ''
}
