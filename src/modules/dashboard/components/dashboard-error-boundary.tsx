/**
 * Error Boundary for Dashboard
 * Provides graceful error handling and recovery options
 */

'use client'

import * as React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Props for error fallback component
 */
interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error
  /** Function to reset the error boundary */
  resetErrorBoundary: () => void
}

/**
 * Fallback component shown when an error occurs
 */
export function DashboardErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  React.useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Replace with your error monitoring service
      console.error('[Dashboard Error]', error)
    }
  }, [error])

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Ops! Algo deu errado</CardTitle>
          </div>
          <CardDescription>
            Encontramos um erro ao carregar o dashboard. Por favor, tente
            novamente.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || 'Erro desconhecido'}
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Detalhes técnicos (desenvolvimento)
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted p-2 text-xs">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
          >
            Ir para Início
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Props for DashboardErrorBoundary component
 */
interface DashboardErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode
  /** Optional fallback component */
  fallback?: React.ComponentType<ErrorFallbackProps>
  /** Optional error handler */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * State for error boundary
 */
interface DashboardErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean
  /** The error that was caught */
  error?: Error
}

/**
 * Error Boundary component for dashboard
 * Catches errors in child components and displays fallback UI
 */
export class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    const { onError } = this.props
    if (onError) {
      onError(error, errorInfo)
    } else if (process.env.NODE_ENV === 'production') {
      // Default error logging in production
      console.error('[Dashboard Error Boundary]', {
        error,
        errorInfo,
        timestamp: new Date().toISOString(),
      })
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DashboardErrorFallback

      return (
        <FallbackComponent
          error={this.state.error || new Error('Unknown error')}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Hook to wrap async operations with error handling
 */
export function useDashboardErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    setError(error)

    // Log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.error('[Dashboard Hook Error]', error)
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
