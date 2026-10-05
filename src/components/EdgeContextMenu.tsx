import { useEffect, useRef } from 'react'
import { useSchemaStore } from '../store/schemaStore'

export function EdgeContextMenu() {
  const menu = useSchemaStore((s) => s.edgeMenu)
  const setEdgeMenu = useSchemaStore((s) => s.setEdgeMenu)
  const removeConnection = useSchemaStore((s) => s.removeConnection)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setEdgeMenu(null)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [menu, setEdgeMenu])

  if (!menu) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-md border border-slate-200 bg-white py-1 shadow-lg"
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        type="button"
        className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
        onClick={() => {
          removeConnection(menu.connectionId)
          setEdgeMenu(null)
        }}
      >
        Delete Relationship
      </button>
    </div>
  )
}
