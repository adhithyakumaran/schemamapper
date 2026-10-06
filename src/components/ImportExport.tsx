import { useEffect, useRef, useState } from 'react'
import { downloadBoardJson, downloadBoardPdf, downloadBoardPng } from '../services/boardExport'
import { exportBoardXlsx, importBoardFromXlsx } from '../services/xlsxResearch'
import { useSchemaStore } from '../store/schemaStore'

export function ImportExportButtons() {
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  const importBoard = useSchemaStore((s) => s.importBoard)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const xlsxInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!exportOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [exportOpen])

  const onImportJson = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      importBoard(parsed)
    } catch {
      alert('Invalid board JSON')
    }
  }

  const runExport = async (kind: 'json' | 'pdf' | 'png' | 'xlsx') => {
    if (!board) return
    setExporting(true)
    setExportOpen(false)
    try {
      if (kind === 'json') downloadBoardJson(board)
      else if (kind === 'pdf') await downloadBoardPdf(board)
      else if (kind === 'png') await downloadBoardPng(board)
      else exportBoardXlsx(board)
    } finally {
      setExporting(false)
    }
  }

  const onImportXlsx = async (file: File) => {
    try {
      const imported = await importBoardFromXlsx(file)
      importBoard(imported)
    } catch {
      alert('Invalid research spreadsheet')
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="toolbar-btn"
          disabled={!board || exporting}
          onClick={() => setExportOpen((o) => !o)}
        >
          Export ▾
        </button>
        {exportOpen && (
          <div className="themed-menu absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-md border py-1 shadow-lg">
            <button
              type="button"
              className="themed-menu-item block w-full px-3 py-1.5 text-left text-xs"
              onClick={() => runExport('json')}
            >
              JSON
            </button>
            <button
              type="button"
              className="themed-menu-item block w-full px-3 py-1.5 text-left text-xs"
              onClick={() => runExport('pdf')}
            >
              PDF
            </button>
            <button
              type="button"
              className="themed-menu-item block w-full px-3 py-1.5 text-left text-xs"
              onClick={() => runExport('png')}
            >
              PNG
            </button>
            <button
              type="button"
              className="themed-menu-item block w-full px-3 py-1.5 text-left text-xs"
              onClick={() => runExport('xlsx')}
            >
              XLSX
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => runExport('xlsx')}
        disabled={!board || exporting}
      >
        Export XLSX
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => jsonInputRef.current?.click()}
      >
        Import JSON
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => xlsxInputRef.current?.click()}
      >
        Import Excel
      </button>
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onImportJson(file)
          e.target.value = ''
        }}
      />
      <input
        ref={xlsxInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onImportXlsx(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
