import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { useSchemaStore } from '../../store/schemaStore'

export type SchemaNodeData = {
  label: string
  schemaNodeId: string
  hasNote: boolean
  evidenceCount: number
}

function SchemaNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as SchemaNodeData
  const setDialog = useSchemaStore((s) => s.setDialog)

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDialog({
      type: 'nodeMenu',
      nodeId: nodeData.schemaNodeId,
      x: e.clientX,
      y: e.clientY,
    })
  }

  return (
    <div
      className={`schema-node group relative min-w-[180px] max-w-[240px] rounded-lg border bg-white px-3 py-2.5 shadow-md transition-shadow ${
        selected
          ? 'border-slate-800 ring-2 ring-slate-400/60 shadow-lg'
          : 'border-slate-400/80 hover:border-slate-500 hover:shadow-lg'
      }`}
      onContextMenu={openMenu}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="hierarchy-in"
        isConnectable={false}
        className="schema-handle hierarchy-handle !top-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="rel-target"
        className="schema-handle rel-handle rel-handle-target"
        title="Relationship target"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="rel-source"
        className="schema-handle rel-handle rel-handle-source"
        title="Drag to link relationship"
      />

      <div className="font-semibold text-sm text-slate-900 pr-2 break-words leading-snug">
        {nodeData.label}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {nodeData.hasNote && (
            <button
              type="button"
              title="Has note — open Edit"
              className="schema-node-icon"
              onClick={(e) => {
                e.stopPropagation()
                setDialog({ type: 'edit', nodeId: nodeData.schemaNodeId })
              }}
            >
              📝
            </button>
          )}
          {nodeData.evidenceCount > 0 && (
            <button
              type="button"
              title="View evidence — open Edit"
              className="schema-node-evidence"
              onClick={(e) => {
                e.stopPropagation()
                setDialog({ type: 'edit', nodeId: nodeData.schemaNodeId })
              }}
            >
              <span aria-hidden>📷</span>
              <span>{nodeData.evidenceCount}</span>
            </button>
          )}
        </div>
        <button
          type="button"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-400 bg-white text-slate-800 text-sm font-medium leading-none shadow-sm hover:bg-slate-50"
          title="Add child (hierarchy)"
          onClick={(e) => {
            e.stopPropagation()
            setDialog({ type: 'addChild', parentId: nodeData.schemaNodeId })
          }}
        >
          +
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="hierarchy-out"
        isConnectable={false}
        className="schema-handle hierarchy-handle !bottom-0"
      />
    </div>
  )
}

export const SchemaNode = memo(SchemaNodeComponent)
