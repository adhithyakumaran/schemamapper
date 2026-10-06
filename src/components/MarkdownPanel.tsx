import { marked } from 'marked'
import { useMemo, useState } from 'react'
import { useSchemaStore } from '../store/schemaStore'

export function MarkdownPanel({ documentId }: { documentId: string }) {
  const doc = useSchemaStore((s) => s.workspaceDocuments[documentId])
  const update = useSchemaStore((s) => s.updateMarkdownDocument)
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')

  const html = useMemo(() => {
    if (!doc) return ''
    return marked.parse(doc.content, { async: false }) as string
  }, [doc?.content])

  if (!doc || doc.type !== 'markdown') {
    return (
      <div className="flex flex-1 items-center justify-center text-sm themed-muted">
        Document not found.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center gap-2 border-b px-4 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-sm font-medium">📄 {doc.name}</span>
        <span className="flex-1" />
        <button
          type="button"
          className={`toolbar-btn ${mode === 'preview' ? 'nested-tree-row-selected' : ''}`}
          onClick={() => setMode('preview')}
        >
          Preview
        </button>
        <button
          type="button"
          className={`toolbar-btn ${mode === 'edit' ? 'nested-tree-row-selected' : ''}`}
          onClick={() => setMode('edit')}
        >
          Edit
        </button>
      </div>
      {mode === 'edit' ? (
        <textarea
          className="themed-input min-h-0 flex-1 resize-none border-0 p-6 text-sm leading-relaxed"
          value={doc.content}
          onChange={(e) => update(documentId, e.target.value)}
          spellCheck={false}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <article
            className="markdown-preview mx-auto max-w-3xl text-sm leading-relaxed [&_a]:text-indigo-500 [&_code]:rounded [&_code]:bg-[var(--surface-secondary)] [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[var(--surface-secondary)] [&_pre]:p-3"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  )
}
