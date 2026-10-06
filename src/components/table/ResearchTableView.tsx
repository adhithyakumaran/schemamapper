import { useCallback, useMemo, useState } from 'react'
import { nodeDisplayIcon } from '../../lib/nodePresentation'
import {
  researchColumnsForBoard,
  researchField,
} from '../../lib/researchColumns'
import {
  orderedResearchRows,
  resolveParentIdByName,
} from '../../lib/researchTable'
import { boardUiForBoard } from '../../store/stableDefaults'
import { useSchemaStore } from '../../store/schemaStore'
import type { Board } from '../../types/schema'
const DEFAULT_COL_WIDTHS: Record<string, number> = {
  num: 44,
  level: 52,
  feature: 220,
  parent: 140,
  notes: 72,
  evidence: 88,
  actions: 72,
}

export function ResearchTableView({ board }: { board: Board }) {
  const rows = useMemo(() => orderedResearchRows(board), [board])
  const extraCols = useMemo(() => researchColumnsForBoard(board), [board])
  const ui = useSchemaStore((s) => boardUiForBoard(s.boardUiState, board.id))
  const updateNode = useSchemaStore((s) => s.updateNode)
  const updateNodeResearch = useSchemaStore((s) => s.updateNodeResearch)
  const setSelected = useSchemaStore((s) => s.setTreeSelectedNode)
  const setDetailPanel = useSchemaStore((s) => s.setBoardDetailPanel)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const addResearchColumn = useSchemaStore((s) => s.addResearchColumn)
  const [addingCol, setAddingCol] = useState(false)
  const [newColLabel, setNewColLabel] = useState('')

  const widths = { ...DEFAULT_COL_WIDTHS, ...(ui.columnWidths ?? {}) }

  const commitParent = useCallback(
    (nodeId: string, parentName: string) => {
      const parentId = resolveParentIdByName(board, nodeId, parentName)
      if (parentName.trim() && parentName !== '—' && parentId === null) return
      updateNode(nodeId, { parentId })
    },
    [board, updateNode],
  )

  const submitNewColumn = () => {
    const label = newColLabel.trim()
    if (!label) return
    addResearchColumn(board.id, label)
    setNewColLabel('')
    setAddingCol(false)
  }

  return (
    <div className="research-table-wrap min-h-0 flex-1 overflow-auto p-3 md:p-5">
      <div className="research-table-surface overflow-x-auto rounded-lg border">
        <table className="research-table w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr>
              <th style={{ width: widths.num }} className="research-th sticky-th">#</th>
              <th style={{ width: widths.level }} className="research-th sticky-th">Level</th>
              <th style={{ width: widths.feature }} className="research-th sticky-th">
                Feature / Component
              </th>
              <th style={{ width: widths.parent }} className="research-th sticky-th">Parent</th>
              {extraCols.map((col) => (
                <th
                  key={col.id}
                  style={{ width: widths[col.id] ?? 120 }}
                  className="research-th sticky-th"
                >
                  {col.label}
                </th>
              ))}
              <th style={{ width: widths.notes }} className="research-th sticky-th">Notes</th>
              <th style={{ width: widths.evidence }} className="research-th sticky-th">Evidence</th>
              <th style={{ width: widths.actions }} className="research-th sticky-th">
                <button
                  type="button"
                  className="research-add-col"
                  title="Add column"
                  onClick={() => setAddingCol((v) => !v)}
                >
                  +
                </button>
              </th>
            </tr>
            {addingCol ? (
              <tr>
                <th colSpan={extraCols.length + 7} className="research-th">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <input
                      className="themed-input rounded px-2 py-1 text-xs"
                      placeholder="Column name"
                      value={newColLabel}
                      onChange={(e) => setNewColLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitNewColumn()
                      }}
                    />
                    <button type="button" className="toolbar-btn text-xs" onClick={submitNewColumn}>
                      Add
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn text-xs"
                      onClick={() => setAddingCol(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </th>
              </tr>
            ) : null}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={extraCols.length + 7} className="research-td p-6 text-center themed-muted">
                  No nodes yet. Use + Node to add a root.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const { node, level, index, parentName } = row
                const selected = ui.selectedNodeId === node.id
                const hasNote = Boolean(node.note?.trim())
                const shotCount = node.screenshots.length
                const icon = nodeDisplayIcon(node.name)
                return (
                  <tr
                    key={node.id}
                    className={`research-tr ${selected ? 'research-tr-selected' : ''}`}
                    onClick={() => setSelected(board.id, node.id)}
                  >
                    <td className="research-td research-td-num">{index}</td>
                    <td className="research-td">{level}</td>
                    <td className="research-td">
                      <div
                        className="research-feature-cell"
                        style={{ paddingLeft: `${level * 14}px` }}
                      >
                        {icon ? (
                          <span className="ui-glyph mr-1" aria-hidden>{icon}</span>
                        ) : null}
                        <EditableCell
                          value={node.name}
                          onCommit={(v) => updateNode(node.id, { name: v.trim() || node.name })}
                        />
                      </div>
                    </td>
                    <td className="research-td">
                      <EditableCell
                        value={parentName}
                        onCommit={(v) => commitParent(node.id, v)}
                      />
                    </td>
                    {extraCols.map((col) => (
                      <td key={col.id} className="research-td">
                        <EditableCell
                          value={researchField(node, col.id)}
                          onCommit={(v) =>
                            updateNodeResearch(node.id, { [col.id]: v })
                          }
                        />
                      </td>
                    ))}
                    <td className="research-td research-td-actions">
                      <button
                        type="button"
                        className={`research-icon-btn ${hasNote ? 'research-icon-btn-active' : ''}`}
                        title="Note"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDialog({ type: 'note', nodeId: node.id })
                        }}
                      >
                        📝
                      </button>
                    </td>
                    <td className="research-td research-td-actions">
                      <button
                        type="button"
                        className={`research-icon-btn ${shotCount ? 'research-icon-btn-active' : ''}`}
                        title="Evidence"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailPanel(board.id, {
                            kind: 'evidence',
                            nodeId: node.id,
                            imageIndex: 0,
                          })
                        }}
                      >
                        📷{shotCount > 0 ? ` ${shotCount}` : ''}
                      </button>
                    </td>
                    <td className="research-td research-td-actions">
                      <button
                        type="button"
                        className="research-icon-btn"
                        title="More"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDialog({
                            type: 'nodeMenu',
                            nodeId: node.id,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }}
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EditableCell({
  value,
  onCommit,
}: {
  value: string
  onCommit: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editing) {
    return (
      <button
        type="button"
        className="research-cell-btn"
        onClick={(e) => {
          e.stopPropagation()
          setDraft(value)
          setEditing(true)
        }}
      >
        {value || <span className="themed-muted">—</span>}
      </button>
    )
  }

  return (
    <input
      className="themed-input research-cell-input w-full rounded px-1.5 py-0.5 text-xs"
      autoFocus
      value={draft}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false)
        if (draft !== value) onCommit(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      }}
    />
  )
}
