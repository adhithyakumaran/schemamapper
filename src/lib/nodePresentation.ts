import type { WorkspaceTreeNode } from '../types/workspace'

/** Major schema nodes only — presentation layer (never written to JSON). */
const SCHEMA_CATEGORY_ICONS: Record<string, string> = {
  'Menu Bar': '📋',
  Spy: '🔍',
  Record: '🎥',
  Run: '▶️',
  Debug: '🐞',
  Tools: '⚙️',
}

export function nodeDisplayIcon(name: string): string | null {
  return SCHEMA_CATEGORY_ICONS[name] ?? null
}

/** Sidebar column glyph (boards only; documents use inline label prefix). */
export function workspaceLeadingGlyph(
  node: WorkspaceTreeNode,
): string | null {
  if (node.type === 'board') return '◇'
  return null
}

export function workspaceItemLabel(node: WorkspaceTreeNode): string {
  switch (node.type) {
    case 'markdown':
      return `📄 ${node.name}`
    case 'pdf':
      return `📕 ${node.name}`
    default:
      return node.name
  }
}
