/**
 * Integration tests for validated React Query hooks
 * Tests the complete flow: Service → Validation → React Query → Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useDashboardMetricsValidated,
  useDashboardDataValidated,
  usePrefetchDashboardDataValidated,
} from '../dashboard/use-dashboard-data-validated'
import {
  useProdutoMetricsValidated,
  useProdutosListValidated,
  useAllProdutoDataValidated,
} from '../produtos/use-produtos-data-validated'
import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import { produtosService } from '@/modules/produtos/services/produtos.service'
import { ValidationError } from '@/modules/core/utils/validation'
import { toast } from 'sonner'
import {
  validDashboardMetrics,
  invalidDashboardMetrics,
  validFinancialMetrics,
} from '@/modules/dashboard/schemas/__tests__/fixtures/dashboard-valid-data'
import {
  validProdutoMetrics,
  invalidProdutoMetrics,
  validProdutos,
} from '@/modules/produtos/schemas/__tests__/fixtures/produtos-valid-data'
import type {
  DashboardMetrics,
  DashboardFinancialMetrics,
} from '@/modules/dashboard/types/dashboard.types'

// Mock the services
vi.mock('@/modules/dashboard/services/dashboard.service')
vi.mock('@/modules/produtos/services/produtos.service')
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const dashboardServiceMock = vi.mocked(dashboardService)
const produtosServiceMock = vi.mocked(produtosService)
const toastMock = vi.mocked(toast)
const toastErrorMock = vi.mocked(toast.error)

describe('Validated Hooks Integration Tests', () => {
  let queryClient: QueryClient
  let wrapper: React.FC<{ children: React.ReactNode }>

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
          cacheTime: 0, // Disable cache for tests
          staleTime: 0,
        },
      },
      logger: {
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    })

    // Create wrapper component
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Dashboard Hooks', () => {
    describe('useDashboardMetricsValidated', () => {
      it('should return validated data when service returns valid data', async () => {
        // Mock service to return valid data
        dashboardServiceMock.getMetrics.mockResolvedValue(validDashboardMetrics)

        const { result } = renderHook(() => useDashboardMetricsValidated(), {
          wrapper,
        })

        // Wait for the query to resolve
        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        // Check that data is validated and returned
        expect(result.current.data).toEqual(validDashboardMetrics)
        expect(result.current.error).toBeNull()
        expect(toast.error).not.toHaveBeenCalled()
      })

      it('should handle validation errors and show toast', async () => {
        // Mock service to return invalid data that will fail validation
        // Using undefined will cause validation to fail
        dashboardServiceMock.getMetrics.mockResolvedValue(
          undefined as unknown as DashboardMetrics,
        )

        const { result } = renderHook(() => useDashboardMetricsValidated(), {
          wrapper,
        })

        // Wait for the error state
        await waitFor(() => expect(result.current.isError).toBe(true))

        // Check that error is a ValidationError
        expect(result.current.error).toBeInstanceOf(ValidationError)

        // Check that toast was called
        expect(toast.error).toHaveBeenCalledWith(
          'Erro ao validar dados: métricas do dashboard',
          expect.any(Object),
        )
      })

      it('should not retry on validation errors', async () => {
        dashboardServiceMock.getMetrics.mockResolvedValue(
          undefined as unknown as DashboardMetrics,
        )

        const { result } = renderHook(() => useDashboardMetricsValidated(), {
          wrapper,
        })

        // Wait for error
        await waitFor(() => expect(result.current.isError).toBe(true))

        // Service should only be called once (no retries)
        expect(dashboardServiceMock.getMetrics.mock.calls.length).toBe(1)
      })

      it('should retry on network errors', async () => {
        dashboardServiceMock.getMetrics
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(validDashboardMetrics)

        const { result } = renderHook(
          () => useDashboardMetricsValidated(undefined, { retry: 1 }),
          { wrapper },
        )

        // Wait for success after retry
        await waitFor(() => expect(result.current.isSuccess).toBe(true), {
          timeout: 3000,
        })

        // Service should be called twice (initial + 1 retry)
        expect(dashboardServiceMock.getMetrics.mock.calls.length).toBe(2)
        expect(result.current.data).toEqual(validDashboardMetrics)
      })
    })

    describe('useDashboardDataValidated', () => {
      it('should fetch all dashboard data in parallel', async () => {
        // Mock all service methods
        dashboardServiceMock.getMetrics.mockResolvedValue(
          validDashboardMetrics,
        )
        dashboardServiceMock.getFinancialMetrics.mockResolvedValue(
          validFinancialMetrics,
        )
        dashboardServiceMock.getChartData.mockResolvedValue([])
        dashboardServiceMock.getShippingDifference.mockResolvedValue({
          value: 1500,
          currency: 'BRL',
          trend: 'positive',
          description: 'Economia no frete comparado ao mês anterior',
        })

        const { result } = renderHook(() => useDashboardDataValidated(), {
          wrapper,
        })

        // Wait for all queries to resolve
        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        // Check that all data is present
        expect(result.current.data).toBeDefined()
        expect(result.current.data?.metrics).toEqual(validDashboardMetrics)
        expect(result.current.data?.financialMetrics).toEqual(
          validFinancialMetrics,
        )
        expect(result.current.validationErrors).toHaveLength(0)
      })

      it('should handle partial failures with fallback data', async () => {
        // Mock metrics to fail validation
        dashboardServiceMock.getMetrics.mockResolvedValue(
          undefined as unknown as DashboardMetrics,
        )
        dashboardServiceMock.getFinancialMetrics.mockResolvedValue(
          validFinancialMetrics,
        )
        dashboardServiceMock.getChartData.mockResolvedValue([])
        dashboardServiceMock.getShippingDifference.mockResolvedValue({
          value: 1500,
          currency: 'BRL',
          trend: 'positive',
          description: 'Economia no frete comparado ao mês anterior',
        })

        const fallbackData = {
          metrics: validDashboardMetrics,
        }

        const { result } = renderHook(
          () => useDashboardDataValidated(undefined, { fallbackData }),
          { wrapper },
        )

        // Wait for queries to settle
        await waitFor(() => expect(result.current.isFetching).toBe(false))

        // Should have validation errors but still provide fallback data
        expect(result.current.validationErrors.length).toBeGreaterThan(0)
        expect(result.current.data).toBeDefined()
      })

      it('should call custom validation error handler', async () => {
        dashboardServiceMock.getMetrics.mockResolvedValue(
          undefined as unknown as DashboardMetrics,
        )
        dashboardServiceMock.getFinancialMetrics.mockResolvedValue(
          validFinancialMetrics,
        )
        dashboardServiceMock.getChartData.mockResolvedValue([])
        dashboardServiceMock.getShippingDifference.mockResolvedValue({
          value: 1500,
          currency: 'BRL',
          trend: 'positive',
          description: 'Economia no frete comparado ao mês anterior',
        })

        const onValidationError = vi.fn()

        const { result } = renderHook(
          () => useDashboardDataValidated(undefined, { onValidationError }),
          { wrapper },
        )

        // Wait for error
        await waitFor(() => expect(result.current.isError).toBe(true))

        // Custom handler should be called with validation errors
        expect(onValidationError).toHaveBeenCalledWith(
          expect.arrayContaining([expect.any(ValidationError)]),
        )
      })
    })
  })

  describe('Produtos Hooks', () => {
    describe('useProdutoMetricsValidated', () => {
      it('should return validated product metrics', async () => {
        produtosServiceMock.getMetrics.mockResolvedValue(validProdutoMetrics)

        const { result } = renderHook(() => useProdutoMetricsValidated(), {
          wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toEqual(validProdutoMetrics)
        expect(result.current.error).toBeNull()
      })

      it('should handle invalid product metrics', async () => {
        produtosServiceMock.getMetrics.mockResolvedValue(
          undefined as unknown as typeof validProdutoMetrics,
        )

        const { result } = renderHook(() => useProdutoMetricsValidated(), {
          wrapper,
        })

        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(result.current.error).toBeInstanceOf(ValidationError)
        expect(toast.error).toHaveBeenCalledWith(
          'Erro ao validar métricas de produtos',
          expect.any(Object),
        )
      })
    })

    describe('useProdutosListValidated', () => {
      it('should return validated products list', async () => {
        produtosServiceMock.getProdutos.mockResolvedValue(validProdutos)

        const { result } = renderHook(() => useProdutosListValidated(), {
          wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toEqual(validProdutos)
        expect(result.current.data?.length).toBe(3)
      })

      it('should filter invalid products with warning', async () => {
        const mixedProdutos = [
          ...validProdutos,
          { invalid: 'product' }, // Invalid product
        ]

        // Mock console.warn
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        produtosServiceMock.getProdutos.mockResolvedValue(
          mixedProdutos as unknown as typeof validProdutos,
        )

        const { result } = renderHook(() => useProdutosListValidated(), {
          wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true), {
          timeout: 3000,
        })

        // Should only return valid products (3 valid ones)
        expect(result.current.data?.length).toBe(3)

        // Should log warning about invalid products
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Product validation:'),
          expect.any(Object),
        )

        warnSpy.mockRestore()
      })
    })

    describe('useAllProdutoDataValidated', () => {
      it('should fetch all product data in parallel', async () => {
        produtosServiceMock.getMetrics.mockResolvedValue(validProdutoMetrics)
        produtosServiceMock.getProdutos.mockResolvedValue(validProdutos)
        produtosServiceMock.getStockDistribution.mockResolvedValue([])
        produtosServiceMock.getProdutosReposicao.mockResolvedValue([])

        const { result } = renderHook(() => useAllProdutoDataValidated(), {
          wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeDefined()
        expect(result.current.data?.metrics).toEqual(validProdutoMetrics)
        expect(result.current.data?.produtos).toEqual(validProdutos)
        expect(result.current.validationErrors).toHaveLength(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should show different toast messages in dev vs production', async () => {
      const originalEnv = process.env.NODE_ENV

      // Test development mode
      process.env.NODE_ENV = 'development'
      dashboardServiceMock.getMetrics.mockResolvedValue(
        undefined as unknown as DashboardMetrics,
      )

      const { result: devResult } = renderHook(
        () => useDashboardMetricsValidated(),
        { wrapper },
      )

      await waitFor(() => expect(devResult.current.isError).toBe(true))

      const devCall = toastErrorMock.mock.calls.at(-1)
      const devOptions = devCall?.[1] as { description?: string } | undefined
      expect(devCall?.[0]).toBe('Erro ao validar dados: métricas do dashboard')
      expect(devOptions?.description ?? '').toContain(
        'erro(s) de validação encontrado(s)',
      )

      // Test production mode
      process.env.NODE_ENV = 'production'
      vi.clearAllMocks()

      const { result: prodResult } = renderHook(
        () => useDashboardMetricsValidated(),
        { wrapper },
      )

      await waitFor(() => expect(prodResult.current.isError).toBe(true))

      const prodCall = toastErrorMock.mock.calls.at(-1)
      const prodOptions = prodCall?.[1] as { description?: string } | undefined
      expect(prodCall?.[0]).toBe('Erro ao validar dados: métricas do dashboard')
      expect(prodOptions?.description).toBe('Por favor, tente novamente mais tarde')

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Caching and Stale Time', () => {
    it('should respect cache configuration for produtos', async () => {
      produtosServiceMock.getMetrics.mockResolvedValue(validProdutoMetrics)

      // First render
      const { result: result1, unmount: unmount1 } = renderHook(
        () => useProdutoMetricsValidated(),
        { wrapper },
      )

      await waitFor(() => expect(result1.current.isSuccess).toBe(true))
      expect(produtosServiceMock.getMetrics.mock.calls.length).toBe(1)

      unmount1()

      // Second render (should use cache)
      const { result: result2 } = renderHook(
        () => useProdutoMetricsValidated(),
        { wrapper },
      )

      // Should immediately have data from cache
      expect(result2.current.data).toEqual(validProdutoMetrics)

      // Service should not be called again (using cache)
      expect(produtosServiceMock.getMetrics.mock.calls.length).toBe(1)
    })
  })
})

/**
 * Test utilities for components using validated hooks
 */
export function createMockQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  })
}

export function createValidatedHooksWrapper(queryClient?: QueryClient) {
  const client = queryClient || createMockQueryClient()

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}
