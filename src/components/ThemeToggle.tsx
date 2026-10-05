import { useThemeStore } from '../store/themeStore'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  return (
    <button
      type="button"
      className="toolbar-btn rounded-md border px-2 py-1"
      style={{ borderColor: 'var(--border)' }}
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? '☾' : '☀'}
    </button>
  )
}
