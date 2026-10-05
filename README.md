# Schema Mapper

Lightweight hierarchical schema whiteboard for UI research (Katalon Studio, etc.).

## Core workflow

```
JSON  →  Import JSON  →  Schema Mapper  →  visual schema
Schema Mapper  →  Export JSON / PNG / PDF
```

**JSON is the schema format.** Cursor can edit files under `data/` directly; import/export in the app uses the same shape.

Hierarchy: `nodes[].parentId`. Relationships: `connections[]` (separate from hierarchy edges).

## Repository layout

```
data/
  boards/
    katalon-example.json      # full example board (Katalon Example)
    katalon-complete.json     # merge target for modules (manual / Cursor)
  katalon-modules/
    file.json
    action.json
    project.json
    …                         # research slices → Import JSON → new board each
```

Importing a module JSON **creates a new board** (does not merge into the current board).

## Persistence

| Mode | When | Behavior |
|------|------|----------|
| **local** (default) | Production / no Supabase | Boards, workspace tree, Markdown/PDF docs in `localStorage` (`schema-mapper-data-v2`) |
| **file** | `npm run dev` without Supabase | Seed from `data/boards/`; optional save back via Vite file API |
| **supabase** | `VITE_USE_SUPABASE=true` + Supabase env | Optional legacy sync (not required for schema work) |

Theme preference: `schema-mapper-theme` in localStorage only.

## Features

- **Layouts:** Vertical Tree, Horizontal Tree, Compact Tree, Radial, Mind Map, Org Chart, Freeform (`layout` on board JSON)
- **Workspace explorer:** folders, boards, Markdown, PDF (sidebar organization ≠ schema `parentId`)
- **Evidence, notes, relationships, board colors, dark mode**

## Run locally

```bash
npm install
npm run dev
```

Optional Supabase (not required):

```bash
cp .env.example .env
# VITE_USE_SUPABASE=true
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

## Build

```bash
npm run build
```
