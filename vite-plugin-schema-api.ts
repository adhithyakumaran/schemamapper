import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const BOARDS_DIR = path.resolve(process.cwd(), 'data/boards')
const REGISTRY_FILE = path.join(BOARDS_DIR, '_registry.json')

function ensureBoardsDir() {
  fs.mkdirSync(BOARDS_DIR, { recursive: true })
}

function readRegistry(): { entries: { boardId: string; file: string }[] } {
  ensureBoardsDir()
  if (!fs.existsSync(REGISTRY_FILE)) {
    return { entries: [] }
  }
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'))
}

function writeRegistry(registry: { entries: { boardId: string; file: string }[] }) {
  ensureBoardsDir()
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2))
}

function readBoardFile(file: string): unknown {
  const filePath = path.join(BOARDS_DIR, file)
  if (!filePath.startsWith(BOARDS_DIR) || !fs.existsSync(filePath)) {
    return null
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function writeBoardFile(file: string, body: string) {
  ensureBoardsDir()
  const safeName = path.basename(file)
  if (!safeName.endsWith('.json') || safeName.startsWith('_')) {
    throw new Error('Invalid board filename')
  }
  const filePath = path.join(BOARDS_DIR, safeName)
  fs.writeFileSync(filePath, body)
}

function deleteBoardFile(file: string) {
  const safeName = path.basename(file)
  const filePath = path.join(BOARDS_DIR, safeName)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

function sendJson(res: import('http').ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

async function readBody(req: import('http').IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

export function schemaApiPlugin(): Plugin {
  return {
    name: 'schema-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url?.startsWith('/api/schema')) return next()

        try {
          if (url === '/api/schema/registry' && req.method === 'GET') {
            sendJson(res, 200, readRegistry())
            return
          }

          if (url === '/api/schema/boards' && req.method === 'GET') {
            const registry = readRegistry()
            const boardFiles: Record<string, string> = {}
            const boards: unknown[] = []
            for (const entry of registry.entries) {
              const board = readBoardFile(entry.file)
              if (board) {
                boards.push(board)
                boardFiles[entry.boardId] = entry.file
              }
            }
            sendJson(res, 200, { boards, boardFiles })
            return
          }

          if (url === '/api/schema/boards' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req)) as {
              file: string
              board: { id: string; name: string }
            }
            const file = path.basename(body.file)
            writeBoardFile(file, JSON.stringify(body.board, null, 2))
            const registry = readRegistry()
            if (!registry.entries.find((e) => e.boardId === body.board.id)) {
              registry.entries.push({ boardId: body.board.id, file })
              writeRegistry(registry)
            }
            sendJson(res, 201, { ok: true })
            return
          }

          const fileMatch = url.match(/^\/api\/schema\/boards\/([^/]+)$/)
          if (fileMatch) {
            const file = decodeURIComponent(fileMatch[1])
            if (req.method === 'PUT') {
              const body = await readBody(req)
              writeBoardFile(file, body)
              const parsed = JSON.parse(body) as { id: string }
              const registry = readRegistry()
              if (!registry.entries.find((e) => e.boardId === parsed.id)) {
                registry.entries.push({ boardId: parsed.id, file: path.basename(file) })
                writeRegistry(registry)
              }
              sendJson(res, 200, { ok: true })
              return
            }
            if (req.method === 'DELETE') {
              deleteBoardFile(file)
              const registry = readRegistry()
              registry.entries = registry.entries.filter((e) => e.file !== path.basename(file))
              writeRegistry(registry)
              sendJson(res, 200, { ok: true })
              return
            }
          }

          sendJson(res, 404, { error: 'Not found' })
        } catch (err) {
          sendJson(res, 500, {
            error: err instanceof Error ? err.message : 'Server error',
          })
        }
      })
    },
    closeBundle() {
      ensureBoardsDir()
      if (fs.existsSync(BOARDS_DIR)) {
        const outDir = path.resolve(process.cwd(), 'dist/data/boards')
        fs.mkdirSync(outDir, { recursive: true })
        for (const name of fs.readdirSync(BOARDS_DIR)) {
          if (name.endsWith('.json')) {
            fs.copyFileSync(
              path.join(BOARDS_DIR, name),
              path.join(outDir, name),
            )
          }
        }
      }
      const modulesDir = path.resolve(process.cwd(), 'data/katalon-modules')
      if (fs.existsSync(modulesDir)) {
        const outModules = path.resolve(process.cwd(), 'dist/data/katalon-modules')
        fs.mkdirSync(outModules, { recursive: true })
        for (const name of fs.readdirSync(modulesDir)) {
          if (name.endsWith('.json')) {
            fs.copyFileSync(
              path.join(modulesDir, name),
              path.join(outModules, name),
            )
          }
        }
      }
    },
  }
}
