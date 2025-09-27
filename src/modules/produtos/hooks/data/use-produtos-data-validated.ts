/**
 * Validated hooks for produtos data using React Query v5 and Zod
 */

import * as React from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  validatedProdutosService,
  produtosFetchers,
} from '@/modules/produtos/services/produtos.service.validated'
import { validationTelemetry } from '@/modules/core/monitoring/validation-telemetry'
import { ValidationError, logValidationError } from '@/modules/core/utils/validation'
import { FEATURE_FLAGS } from '@/modules/core/utils/feature-flags'
import type { ProdutoFilter } from '@/modules/produtos/types/produtos.types'
import type {
  ProdutoMetricsValidated,
  ProdutoValidated,
  ProdutoDataValidated,
} from '@/modules/produtos/schemas/produtos.schemas'
import type { StockDistributionValidated } from '@/modules/produtos/schemas/produtos.schemas'
import { normalizeProdutoFilter, produtosQueryKeys } from './query-helpers'

/**
 * Narrow query options we support for validated hooks.
 * Keeps parity with React Query v5 naming (gcTime instead of cacheTime).
 */
export type ProdutosQueryOptions<TData> = Pick<
  UseQueryOptions<TData, Error>,
  | 'enabled'
  | 'staleTime'
  | 'gcTime'
  | 'refetchInterval'
  | 'refetchOnWindowFocus'
  | 'refetchOnReconnect'
  | 'select'
  | 'meta'
  | 'initialData'
  | 'initialDataUpdatedAt'
  | 'placeholderData'
  | 'retry'
> & {
  onError?: (error: Error) => unknown
}

type RetryOption<TData> = ProdutosQueryOptions<TData>['retry']

const DEFAULT_RETRY_ATTEMPTS = 3

function measureDataSize(payload: unknown): number {
  if (!FEATURE_FLAGS.VALIDATION_MONITORING) {
    return 0
  }

  try {
    return JSON.stringify(payload).length
  } catch (error) {
    console.warn('[ProdutosValidation] Failed to measure payload size', error)
    return 0
  }
}

function handleProdutosValidationError(error: unknown, context: string) {
  if (error instanceof ValidationError) {
    logValidationError(error, { context, module: 'produtos' })
    validationTelemetry.trackValidationError(error, `produtos-${context}`)

    toast.error(`Erro ao validar ${context}`, {
      description:
        process.env.NODE_ENV === 'development'
          ? `${error.errors.length} erro(s) encontrados`
          : 'Revise os dados e tente novamente',
    })
    return
  }

  if (error instanceof Error) {
    console.error(`[Produtos ${context}]`, error)
    toast.error(`Erro ao carregar ${context}`)
    return
  }

  console.error(`[Produtos ${context}] erro desconhecido`, error)
  toast.error(`Erro desconhecido ao processar ${context}`)
}

function shouldRetry<TData>(
  retryOption: RetryOption<TData> | undefined,
  failureCount: number,
  error: Error,
): boolean {
  if (typeof retryOption === 'function') {
    return retryOption(failureCount, error)
  }

  if (typeof retryOption === 'number') {
    return failureCount < retryOption
  }

  if (retryOption === false) {
    return false
  }

  return failureCount < DEFAULT_RETRY_ATTEMPTS
}

type ValidatedQueryConfig<TData> = {
  key: readonly unknown[]
  context: string
  fetcher: () => Promise<TData>
  options?: ProdutosQueryOptions<TData>
  dataSize?: (data: TData) => number
}

function useValidatedProdutosQuery<TData>({
  key,
  context,
  fetcher,
  options,
  dataSize,
}: ValidatedQueryConfig<TData>): UseQueryResult<TData, Error> {
  const { onError, retry, ...rest } = options ?? {}
  const startTimeRef = React.useRef(0)
  const lastErrorRef = React.useRef<Error | null>(null)

  const queryResult = useQuery<TData, Error>({
    queryKey: key,
    queryFn: async () => {
      startTimeRef.current = Date.now()
      const data = await fetcher()
      const duration = Date.now() - startTimeRef.current
      const size = dataSize ? dataSize(data) : measureDataSize(data)

      validationTelemetry.trackValidationSuccess(context, duration, size)
      return data
    },
    retry: (failureCount, error) => {
      if (error instanceof ValidationError) {
        return false
      }

      return shouldRetry(retry, failureCount, error)
    },
    ...rest,
  })

  React.useEffect(() => {
    if (queryResult.isError && queryResult.error) {
      if (lastErrorRef.current === queryResult.error) {
        return
      }

      lastErrorRef.current = queryResult.error
      handleProdutosValidationError(queryResult.error, context)
      onError?.(queryResult.error)
    }
  }, [context, onError, queryResult.error, queryResult.isError])

  return queryResult
}

export function useProdutoMetricsValidated(
  filter?: ProdutoFilter,
  options?: ProdutosQueryOptions<ProdutoMetricsValidated>,
): UseQueryResult<ProdutoMetricsValidated, Error> {
  const normalizedFilter = React.useMemo(
    () => normalizeProdutoFilter(filter),
    [filter],
  )

  return useValidatedProdutosQuery<ProdutoMetricsValidated>({
    key: produtosQueryKeys.metrics(normalizedFilter),
    context: 'métricas de produtos',
    fetcher: () => produtosFetchers.metrics(filter),
    options: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      ...options,
    },
  })
}

export function useProdutosListValidated(
  filter?: ProdutoFilter,
  limit?: number,
  options?: ProdutosQueryOptions<ProdutoValidated[]>,
): UseQueryResult<ProdutoValidated[], Error> {
  const normalizedFilter = React.useMemo(
    () => normalizeProdutoFilter(filter),
    [filter],
  )

  return useValidatedProdutosQuery<ProdutoValidated[]>({
    key: produtosQueryKeys.list(normalizedFilter, limit),
    context: 'lista de produtos',
    fetcher: () => produtosFetchers.produtos(filter, limit),
    options: {
      staleTime: 3 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      placeholderData: keepPreviousData,
      ...options,
    },
  })
}

export function useStockDistributionValidated(
  options?: ProdutosQueryOptions<StockDistributionValidated[]>,
): UseQueryResult<StockDistributionValidated[], Error> {
  return useValidatedProdutosQuery<StockDistributionValidated[]>({
    key: produtosQueryKeys.stockDistribution(),
    context: 'distribuição de estoque',
    fetcher: () => produtosFetchers.stockDistribution(),
    options: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      ...options,
    },
  })
}

export function useProdutosReposicaoValidated(
  options?: ProdutosQueryOptions<ProdutoValidated[]>,
): UseQueryResult<ProdutoValidated[], Error> {
  return useValidatedProdutosQuery<ProdutoValidated[]>({
    key: produtosQueryKeys.reposicao(),
    context: 'produtos para reposição',
    fetcher: () => produtosFetchers.produtosReposicao(),
    options: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
      ...options,
    },
  })
}

export function useProdutoDataValidated(
  filter?: ProdutoFilter,
  options?: ProdutosQueryOptions<ProdutoDataValidated>,
): UseQueryResult<ProdutoDataValidated, Error> {
  const normalizedFilter = React.useMemo(
    () => normalizeProdutoFilter(filter),
    [filter],
  )

  return useValidatedProdutosQuery<ProdutoDataValidated>({
    key: produtosQueryKeys.complete(normalizedFilter),
    context: 'dados completos de produtos',
    fetcher: () => produtosFetchers.completeProdutoData(filter),
    options: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      ...options,
    },
  })
}

export function useProdutoByIdValidated(
  id: string,
  options?: ProdutosQueryOptions<ProdutoValidated | null>,
): UseQueryResult<ProdutoValidated | null, Error> {
  const mergedOptions: ProdutosQueryOptions<ProdutoValidated | null> = {
    enabled: Boolean(id),
    gcTime: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    ...options,
  }

  return useValidatedProdutosQuery<ProdutoValidated | null>({
    key: produtosQueryKeys.detail(id),
    context: `produto ${id}`,
    fetcher: () => validatedProdutosService.getProdutoById(id),
    options: mergedOptions,
    dataSize: (data) => (data ? measureDataSize(data) : 0),
  })
}

interface UseAllProdutoDataValidatedOptions {
  onValidationError?: (errors: ValidationError[]) => void
  initialData?: ProdutoDataValidated
  fallbackData?: Partial<ProdutoDataValidated>
  enabled?: boolean
}

export function useAllProdutoDataValidated(
  filter?: ProdutoFilter,
  options?: UseAllProdutoDataValidatedOptions,
) {
  const normalizedFilter = React.useMemo(
    () => normalizeProdutoFilter(filter),
    [filter],
  )
  const isEnabled = options?.enabled !== false

  const metricsQuery = useProdutoMetricsValidated(filter, {
    initialData: options?.initialData?.metrics,
    placeholderData: options?.initialData?.metrics,
    enabled: isEnabled,
  })

  const produtosQuery = useProdutosListValidated(filter, undefined, {
    initialData: options?.initialData?.produtos,
    placeholderData: options?.initialData?.produtos,
    enabled: isEnabled,
  })

  const stockQuery = useStockDistributionValidated({
    initialData: options?.initialData?.analytics?.distribuicaoEstoque,
    placeholderData: options?.initialData?.analytics?.distribuicaoEstoque,
    enabled: isEnabled,
  })

  const reposicaoQuery = useProdutosReposicaoValidated({
    initialData: options?.initialData?.analytics?.produtosReposicao,
    placeholderData: options?.initialData?.analytics?.produtosReposicao,
    enabled: isEnabled,
  })

  const queries = [metricsQuery, produtosQuery, stockQuery, reposicaoQuery]

  const validationErrors = queries
    .map((result) => result.error)
    .filter((error): error is ValidationError => error instanceof ValidationError)

  if (isEnabled && validationErrors.length > 0 && options?.onValidationError) {
    options.onValidationError(validationErrors)
  }

  const errors = queries
    .map((result) => result.error)
    .filter((error): error is Error => error instanceof Error)

  const isSuccess = queries.every((result) => result.isSuccess)
  const isLoading = queries.some((result) => result.isLoading)
  const isError = queries.some((result) => result.isError)
  const isFetching = queries.some((result) => result.isFetching)

  let data: ProdutoDataValidated | undefined

  if (isSuccess) {
    data = {
      metrics: metricsQuery.data!,
      produtos: produtosQuery.data!,
      analytics: {
        distribuicaoEstoque: stockQuery.data!,
        produtosReposicao: reposicaoQuery.data!,
      },
    }
  } else if (options?.fallbackData) {
    const fallbackMetrics =
      metricsQuery.data || options.fallbackData.metrics || undefined
    const fallbackProdutos =
      produtosQuery.data || options.fallbackData.produtos || undefined
    const fallbackStock =
      stockQuery.data || options.fallbackData.analytics?.distribuicaoEstoque
    const fallbackReposicao =
      reposicaoQuery.data || options.fallbackData.analytics?.produtosReposicao

    if (
      fallbackMetrics &&
      fallbackProdutos &&
      fallbackStock &&
      fallbackReposicao
    ) {
      if (isEnabled) {
        validationTelemetry.trackFallbackUsage(
          'produtos-data-combined',
          `${errors.length} errors, using fallback data`,
        )
      }

      data = {
        metrics: fallbackMetrics,
        produtos: fallbackProdutos,
        analytics: {
          distribuicaoEstoque: fallbackStock,
          produtosReposicao: fallbackReposicao,
        },
      }
    }
  }
  return {
    data,
    isSuccess,
    isLoading,
    isError,
    isFetching,
    validationErrors,
    queries: {
      metrics: metricsQuery,
      produtos: produtosQuery,
      stock: stockQuery,
      reposicao: reposicaoQuery,
    },
  }
}

export function useSaveProdutoValidated(
  options?: UseMutationOptions<ProdutoValidated, Error, unknown, unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation<ProdutoValidated, Error, unknown, unknown>({
    mutationFn: (produto: unknown) => {
      const validated = validatedProdutosService.validateBeforeSave(produto)
      return Promise.resolve(validated)
    },
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({ queryKey: produtosQueryKeys.all })
      toast.success('Produto salvo com sucesso!')
      options?.onSuccess?.(data, variables, context, mutation)
    },
    onError: (error, variables, context, mutation) => {
      handleProdutosValidationError(error, 'salvar produto')
      options?.onError?.(error, variables, context, mutation)
    },
    ...options,
  })
}

export const validatedProdutosHooks = {
  useMetrics: useProdutoMetricsValidated,
  useList: useProdutosListValidated,
  useStock: useStockDistributionValidated,
  useReposicao: useProdutosReposicaoValidated,
  useComplete: useProdutoDataValidated,
  useById: useProdutoByIdValidated,
  useAll: useAllProdutoDataValidated,
  useSave: useSaveProdutoValidated,
}

export function useInvalidateProdutos() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: produtosQueryKeys.all }),
    invalidateMetrics: (filter?: ProdutoFilter) =>
      queryClient.invalidateQueries({
        queryKey: produtosQueryKeys.metrics(normalizeProdutoFilter(filter)),
      }),
    invalidateList: (filter?: ProdutoFilter, limit?: number) =>
      queryClient.invalidateQueries({
        queryKey: produtosQueryKeys.list(
          normalizeProdutoFilter(filter),
          limit,
        ),
      }),
    invalidateStock: () =>
      queryClient.invalidateQueries({
        queryKey: produtosQueryKeys.stockDistribution(),
      }),
    invalidateReposicao: () =>
      queryClient.invalidateQueries({
        queryKey: produtosQueryKeys.reposicao(),
      }),
    invalidateComplete: (filter?: ProdutoFilter) =>
      queryClient.invalidateQueries({
        queryKey: produtosQueryKeys.complete(normalizeProdutoFilter(filter)),
      }),
    invalidateDetail: (id: string) =>
      queryClient.invalidateQueries({ queryKey: produtosQueryKeys.detail(id) }),
  }
}
