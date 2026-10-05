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
      className={`schema-node group relative rounded-lg border px-3 py-2.5 shadow-md transition-shadow ${
        selected ? 'selected ring-2 ring-[color-mix(in_srgb,var(--text)_25%,transparent)]' : 'hover:shadow-lg'
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

      <div className="schema-node-title pr-2">{nodeData.label}</div>

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
          className="schema-node-add-child flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-medium leading-none shadow-sm"
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
