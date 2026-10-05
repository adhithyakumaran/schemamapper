import { useRef, useState } from 'react'
import { downloadBoardJson, downloadBoardPdf, downloadBoardPng } from '../services/boardExport'
import { useSchemaStore } from '../store/schemaStore'
import type { Board } from '../types/schema'

export function ImportExportButtons() {
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  const importBoard = useSchemaStore((s) => s.importBoard)
  const replaceActiveBoard = useSchemaStore((s) => s.replaceActiveBoard)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const onImportJson = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Board
      if (board && confirm('Replace current board with imported JSON?')) {
        replaceActiveBoard(parsed)
      } else {
        importBoard(parsed)
      }
    } catch {
      alert('Invalid board JSON')
    }
  }

  const runExport = async (kind: 'json' | 'pdf' | 'png') => {
    if (!board) return
    setExporting(true)
    setExportOpen(false)
    try {
      if (kind === 'json') downloadBoardJson(board)
      else if (kind === 'pdf') await downloadBoardPdf(board)
      else await downloadBoardPng(board)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="toolbar-btn"
          disabled={!board || exporting}
          onClick={() => setExportOpen((o) => !o)}
        >
          Export ▾
        </button>
        {exportOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
              onClick={() => runExport('json')}
            >
              JSON
            </button>
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
              onClick={() => runExport('pdf')}
            >
              PDF
            </button>
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
              onClick={() => runExport('png')}
            >
              PNG
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => jsonInputRef.current?.click()}
      >
        Import JSON
      </button>
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImportJson(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
