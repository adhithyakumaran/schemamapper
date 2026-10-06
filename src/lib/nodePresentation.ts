/** Presentation-only icons (not stored in JSON names). */
const NODE_ICONS: Record<string, string> = {
  'Menu Bar': '📋',
  New: '📁',
  Spy: '🔍',
  Record: '🎥',
  Run: '▶️',
  Debug: '🐞',
  Tools: '⚙️',
}

export function nodeDisplayIcon(name: string): string | null {
  return NODE_ICONS[name] ?? null
}
