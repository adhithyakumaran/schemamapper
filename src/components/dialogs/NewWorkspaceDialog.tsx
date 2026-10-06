import { useRef } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import { Modal } from './Modal'

export function NewWorkspaceDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const importMarkdown = useSchemaStore((s) => s.importMarkdownFile)
  const importPdf = useSchemaStore((s) => s.importPdfFile)

  const mdRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  if (dialog?.type !== 'newWorkspace') return null

  const close = () => setDialog(null)

  return (
    <Modal title="New in workspace" onClose={close}>
      <div className="grid gap-2">
        <button
          type="button"
          className="themed-input rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-secondary)]"
          onClick={() => {
            close()
            setDialog({ type: 'folder', mode: 'create' })
          }}
        >
          <span className="ui-glyph" aria-hidden>📁 </span>
          New Folder
        </button>
        <button
          type="button"
          className="themed-input rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-secondary)]"
          onClick={() => mdRef.current?.click()}
        >
          <span className="ui-glyph" aria-hidden>📄 </span>
          Import Markdown
        </button>
        <button
          type="button"
          className="themed-input rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-secondary)]"
          onClick={() => pdfRef.current?.click()}
        >
          <span className="ui-glyph" aria-hidden>📕 </span>
          Import PDF
        </button>
      </div>
      <input
        ref={mdRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            void importMarkdown(file).then(close)
          }
          e.target.value = ''
        }}
      />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            void importPdf(file).then(close)
          }
          e.target.value = ''
        }}
      />
    </Modal>
  )
}
