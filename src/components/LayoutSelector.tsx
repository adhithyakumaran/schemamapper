import { useEffect, useRef, useState } from 'react'
import {
  EXPERIMENTAL_LAYOUT_OPTIONS,
  PRIMARY_LAYOUT_OPTIONS,
  normalizeBoardLayout,
  type BoardLayoutType,
} from '../types/layout'
import { useSchemaStore } from '../store/schemaStore'

export function LayoutSelector() {
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  const setBoardLayout = useSchemaStore((s) => s.setBoardLayout)
  const [open, setOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
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

  const active = normalizeBoardLayout(board.layout)

  const pick = (id: BoardLayoutType) => {
    setBoardLayout(board.id, id)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => setOpen((o) => !o)}
      >
        Advanced ▾
      </button>
      {open && (
        <div className="themed-menu absolute left-0 top-full z-30 mt-1 min-w-[200px] rounded-md border py-1 shadow-lg">
          {PRIMARY_LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="themed-menu-item flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs"
              onClick={() => pick(opt.id)}
            >
              <span>{opt.label}</span>
              {active === opt.id ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
          <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
          <button
            type="button"
            className="themed-menu-item block w-full px-3 py-1 text-left text-[10px] uppercase tracking-wide themed-muted"
            onClick={() => setShowAdvanced((s) => !s)}
          >
            {showAdvanced ? '▾' : '▸'} Advanced / Experimental
          </button>
          {showAdvanced &&
            EXPERIMENTAL_LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="themed-menu-item flex w-full items-center justify-between gap-2 px-3 py-1.5 pl-5 text-left text-xs themed-muted"
                onClick={() => pick(opt.id)}
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
