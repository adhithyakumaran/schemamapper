import { marked } from 'marked'
import { useMemo } from 'react'
import { useSchemaStore } from '../store/schemaStore'

export function MarkdownPanel({ documentId }: { documentId: string }) {
  const doc = useSchemaStore((s) => s.workspaceDocuments[documentId])
  const update = useSchemaStore((s) => s.updateMarkdownDocument)

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
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="flex min-h-0 flex-1 flex-col border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--border)' }}>
        <div className="border-b px-3 py-2 text-xs font-medium themed-muted" style={{ borderColor: 'var(--border)' }}>
          Edit
        </div>
        <textarea
          className="themed-input min-h-0 flex-1 resize-none border-0 p-4 text-sm leading-relaxed"
          value={doc.content}
          onChange={(e) => update(documentId, e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <article
          className="markdown-preview prose-sm max-w-none text-sm leading-relaxed [&_a]:text-indigo-500 [&_code]:rounded [&_code]:bg-[var(--surface-secondary)] [&_code]:px-1 [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[var(--surface-secondary)] [&_pre]:p-3 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
