import { BOARD_COLOR_PRESETS } from '../types/schema'
import { useSchemaStore } from '../store/schemaStore'

export function BoardColorPicker() {
  const board = useSchemaStore((s) =>
    s.boards.find((b) => b.id === s.activeBoardId) ?? null,
  )
  const setBoardColor = useSchemaStore((s) => s.setBoardColor)
  if (!board) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Board color
      </span>
      {BOARD_COLOR_PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          title={preset.label}
          className={`h-5 w-5 rounded-full border ${
            board.color === preset.value
              ? 'border-slate-700 ring-1 ring-slate-400'
              : 'border-slate-300'
          }`}
          style={{ backgroundColor: preset.value }}
          onClick={() => setBoardColor(board.id, preset.value)}
        />
      ))}
      <input
        type="color"
        title="Custom board color"
        className="h-6 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0"
        value={board.color}
        onChange={(e) => setBoardColor(board.id, e.target.value)}
      />
    </div>
  )
}
