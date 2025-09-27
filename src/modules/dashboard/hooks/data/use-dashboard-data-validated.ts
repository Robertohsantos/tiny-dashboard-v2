/**
 * Validated hooks for dashboard data fetching with React Query + Zod
 * These hooks use the validated services to ensure runtime type safety
 * Migration from use-dashboard-data.ts with full Zod validation
 */

import * as React from 'react'
import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { dashboardFetchers } from '@/modules/dashboard/services/dashboard.service.validated'
import { queryKeys, PREFETCH_CONFIG } from '@/modules/core/providers/query-provider'
import { ValidationError, logValidationError } from '@/modules/core/utils/validation'
import { validationTelemetry } from '@/modules/core/monitoring/validation-telemetry'
import { toast } from 'sonner'
import type { PeriodFilter } from '@/modules/dashboard/types/dashboard.types'
import type {
  DashboardMetricsValidated,
  DashboardFinancialMetricsValidated,
  ChartDataPointValidated,
  ShippingDifferenceDataValidated,
  DashboardDataValidated,
} from '@/modules/dashboard/schemas/dashboard.schemas'

function callUserOnError(
  handler: ((err: Error) => unknown) | undefined,
  error: Error,
) {
  if (typeof handler === 'function') {
    handler(error)
  }
}

function shouldRetry<TError extends Error>(
  userRetry: UseQueryOptions<unknown, TError>['retry'] | undefined,
  failureCount: number,
  error: TError,
  defaultMaxRetries = 3,
): boolean {
  if (typeof userRetry === 'function') {
    return userRetry(failureCount, error)
  }

  if (typeof userRetry === 'number') {
    return failureCount < userRetry
  }

  if (userRetry === false) {
    return false
  }

  return failureCount < defaultMaxRetries
}

type ValidatedQueryOptions<TData> = {
  enabled?: boolean
  onError?: (error: Error) => unknown
  retry?: UseQueryOptions<TData, Error>['retry']
}

/**
 * Default error handler for validation errors
 * Shows user-friendly toast notifications and tracks telemetry
 */
const handleValidationError = (error: Error, context: string) => {
  if (error instanceof ValidationError) {
    logValidationError(error, { context })

    // Track validation error in telemetry
    validationTelemetry.trackValidationError(error, context)

    // Show user-friendly error message
    toast.error(`Erro ao validar dados: ${context}`, {
      description:
        process.env.NODE_ENV === 'development'
          ? `${error.errors.length} erro(s) de validação encontrado(s)`
          : 'Por favor, tente novamente mais tarde',
    })
  } else {
    // Handle other errors
    console.error(`[${context}] Error:`, error)
    toast.error(`Erro ao carregar ${context}`)
  }
}

/**
 * Validated hook for fetching dashboard sales metrics
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with validated metrics data
 */
export function useDashboardMetricsValidated(
  period?: PeriodFilter,
  options?: ValidatedQueryOptions<DashboardMetricsValidated>,
): UseQueryResult<DashboardMetricsValidated, Error> {
  const startTime = React.useRef<number>(0)
  const { onError: userOnError, retry: userRetry, enabled } = options ?? {}

  const queryOptions = {
    queryKey: queryKeys.metrics(period),
    queryFn: async () => {
      startTime.current = Date.now()
      const data = await dashboardFetchers.metrics(period)
      const duration = Date.now() - (startTime.current ?? Date.now())
      const dataSize = JSON.stringify(data).length

      validationTelemetry.trackValidationSuccess(
        'dashboard-metrics-hook',
        duration,
        dataSize,
      )

      return data
    },
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ValidationError) {
        return false
      }

      return shouldRetry(userRetry, failureCount, error)
    },
    enabled,
  } satisfies UseQueryOptions<DashboardMetricsValidated, Error>

  const queryResult = useQuery(queryOptions)
  const lastErrorRef = React.useRef<Error | null>(null)

  React.useEffect(() => {
    if (queryResult.isError && queryResult.error) {
      if (lastErrorRef.current !== queryResult.error) {
        lastErrorRef.current = queryResult.error
        handleValidationError(queryResult.error, 'métricas do dashboard')
        callUserOnError(userOnError, queryResult.error)
      }
    }
  }, [queryResult.isError, queryResult.error, userOnError])

  return queryResult
}

/**
 * Validated hook for fetching financial metrics
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with validated financial metrics
 */
export function useFinancialMetricsValidated(
  period?: PeriodFilter,
  options?: ValidatedQueryOptions<DashboardFinancialMetricsValidated>,
): UseQueryResult<DashboardFinancialMetricsValidated, Error> {
  const startTime = React.useRef<number>(0)
  const { onError: userOnError, retry: userRetry, enabled } = options ?? {}

  const queryOptions = {
    queryKey: queryKeys.financialMetrics(period),
    queryFn: async () => {
      startTime.current = Date.now()
      const data = await dashboardFetchers.financialMetrics(period)
      const duration = Date.now() - (startTime.current ?? Date.now())
      const dataSize = JSON.stringify(data).length

      validationTelemetry.trackValidationSuccess(
        'financial-metrics-hook',
        duration,
        dataSize,
      )

      return data
    },
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ValidationError) {
        return false
      }

      return shouldRetry(userRetry, failureCount, error)
    },
    enabled,
  } satisfies UseQueryOptions<DashboardFinancialMetricsValidated, Error>

  const queryResult = useQuery(queryOptions)
  const lastErrorRef = React.useRef<Error | null>(null)

  React.useEffect(() => {
    if (queryResult.isError && queryResult.error) {
      if (lastErrorRef.current !== queryResult.error) {
        lastErrorRef.current = queryResult.error
        handleValidationError(queryResult.error, 'métricas financeiras')
        callUserOnError(userOnError, queryResult.error)
      }
    }
  }, [queryResult.isError, queryResult.error, userOnError])

  return queryResult
}

/**
 * Validated hook for fetching chart data
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with validated chart data points
 */
export function useChartDataValidated(
  period?: PeriodFilter,
  options?: ValidatedQueryOptions<ChartDataPointValidated[]>,
): UseQueryResult<ChartDataPointValidated[], Error> {
  const startTime = React.useRef<number>(0)
  const { onError: userOnError, retry: userRetry, enabled } = options ?? {}

  const queryOptions = {
    queryKey: queryKeys.chartData(period),
    queryFn: async () => {
      startTime.current = Date.now()
      const data = await dashboardFetchers.chartData(period)
      const duration = Date.now() - (startTime.current ?? Date.now())
      const dataSize = JSON.stringify(data).length

      validationTelemetry.trackValidationSuccess(
        'chart-data-hook',
        duration,
        dataSize,
      )

      return data
    },
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ValidationError) {
        return false
      }

      return shouldRetry(userRetry, failureCount, error)
    },
    enabled,
  } satisfies UseQueryOptions<ChartDataPointValidated[], Error>

  const queryResult = useQuery(queryOptions)
  const lastErrorRef = React.useRef<Error | null>(null)

  React.useEffect(() => {
    if (queryResult.isError && queryResult.error) {
      if (lastErrorRef.current !== queryResult.error) {
        lastErrorRef.current = queryResult.error
        handleValidationError(queryResult.error, 'dados do gráfico')
        callUserOnError(userOnError, queryResult.error)
      }
    }
  }, [queryResult.isError, queryResult.error, userOnError])

  return queryResult
}

/**
 * Validated hook for fetching shipping difference data
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with validated shipping difference
 */
export function useShippingDifferenceValidated(
  period?: PeriodFilter,
  options?: ValidatedQueryOptions<ShippingDifferenceDataValidated>,
): UseQueryResult<ShippingDifferenceDataValidated, Error> {
  const startTime = React.useRef<number>(0)
  const { onError: userOnError, retry: userRetry, enabled } = options ?? {}

  const queryOptions = {
    queryKey: queryKeys.shippingDifference(period),
    queryFn: async () => {
      startTime.current = Date.now()
      const data = await dashboardFetchers.shippingDifference(period)
      const duration = Date.now() - (startTime.current ?? Date.now())
      const dataSize = JSON.stringify(data).length

      validationTelemetry.trackValidationSuccess(
        'shipping-difference-hook',
        duration,
        dataSize,
      )

      return data
    },
    retry: (failureCount: number, error: Error) => {
      if (error instanceof ValidationError) {
        return false
      }

      return shouldRetry(userRetry, failureCount, error)
    },
    enabled,
  } satisfies UseQueryOptions<ShippingDifferenceDataValidated, Error>

  const queryResult = useQuery(queryOptions)
  const lastErrorRef = React.useRef<Error | null>(null)

  React.useEffect(() => {
    if (queryResult.isError && queryResult.error) {
      if (lastErrorRef.current !== queryResult.error) {
        lastErrorRef.current = queryResult.error
        handleValidationError(queryResult.error, 'diferença de envio')
        callUserOnError(userOnError, queryResult.error)
      }
    }
  }, [queryResult.isError, queryResult.error, userOnError])

  return queryResult
}

/**
 * Validated hook for fetching all dashboard data in parallel
 * Uses useQueries for optimal parallel fetching with validation
 * @param period - Optional period filter
 * @param options - Options for error handling and fallbacks
 * @returns Combined query results with validation
 */
export function useDashboardDataValidated(
  period?: PeriodFilter,
  options?: {
    onValidationError?: (errors: ValidationError[]) => void
    fallbackData?: Partial<DashboardDataValidated>
    enabled?: boolean
  },
) {
  const sharedOptions = React.useMemo(
    () => ({ enabled: options?.enabled }),
    [options?.enabled],
  )

  const metricsQuery = useDashboardMetricsValidated(period, sharedOptions)
  const financialQuery = useFinancialMetricsValidated(period, sharedOptions)
  const chartQuery = useChartDataValidated(period, sharedOptions)
  const shippingQuery = useShippingDifferenceValidated(period, sharedOptions)

  const queries = [metricsQuery, financialQuery, chartQuery, shippingQuery]

  const isSuccess = queries.every((result) => result.isSuccess)
  const isLoading = queries.some((result) => result.isLoading)
  const isError = queries.some((result) => result.isError)
  const isFetching = queries.some((result) => result.isFetching)

  const validationErrors = queries
    .map((result) => result.error)
    .filter((error): error is ValidationError => error instanceof ValidationError)

  if (validationErrors.length > 0 && options?.onValidationError) {
    options.onValidationError(validationErrors)
  }

  const errors = queries
    .map((result) => result.error)
    .filter((error): error is Error => error instanceof Error)

  let data: DashboardDataValidated | undefined

  if (isSuccess) {
    data = {
      metrics: metricsQuery.data!,
      financialMetrics: financialQuery.data!,
      chartData: chartQuery.data!,
      shippingDifference: shippingQuery.data!,
    }
  } else if (options?.fallbackData) {
    const fallbackMetrics = metricsQuery.data || options.fallbackData.metrics
    const fallbackFinancial =
      financialQuery.data || options.fallbackData.financialMetrics
    const fallbackChart = chartQuery.data || options.fallbackData.chartData
    const fallbackShipping =
      shippingQuery.data || options.fallbackData.shippingDifference

    if (
      fallbackMetrics &&
      fallbackFinancial &&
      fallbackChart &&
      fallbackShipping
    ) {
      validationTelemetry.trackFallbackUsage(
        'dashboard-data-combined',
        `${errors.length} errors, using fallback data`,
      )

      data = {
        metrics: fallbackMetrics,
        financialMetrics: fallbackFinancial,
        chartData: fallbackChart,
        shippingDifference: fallbackShipping,
      }
    }
  }

  return {
    data,
    isSuccess,
    isLoading,
    isError,
    isFetching,
    errors,
    validationErrors,
    queries: {
      metrics: metricsQuery,
      financial: financialQuery,
      chart: chartQuery,
      shipping: shippingQuery,
    },
  }
}

/**
 * Hook to prefetch validated dashboard data for adjacent periods
 * Useful for improving perceived performance with validation
 * @param currentPeriod - Current period being viewed
 * @param adjacentPeriod - Adjacent period to prefetch
 */
export function usePrefetchDashboardDataValidated(
  currentPeriod?: PeriodFilter,
  adjacentPeriod?: PeriodFilter,
) {
  const targetPeriod = adjacentPeriod ?? currentPeriod
  const enabled = Boolean(adjacentPeriod && targetPeriod)
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (!enabled || !targetPeriod) {
      return
    }

    const period = targetPeriod
    queryClient.prefetchQuery({
      queryKey: queryKeys.metrics(period),
      queryFn: () => dashboardFetchers.metrics(period),
      ...PREFETCH_CONFIG,
    })

    queryClient.prefetchQuery({
      queryKey: queryKeys.financialMetrics(period),
      queryFn: () => dashboardFetchers.financialMetrics(period),
      ...PREFETCH_CONFIG,
    })

    queryClient.prefetchQuery({
      queryKey: queryKeys.chartData(period),
      queryFn: () => dashboardFetchers.chartData(period),
      ...PREFETCH_CONFIG,
    })

    queryClient.prefetchQuery({
      queryKey: queryKeys.shippingDifference(period),
      queryFn: () => dashboardFetchers.shippingDifference(period),
      ...PREFETCH_CONFIG,
    })
  }, [
    enabled,
    queryClient,
    targetPeriod?.startDate,
    targetPeriod?.endDate,
    targetPeriod?.marketplaceId,
  ])
}

/**
 * Hook to check if data needs revalidation
 * Useful for showing stale data indicators
 * @param queryKey - Query key to check
 * @returns Whether data is stale or needs revalidation
 */
export function useIsDataStale(queryKey: unknown[]): boolean {
  const query = useQuery({
    queryKey,
    enabled: false, // Don't fetch, just check status
  } as any)

  return query.isStale || false
}

/**
 * Export all validated hooks for easy migration
 */
export const validatedDashboardHooks = {
  useMetrics: useDashboardMetricsValidated,
  useFinancialMetrics: useFinancialMetricsValidated,
  useChartData: useChartDataValidated,
  useShippingDifference: useShippingDifferenceValidated,
  useAllData: useDashboardDataValidated,
  usePrefetch: usePrefetchDashboardDataValidated,
  useIsStale: useIsDataStale,
}

// Export individual hooks for direct import
export {
  useDashboardMetricsValidated as useDashboardMetrics,
  useFinancialMetricsValidated as useFinancialMetrics,
  useChartDataValidated as useChartData,
  useShippingDifferenceValidated as useShippingDifference,
  useDashboardDataValidated as useDashboardData,
}

export type { DashboardDataValidated } from '@/modules/dashboard/schemas/dashboard.schemas'
