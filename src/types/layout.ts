export type BoardLayoutType =
  | 'vertical-tree'
  | 'horizontal-tree'
  | 'compact-tree'
  | 'radial'
  | 'mind-map'
  | 'org-chart'
  | 'freeform'

export const BOARD_LAYOUT_OPTIONS: {
  id: BoardLayoutType
  label: string
}[] = [
  { id: 'vertical-tree', label: 'Vertical Tree' },
  { id: 'horizontal-tree', label: 'Horizontal Tree' },
  { id: 'compact-tree', label: 'Compact Tree' },
  { id: 'radial', label: 'Radial' },
  { id: 'mind-map', label: 'Mind Map' },
  { id: 'org-chart', label: 'Org Chart' },
  { id: 'freeform', label: 'Freeform' },
]

export const DEFAULT_BOARD_LAYOUT: BoardLayoutType = 'vertical-tree'
