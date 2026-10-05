import { useRef } from 'react'
import { exportBoardJson as serializeBoard } from '../services/schemaService'
import { useSchemaStore } from '../store/schemaStore'
import type { Board } from '../types/schema'

export function downloadBoardJson(board: Board) {
  const blob = new Blob([serializeBoard(board)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = board.name.replace(/[^\w\-]+/g, '-').toLowerCase()
  a.href = url
  a.download = `${safeName || 'schema-board'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportExportButtons() {
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  const importBoard = useSchemaStore((s) => s.importBoard)
  const replaceActiveBoard = useSchemaStore((s) => s.replaceActiveBoard)
  const inputRef = useRef<HTMLInputElement>(null)

  const onImport = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Board
      if (board && confirm('Replace current board with imported data?')) {
        replaceActiveBoard(parsed)
      } else {
        importBoard(parsed)
      }
    } catch {
      alert('Invalid board JSON')
    }
  }

  return (
    <>
      <button
        type="button"
        className="toolbar-btn"
        disabled={!board}
        onClick={() => board && downloadBoardJson(board)}
      >
        Export
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => inputRef.current?.click()}
      >
        Import
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImport(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
