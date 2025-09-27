/**
 * React Query hooks for produtos (products) data management
 * Provides caching, background refetching, and optimized data fetching
 */

'use client'

import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { produtosService } from '@/modules/produtos/services/produtos.service'
import type {
  Produto,
  ProdutoData,
  ProdutoFilter,
  ProdutoMetrics,
} from '@/modules/produtos/types/produtos.types'
import { normalizeProdutoFilter, produtosQueryKeys } from './query-helpers'

export type { NormalizedProdutoFilter } from './query-helpers'

/**
 * Hook to fetch complete produtos data
 * Includes metrics, product list, and analytics
 * @param filter - Optional filter parameters
 * @returns Query result with produtos data
 */
export type ProdutoDataQueryOptions = Omit<
  UseQueryOptions<ProdutoData, Error>,
  'queryKey' | 'queryFn'
>

type ProdutoMetricsQueryOptions = Omit<
  UseQueryOptions<ProdutoMetrics, Error>,
  'queryKey' | 'queryFn'
>

type ProdutoListQueryOptions = Omit<
  UseQueryOptions<Produto[], Error>,
  'queryKey' | 'queryFn'
>

type StockDistributionQueryOptions = Omit<
  UseQueryOptions<
    Array<{ categoria: string; valor: number; quantidade: number }>,
    Error
  >,
  'queryKey' | 'queryFn'
>

type ReorderProductsQueryOptions = Omit<
  UseQueryOptions<Produto[], Error>,
  'queryKey' | 'queryFn'
>

export function useProdutosData(
  filter?: ProdutoFilter,
  options?: ProdutoDataQueryOptions,
): UseQueryResult<ProdutoData, Error> {
  const normalizedFilter = normalizeProdutoFilter(filter)

  return useQuery({
    queryKey: produtosQueryKeys.complete(normalizedFilter),
    queryFn: () => produtosService.getCompleteProdutoData(filter),
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (previously cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...options,
  })
}

/**
 * Hook to fetch only product metrics
 * Useful when you only need the metrics without the full product list
 * @param filter - Optional filter parameters
 * @returns Query result with metrics data
 */
export function useProdutoMetrics(
  filter?: ProdutoFilter,
  options?: ProdutoMetricsQueryOptions,
): UseQueryResult<ProdutoMetrics, Error> {
  const normalizedFilter = normalizeProdutoFilter(filter)

  return useQuery({
    queryKey: produtosQueryKeys.metrics(normalizedFilter),
    queryFn: () => produtosService.getMetrics(filter),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...options,
  })
}

/**
 * Hook to fetch product list
 * @param filter - Optional filter parameters
 * @param limit - Maximum number of products to fetch
 * @returns Query result with product list
 */
export function useProdutosList(
  filter?: ProdutoFilter,
  limit?: number,
  options?: ProdutoListQueryOptions,
): UseQueryResult<Produto[], Error> {
  const normalizedFilter = normalizeProdutoFilter(filter)

  return useQuery({
    queryKey: produtosQueryKeys.list(normalizedFilter, limit),
    queryFn: () => produtosService.getProdutos(filter, limit),
    staleTime: 60 * 1000, // Products list can be cached longer
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false, // Don't refetch product list on window focus
    ...options,
  })
}

/**
 * Hook to fetch stock distribution data
 * @returns Query result with stock distribution by category
 */
export function useStockDistribution(
  options?: StockDistributionQueryOptions,
): UseQueryResult<
  Array<{ categoria: string; valor: number; quantidade: number }>,
  Error
> {
  return useQuery({
    queryKey: produtosQueryKeys.stockDistribution(),
    queryFn: () => produtosService.getStockDistribution(),
    staleTime: 2 * 60 * 1000, // Stock distribution changes less frequently
    gcTime: 10 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch products that need reordering
 * @returns Query result with products needing reorder
 */
export function useReorderProducts(
  options?: ReorderProductsQueryOptions,
): UseQueryResult<Produto[], Error> {
  return useQuery({
    queryKey: produtosQueryKeys.reorderProducts(),
    queryFn: () => produtosService.getProdutosReposicao(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    ...options,
  })
}

/**
 * Hook to prefetch produtos data
 * Useful for preloading data before navigation
 * @param filter - Optional filter parameters
 */
export function usePrefetchProdutosData(filter?: ProdutoFilter) {
  const queryClient = useQueryClient()
  const normalizedFilter = normalizeProdutoFilter(filter)

  return () => {
    void queryClient.prefetchQuery({
      queryKey: produtosQueryKeys.complete(normalizedFilter),
      queryFn: () => produtosService.getCompleteProdutoData(filter),
      staleTime: 30 * 1000,
    })
  }
}

/**
 * Hook to invalidate all produtos queries
 * Forces refetch of all cached produtos data
 */
export function useInvalidateProdutosData() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: produtosQueryKeys.all })
  }
}

/**
 * Hook to get cached produtos data
 * Returns cached data without triggering a fetch
 * @param filter - Optional filter parameters
 * @returns Cached produtos data or undefined
 */
export function useCachedProdutosData(
  filter?: ProdutoFilter,
): ProdutoData | undefined {
  const queryClient = useQueryClient()
  const normalizedFilter = normalizeProdutoFilter(filter)
  return queryClient.getQueryData(produtosQueryKeys.complete(normalizedFilter))
}
