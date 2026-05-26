import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation, faRotateRight } from '@fortawesome/free-solid-svg-icons'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-sm dark:bg-card text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl" />
            </div>
            
            <h1 className="text-base font-bold text-foreground">
              Đã xảy ra lỗi không mong muốn
            </h1>
            
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Ứng dụng đã gặp sự cố không thể tự phục hồi. Vui lòng tải lại trang hoặc thử lại sau.
            </p>

            {this.state.error && (
              <div className="mt-4 rounded bg-secondary/50 p-3 text-left font-mono text-[10px] text-muted-foreground max-h-32 overflow-auto border border-border">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center justify-center space-x-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary/95 transition-colors"
            >
              <FontAwesomeIcon icon={faRotateRight} />
              <span>Tải lại trang</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
