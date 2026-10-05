import { createId } from '../lib/ids'
import { EVIDENCE_BUCKET, getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { Board, SchemaConnection, SchemaNode } from '../types/schema'
import { normalizeImportedBoard } from './schemaService'

function publicEvidenceUrl(storagePath: string): string {
  const sb = getSupabase()
  const { data } = sb.storage.from(EVIDENCE_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'image/webp'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { blob: new Blob([bytes], { type: mime }), mime }
}

function extensionForMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  return 'webp'
}

export async function loadAllBoardsFromSupabase(): Promise<Board[]> {
  if (!isSupabaseConfigured()) return []
  const sb = getSupabase()

  const { data: boardRows, error: boardErr } = await sb.from('boards').select('*')
  if (boardErr) throw boardErr
  if (!boardRows?.length) return []

  const boardIds = boardRows.map((b) => b.id as string)

  const { data: nodeRows, error: nodeErr } = await sb
    .from('nodes')
    .select('*')
    .in('board_id', boardIds)
  if (nodeErr) throw nodeErr

  const nodeIds = (nodeRows ?? []).map((n) => n.id as string)

  const { data: connRows, error: connErr } = await sb
    .from('connections')
    .select('*')
    .in('board_id', boardIds)
  if (connErr) throw connErr

  const { data: evidenceRows, error: evErr } = nodeIds.length
    ? await sb.from('evidence').select('*').in('node_id', nodeIds)
    : { data: [], error: null }
  if (evErr) throw evErr

  const evidenceByNode = new Map<string, string[]>()
  for (const row of evidenceRows ?? []) {
    const list = evidenceByNode.get(row.node_id as string) ?? []
    list.push(publicEvidenceUrl(row.storage_path as string))
    evidenceByNode.set(row.node_id as string, list)
  }

  return boardRows.map((b) => {
    const nodes: SchemaNode[] = (nodeRows ?? [])
      .filter((n) => n.board_id === b.id)
      .map((n) => ({
        id: n.id as string,
        name: n.name as string,
        parentId: (n.parent_id as string | null) ?? null,
        position: {
          x: Number(n.position_x),
          y: Number(n.position_y),
        },
        note: (n.note as string) ?? '',
        screenshots: evidenceByNode.get(n.id as string) ?? [],
      }))

    const connections: SchemaConnection[] = (connRows ?? [])
      .filter((c) => c.board_id === b.id)
      .map((c) => ({
        id: c.id as string,
        source: c.source as string,
        target: c.target as string,
      }))

    return {
      id: b.id as string,
      name: b.name as string,
      color: (b.color as string) ?? '#F8FAFC',
      nodes,
      connections,
    }
  })
}

async function uploadScreenshot(
  boardId: string,
  nodeId: string,
  dataUrl: string,
): Promise<string> {
  const sb = getSupabase()
  const { blob, mime } = dataUrlToBlob(dataUrl)
  const ext = extensionForMime(mime)
  const fileName = `${createId('img')}.${ext}`
  const storagePath = `${boardId}/${nodeId}/${fileName}`

  const { error: upErr } = await sb.storage
    .from(EVIDENCE_BUCKET)
    .upload(storagePath, blob, { contentType: mime, upsert: false })
  if (upErr) throw upErr

  const evidenceId = createId('evidence')
  const { error: insErr } = await sb.from('evidence').insert({
    id: evidenceId,
    node_id: nodeId,
    file_name: fileName,
    storage_path: storagePath,
    mime_type: mime,
    file_size: blob.size,
  })
  if (insErr) throw insErr

  return publicEvidenceUrl(storagePath)
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${EVIDENCE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

async function deleteEvidenceUrl(url: string): Promise<void> {
  const path = storagePathFromPublicUrl(url)
  if (!path) return
  const sb = getSupabase()
  await sb.from('evidence').delete().eq('storage_path', path)
  await sb.storage.from(EVIDENCE_BUCKET).remove([path])
}

export async function syncNodeScreenshots(
  boardId: string,
  nodeId: string,
  previous: string[],
  next: string[],
): Promise<string[]> {
  const resolved: string[] = []
  for (const item of next) {
    if (item.startsWith('data:')) {
      resolved.push(await uploadScreenshot(boardId, nodeId, item))
    } else {
      resolved.push(item)
    }
  }

  for (const old of previous) {
    if (!resolved.includes(old)) {
      await deleteEvidenceUrl(old)
    }
  }

  return resolved
}

/** Idempotent full board upsert (import / seed / debounced save). */
export async function upsertFullBoardToSupabase(board: Board): Promise<void> {
  if (!isSupabaseConfigured()) return
  const sb = getSupabase()
  const normalized = normalizeImportedBoard(board)

  const { error: boardErr } = await sb.from('boards').upsert({
    id: normalized.id,
    name: normalized.name,
    color: normalized.color,
  })
  if (boardErr) throw boardErr

  const { data: existingNodes } = await sb
    .from('nodes')
    .select('id')
    .eq('board_id', normalized.id)
  const existingIds = new Set((existingNodes ?? []).map((n) => n.id as string))
  const nextIds = new Set(normalized.nodes.map((n) => n.id))

  const toDelete = [...existingIds].filter((id) => !nextIds.has(id))
  if (toDelete.length) {
    await sb.from('nodes').delete().in('id', toDelete)
  }

  for (const node of normalized.nodes) {
    let screenshots = node.screenshots ?? []
    const embedded = screenshots.filter((s) => s.startsWith('data:'))
    const remote = screenshots.filter((s) => !s.startsWith('data:'))
    const uploaded: string[] = []
    for (const dataUrl of embedded) {
      uploaded.push(await uploadScreenshot(normalized.id, node.id, dataUrl))
    }
    screenshots = [...remote, ...uploaded]

    const { error: nodeErr } = await sb.from('nodes').upsert({
      id: node.id,
      board_id: normalized.id,
      name: node.name,
      parent_id: node.parentId,
      position_x: node.position.x,
      position_y: node.position.y,
      note: node.note ?? '',
    })
    if (nodeErr) throw nodeErr

    if (screenshots.length > 0) {
      const { data: existingEv } = await sb
        .from('evidence')
        .select('storage_path')
        .eq('node_id', node.id)
      const existingUrls = (existingEv ?? []).map((e) =>
        publicEvidenceUrl(e.storage_path as string),
      )
      await syncNodeScreenshots(
        normalized.id,
        node.id,
        existingUrls,
        screenshots,
      )
    }
  }

  const { data: existingConn } = await sb
    .from('connections')
    .select('id')
    .eq('board_id', normalized.id)
  const existingConnIds = new Set((existingConn ?? []).map((c) => c.id as string))
  const nextConnIds = new Set((normalized.connections ?? []).map((c) => c.id))

  const connDelete = [...existingConnIds].filter((id) => !nextConnIds.has(id))
  if (connDelete.length) {
    await sb.from('connections').delete().in('id', connDelete)
  }

  for (const c of normalized.connections ?? []) {
    const { error: cErr } = await sb.from('connections').upsert({
      id: c.id,
      board_id: normalized.id,
      source: c.source,
      target: c.target,
    })
    if (cErr) throw cErr
  }
}

export async function deleteBoardFromSupabase(boardId: string): Promise<void> {
  const sb = getSupabase()
  const { data: nodes } = await sb.from('nodes').select('id').eq('board_id', boardId)
  const nodeIds = (nodes ?? []).map((n) => n.id as string)
  if (nodeIds.length) {
    const { data: ev } = await sb.from('evidence').select('storage_path').in('node_id', nodeIds)
    const paths = (ev ?? []).map((e) => e.storage_path as string)
    if (paths.length) {
      await sb.storage.from(EVIDENCE_BUCKET).remove(paths)
    }
  }
  const { error } = await sb.from('boards').delete().eq('id', boardId)
  if (error) throw error
}

export async function patchBoardMeta(
  boardId: string,
  patch: { name?: string; color?: string },
): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb.from('boards').update(patch).eq('id', boardId)
  if (error) throw error
}

export async function patchNodeRow(
  boardId: string,
  nodeId: string,
  patch: Partial<{
    name: string
    note: string
    parentId: string | null
    position_x: number
    position_y: number
  }>,
): Promise<void> {
  const sb = getSupabase()
  const row: Record<string, unknown> = { board_id: boardId }
  if (patch.name !== undefined) row.name = patch.name
  if (patch.note !== undefined) row.note = patch.note
  if (patch.parentId !== undefined) row.parent_id = patch.parentId
  if (patch.position_x !== undefined) row.position_x = patch.position_x
  if (patch.position_y !== undefined) row.position_y = patch.position_y
  const { error } = await sb.from('nodes').update(row).eq('id', nodeId)
  if (error) throw error
}

export async function insertNodeRow(boardId: string, node: SchemaNode): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb.from('nodes').insert({
    id: node.id,
    board_id: boardId,
    name: node.name,
    parent_id: node.parentId,
    position_x: node.position.x,
    position_y: node.position.y,
    note: node.note ?? '',
  })
  if (error) throw error
}

export async function deleteNodeRows(nodeIds: string[]): Promise<void> {
  if (!nodeIds.length) return
  const sb = getSupabase()
  const { error } = await sb.from('nodes').delete().in('id', nodeIds)
  if (error) throw error
}

export async function upsertConnectionRow(
  boardId: string,
  connection: SchemaConnection,
): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb.from('connections').upsert({
    id: connection.id,
    board_id: boardId,
    source: connection.source,
    target: connection.target,
  })
  if (error) throw error
}

export async function deleteConnectionRow(connectionId: string): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb.from('connections').delete().eq('id', connectionId)
  if (error) throw error
}
