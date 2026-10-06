import { useMemo, useState } from 'react'
import { filterBoardNodesFromTree } from '../../lib/workspaceDisplay'
import { EMPTY_WORKSPACE_TREE } from '../../store/stableDefaults'
import { useSchemaStore } from '../../store/schemaStore'

export function WorkspaceSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const tree = useSchemaStore((s) => s.workspaceTree ?? EMPTY_WORKSPACE_TREE)
  const docs = useSchemaStore((s) => s.workspaceDocuments)
  const openDoc = useSchemaStore((s) => s.openWorkspaceDocument)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const items: {
      id: string
      name: string
      kind: 'markdown' | 'pdf' | 'folder'
      documentId?: string
    }[] = []
    const walk = (nodes: ReturnType<typeof filterBoardNodesFromTree>) => {
      for (const n of nodes) {
        if (n.type === 'folder') {
          if (n.name.toLowerCase().includes(q)) {
            items.push({ id: n.id, name: n.name, kind: 'folder' })
          }
          if (n.children) walk(n.children)
        } else if (
          (n.type === 'markdown' || n.type === 'pdf') &&
          n.documentId
        ) {
          const doc = docs[n.documentId]
          const textMatch = doc?.content?.toLowerCase().includes(q)
          if (n.name.toLowerCase().includes(q) || textMatch) {
            items.push({
              id: n.id,
              name: n.name,
              kind: n.type,
              documentId: n.documentId,
            })
          }
        }
      }
    }
    walk(filterBoardNodesFromTree(tree))
    return items.slice(0, 12)
  }, [docs, query, tree])

  return (
    <div className="relative">
      <input
        type="search"
        className="workspace-search themed-input w-44 rounded-md px-2 py-1 text-xs md:w-52"
        placeholder="Search workspace…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && query.trim() && results.length > 0 ? (
        <div className="themed-menu absolute right-0 top-full z-40 mt-1 max-h-64 w-64 overflow-y-auto rounded-md border py-1 shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="themed-menu-item block w-full truncate px-3 py-1.5 text-left text-xs"
              onMouseDown={() => {
                if (r.documentId && r.kind !== 'folder') {
                  openDoc(r.documentId, r.kind)
                }
                setOpen(false)
                setQuery('')
              }}
            >
              {r.kind === 'folder' ? '📁 ' : r.kind === 'pdf' ? '📕 ' : '📄 '}
              {r.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
