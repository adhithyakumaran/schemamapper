import { jsPDF } from 'jspdf'
import { marked } from 'marked'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeName(name: string): string {
  const base = name.replace(/\.md$/i, '').trim()
  return base.replace(/[^\w\-]+/g, '-').toLowerCase() || 'document'
}

export function downloadDocumentMarkdown(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  downloadBlob(blob, name.endsWith('.md') ? name : `${name}.md`)
}

export async function downloadDocumentPdf(
  name: string,
  markdown: string,
): Promise<void> {
  const html = marked.parse(markdown, { async: false }) as string
  const host = document.createElement('div')
  host.className = 'document-pdf-export'
  host.innerHTML = `<article class="markdown-preview">${html}</article>`
  host.style.cssText =
    'position:fixed;left:-9999px;top:0;width:720px;padding:40px;font-family:system-ui,sans-serif;font-size:12px;line-height:1.5;color:#0f172a;background:#fff'
  document.body.appendChild(host)

  const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
  await pdf.html(host, {
    x: 36,
    y: 36,
    width: 540,
    windowWidth: 720,
    autoPaging: 'text',
  })
  pdf.save(`${safeName(name)}.pdf`)
  host.remove()
}
