/**
 * Tests for useDashboardData hook
 * Tests caching, refetch, loading states and error handling
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useDashboardData,
  useDashboardMetrics,
  useDashboardChart,
} from '../use-dashboard-data'
import type { ReactNode } from 'react'
import type { PeriodType } from '@/modules/dashboard/utils/period-utils'

type ChartPoint = { date: string; current: number; previous: number }

const getChartDataMock = vi.fn<[], Promise<ChartPoint[]>>()
const getMetricsMock = vi.fn<[], Promise<Record<string, unknown>>>()
const getFinancialMetricsMock = vi.fn<[], Promise<Record<string, unknown>>>()
const getShippingDifferenceMock = vi.fn<[], Promise<Record<string, unknown>>>()
const getDashboardItemsMock = vi.fn<[], Promise<unknown[]>>()

const dashboardServiceMock = {
  getChartData: getChartDataMock,
  getMetrics: getMetricsMock,
  getFinancialMetrics: getFinancialMetricsMock,
  getShippingDifference: getShippingDifferenceMock,
  getDashboardItems: getDashboardItemsMock,
}

vi.mock('@/modules/dashboard/services/dashboard.service', () => ({
  DashboardService: vi.fn(() => dashboardServiceMock),
  dashboardService: dashboardServiceMock,
}))

const defaultChartData: ChartPoint[] = [
  { date: '2024-01-01', current: 100, previous: 80 },
  { date: '2024-01-02', current: 120, previous: 90 },
]

const defaultMetrics = {
  revenue: 50000,
  sales: 150,
  conversion: 3.5,
  avgTicket: 333.33,
  growthRate: 15,
  previousRevenue: 43478,
  previousSales: 130,
}

const defaultFinancialMetrics = {
  salesWithoutShipping: {
    value: 0,
    currency: 'BRL',
    change: 0,
    trend: 'neutral',
    description: 'mock',
    subtext: 'mock',
  },
  costOfGoods: {
    value: 0,
    currency: 'BRL',
    change: 0,
    trend: 'neutral',
    description: 'mock',
    subtext: 'mock',
  },
  taxes: {
    value: 0,
    currency: 'BRL',
    change: 0,
    trend: 'neutral',
    description: 'mock',
    subtext: 'mock',
  },
  marketplaceFees: {
    value: 0,
    currency: 'BRL',
    change: 0,
    trend: 'neutral',
    description: 'mock',
    subtext: 'mock',
  },
  grossProfit: {
    value: 0,
    currency: 'BRL',
    change: 0,
    trend: 'neutral',
    description: 'mock',
    subtext: 'mock',
  },
}

const defaultShippingDifference = {
  value: 1500,
  currency: 'BRL',
  trend: 'positive',
  description: 'Economia no frete comparado ao mês anterior',
}

type DashboardDataResult = ReturnType<typeof useDashboardData>
type DashboardMetricsResult = ReturnType<typeof useDashboardMetrics>
type DashboardChartResult = ReturnType<typeof useDashboardChart>
type DashboardQueries = DashboardDataResult['queries']

describe('useDashboardData', () => {
  let queryClient: QueryClient

  // Create wrapper with QueryClient
  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })

    const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    Wrapper.displayName = 'DashboardTestWrapper'

    return Wrapper
  }

  beforeEach(() => {
    getChartDataMock.mockReset()
    getMetricsMock.mockReset()
    getFinancialMetricsMock.mockReset()
    getShippingDifferenceMock.mockReset()
    getDashboardItemsMock.mockReset()

    getChartDataMock.mockResolvedValue(defaultChartData)
    getMetricsMock.mockResolvedValue(defaultMetrics)
    getFinancialMetricsMock.mockResolvedValue(defaultFinancialMetrics)
    getShippingDifferenceMock.mockResolvedValue(defaultShippingDifference)
    getDashboardItemsMock.mockResolvedValue([])
  })

  afterEach(() => {
    if (queryClient) {
      queryClient.clear()
      const destroy = (queryClient as unknown as { destroy?: () => void }).destroy
      if (typeof destroy === 'function') {
        destroy.call(queryClient)
      }
    }
  })

  describe('Data Fetching', () => {
    it('should fetch dashboard data for a given period', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook<undefined, DashboardDataResult>(
        () => useDashboardData('month'),
        { wrapper },
      )

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Wait for data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isSuccess).toBe(true)
      })

      const current: DashboardDataResult = result.current
      const data = current.data as ChartPoint[] | undefined
      expect(data).toBeDefined()
      if (!data) {
        throw new Error('Expected dashboard data to be available')
      }
      expect(data.metrics).toMatchObject({
        revenue: 50000,
        sales: 150,
      })
      expect(data.chartData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            date: '2024-01-01',
            current: 100,
          }),
        ]),
      )
    })

    it('should handle different period types', async () => {
      const periods: PeriodType[] = ['today', 'week', 'month', 'year']

      for (const period of periods) {
        const wrapper = createWrapper()
        const { result } = renderHook<undefined, DashboardDataResult>(
          () => useDashboardData(period),
          { wrapper },
        )

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toBeDefined()
      }
    })
  })

  describe('Caching Behavior', () => {
    it('should cache data according to staleTime', async () => {
      const wrapper = createWrapper()

      const { result: first } = renderHook<undefined, DashboardDataResult>(
        () => useDashboardData('month', { staleTime: 5 * 60 * 1000 }),
        { wrapper },
      )

      await waitFor(() => {
        expect(first.current.isSuccess).toBe(true)
      })

      const metricsCalls = getMetricsMock.mock.calls.length
      const chartCalls = getChartDataMock.mock.calls.length

      const { result: second } = renderHook<undefined, DashboardDataResult>(
        () => useDashboardData('month', { staleTime: 5 * 60 * 1000 }),
        { wrapper },
      )

      expect(second.current.isSuccess).toBe(true)
      expect(second.current.data).toBeDefined()
      expect(getMetricsMock.mock.calls.length).toBe(metricsCalls)
      expect(getChartDataMock.mock.calls.length).toBe(chartCalls)
    })

    it('should refetch when stale', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook<undefined, DashboardDataResult>(
        () =>
          useDashboardData('month', {
            staleTime: 0, // Immediately stale
            refetchInterval: false,
          }),
        { wrapper },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Trigger refetch on all queries
      const currentAfterInitial: DashboardDataResult = result.current
      const queries: DashboardQueries = currentAfterInitial.queries
      const { metrics, financial, chart, shipping } = queries
      await metrics.refetch()
      await financial.refetch()
      await chart.refetch()
      await shipping.refetch()

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false)
      })

      // Data should be refetched
      expect(result.current.data).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      getChartDataMock.mockRejectedValueOnce(new Error('Fetch failed'))
      getMetricsMock.mockRejectedValueOnce(new Error('Fetch failed'))

      const wrapper = createWrapper()
      const { result } = renderHook<undefined, DashboardDataResult>(
        () => useDashboardData('month'),
        { wrapper },
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      const { error } = result.current as DashboardDataResult
      expect(error).toBeInstanceOf(Error)
      if (error instanceof Error) {
        expect(error.message).toBe('Fetch failed')
      }
    })

    it('should retry on failure', async () => {
      let attempts = 0

      getChartDataMock.mockImplementation(() => {
        attempts += 1
        if (attempts === 1) {
          return Promise.reject(new Error('First attempt failed'))
        }
        return Promise.resolve([])
      })
      getMetricsMock.mockResolvedValueOnce({})

      const retryWrapper = createWrapper()
      const { result } = renderHook<undefined, DashboardDataResult>(
        () => useDashboardData('month', { retry: 1 }),
        { wrapper: retryWrapper },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(attempts).toBe(2) // Initial + 1 retry
    })
  })

  describe('useDashboardMetrics', () => {
    it('should fetch only metrics data', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook<undefined, DashboardMetricsResult>(
        () => useDashboardMetrics('month'),
        { wrapper },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const current: DashboardMetricsResult = result.current

      expect(current.data).toEqual(
        expect.objectContaining({
          revenue: 50000,
          sales: 150,
          conversion: 3.5,
        }),
      )
    })

    it('should support custom query options', async () => {
      const onSuccess = vi.fn()
      const onError = vi.fn()

      const wrapperWithHandlers = createWrapper()
      const { result } = renderHook<undefined, DashboardMetricsResult>(
        () =>
          useDashboardMetrics('month', {
            onSuccess,
            onError,
          }),
        { wrapper: wrapperWithHandlers },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(onSuccess).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('useDashboardChart', () => {
    it('should fetch only chart data', async () => {
      const wrapper = createWrapper()
      const useChartCallback = (): DashboardChartResult =>
        useDashboardChart('month')
      const { result } = renderHook<undefined, DashboardChartResult>(
        useChartCallback,
        { wrapper },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const current: DashboardChartResult = result.current
      const data = current.data
      expect(data).toBeDefined()
      if (!data) {
        throw new Error('Expected chart data to be available')
      }
      expect(data).toEqual([
        { date: '2024-01-01', current: 100, previous: 80 },
        { date: '2024-01-02', current: 120, previous: 90 },
      ])
    })

    it('should handle empty data', async () => {
      getChartDataMock.mockResolvedValueOnce([])
      getMetricsMock.mockResolvedValueOnce({})

      const wrapperEmpty = createWrapper()
      const useEmptyChartCallback = (): DashboardChartResult =>
        useDashboardChart('month')
      const { result } = renderHook<undefined, DashboardChartResult>(
        useEmptyChartCallback,
        { wrapper: wrapperEmpty },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const currentEmpty: DashboardChartResult = result.current
      const emptyData = currentEmpty.data as ChartPoint[] | undefined
      expect(emptyData).toBeDefined()
      expect(emptyData).toEqual([])
    })
  })

  describe('Loading States', () => {
    it('should handle loading states correctly', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook<undefined, DashboardDataResult>(
        () => useDashboardData('month'),
        { wrapper },
      )

      // Initial loading state
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isPending).toBe(true)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.isError).toBe(false)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Success state
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isPending).toBe(false)
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })

    it('should handle refetching states', async () => {
      const wrapperRefetch = createWrapper()
      const { result } = renderHook<undefined, DashboardDataResult>(
        () => useDashboardData('month'),
        { wrapper: wrapperRefetch },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Trigger refetch on metrics query
      const queries: DashboardQueries = result.current.queries
      const { metrics: metricsQuery } = queries
      const refetchPromise = metricsQuery.refetch()

      // Should be fetching but not loading
      expect(result.current.isFetching).toBe(true)
      expect(result.current.isLoading).toBe(false)

      await refetchPromise

      expect(result.current.isFetching).toBe(false)
    })
  })
})
