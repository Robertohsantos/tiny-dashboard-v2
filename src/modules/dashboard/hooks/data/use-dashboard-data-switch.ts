/**
 * Smart Hook Switch for Dashboard Data
 * Dynamically switches between original and validated hooks based on feature flags
 * Provides automatic fallback on validation errors
 */

import * as React from 'react'
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query'

import { FEATURE_FLAGS, isValidationEnabled } from '@/modules/core/utils/feature-flags'
import { validationTelemetry } from '@/modules/core/monitoring/validation-telemetry'
import { ValidationError } from '@/modules/core/utils/validation'
import { calculateDateRange, type PeriodType } from '@/modules/dashboard/utils/period-utils'
import type {
  ChartDataPoint,
  DashboardData,
  DashboardFinancialMetrics,
  DashboardMetrics,
  PeriodFilter,
  ShippingDifferenceData,
} from '@/modules/dashboard/types/dashboard.types'

import * as OriginalHooks from './use-dashboard-data'
import * as ValidatedHooks from './use-dashboard-data-validated'

const COMPONENT_NAME = 'DashboardData' as const

type PeriodInput = PeriodFilter | PeriodType | undefined

type FallbackReason = 'validation_error' | 'fatal_error'

type SwitchQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error>,
  'queryKey' | 'queryFn'
> & {
  onError?: (error: Error) => unknown
}

type MetricsQueryOptions = SwitchQueryOptions<DashboardMetrics>
type FinancialQueryOptions = SwitchQueryOptions<DashboardFinancialMetrics>
type ChartQueryOptions = SwitchQueryOptions<ChartDataPoint[]>
type ShippingQueryOptions = SwitchQueryOptions<ShippingDifferenceData>

type DashboardDataResult = ReturnType<typeof OriginalHooks.useDashboardData>

type DashboardMetricsResult = UseQueryResult<DashboardMetrics, Error>
type DashboardFinancialMetricsResult = UseQueryResult<
  DashboardFinancialMetrics,
  Error
>
type ChartDataResult = UseQueryResult<ChartDataPoint[], Error>
type ShippingDifferenceResult = UseQueryResult<ShippingDifferenceData, Error>

type TriggerFallback = (reason: FallbackReason) => boolean

type ValidationGuard = {
  shouldUseValidated: boolean
  triggerFallback: TriggerFallback
}

type ValidatedMetricsOptions = NonNullable<
  Parameters<typeof ValidatedHooks.useDashboardMetrics>[1]
>
type ValidatedFinancialOptions = NonNullable<
  Parameters<typeof ValidatedHooks.useFinancialMetrics>[1]
>
type ValidatedChartOptions = NonNullable<
  Parameters<typeof ValidatedHooks.useChartData>[1]
>
type ValidatedShippingOptions = NonNullable<
  Parameters<typeof ValidatedHooks.useShippingDifference>[1]
>

function resolvePeriod(period?: PeriodInput): PeriodFilter | undefined {
  if (!period) {
    return undefined
  }

  if (typeof period === 'string') {
    const { startDate, endDate } = calculateDateRange(period)
    return { startDate, endDate }
  }

  return period
}

function useValidationGuard(hookLabel: string): ValidationGuard {
  const validationEnabled = isValidationEnabled(COMPONENT_NAME)
  const [fallbackReason, setFallbackReason] =
    React.useState<FallbackReason | null>(null)

  const shouldUseValidated = validationEnabled && fallbackReason === null

  React.useEffect(() => {
    if (FEATURE_FLAGS.VALIDATION_DEBUG) {
      console.log(
        '[HookSwitch] ' +
          hookLabel +
          ' using ' +
          (shouldUseValidated ? 'validated' : 'original') +
          ' version',
      )
    }
  }, [hookLabel, shouldUseValidated])

  const triggerFallback = React.useCallback<TriggerFallback>(
    (reason) => {
      if (!FEATURE_FLAGS.VALIDATION_FALLBACK) {
        return false
      }

      let didSet = false
      setFallbackReason((current) => {
        if (current === null) {
          didSet = true
          return reason
        }
        return current
      })

      if (didSet) {
        validationTelemetry.trackFallbackUsage(hookLabel, reason)
      }

      return true
    },
    [hookLabel],
  )

  return { shouldUseValidated, triggerFallback }
}

function handleHookError(
  error: Error,
  hookLabel: string,
  triggerFallback: TriggerFallback,
) {
  if (error instanceof ValidationError) {
    const fallbackTriggered = triggerFallback('validation_error')
    if (!fallbackTriggered && FEATURE_FLAGS.VALIDATION_DEBUG) {
      console.warn(`[HookSwitch] Validation error in ${hookLabel}`, error)
    }
  } else {
    console.error(`[HookSwitch] Fatal error in ${hookLabel}:`, error)
    const fallbackTriggered = triggerFallback('fatal_error')
    if (!fallbackTriggered && FEATURE_FLAGS.VALIDATION_DEBUG) {
      console.warn(
        `[HookSwitch] Fallback disabled for fatal error in ${hookLabel}`,
      )
    }
  }
}

function callUserOnError(handler: unknown, error: Error) {
  if (typeof handler === 'function') {
    const safeHandler = handler as (err: Error) => unknown
    safeHandler(error)
  }
}

export function useDashboardMetrics(
  period?: PeriodInput,
  options?: MetricsQueryOptions,
): DashboardMetricsResult {
  const normalizedPeriod = React.useMemo(() => resolvePeriod(period), [period])
  const { shouldUseValidated, triggerFallback } = useValidationGuard(
    'useDashboardMetrics',
  )
  const baseEnabled = options?.enabled ?? true

  const validatedOptions = React.useMemo(() => {
    const nextOptions = {
      ...options,
      enabled: shouldUseValidated && baseEnabled,
    } as ValidatedMetricsOptions

    if (shouldUseValidated) {
      nextOptions.onError = (error: Error) => {
        handleHookError(error, 'useDashboardMetrics', triggerFallback)
        callUserOnError(options?.onError, error)
        return undefined
      }
    }

    return nextOptions
  }, [options, shouldUseValidated, triggerFallback, baseEnabled])

  const originalOptions = React.useMemo(
    () =>
      ({
        ...options,
        enabled: !shouldUseValidated && baseEnabled,
      }) as MetricsQueryOptions,
    [options, shouldUseValidated, baseEnabled],
  )

  const validatedResult = ValidatedHooks.useDashboardMetrics(
    normalizedPeriod,
    validatedOptions,
  )

  const originalResult = OriginalHooks.useDashboardMetrics(
    normalizedPeriod,
    originalOptions,
  )

  return shouldUseValidated
    ? (validatedResult as unknown as DashboardMetricsResult)
    : originalResult
}

export function useFinancialMetrics(
  period?: PeriodInput,
  options?: FinancialQueryOptions,
): DashboardFinancialMetricsResult {
  const normalizedPeriod = React.useMemo(() => resolvePeriod(period), [period])
  const { shouldUseValidated, triggerFallback } = useValidationGuard(
    'useFinancialMetrics',
  )
  const baseEnabled = options?.enabled ?? true

  const validatedOptions = React.useMemo(() => {
    const nextOptions = {
      ...options,
      enabled: shouldUseValidated && baseEnabled,
    } as ValidatedFinancialOptions

    if (shouldUseValidated) {
      nextOptions.onError = (error: Error) => {
        handleHookError(error, 'useFinancialMetrics', triggerFallback)
        callUserOnError(options?.onError, error)
        return undefined
      }
    }

    return nextOptions
  }, [options, shouldUseValidated, triggerFallback, baseEnabled])

  const originalOptions = React.useMemo(
    () =>
      ({
        ...options,
        enabled: !shouldUseValidated && baseEnabled,
      }) as FinancialQueryOptions,
    [options, shouldUseValidated, baseEnabled],
  )

  const validatedResult = ValidatedHooks.useFinancialMetrics(
    normalizedPeriod,
    validatedOptions,
  )

  const originalResult = OriginalHooks.useFinancialMetrics(
    normalizedPeriod,
    originalOptions,
  )

  return shouldUseValidated
    ? (validatedResult as unknown as DashboardFinancialMetricsResult)
    : originalResult
}

export function useChartData(
  period?: PeriodInput,
  options?: ChartQueryOptions,
): ChartDataResult {
  const normalizedPeriod = React.useMemo(() => resolvePeriod(period), [period])
  const { shouldUseValidated, triggerFallback } =
    useValidationGuard('useChartData')
  const baseEnabled = options?.enabled ?? true

  const validatedOptions = React.useMemo(() => {
    const nextOptions = {
      ...options,
      enabled: shouldUseValidated && baseEnabled,
    } as ValidatedChartOptions

    if (shouldUseValidated) {
      nextOptions.onError = (error: Error) => {
        handleHookError(error, 'useChartData', triggerFallback)
        callUserOnError(options?.onError, error)
        return undefined
      }
    }

    return nextOptions
  }, [options, shouldUseValidated, triggerFallback, baseEnabled])

  const originalOptions = React.useMemo(
    () =>
      ({
        ...options,
        enabled: !shouldUseValidated && baseEnabled,
      }) as ChartQueryOptions,
    [options, shouldUseValidated, baseEnabled],
  )

  const validatedResult = ValidatedHooks.useChartData(
    normalizedPeriod,
    validatedOptions,
  )

  const originalResult = OriginalHooks.useChartData(
    normalizedPeriod,
    originalOptions,
  )

  return shouldUseValidated
    ? (validatedResult as unknown as ChartDataResult)
    : originalResult
}

export function useShippingDifference(
  period?: PeriodInput,
  options?: ShippingQueryOptions,
): ShippingDifferenceResult {
  const normalizedPeriod = React.useMemo(() => resolvePeriod(period), [period])
  const { shouldUseValidated, triggerFallback } = useValidationGuard(
    'useShippingDifference',
  )
  const baseEnabled = options?.enabled ?? true

  const validatedOptions = React.useMemo(() => {
    const nextOptions = {
      ...options,
      enabled: shouldUseValidated && baseEnabled,
    } as ValidatedShippingOptions

    if (shouldUseValidated) {
      nextOptions.onError = (error: Error) => {
        handleHookError(error, 'useShippingDifference', triggerFallback)
        callUserOnError(options?.onError, error)
        return undefined
      }
    }

    return nextOptions
  }, [options, shouldUseValidated, triggerFallback, baseEnabled])

  const originalOptions = React.useMemo(
    () =>
      ({
        ...options,
        enabled: !shouldUseValidated && baseEnabled,
      }) as ShippingQueryOptions,
    [options, shouldUseValidated, baseEnabled],
  )

  const validatedResult = ValidatedHooks.useShippingDifference(
    normalizedPeriod,
    validatedOptions,
  )

  const originalResult = OriginalHooks.useShippingDifference(
    normalizedPeriod,
    originalOptions,
  )

  return shouldUseValidated
    ? (validatedResult as unknown as ShippingDifferenceResult)
    : originalResult
}

export function useDashboardData(
  period?: PeriodInput,
  onValidationError?: (errors: ValidationError[]) => void,
): DashboardDataResult {
  const normalizedPeriod = React.useMemo(() => resolvePeriod(period), [period])
  const { shouldUseValidated, triggerFallback } =
    useValidationGuard('useDashboardData')
  const validatedResult = ValidatedHooks.useDashboardDataValidated(
    normalizedPeriod,
    shouldUseValidated
      ? {
          enabled: true,
          onValidationError: (errors) => {
            onValidationError?.(errors)
            const fallbackTriggered = triggerFallback('validation_error')
            if (!fallbackTriggered && FEATURE_FLAGS.VALIDATION_DEBUG) {
              console.warn(
                '[HookSwitch] Validation error in useDashboardData',
                errors,
              )
            }
          },
        }
      : { enabled: false },
  )

  const originalResult = OriginalHooks.useDashboardData(normalizedPeriod, {
    enabled: !shouldUseValidated,
  })

  React.useEffect(() => {
    if (!shouldUseValidated) return
    const fatalError = validatedResult.errors?.find(
      (error): error is Error =>
        Boolean(error) && !(error instanceof ValidationError),
    )

    if (!fatalError) {
      return
    }

    console.error('[HookSwitch] Fatal error in useDashboardData:', fatalError)
    const fallbackTriggered = triggerFallback('fatal_error')
    if (!fallbackTriggered && FEATURE_FLAGS.VALIDATION_DEBUG) {
      console.warn(
        '[HookSwitch] Fallback disabled for fatal error in useDashboardData',
        fatalError,
      )
    }
  }, [shouldUseValidated, validatedResult.errors, triggerFallback])

  return shouldUseValidated
    ? (validatedResult as DashboardDataResult)
    : originalResult
}

export function usePrefetchDashboardData(
  currentPeriod?: PeriodInput,
  adjacentPeriod?: PeriodInput,
): void {
  const normalizedCurrent = React.useMemo(
    () => resolvePeriod(currentPeriod),
    [currentPeriod],
  )
  const normalizedAdjacent = React.useMemo(
    () => resolvePeriod(adjacentPeriod),
    [adjacentPeriod],
  )
  const { shouldUseValidated } = useValidationGuard('usePrefetchDashboardData')

  ValidatedHooks.usePrefetchDashboardDataValidated(
    normalizedCurrent,
    shouldUseValidated ? normalizedAdjacent : undefined,
  )

  OriginalHooks.usePrefetchDashboardData(
    normalizedCurrent,
    shouldUseValidated ? undefined : normalizedAdjacent,
  )
}

export { useAdjacentPeriod } from './use-dashboard-data'
