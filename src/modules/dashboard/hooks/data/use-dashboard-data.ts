/**
 * Custom hooks for dashboard data fetching with React Query
 * Provides caching, prefetching, and optimistic updates
 */

import {
  useQuery,
  useQueries,
  usePrefetchQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import { queryKeys, PREFETCH_CONFIG } from '@/modules/core/providers/query-provider'
import type {
  DashboardMetrics,
  DashboardFinancialMetrics,
  ChartDataPoint,
  ShippingDifferenceData,
  DashboardItem,
  PeriodFilter,
  DashboardData,
} from '@/modules/dashboard/types/dashboard.types'

/**
 * Custom hook for fetching dashboard sales metrics
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with metrics data
 */
export function useDashboardMetrics(
  period?: PeriodFilter,
  options?: Omit<UseQueryOptions<DashboardMetrics>, 'queryKey' | 'queryFn'>,
): UseQueryResult<DashboardMetrics> {
  return useQuery({
    queryKey: queryKeys.metrics(period),
    queryFn: () => dashboardService.getMetrics(period),
    ...options,
  })
}

/**
 * Custom hook for fetching financial metrics
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with financial metrics
 */
export function useFinancialMetrics(
  period?: PeriodFilter,
  options?: Omit<
    UseQueryOptions<DashboardFinancialMetrics>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<DashboardFinancialMetrics> {
  return useQuery({
    queryKey: queryKeys.financialMetrics(period),
    queryFn: () => dashboardService.getFinancialMetrics(period),
    ...options,
  })
}

/**
 * Custom hook for fetching chart data
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with chart data points
 */
export function useChartData(
  period?: PeriodFilter,
  options?: Omit<UseQueryOptions<ChartDataPoint[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<ChartDataPoint[]> {
  return useQuery({
    queryKey: queryKeys.chartData(period),
    queryFn: () => dashboardService.getChartData(period),
    ...options,
  })
}

/**
 * Custom hook for fetching shipping difference data
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with shipping difference
 */
export function useShippingDifference(
  period?: PeriodFilter,
  options?: Omit<
    UseQueryOptions<ShippingDifferenceData>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ShippingDifferenceData> {
  return useQuery({
    queryKey: queryKeys.shippingDifference(period),
    queryFn: () => dashboardService.getShippingDifference(period),
    ...options,
  })
}

/**
 * Custom hook for fetching dashboard table items
 * @param period - Optional period filter
 * @param options - Additional query options
 * @returns Query result with dashboard items
 */
export function useDashboardItems(
  period?: PeriodFilter,
  options?: Omit<UseQueryOptions<DashboardItem[]>, 'queryKey' | 'queryFn'>,
): UseQueryResult<DashboardItem[]> {
  return useQuery({
    queryKey: queryKeys.dashboardItems(period),
    queryFn: () => dashboardService.getDashboardItems(period),
    ...options,
  })
}

/**
 * Custom hook for fetching all dashboard data in parallel
 * Uses useQueries for optimal parallel fetching
 * @param period - Optional period filter
 * @param options - Optional settings to control fetching
 * @returns Combined query results
 */
export function useDashboardData(
  period?: PeriodFilter,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true

  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.metrics(period),
        queryFn: () => dashboardService.getMetrics(period),
        enabled,
      },
      {
        queryKey: queryKeys.financialMetrics(period),
        queryFn: () => dashboardService.getFinancialMetrics(period),
        enabled,
      },
      {
        queryKey: queryKeys.chartData(period),
        queryFn: () => dashboardService.getChartData(period),
        enabled,
      },
      {
        queryKey: queryKeys.shippingDifference(period),
        queryFn: () => dashboardService.getShippingDifference(period),
        enabled,
      },
    ],
  })

  // Combine results into a single object
  const [metricsQuery, financialQuery, chartQuery, shippingQuery] = results

  // Check if all queries are successful
  const isSuccess = results.every((result) => result.isSuccess)
  const isLoading = results.some((result) => result.isLoading)
  const isError = results.some((result) => result.isError)
  const isFetching = results.some((result) => result.isFetching)

  // Combine errors if any
  const errors = results
    .filter((result) => result.error)
    .map((result) => result.error)

  // Combine data if all successful
  const data: DashboardData | undefined = isSuccess
    ? {
        metrics: metricsQuery.data!,
        financialMetrics: financialQuery.data!,
        chartData: chartQuery.data!,
        shippingDifference: shippingQuery.data!,
      }
    : undefined

  return {
    data,
    isSuccess,
    isLoading,
    isError,
    isFetching,
    errors,
    queries: {
      metrics: metricsQuery,
      financial: financialQuery,
      chart: chartQuery,
      shipping: shippingQuery,
    },
  }
}

/**
 * Hook to prefetch dashboard data for adjacent periods
 * Useful for improving perceived performance
 * @param currentPeriod - Current period being viewed
 * @param adjacentPeriod - Adjacent period to prefetch
 */
export function usePrefetchDashboardData(
  currentPeriod?: PeriodFilter,
  adjacentPeriod?: PeriodFilter,
) {
  const targetPeriod = adjacentPeriod ?? currentPeriod
  usePrefetchQuery({
    queryKey: queryKeys.metrics(targetPeriod),
    queryFn: () => dashboardService.getMetrics(targetPeriod),
    ...PREFETCH_CONFIG,
  })

  usePrefetchQuery({
    queryKey: queryKeys.financialMetrics(targetPeriod),
    queryFn: () => dashboardService.getFinancialMetrics(targetPeriod),
    ...PREFETCH_CONFIG,
  })

  usePrefetchQuery({
    queryKey: queryKeys.chartData(targetPeriod),
    queryFn: () => dashboardService.getChartData(targetPeriod),
    ...PREFETCH_CONFIG,
  })

  usePrefetchQuery({
    queryKey: queryKeys.shippingDifference(targetPeriod),
    queryFn: () => dashboardService.getShippingDifference(targetPeriod),
    ...PREFETCH_CONFIG,
  })
}

/**
 * Hook to calculate adjacent period for prefetching
 * @param period - Current period filter
 * @param direction - Direction to calculate ('next' or 'previous')
 * @returns Adjacent period filter
 */
export function useAdjacentPeriod(
  period?: PeriodFilter,
  direction: 'next' | 'previous' = 'next',
): PeriodFilter | undefined {
  if (!period?.startDate || !period?.endDate) return undefined

  const daysDiff = Math.ceil(
    (period.endDate.getTime() - period.startDate.getTime()) /
      (1000 * 60 * 60 * 24),
  )

  const multiplier = direction === 'next' ? 1 : -1

  return {
    startDate: new Date(
      period.startDate.getTime() + daysDiff * multiplier * 24 * 60 * 60 * 1000,
    ),
    endDate: new Date(
      period.endDate.getTime() + daysDiff * multiplier * 24 * 60 * 60 * 1000,
    ),
    marketplaceId: period.marketplaceId, // Preserve marketplace filter
  }
}
