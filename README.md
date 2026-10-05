# Schema Mapper

A lightweight internal whiteboard for mapping hierarchical UI/application structure.

**The schema is the source of truth.** The canvas only renders structured data (`nodes` with `parentId` relationships).

## Schema files (Cursor-friendly)

Boards live as human-readable JSON under:

```
data/boards/
├── _registry.json          # board id → filename mapping
├── katalon-example.json    # sample Katalon menu tree
└── …                       # one file per board
```

Example node:

```json
{
  "id": "node-file",
  "name": "File",
  "parentId": "node-menu-bar",
  "position": { "x": 100, "y": 200 },
  "note": "",
  "screenshot": null
}
```

You can edit these files directly in the repo; restart dev or refresh after changes. While `npm run dev` is running, UI edits are also written back to `data/boards/` via the dev API.

## Architecture

```
data/boards/*.json  →  schemaService  →  Zustand store  →  React Flow canvas
```

- `src/services/schemaService.ts` — all board/node mutations (create, add child, move, notes, screenshots, import/export)
- `src/services/persistence.ts` — load/save boards from `data/boards` (dev server)
- `src/store/schemaStore.ts` — thin UI state + debounced file sync

Hierarchy is **only** from `parentId`. Connectors on the canvas are derived at render time.

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:43123

## Build

```bash
npm run build
```

Static builds copy `data/boards/` into `dist/data/boards/` for read-only reference. Use Export/Import or the dev server for round-tripping edits.

## Tech

React, TypeScript, Vite, @xyflow/react, Zustand
