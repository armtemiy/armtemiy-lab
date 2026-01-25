import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="text-2xl font-bold text-[color:var(--error)]">Что-то сломалось 😔</h1>
          <div className="mt-4 max-h-[60vh] w-full overflow-auto rounded-lg bg-black/50 p-4 text-left text-xs font-mono text-gray-300">
            <p className="font-bold text-red-400 mb-2">{this.state.error?.toString()}</p>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </div>
          <button
            className="btn-primary mt-6"
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
