import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { useSchemaStore } from '../../store/schemaStore'

export type SchemaNodeData = {
  label: string
  schemaNodeId: string
  hasNote: boolean
  hasImage: boolean
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
      className={`schema-node relative min-w-[160px] max-w-[220px] rounded-md border bg-white shadow-sm ${
        selected ? 'border-slate-800 ring-2 ring-slate-300' : 'border-slate-300'
      }`}
      onContextMenu={openMenu}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <div className="px-3 py-2.5">
        <div className="font-medium text-sm text-slate-800 pr-6 break-words">
          {nodeData.label}
        </div>
        {(nodeData.hasNote || nodeData.hasImage) && (
          <div className="mt-1 flex gap-2 text-[10px] uppercase tracking-wide text-slate-500">
            {nodeData.hasNote && <span>Note</span>}
            {nodeData.hasImage && <span>Screenshot</span>}
          </div>
        )}
      </div>
      <button
        type="button"
        className="absolute -bottom-3 right-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow hover:bg-slate-50 text-sm leading-none"
        title="Add child"
        onClick={(e) => {
          e.stopPropagation()
          setDialog({ type: 'addChild', parentId: nodeData.schemaNodeId })
        }}
      >
        +
      </button>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  )
}

export const SchemaNode = memo(SchemaNodeComponent)
