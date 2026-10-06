import '@blocknote/ariakit/style.css'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/react/style.css'
import { BlockNoteView } from '@blocknote/ariakit'
import type { BlockNoteEditor } from '@blocknote/core'
import { useCreateBlockNote } from '@blocknote/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  blocksForDocument,
  markdownSnapshot,
  serializeEditorBlocks,
  uploadFileForNotepad,
} from '../../lib/notepadPersistence'
import { parseWorkspaceDocumentHref, workspaceDocumentHref } from '../../lib/workspaceLinks'
import {
  downloadDocumentMarkdown,
  downloadDocumentPdf,
} from '../../services/documentExport'
import { DEFAULT_WORKSPACE_UI } from '../../store/stableDefaults'
import { useSchemaStore } from '../../store/schemaStore'
import { useThemeStore } from '../../store/themeStore'
import { InternalLinkPicker } from './InternalLinkPicker'

const SAVE_DEBOUNCE_MS = 750

export function NotepadEditor({ documentId }: { documentId: string }) {
  const doc = useSchemaStore((s) => s.workspaceDocuments[documentId])
  const updateEditorState = useSchemaStore((s) => s.updateDocumentEditorState)
  const renameDocument = useSchemaStore((s) => s.renameDocument)
  const setSaveStatus = useSchemaStore((s) => s.setWorkspaceSaveStatus)
  const saveStatus = useSchemaStore(
    (s) => (s.workspaceUi ?? DEFAULT_WORKSPACE_UI).saveStatus,
  )
  const openWorkspaceDocument = useSchemaStore((s) => s.openWorkspaceDocument)
  const workspaceDocuments = useSchemaStore((s) => s.workspaceDocuments)
  const workspaceTree = useSchemaStore((s) => s.workspaceTree)
  const dark = useThemeStore((s) => s.theme === 'dark')
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [linkPickerOpen, setLinkPickerOpen] = useState(false)
  const [linkPickerLabel, setLinkPickerLabel] = useState('')
  const loadGeneration = useRef(0)
  const editorReady = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<BlockNoteEditor | null>(null)

  const editor = useCreateBlockNote(
    {
      uploadFile: uploadFileForNotepad,
      placeholders: {
        default: 'Start writing…',
        emptyDocument: 'Start writing…',
      },
    },
    [documentId],
  )
  editorRef.current = editor

  const flushSave = useCallback(
    (ed: BlockNoteEditor) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      const editorContent = serializeEditorBlocks(ed)
      const content = markdownSnapshot(ed)
      updateEditorState(documentId, { editorContent, content })
      setSaveStatus('saved')
    },
    [documentId, setSaveStatus, updateEditorState],
  )

  const scheduleSave = useCallback(
    (ed: BlockNoteEditor) => {
      if (!editorReady.current) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaveStatus('saving')
      saveTimer.current = setTimeout(() => {
        flushSave(ed)
        saveTimer.current = null
      }, SAVE_DEBOUNCE_MS)
    },
    [flushSave, setSaveStatus],
  )

  useEffect(() => {
    editorReady.current = false
    const generation = ++loadGeneration.current
    const currentDoc = useSchemaStore.getState().workspaceDocuments[documentId]
    if (!currentDoc || currentDoc.type !== 'markdown') return

    let cancelled = false
    void (async () => {
      const blocks = await blocksForDocument(editor, currentDoc)
      if (cancelled || generation !== loadGeneration.current) return
      editor.replaceBlocks(editor.document, blocks as typeof editor.document)
      editorReady.current = true
      if (!currentDoc.editorContent && blocks.length > 0) {
        const editorContent = JSON.stringify(blocks)
        const content = editor.blocksToMarkdownLossy(blocks as typeof editor.document)
        updateEditorState(documentId, { editorContent, content })
      }
    })()

    return () => {
      cancelled = true
      if (editorReady.current && editorRef.current) {
        flushSave(editorRef.current)
      }
      editorReady.current = false
    }
  }, [documentId, editor, flushSave, updateEditorState])

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
    const walk = (nodes: typeof workspaceTree): string | null => {
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

  const openLinkPicker = () => {
    const selected = editor.getSelectedText().trim()
    setLinkPickerLabel(selected || 'Link')
    setLinkPickerOpen(true)
  }

  const applyInternalLink = (target: {
    documentId: string
    name: string
  }) => {
    const url = workspaceDocumentHref(target.documentId)
    const label =
      linkPickerLabel && linkPickerLabel !== 'Link'
        ? linkPickerLabel
        : target.name.replace(/\.md$/i, '')
    editor.createLink(url, label)
  }

  const exportMd = () => {
    if (!doc) return
    downloadDocumentMarkdown(doc.name, markdownSnapshot(editor))
  }

  const exportPdf = async () => {
    if (!doc) return
    await downloadDocumentPdf(doc.name, markdownSnapshot(editor))
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
      <InternalLinkPicker
        open={linkPickerOpen}
        linkLabel={linkPickerLabel}
        onClose={() => setLinkPickerOpen(false)}
        onSelect={applyInternalLink}
      />
      <div
        className="notepad-toolbar flex flex-wrap items-center gap-2 border-b px-4 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-xs themed-muted">{saveLabel}</span>
        <span className="flex-1" />
        <button type="button" className="toolbar-btn text-xs" onClick={openLinkPicker}>
          🔗 Link
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
          <BlockNoteView
            editor={editor}
            theme={dark ? 'dark' : 'light'}
            onChange={() => scheduleSave(editor)}
          />
        </div>
      </div>
    </div>
  )
}
