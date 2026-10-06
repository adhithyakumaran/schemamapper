import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

function bootstrapTheme() {
  try {
    const raw = localStorage.getItem('schema-mapper-theme')
    if (!raw) return
    const parsed = JSON.parse(raw) as { state?: { theme?: string }; theme?: string }
    const theme = parsed.state?.theme ?? parsed.theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    }
  } catch {
    /* ignore */
  }
}

bootstrapTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
