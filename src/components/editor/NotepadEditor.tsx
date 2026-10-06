import '@blocknote/core/fonts/inter.css'
import '@blocknote/react/style.css'
import {
  BlockNoteDefaultUI,
  BlockNoteViewRaw,
  useCreateBlockNote,
} from '@blocknote/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  parseWorkspaceDocumentHref,
  resolveDocumentIdByTitle,
  workspaceDocumentHref,
  wikiLinkPattern,
} from '../../lib/workspaceLinks'
import {
  downloadDocumentMarkdown,
  downloadDocumentPdf,
} from '../../services/documentExport'
import { DEFAULT_WORKSPACE_UI } from '../../store/stableDefaults'
import { useSchemaStore } from '../../store/schemaStore'
import { useThemeStore } from '../../store/themeStore'

const SAVE_DEBOUNCE_MS = 450

export function NotepadEditor({ documentId }: { documentId: string }) {
  const doc = useSchemaStore((s) => s.workspaceDocuments[documentId])
  const update = useSchemaStore((s) => s.updateMarkdownDocument)
  const renameDocument = useSchemaStore((s) => s.renameDocument)
  const setSaveStatus = useSchemaStore((s) => s.setWorkspaceSaveStatus)
  const saveStatus = useSchemaStore(
    (s) => (s.workspaceUi ?? DEFAULT_WORKSPACE_UI).saveStatus,
  )
  const openWorkspaceDocument = useSchemaStore(
    (s) => s.openWorkspaceDocument,
  )
  const workspaceDocuments = useSchemaStore((s) => s.workspaceDocuments)
  const workspaceTree = useSchemaStore((s) => s.workspaceTree)
  const dark = useThemeStore((s) => s.theme === 'dark')
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const loadedFor = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useCreateBlockNote()

  useEffect(() => {
    if (!doc || doc.type !== 'markdown') return
    if (loadedFor.current === documentId) return
    loadedFor.current = documentId
    void (async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(doc.content)
      editor.replaceBlocks(editor.document, blocks)
    })()
  }, [documentId, doc, editor])

  const persistMarkdown = useCallback(
    (markdown: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaveStatus('saving')
      saveTimer.current = setTimeout(() => {
        update(documentId, markdown)
        setSaveStatus('saved')
      }, SAVE_DEBOUNCE_MS)
    },
    [documentId, setSaveStatus, update],
  )

  const onEditorClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      const internalId = parseWorkspaceDocumentHref(href)
      if (internalId && workspaceDocuments[internalId]) {
        e.preventDefault()
        const d = workspaceDocuments[internalId]
        openWorkspaceDocument(internalId, d.type === 'pdf' ? 'pdf' : 'markdown')
        return
      }
      if (href.startsWith('http://') || href.startsWith('https://')) {
        e.preventDefault()
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    },
    [openWorkspaceDocument, workspaceDocuments],
  )

  const findTreeItemId = useCallback(() => {
    const walk = (
      nodes: typeof workspaceTree,
    ): string | null => {
      for (const n of nodes) {
        if (n.documentId === documentId) return n.id
        if (n.children) {
          const found = walk(n.children)
          if (found) return found
        }
      }
      return null
    }
    return walk(workspaceTree)
  }, [documentId, workspaceTree])

  const insertInternalLink = () => {
    const title = window.prompt('Link to document (name):')
    if (!title) return
    const id = resolveDocumentIdByTitle(title, workspaceDocuments)
    const text = id
      ? workspaceDocumentHref(id)
      : wikiLinkPattern(title)
    void editor.insertInlineContent([
      { type: 'link', href: text, content: title },
    ])
  }

  const exportMd = () => {
    if (!doc) return
    const md = editor.blocksToMarkdownLossy(editor.document)
    downloadDocumentMarkdown(doc.name, md)
  }

  const exportPdf = async () => {
    if (!doc) return
    const md = editor.blocksToMarkdownLossy(editor.document)
    await downloadDocumentPdf(doc.name, md)
  }

  if (!doc || doc.type !== 'markdown') {
    return (
      <div className="flex flex-1 items-center justify-center text-sm themed-muted">
        Document not found.
      </div>
    )
  }

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved'
        : ''

  return (
    <div className="notepad-editor flex min-h-0 flex-1 flex-col" onClick={onEditorClick}>
      <div
        className="notepad-toolbar flex flex-wrap items-center gap-2 border-b px-4 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-xs themed-muted">{saveLabel}</span>
        <span className="flex-1" />
        <button type="button" className="toolbar-btn text-xs" onClick={insertInternalLink}>
          Link
        </button>
        <button type="button" className="toolbar-btn text-xs" onClick={exportMd}>
          Export Markdown
        </button>
        <button type="button" className="toolbar-btn text-xs" onClick={() => void exportPdf()}>
          Export PDF
        </button>
      </div>
      <div className="notepad-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="notepad-page mx-auto w-full max-w-[820px] px-6 py-8">
          {titleEditing ? (
            <input
              className="notepad-title-input mb-4 w-full border-0 bg-transparent text-2xl font-bold outline-none"
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                setTitleEditing(false)
                const trimmed = titleDraft.trim()
                if (trimmed && trimmed !== doc.name) {
                  const itemId = findTreeItemId()
                  if (itemId) renameDocument(itemId, trimmed)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
            />
          ) : (
            <h1
              className="notepad-title mb-4 cursor-text text-2xl font-bold"
              onClick={() => {
                setTitleDraft(doc.name.replace(/\.md$/i, ''))
                setTitleEditing(true)
              }}
            >
              {doc.name.replace(/\.md$/i, '')}
            </h1>
          )}
          <BlockNoteViewRaw
            editor={editor}
            theme={dark ? 'dark' : 'light'}
            onChange={() => {
              persistMarkdown(editor.blocksToMarkdownLossy(editor.document))
            }}
          >
            <BlockNoteDefaultUI />
          </BlockNoteViewRaw>
        </div>
      </div>
    </div>
  )
}
