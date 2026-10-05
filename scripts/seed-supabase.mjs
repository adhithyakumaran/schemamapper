/**
 * One-time seed: node scripts/seed-supabase.mjs
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const board = JSON.parse(
  readFileSync('data/boards/katalon-example.json', 'utf8'),
)
const sb = createClient(url, key)

await sb.from('boards').upsert({
  id: board.id,
  name: board.name,
  color: board.color ?? '#E8F5E9',
})

const nodeIds = board.nodes.map((n) => n.id)
const { data: existing } = await sb.from('nodes').select('id').eq('board_id', board.id)
const existingIds = new Set((existing ?? []).map((n) => n.id))
const nextIds = new Set(nodeIds)
for (const id of existingIds) {
  if (!nextIds.has(id)) await sb.from('nodes').delete().eq('id', id)
}

for (const n of board.nodes) {
  await sb.from('nodes').upsert({
    id: n.id,
    board_id: board.id,
    name: n.name,
    parent_id: n.parentId,
    position_x: n.position.x,
    position_y: n.position.y,
    note: n.note ?? '',
  })
}

const { data: existingConn } = await sb
  .from('connections')
  .select('id')
  .eq('board_id', board.id)
for (const c of existingConn ?? []) {
  if (!board.connections?.find((x) => x.id === c.id)) {
    await sb.from('connections').delete().eq('id', c.id)
  }
}
for (const c of board.connections ?? []) {
  await sb.from('connections').upsert({
    id: c.id,
    board_id: board.id,
    source: c.source,
    target: c.target,
  })
}

console.log(`Seeded board ${board.id} with ${board.nodes.length} nodes`)
