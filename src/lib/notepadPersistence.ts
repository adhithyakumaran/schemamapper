import type { BlockNoteEditor } from '@blocknote/core'
import { optimizeImageFiles, isAcceptedImageType } from './imageOptimize'
import type { WorkspaceDocument } from '../types/workspace'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Persist uploads as durable data URLs (images optimized). */
export async function uploadFileForNotepad(file: File): Promise<string> {
  if (isAcceptedImageType(file.type)) {
    const optimized = await optimizeImageFiles([file])
    if (optimized[0]) return optimized[0]
  }
  return readFileAsDataUrl(file)
}

export function serializeEditorBlocks(editor: BlockNoteEditor): string {
  return JSON.stringify(editor.document)
}

export async function blocksForDocument(
  editor: BlockNoteEditor,
  doc: WorkspaceDocument,
): Promise<unknown[]> {
  if (doc.editorContent) {
    try {
      const parsed = JSON.parse(doc.editorContent) as unknown
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch {
      /* fall through to markdown */
    }
  }
  return editor.tryParseMarkdownToBlocks(doc.content || '')
}

export function markdownSnapshot(editor: BlockNoteEditor): string {
  return editor.blocksToMarkdownLossy(editor.document)
}
