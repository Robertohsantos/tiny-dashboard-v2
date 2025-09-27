'use client'

/**
 * Dashboard Content Component with Validated Hooks
 * This is the migrated version using Zod validation for runtime type safety
 * Includes telemetry tracking and fallback support
 */

import * as React from 'react'
import { ChartAreaInteractive } from './chart-area-interactive'
import { SectionCards } from './section-cards'
import { SectionMetrics } from './section-metrics'
import { ShippingDifferenceMetric } from './shipping-difference-metric'
import { PeriodFilterSimple } from './period-filter-simple'
import { DashboardLoadingSkeleton } from './dashboard-loading'
import { DashboardErrorBoundary } from '@/modules/dashboard/components/dashboard-error-boundary'
import { usePeriod } from './period-context'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useDashboardDataValidated,
  type DashboardDataValidated,
} from '@/modules/dashboard/hooks/data/use-dashboard-data-validated'
import { validationTelemetry } from '@/modules/core/monitoring/validation-telemetry'
import { FEATURE_FLAGS } from '@/modules/core/utils/feature-flags'
import type { ValidationError } from '@/modules/core/utils/validation'
import { Badge } from '@/components/ui/badge'

interface DashboardContentValidatedProps {
  /** Initial data for SSR and fallback */
  initialData: any // Using any since initial data might not be validated
}

/**
 * Dashboard Content component using validated hooks
 * Features:
 * - Runtime type validation with Zod
 * - Automatic error tracking with telemetry
 * - Smart fallback to initial data
 * - Visual indicators for validation status
 */
export function DashboardContentValidated({
  initialData,
}: DashboardContentValidatedProps) {
  const componentName = 'dashboard-content-validated'
  const startTime = React.useRef(Date.now())

  const { periodType, startDate, endDate, setPeriod } = usePeriod()
  const [showValidationStatus, setShowValidationStatus] = React.useState(
    FEATURE_FLAGS.VALIDATION_DEBUG,
  )

  // Use validated hook with fallback and telemetry
  const { data, isLoading, isError, validationErrors, queries } =
    useDashboardDataValidated({ startDate, endDate } as any, {
      fallbackData: initialData,
      onValidationError: (errors: ValidationError[]) => {
        // Track validation errors in telemetry
        errors.forEach((error) => {
          validationTelemetry.trackValidationError(error, componentName)
        })

        // Use fallback data
        if (FEATURE_FLAGS.VALIDATION_FALLBACK && initialData) {
          validationTelemetry.trackFallbackUsage(
            componentName,
            `${errors.length} validation error(s)`,
          )
        }
      },
    })

  // Track successful validation
  React.useEffect(() => {
    if (data && !isLoading && !isError) {
      const duration = Date.now() - startTime.current
      const dataSize = JSON.stringify(data).length
      validationTelemetry.trackValidationSuccess(
        componentName,
        duration,
        dataSize,
      )
    }
  }, [data, isLoading, isError])

  // Determine what data to display
  const displayData: DashboardDataValidated | undefined = React.useMemo(() => {
    if (data) {
      return data
    }

    if (FEATURE_FLAGS.VALIDATION_FALLBACK && initialData) {
      // Try to use initial data as fallback
      console.warn(
        '[DashboardContentValidated] Using fallback data due to validation errors',
      )
      return initialData as DashboardDataValidated
    }

    return undefined
  }, [data, initialData])

  // Calculate validation health
  const validationHealth = React.useMemo(() => {
    if (!validationErrors || validationErrors.length === 0) {
      return 'healthy'
    }
    if (validationErrors.length <= 2) {
      return 'warning'
    }
    return 'error'
  }, [validationErrors])

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back to your analytics dashboard
              {FEATURE_FLAGS.VALIDATION_DEBUG && (
                <Badge
                  variant="outline"
                  className="ml-2 text-xs"
                  onClick={() => setShowValidationStatus(!showValidationStatus)}
                >
                  Validated Mode
                </Badge>
              )}
            </p>
          </div>

          {/* Validation Status Indicator */}
          {showValidationStatus && (
            <div className="flex items-center gap-2">
              {validationHealth === 'healthy' ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Validation OK
                </Badge>
              ) : validationHealth === 'warning' ? (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-600"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Partial Validation
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-red-600 border-red-600"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Validation Errors
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <PeriodFilterSimple value={periodType} onPeriodChange={setPeriod} />
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationErrors &&
        validationErrors.length > 0 &&
        !FEATURE_FLAGS.VALIDATION_FALLBACK && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Encontramos {validationErrors.length} erro(s) de validação nos
              dados.
              {FEATURE_FLAGS.VALIDATION_DEBUG && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer">Ver detalhes</summary>
                  <pre className="mt-1 overflow-auto">
                    {JSON.stringify(validationErrors, null, 2)}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

      {/* Fallback Notice */}
      {validationErrors &&
        validationErrors.length > 0 &&
        FEATURE_FLAGS.VALIDATION_FALLBACK &&
        displayData && (
          <Alert variant="default" className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Usando dados em cache devido a problemas de validação. Os dados
              podem estar desatualizados.
            </AlertDescription>
          </Alert>
        )}

      {isLoading ? (
        <DashboardLoadingSkeleton />
      ) : displayData ? (
        <DashboardErrorBoundary>
          <SectionCards metrics={displayData.metrics} />
          <ChartAreaInteractive
            data={displayData.chartData}
            periodType={periodType}
          />
          <SectionMetrics metrics={displayData.financialMetrics} />
          <ShippingDifferenceMetric data={displayData.shippingDifference} />
        </DashboardErrorBoundary>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível carregar os dados do dashboard. Por favor, tente
            novamente mais tarde.
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Panel */}
      {FEATURE_FLAGS.VALIDATION_DEBUG && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold mb-2">Debug Info</h3>
          <div className="text-xs space-y-1">
            <div>Component: {componentName}</div>
            <div>Validation Errors: {validationErrors?.length || 0}</div>
            <div>Using Fallback: {!data && displayData ? 'Yes' : 'No'}</div>
            <div>
              Query Status:
              {Object.entries(queries).map(([key, query]) => (
                <span key={key} className="ml-2">
                  {key}: {query.isSuccess ? '✅' : query.isError ? '❌' : '⏳'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
