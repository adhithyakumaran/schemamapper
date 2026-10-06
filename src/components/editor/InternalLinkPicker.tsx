import { useEffect, useMemo, useRef, useState } from 'react'
import { filterBoardNodesFromTree } from '../../lib/workspaceDisplay'
import { EMPTY_WORKSPACE_TREE } from '../../store/stableDefaults'
import { useSchemaStore } from '../../store/schemaStore'
import { Modal } from '../dialogs/Modal'

export type LinkPickerTarget = {
  documentId: string
  name: string
  kind: 'markdown' | 'pdf'
}

export function InternalLinkPicker({
  open,
  linkLabel,
  onClose,
  onSelect,
}: {
  open: boolean
  linkLabel: string
  onClose: () => void
  onSelect: (target: LinkPickerTarget) => void
}) {
  const tree = useSchemaStore((s) => s.workspaceTree ?? EMPTY_WORKSPACE_TREE)
  const docs = useSchemaStore((s) => s.workspaceDocuments)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const targets = useMemo(() => {
    const list: LinkPickerTarget[] = []
    const walk = (nodes: ReturnType<typeof filterBoardNodesFromTree>) => {
      for (const n of nodes) {
        if (n.type === 'folder' && n.children) walk(n.children)
        if (
          (n.type === 'markdown' || n.type === 'pdf') &&
          n.documentId &&
          docs[n.documentId]
        ) {
          list.push({
            documentId: n.documentId,
            name: docs[n.documentId].name,
            kind: n.type,
          })
        }
      }
    }
    walk(filterBoardNodesFromTree(tree))
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((t) => t.name.toLowerCase().includes(q))
  }, [docs, query, tree])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setHighlight(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    setHighlight(0)
  }, [query])

  if (!open) return null

  const pick = (t: LinkPickerTarget) => {
    onSelect(t)
    onClose()
  }

  return (
    <Modal title="Insert link" onClose={onClose} widthClass="max-w-md">
      <p className="mb-2 text-xs themed-muted">
        Link text: <span className="font-medium text-[var(--text)]">{linkLabel || 'Link'}</span>
      </p>
      <input
        ref={inputRef}
        className="themed-input mb-3 w-full rounded-md px-3 py-2 text-sm"
        placeholder="Search workspace documents…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
            return
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlight((h) => Math.min(h + 1, Math.max(0, targets.length - 1)))
            return
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlight((h) => Math.max(h - 1, 0))
            return
          }
          if (e.key === 'Enter' && targets[highlight]) {
            e.preventDefault()
            pick(targets[highlight])
          }
        }}
      />
      <ul className="max-h-56 overflow-y-auto rounded-md border" style={{ borderColor: 'var(--border)' }}>
        {targets.length === 0 ? (
          <li className="px-3 py-4 text-center text-xs themed-muted">No documents found.</li>
        ) : (
          targets.map((t, i) => (
            <li key={t.documentId}>
              <button
                type="button"
                className={`link-picker-item w-full px-3 py-2 text-left text-sm ${
                  i === highlight ? 'link-picker-item-active' : ''
                }`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(t)}
              >
                <span className="ui-glyph" aria-hidden>
                  {t.kind === 'pdf' ? '📕 ' : '📄 '}
                </span>
                {t.name}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="mt-4 flex justify-end">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
