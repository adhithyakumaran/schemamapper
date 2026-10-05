# Schema Mapper

A lightweight internal whiteboard for mapping hierarchical UI/application structure (for example, menus and panels in tools like Katalon Studio).

## Features

- Multiple independent boards (create, rename, delete, open)
- Canvas with pan, zoom, fit, movable nodes, and parent→child connectors
- Structured node data (`parentId`, positions, notes, optional screenshot attachments)
- Browser persistence via `localStorage`
- JSON import / export per board

## Tech stack

- React + TypeScript + Vite
- [@xyflow/react](https://reactflow.dev/) for the canvas
- Zustand for centralized schema state

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default port `43123`).

## Build

```bash
npm run build
npm run preview
```

## Data model

Each board stores `nodes` and derived `edges`. Nodes include `id`, `name`, `parentId`, `position`, `note`, and `image` (base64 data URL when a screenshot is attached).

Export produces a single JSON file suitable for tooling or later automation.
