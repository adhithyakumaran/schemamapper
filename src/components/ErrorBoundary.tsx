import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-red-600">
            Something went wrong loading Schema Mapper.
          </p>
          <p className="max-w-md text-xs themed-muted">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="btn-primary rounded-md px-3 py-1.5 text-sm"
            onClick={() => {
              try {
                localStorage.removeItem('schema-mapper-data-v2')
              } catch {
                /* ignore */
              }
              window.location.reload()
            }}
          >
            Reset local data & reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
