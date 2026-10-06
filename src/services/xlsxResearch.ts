import * as XLSX from 'xlsx'
import { createId } from '../lib/ids'
import {
  DEFAULT_RESEARCH_COLUMNS,
  researchColumnsForBoard,
  researchField,
} from '../lib/researchColumns'
import { orderedResearchRows } from '../lib/researchTable'
import type { Board, ResearchColumnDef, SchemaNode } from '../types/schema'
import * as schema from './schemaService'

const SHEET_NAME = 'Research Mapping'

export function exportBoardXlsx(board: Board): void {
  const cols = researchColumnsForBoard(board)
  const rows = orderedResearchRows(board)
  const header = [
    '#',
    'Level',
    'Feature / Component',
    'Parent',
    ...cols.map((c) => c.label),
    'Notes',
    'Evidence',
  ]

  const data = rows.map((r) => {
    const evidence =
      r.node.screenshots.length > 0
        ? `${r.node.screenshots.length} image(s)`
        : ''
    const row: (string | number)[] = [
      r.index,
      r.level,
      r.node.name,
      r.parentName,
      ...cols.map((c) => researchField(r.node, c.id)),
      r.node.note,
      evidence,
    ]
    return row
  })

  const ws = XLSX.utils.aoa_to_sheet([header, ...data])
  const colWidths = header.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...data.map((row) => String(row[i] ?? '').length),
    )
    return { wch: Math.min(48, Math.max(8, maxLen + 2)) }
  })
  ws['!cols'] = colWidths
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' }
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: data.length, c: header.length - 1 },
    }),
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME)
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${schema.slugifyBoardName(board.name)}-research.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

function headerIndex(headers: string[], ...names: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase())
  for (const name of names) {
    const idx = lower.indexOf(name.toLowerCase())
    if (idx >= 0) return idx
  }
  return -1
}

export function importBoardFromXlsx(file: File): Promise<Board> {
  return file.arrayBuffer().then((buf) => {
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[SHEET_NAME] ?? wb.Sheets[wb.SheetNames[0]]
    if (!sheet) throw new Error('Workbook has no sheets')
    const table = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
    }) as string[][]

    if (table.length < 2) throw new Error('Sheet has no data rows')

    const headers = table[0].map(String)
    const featureIdx = headerIndex(
      headers,
      'feature / component',
      'feature',
      'name',
    )
    const parentIdx = headerIndex(headers, 'parent')
    const levelIdx = headerIndex(headers, 'level')
    const notesIdx = headerIndex(headers, 'notes', 'note')

    if (featureIdx < 0) throw new Error('Missing Feature / Component column')

    const customCols: ResearchColumnDef[] = []
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].trim()
      if (!h) continue
      const known =
        ['#', 'level', 'feature / component', 'parent', 'notes', 'evidence'].includes(
          h.toLowerCase(),
        ) || DEFAULT_RESEARCH_COLUMNS.some((c) => c.label.toLowerCase() === h.toLowerCase())
      if (!known) {
        customCols.push({ id: createId('col'), label: h })
      }
    }

    const colIdByHeader = new Map<string, string>()
    for (const c of DEFAULT_RESEARCH_COLUMNS) {
      const idx = headers.findIndex(
        (h) => h.trim().toLowerCase() === c.label.toLowerCase(),
      )
      if (idx >= 0) colIdByHeader.set(String(idx), c.id)
    }
    for (const c of customCols) {
      const idx = headers.indexOf(c.label)
      if (idx >= 0) colIdByHeader.set(String(idx), c.id)
    }

    const boardName =
      file.name.replace(/\.xlsx$/i, '').trim() || 'Imported Research'
    let board = schema.createBoard(boardName)
    if (customCols.length) board = { ...board, researchColumns: customCols }

    const stack: { level: number; id: string }[] = []

    for (let r = 1; r < table.length; r++) {
      const row = table[r]
      const name = String(row[featureIdx] ?? '').trim()
      if (!name) continue

      let level = levelIdx >= 0 ? Number(row[levelIdx]) : NaN
      if (Number.isNaN(level)) {
        level = stack.length ? stack[stack.length - 1].level + 1 : 0
      }

      while (stack.length && stack[stack.length - 1].level >= level) {
        stack.pop()
      }

      let parentId: string | null =
        stack.length ? stack[stack.length - 1].id : null

      if (parentIdx >= 0) {
        const parentName = String(row[parentIdx] ?? '').trim()
        if (
          parentName &&
          parentName !== '—' &&
          parentName !== '-'
        ) {
          const found = board.nodes.find(
            (n) => n.name.toLowerCase() === parentName.toLowerCase(),
          )
          if (found) parentId = found.id
        } else if (!parentName || parentName === '—' || parentName === '-') {
          parentId = null
        }
      }

      const research: Record<string, string> = {}
      for (const [idxKey, fieldId] of colIdByHeader) {
        const val = String(row[Number(idxKey)] ?? '').trim()
        if (val) research[fieldId] = val
      }

      const note = notesIdx >= 0 ? String(row[notesIdx] ?? '') : ''

      const node: SchemaNode = {
        id: createId('node'),
        name,
        parentId,
        position: { x: 120, y: 120 + r * 24 },
        note,
        screenshots: [],
        ...(Object.keys(research).length ? { research } : {}),
      }

      board = { ...board, nodes: [...board.nodes, node] }
      stack.push({ level, id: node.id })
    }

    if (board.nodes.length === 0) throw new Error('No rows imported')
    return board
  })
}
