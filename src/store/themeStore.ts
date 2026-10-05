import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface ThemeStore {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        applyTheme(next)
        set({ theme: next })
      },
    }),
    {
      name: 'schema-mapper-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)
