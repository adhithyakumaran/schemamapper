import { useEffect, useRef, useState } from 'react'
import {
  BOARD_LAYOUT_OPTIONS,
  type BoardLayoutType,
} from '../types/layout'
import { useSchemaStore } from '../store/schemaStore'

export function LayoutSelector() {
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  const setBoardLayout = useSchemaStore((s) => s.setBoardLayout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  if (!board) return null

  const active = board.layout ?? 'vertical-tree'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => setOpen((o) => !o)}
      >
        Layout ▾
      </button>
      {open && (
        <div className="themed-menu absolute left-0 top-full z-30 mt-1 min-w-[168px] rounded-md border py-1 shadow-lg">
          {BOARD_LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="themed-menu-item flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs"
              onClick={() => {
                setBoardLayout(board.id, opt.id as BoardLayoutType)
                setOpen(false)
              }}
            >
              <span>{opt.label}</span>
              {active === opt.id ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
