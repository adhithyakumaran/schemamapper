export type BoardLayoutType =
  | 'nested-tree'
  | 'freeform'
  | 'vertical-tree'
  | 'horizontal-tree'
  | 'compact-tree'
  | 'radial'
  | 'mind-map'
  | 'org-chart'

export const PRIMARY_LAYOUT_OPTIONS: {
  id: BoardLayoutType
  label: string
}[] = [
  { id: 'nested-tree', label: 'Nested Tree' },
  { id: 'freeform', label: 'Freeform' },
]

export const EXPERIMENTAL_LAYOUT_OPTIONS: {
  id: BoardLayoutType
  label: string
}[] = [
  { id: 'vertical-tree', label: 'Vertical Tree (experimental)' },
  { id: 'horizontal-tree', label: 'Horizontal Tree (experimental)' },
  { id: 'compact-tree', label: 'Compact Tree (experimental)' },
  { id: 'radial', label: 'Radial (experimental)' },
  { id: 'mind-map', label: 'Mind Map (experimental)' },
  { id: 'org-chart', label: 'Org Chart (experimental)' },
]

export const DEFAULT_BOARD_LAYOUT: BoardLayoutType = 'nested-tree'

const LEGACY_GRAPH_LAYOUTS = new Set([
  'vertical-tree',
  'horizontal-tree',
  'compact-tree',
  'radial',
  'mind-map',
  'org-chart',
])

/** Map stored layout to a supported mode (legacy graph layouts → nested tree). */
export function normalizeBoardLayout(
  layout: string | undefined,
): BoardLayoutType {
  if (!layout) return DEFAULT_BOARD_LAYOUT
  if (layout === 'freeform') return 'freeform'
  if (layout === 'nested-tree') return 'nested-tree'
  if (LEGACY_GRAPH_LAYOUTS.has(layout)) return 'nested-tree'
  const all = [...PRIMARY_LAYOUT_OPTIONS, ...EXPERIMENTAL_LAYOUT_OPTIONS]
  if (all.some((o) => o.id === layout)) return layout as BoardLayoutType
  return DEFAULT_BOARD_LAYOUT
}

export function isGraphLayout(layout: BoardLayoutType): boolean {
  return layout !== 'nested-tree' && layout !== 'freeform'
}
