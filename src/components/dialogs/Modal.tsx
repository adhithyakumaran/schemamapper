import { useEffect } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  widthClass?: string
}

export function Modal({
  title,
  onClose,
  children,
  widthClass = 'max-w-md',
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`themed-modal w-full ${widthClass} rounded-lg border shadow-xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
