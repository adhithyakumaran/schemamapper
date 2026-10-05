import { useRef } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import { Modal } from './Modal'

export function NewWorkspaceDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const createFolder = useSchemaStore((s) => s.createFolder)
  const importBoard = useSchemaStore((s) => s.importBoard)
  const importMarkdown = useSchemaStore((s) => s.importMarkdownFile)
  const importPdf = useSchemaStore((s) => s.importPdfFile)

  const jsonRef = useRef<HTMLInputElement>(null)
  const mdRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  if (dialog?.type !== 'newWorkspace') return null

  const close = () => setDialog(null)

  const onJson = async (file: File) => {
    try {
      const board = JSON.parse(await file.text())
      importBoard(board)
      close()
    } catch {
      alert('Invalid board JSON')
    }
  }

  return (
    <Modal title="Create new" onClose={close}>
      <div className="grid gap-2">
        <button
          type="button"
          className="themed-input rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-secondary)]"
          onClick={() => {
            close()
            setDialog({ type: 'board', mode: 'create' })
          }}
        >
          New Board
        </button>
        <button
          type="button"
          className="themed-input rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-secondary)]"
          onClick={() => {
            const name = prompt('Folder name', 'Research')
            if (name?.trim()) {
              createFolder(name.trim())
              close()
            }
          }}
        >
          New Folder
        </button>
        <button
          type="button"
          className="themed-input rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-secondary)]"
          onClick={() => jsonRef.current?.click()}
        >
          Import JSON
        </button>
        <button
          type="button"
          className="themed-input rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-secondary)]"
          onClick={() => mdRef.current?.click()}
        >
          Import Markdown
        </button>
        <button
          type="button"
          className="themed-input rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--surface-secondary)]"
          onClick={() => pdfRef.current?.click()}
        >
          Import PDF
        </button>
      </div>
      <input
        ref={jsonRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onJson(file)
          e.target.value = ''
        }}
      />
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
