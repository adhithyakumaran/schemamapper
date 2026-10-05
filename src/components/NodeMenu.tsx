import { useEffect, useRef } from 'react'
import { useSchemaStore } from '../store/schemaStore'

export function NodeMenu() {
  const dialog = useSchemaStore((s) => s.dialog)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOpen = dialog?.type === 'nodeMenu'

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDialog(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialog(null)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, setDialog])

  if (!isOpen || dialog?.type !== 'nodeMenu') return null

  const { nodeId, x, y } = dialog

  const item = (label: string, onClick: () => void) => (
    <button
      type="button"
      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
      onClick={() => {
        setDialog(null)
        onClick()
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      {item('Edit', () => setDialog({ type: 'edit', nodeId }))}
      {item('Add Child', () => setDialog({ type: 'addChild', parentId: nodeId }))}
      {item('Add Note', () => setDialog({ type: 'note', nodeId }))}
      {item('Edit / Evidence', () => setDialog({ type: 'edit', nodeId }))}
      {item('Delete', () => setDialog({ type: 'deleteNode', nodeId }))}
    </div>
  )
}
