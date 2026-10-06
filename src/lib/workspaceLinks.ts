import type { WorkspaceDocument } from '../types/workspace'

export const WORKSPACE_LINK_PREFIX = 'workspace://document/'

export function workspaceDocumentHref(documentId: string): string {
  return `${WORKSPACE_LINK_PREFIX}${documentId}`
}

export function parseWorkspaceDocumentHref(
  href: string,
): string | null {
  if (!href.startsWith(WORKSPACE_LINK_PREFIX)) return null
  return href.slice(WORKSPACE_LINK_PREFIX.length) || null
}

export function wikiLinkPattern(name: string): string {
  return `[[${name.replace(/\]/g, '')}]]`
}

export function resolveDocumentIdByTitle(
  title: string,
  documents: Record<string, WorkspaceDocument>,
): string | null {
  const trimmed = title.trim()
  const exact = Object.values(documents).find(
    (d) => d.name === trimmed || d.name === `${trimmed}.md`,
  )
  if (exact) return exact.id
  const lower = trimmed.toLowerCase()
  const loose = Object.values(documents).find(
    (d) =>
      d.name.toLowerCase() === lower ||
      d.name.toLowerCase() === `${lower}.md`,
  )
  return loose?.id ?? null
}
