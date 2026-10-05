# Schema Mapper

Internal hierarchical UI schema whiteboard.

## Persistence (production)

| Layer | Role |
|--------|------|
| **Supabase Postgres** | Live boards, nodes, connections, evidence metadata |
| **Supabase Storage** (`schema-evidence`) | Screenshot files |
| **`data/boards/*.json`** | Portable / versioned schema for Cursor (not auto-synced to Supabase) |

### Vercel environment variables

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Do not commit secrets. Do not use the service role key in the frontend.

### Database setup

Run `supabase/migrations/001_schema_mapper.sql` in the Supabase SQL editor (tables, RLS, storage bucket).

**RLS:** permissive anon policies for internal research — tighten before any public deployment.

### Seed Katalon board

**Automatic:** On first load, if Supabase has no boards, the app upserts `data/boards/katalon-example.json`.

**Manual (CLI):**

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-supabase.mjs
```

### Local development

- **With Supabase env vars:** same as production (Supabase is authoritative).
- **Without Supabase:** `npm run dev` uses the Vite file API (`data/boards/`) when available.

`localStorage` stores only **active board id** (UI preference). Board schema is **not** persisted in localStorage.

### Sync

- **Import JSON** → normalizes → **Supabase** (production) or files (dev).
- **Export JSON / PDF / PNG** → from current in-memory board (loaded from Supabase in production).
- **Reload** (toolbar, when using Supabase) → refetch from server.

## Run locally

```bash
npm install
cp .env.example .env   # add Supabase keys for production-like dev
npm run dev
```

## Build

```bash
npm run build
```

## Architecture

```
Supabase / dev files  →  schemaService  →  Zustand  →  React Flow
```

Hierarchy: `parentId`. Cross-links: `board.connections[]`.
