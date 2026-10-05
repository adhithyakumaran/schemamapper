import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { exportBoardJson } from './schemaService'
import type { Board } from '../types/schema'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeFilename(name: string): string {
  return name.replace(/[^\w\-]+/g, '-').toLowerCase() || 'schema-board'
}

export function downloadBoardJson(board: Board) {
  const blob = new Blob([exportBoardJson(board)], { type: 'application/json' })
  downloadBlob(blob, `${safeFilename(board.name)}.json`)
}

function getFlowElement(): HTMLElement | null {
  return document.querySelector('.react-flow') as HTMLElement | null
}

export async function downloadBoardPng(board: Board): Promise<void> {
  const el = getFlowElement()
  if (!el) {
    alert('Canvas not ready for export.')
    return
  }
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    backgroundColor: board.color ?? '#F8FAFC',
    filter: (node) => {
      if (node instanceof HTMLElement && node.classList.contains('react-flow__controls')) {
        return false
      }
      return true
    },
  })
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  downloadBlob(blob, `${safeFilename(board.name)}.png`)
}

export async function downloadBoardPdf(board: Board): Promise<void> {
  const el = getFlowElement()
  if (!el) {
    alert('Canvas not ready for export.')
    return
  }
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    backgroundColor: board.color ?? '#F8FAFC',
    filter: (node) => {
      if (node instanceof HTMLElement && node.classList.contains('react-flow__controls')) {
        return false
      }
      return true
    },
  })
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = dataUrl
  })
  const pdf = new jsPDF({
    orientation: img.width > img.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [img.width, img.height],
  })
  pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height)
  pdf.save(`${safeFilename(board.name)}.pdf`)
}
