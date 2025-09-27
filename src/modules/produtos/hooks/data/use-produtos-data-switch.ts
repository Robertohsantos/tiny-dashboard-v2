/**
 * Smart Hook Switch for Produtos data
 * Harmoniza hooks originais e validados com fallback controlado.
 */

import * as React from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

import { FEATURE_FLAGS, isValidationEnabled } from '@/modules/core/utils/feature-flags'
import { validationTelemetry } from '@/modules/core/monitoring/validation-telemetry'
import { ValidationError } from '@/modules/core/utils/validation'
import type {
  ProdutoFilter,
  ProdutoMetrics,
  Produto,
  ProdutoData,
} from '@/modules/produtos/types/produtos.types'
import type {
  ProdutoMetricsValidated,
  ProdutoValidated,
  ProdutoDataValidated,
  StockDistributionValidated,
} from '@/modules/produtos/schemas/produtos.schemas'

import * as OriginalHooks from './use-produtos-data'
import * as ValidatedHooks from './use-produtos-data-validated'
import type { ProdutosQueryOptions } from './use-produtos-data-validated'
import type { ProdutoDataQueryOptions } from './use-produtos-data'

const COMPONENT_NAME = 'ProdutosData' as const

type OriginalMetricsOptions = Parameters<
  typeof OriginalHooks.useProdutoMetrics
>[1]
type ValidatedMetricsOptions = ProdutosQueryOptions<ProdutoMetricsValidated>

type OriginalListOptions = Parameters<typeof OriginalHooks.useProdutosList>[2]
type ValidatedListOptions = ProdutosQueryOptions<ProdutoValidated[]>

type OriginalStockOptions = Parameters<
  typeof OriginalHooks.useStockDistribution
>[0]
type ValidatedStockOptions = ProdutosQueryOptions<StockDistributionValidated[]>

type OriginalReposicaoOptions = Parameters<
  typeof OriginalHooks.useReorderProducts
>[0]
type ValidatedReposicaoOptions = ProdutosQueryOptions<ProdutoValidated[]>

interface AllProdutosOptions {
  onValidationError?: (errors: ValidationError[]) => void
  initialData?: ProdutoData
  fallbackData?: Partial<ProdutoData>
  queryOptions?: ProdutoDataQueryOptions
}

type ValidatedAllProdutosOptions = Parameters<
  typeof ValidatedHooks.useAllProdutoDataValidated
>[1]
type ValidatedAllProdutosResult = ReturnType<
  typeof ValidatedHooks.useAllProdutoDataValidated
>
type SaveProdutoResult = ReturnType<typeof ValidatedHooks.useSaveProdutoValidated>

type ProdutoMetricsResult = UseQueryResult<ProdutoMetrics, Error>
type ProdutoListResult = UseQueryResult<Produto[], Error>
type StockDistributionResult = ReturnType<
  typeof OriginalHooks.useStockDistribution
>
type ReposicaoResult = ReturnType<typeof OriginalHooks.useReorderProducts>

type TriggerFallback = (reason: 'validation_error' | 'fatal_error') => boolean

type ValidationGuard = {
  shouldUseValidated: boolean
  triggerFallback: TriggerFallback
}

function useValidationGuard(hookLabel: string): ValidationGuard {
  const validationEnabled = isValidationEnabled(COMPONENT_NAME)
  const [fallbackReason, setFallbackReason] = React.useState<
    'validation_error' | 'fatal_error' | null
  >(null)

  const shouldUseValidated = validationEnabled && fallbackReason === null

  React.useEffect(() => {
    if (FEATURE_FLAGS.VALIDATION_DEBUG) {
      const message =
        '[HookSwitch] ' +
        hookLabel +
        ' using ' +
        (shouldUseValidated ? 'validated' : 'original') +
        ' version'
      console.log(message)
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

function mapToValidatedOptions<TData>(
  options?: Record<string, unknown>,
): ProdutosQueryOptions<TData> | undefined {
  if (!options) {
    return undefined
  }

  const cloned = { ...options }

  if ('cacheTime' in cloned && cloned.cacheTime !== undefined) {
    if (cloned.gcTime === undefined) {
      cloned.gcTime = cloned.cacheTime
    }
    delete cloned.cacheTime
  }

  return cloned as ProdutosQueryOptions<TData>
}

function buildValidatedOptions<TData>(
  baseOptions: ProdutosQueryOptions<TData> | undefined,
  hookLabel: string,
  shouldUseValidated: boolean,
  triggerFallback: TriggerFallback,
): ProdutosQueryOptions<TData> | undefined {
  if (!shouldUseValidated) {
    return undefined
  }

  const merged = { ...(baseOptions ?? {}) } as ProdutosQueryOptions<TData>
  const originalOnError = merged.onError

  merged.onError = (error: Error) => {
    if (error instanceof ValidationError) {
      const fallbackTriggered = triggerFallback('validation_error')
      if (!fallbackTriggered && FEATURE_FLAGS.VALIDATION_DEBUG) {
        console.warn(
          `[HookSwitch] Validation error in ${hookLabel}: ${error.message}`,
        )
      }
    }

    originalOnError?.(error)
  }

  merged.enabled = merged.enabled ?? true

  return merged
}

export function useProdutoMetrics(
  filter?: ProdutoFilter,
  options?: OriginalMetricsOptions,
): ProdutoMetricsResult {
  const { shouldUseValidated, triggerFallback } =
    useValidationGuard('useProdutoMetrics')

  const mappedOptions = React.useMemo(
    () =>
      mapToValidatedOptions<ProdutoMetricsValidated>(
        options ? { ...options } : undefined,
      ),
    [options],
  )

  const validatedOptions = React.useMemo(
    () =>
      buildValidatedOptions(
        mappedOptions,
        'useProdutoMetrics',
        shouldUseValidated,
        triggerFallback,
      ),
    [mappedOptions, shouldUseValidated, triggerFallback],
  )

  const validatedQuery = ValidatedHooks.useProdutoMetricsValidated(
    filter,
    validatedOptions,
  ) as unknown as ProdutoMetricsResult

  const originalQuery = OriginalHooks.useProdutoMetrics(filter, {
    ...options,
    enabled: shouldUseValidated ? false : options?.enabled,
  })

  return shouldUseValidated ? validatedQuery : originalQuery
}

export function useProdutosList(
  filter?: ProdutoFilter,
  limit?: number,
  options?: OriginalListOptions,
): ProdutoListResult {
  const { shouldUseValidated, triggerFallback } =
    useValidationGuard('useProdutosList')

  const mappedOptions = React.useMemo(
    () =>
      mapToValidatedOptions<ProdutoValidated[]>(
        options ? { ...options } : undefined,
      ),
    [options],
  )

  const validatedOptions = React.useMemo(
    () =>
      buildValidatedOptions(
        mappedOptions,
        'useProdutosList',
        shouldUseValidated,
        triggerFallback,
      ),
    [mappedOptions, shouldUseValidated, triggerFallback],
  )

  const validatedQuery = ValidatedHooks.useProdutosListValidated(
    filter,
    limit,
    validatedOptions,
  ) as unknown as ProdutoListResult

  const originalQuery = OriginalHooks.useProdutosList(filter, limit, {
    ...options,
    enabled: shouldUseValidated ? false : options?.enabled,
  })

  return shouldUseValidated ? validatedQuery : originalQuery
}

export function useStockDistribution(
  options?: OriginalStockOptions,
): StockDistributionResult {
  const { shouldUseValidated, triggerFallback } = useValidationGuard(
    'useStockDistribution',
  )

  const mappedOptions = React.useMemo(
    () =>
      mapToValidatedOptions<StockDistributionValidated[]>(
        options ? { ...options } : undefined,
      ),
    [options],
  )

  const validatedOptions = React.useMemo(
    () =>
      buildValidatedOptions(
        mappedOptions,
        'useStockDistribution',
        shouldUseValidated,
        triggerFallback,
      ),
    [mappedOptions, shouldUseValidated, triggerFallback],
  )

  const validatedQuery = ValidatedHooks.useStockDistributionValidated(
    validatedOptions,
  ) as StockDistributionResult

  const originalQuery = OriginalHooks.useStockDistribution({
    ...options,
    enabled: shouldUseValidated ? false : options?.enabled,
  })

  return shouldUseValidated ? validatedQuery : originalQuery
}

export function useReorderProducts(
  options?: OriginalReposicaoOptions,
): ReposicaoResult {
  const { shouldUseValidated, triggerFallback } =
    useValidationGuard('useReorderProducts')

  const mappedOptions = React.useMemo(
    () =>
      mapToValidatedOptions<ProdutoValidated[]>(
        options ? { ...options } : undefined,
      ),
    [options],
  )

  const validatedOptions = React.useMemo(
    () =>
      buildValidatedOptions(
        mappedOptions,
        'useReorderProducts',
        shouldUseValidated,
        triggerFallback,
      ),
    [mappedOptions, shouldUseValidated, triggerFallback],
  )

  const validatedQuery = ValidatedHooks.useProdutosReposicaoValidated(
    validatedOptions,
  ) as unknown as ReposicaoResult

  const originalQuery = OriginalHooks.useReorderProducts({
    ...options,
    enabled: shouldUseValidated ? false : options?.enabled,
  })

  return shouldUseValidated ? validatedQuery : originalQuery
}

export function useAllProdutoData(
  filter?: ProdutoFilter,
  options?: AllProdutosOptions,
) {
  const { shouldUseValidated, triggerFallback } =
    useValidationGuard('useAllProdutoData')

  const validatedOptions = React.useMemo(
    () => ({
      enabled: shouldUseValidated,
      initialData: options?.initialData,
      fallbackData: options?.fallbackData,
      onValidationError: shouldUseValidated
        ? (errors: ValidationError[]) => {
            options?.onValidationError?.(errors)
            triggerFallback('validation_error')
          }
        : undefined,
    }), [
      options?.initialData,
      options?.fallbackData,
      options?.onValidationError,
      shouldUseValidated,
      triggerFallback,
    ],
  )

  const validatedResult = ValidatedHooks.useAllProdutoDataValidated(
    filter,
    validatedOptions,
  )

  const originalQueryOptions = React.useMemo(() => {
    if (!options?.queryOptions) {
      return {
        enabled: shouldUseValidated ? false : undefined,
        initialData: options?.initialData,
        placeholderData: options?.initialData,
      } satisfies ProdutoDataQueryOptions
    }

    const { cacheTime, ...rest } = options.queryOptions as Record<string, unknown>
    const mapped = { ...rest } as Record<string, unknown>

    if (cacheTime !== undefined && mapped.gcTime === undefined) {
      mapped.gcTime = cacheTime
    }

    mapped.enabled = shouldUseValidated ? false : options.queryOptions.enabled
    mapped.initialData = options.initialData ?? mapped.initialData
    if (mapped.placeholderData === undefined && options.initialData) {
      mapped.placeholderData = options.initialData
    }

    return mapped as ProdutoDataQueryOptions
  }, [options?.queryOptions, options?.initialData, shouldUseValidated])

  const originalResult = OriginalHooks.useProdutosData(
    filter,
    originalQueryOptions,
  )

  if (shouldUseValidated && validatedResult) {
    const all = validatedResult as ValidatedAllProdutosResult

    const refetch = async () => {
      await Promise.all([
        all.queries.metrics.refetch(),
        all.queries.produtos.refetch(),
        all.queries.stock.refetch(),
        all.queries.reposicao.refetch(),
      ])
    }

    const { metrics, produtos, stock, reposicao } = all.queries
    const queryErrors = [
      metrics.error,
      produtos.error,
      stock.error,
      reposicao.error,
    ].filter((error): error is Error => Boolean(error))

    return {
      data: all.data as ProdutoData | undefined,
      isSuccess: all.isSuccess,
      isLoading: all.isLoading,
      isError: all.isError,
      isFetching: all.isFetching,
      validationErrors: all.validationErrors,
      errors: queryErrors,
      refetch,
      queries: all.queries,
    }
  }

  const fallbackData = options?.fallbackData
  const data = originalResult.data ?? fallbackData
  const hasData = Boolean(data)

  return {
    data,
    isSuccess: originalResult.isSuccess || hasData,
    isLoading: originalResult.isLoading && !hasData,
    isError: originalResult.isError && !hasData,
    isFetching: originalResult.isFetching,
    validationErrors: [] as ValidationError[],
    errors: originalResult.error ? [originalResult.error] : [],
    refetch: originalResult.refetch,
    queries: {
      complete: originalResult,
    },
  }
}

export function usePrefetchProdutosData(filter?: ProdutoFilter) {
  return OriginalHooks.usePrefetchProdutosData(filter)
}

export function useSaveProduto(
  onValidationError?: (errors: ValidationError[]) => void,
) {
  const { shouldUseValidated, triggerFallback } =
    useValidationGuard('useSaveProduto')

  const validatedMutation = ValidatedHooks.useSaveProdutoValidated({
    onError: (error, variables, context) => {
      if (error instanceof ValidationError) {
        onValidationError?.([error])
        triggerFallback('validation_error')
      }
    },
  })

  const originalFallback = {
    mutate: () => {
      console.warn('[ProdutosData] useSaveProduto original nao implementado.')
    },
    mutateAsync: () => {
      console.warn('[ProdutosData] useSaveProduto original nao implementado.')
      return Promise.resolve(null as ProdutoData | null)
    },
    isLoading: false,
    error: null,
    data: null as ProdutoData | null,
  } as unknown as SaveProdutoResult

  return shouldUseValidated ? validatedMutation : originalFallback
}
