/**
 * Integration tests for DashboardService
 * Tests service interaction with repository and data transformations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DashboardService } from '@/modules/dashboard/services/dashboard.service'
import type {
  PeriodFilter,
  DashboardMetrics,
  DashboardFinancialMetrics,
  ChartDataPoint,
  ShippingDifferenceData,
} from '@/modules/dashboard/types/dashboard.types'

// Mock the dependencies
vi.mock('@/modules/core', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    orderItem: {
      aggregate: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/modules/dashboard/repositories/dashboard-repository')

vi.mock('@/modules/core/config/environment', () => ({
  ENV_CONFIG: {
    isDevelopment: false,
    isProduction: true,
    useMockData: false,
    defaultOrganizationId: 'test-org-123',
  },
}))

describe('DashboardService - Integration Tests', () => {
  let service: DashboardService
  let mockRepository: any

  beforeEach(() => {
    vi.clearAllMocks()
    service = new DashboardService()

    // Get mocked repository instance
    const {
      DashboardRepository,
    } = require('@/modules/dashboard/repositories/dashboard-repository')
    mockRepository = DashboardRepository.mock.results[0].value
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Service Initialization', () => {
    it('should create service instance with repository', () => {
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(DashboardService)
    })

    it('should initialize repository on construction', () => {
      const {
        DashboardRepository,
      } = require('@/modules/dashboard/repositories/dashboard-repository')
      expect(DashboardRepository).toHaveBeenCalled()
    })
  })

  describe('getChartData', () => {
    const mockChartData: ChartDataPoint[] = [
      { date: '2024-01-01', current: 5000, previous: 4500, label: '1 Jan' },
      { date: '2024-01-02', current: 5500, previous: 4800, label: '2 Jan' },
      { date: '2024-01-03', current: 6000, previous: 5000, label: '3 Jan' },
    ]

    it('should fetch chart data from repository', async () => {
      mockRepository.getChartData = vi.fn().mockResolvedValue(mockChartData)

      const result = await service.getChartData('month')

      expect(mockRepository.getChartData).toHaveBeenCalledWith(
        'test-org-123',
        'month',
      )
      expect(result).toEqual(mockChartData)
    })

    it('should handle different period filters', async () => {
      mockRepository.getChartData = vi.fn().mockResolvedValue(mockChartData)

      const periods: PeriodFilter[] = ['today', 'week', 'month', 'year']

      for (const period of periods) {
        await service.getChartData(period)
        expect(mockRepository.getChartData).toHaveBeenCalledWith(
          'test-org-123',
          period,
        )
      }
    })

    it('should return empty array when no data available', async () => {
      mockRepository.getChartData = vi.fn().mockResolvedValue([])

      const result = await service.getChartData('month')

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should handle repository errors gracefully', async () => {
      mockRepository.getChartData = vi
        .fn()
        .mockRejectedValue(new Error('Database connection failed'))

      const result = await service.getChartData('month')

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should return empty array when organization ID is missing', async () => {
      const { ENV_CONFIG } = require('@/modules/core/config/environment')
      ENV_CONFIG.defaultOrganizationId = null

      const result = await service.getChartData('month')

      expect(result).toEqual([])
      expect(mockRepository.getChartData).not.toHaveBeenCalled()

      // Restore organization ID
      ENV_CONFIG.defaultOrganizationId = 'test-org-123'
    })
  })

  describe('getMetrics', () => {
    const mockMetrics: DashboardMetrics = {
      totalSales: {
        value: 50000,
        currency: 'R$',
        change: 15,
        trend: 'up',
        description: '+15% vs período anterior',
        subtext: 'R$ 43.478 no período anterior',
      },
      itemsSold: {
        value: 150,
        unit: 'un',
        change: 10,
        trend: 'up',
        description: '+10% vs período anterior',
        subtext: '136 un no período anterior',
      },
      orders: {
        value: 45,
        change: 5,
        trend: 'up',
        description: '+5% vs período anterior',
        subtext: '43 pedidos no período anterior',
      },
      averageTicket: {
        value: 1111.11,
        currency: 'R$',
        change: 8,
        trend: 'up',
        description: '+8% vs período anterior',
        subtext: 'R$ 1.029 no período anterior',
      },
    }

    it('should fetch sales metrics from repository', async () => {
      mockRepository.getSalesMetrics = vi.fn().mockResolvedValue(mockMetrics)

      const result = await service.getMetrics('month')

      expect(mockRepository.getSalesMetrics).toHaveBeenCalledWith(
        'test-org-123',
        'month',
      )
      expect(result).toEqual(mockMetrics)
    })

    it('should return empty metrics when no data available', async () => {
      const emptyMetrics: DashboardMetrics = {
        totalSales: {
          value: 0,
          currency: 'R$',
          change: 0,
          trend: 'up',
          description: '',
          subtext: '',
        },
        itemsSold: {
          value: 0,
          unit: 'un',
          change: 0,
          trend: 'up',
          description: '',
          subtext: '',
        },
        orders: {
          value: 0,
          change: 0,
          trend: 'up',
          description: '',
          subtext: '',
        },
        averageTicket: {
          value: 0,
          currency: 'R$',
          change: 0,
          trend: 'up',
          description: '',
          subtext: '',
        },
      }

      mockRepository.getSalesMetrics = vi.fn().mockResolvedValue(emptyMetrics)

      const result = await service.getMetrics('month')

      expect(result.totalSales.description).toBe(
        'Sem dados para o período selecionado',
      )
      expect(result.totalSales.value).toBe(0)
    })

    it('should handle repository errors and return empty metrics', async () => {
      mockRepository.getSalesMetrics = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))

      const result = await service.getMetrics('month')

      expect(result.totalSales.description).toBe('Erro ao carregar métricas')
      expect(result.totalSales.value).toBe(0)
    })

    it('should calculate metrics correctly with partial data', async () => {
      const partialMetrics: DashboardMetrics = {
        ...mockMetrics,
        itemsSold: {
          value: 0,
          unit: 'un',
          change: 0,
          trend: 'up',
          description: '',
          subtext: '',
        },
      }

      mockRepository.getSalesMetrics = vi.fn().mockResolvedValue(partialMetrics)

      const result = await service.getMetrics('month')

      expect(result).toEqual(partialMetrics)
      expect(result.totalSales.value).toBeGreaterThan(0)
    })
  })

  describe('getFinancialMetrics', () => {
    const mockFinancialMetrics: DashboardFinancialMetrics = {
      salesWithoutShipping: {
        value: 45000,
        currency: 'R$',
        change: 12,
        trend: 'up',
        description: '+12% vs período anterior',
        subtext: 'Vendas líquidas',
      },
      costOfGoods: {
        value: 20000,
        currency: 'R$',
        change: 8,
        trend: 'up',
        description: '+8% vs período anterior',
        subtext: 'Custo das mercadorias',
      },
      taxes: {
        value: 5000,
        currency: 'R$',
        change: 10,
        trend: 'up',
        description: '+10% vs período anterior',
        subtext: 'Impostos totais',
      },
      marketplaceFees: {
        value: 3000,
        currency: 'R$',
        change: 5,
        trend: 'up',
        description: '+5% vs período anterior',
        subtext: 'Taxas de marketplace',
      },
      grossProfit: {
        value: 17000,
        currency: 'R$',
        change: 15,
        trend: 'up',
        description: '+15% vs período anterior',
        subtext: 'Lucro bruto',
      },
    }

    it('should fetch financial metrics from repository', async () => {
      mockRepository.getFinancialMetrics = vi
        .fn()
        .mockResolvedValue(mockFinancialMetrics)

      const result = await service.getFinancialMetrics('month')

      expect(mockRepository.getFinancialMetrics).toHaveBeenCalledWith(
        'test-org-123',
        'month',
      )
      expect(result).toEqual(mockFinancialMetrics)
    })

    it('should validate financial calculations', async () => {
      mockRepository.getFinancialMetrics = vi
        .fn()
        .mockResolvedValue(mockFinancialMetrics)

      const result = await service.getFinancialMetrics('month')

      const expectedProfit =
        result.salesWithoutShipping.value -
        result.costOfGoods.value -
        result.taxes.value -
        result.marketplaceFees.value

      expect(result.grossProfit.value).toBe(expectedProfit)
    })

    it('should handle negative profit scenarios', async () => {
      const negativeProfit = {
        ...mockFinancialMetrics,
        grossProfit: {
          ...mockFinancialMetrics.grossProfit,
          value: -5000,
          trend: 'down' as const,
          change: -20,
        },
      }

      mockRepository.getFinancialMetrics = vi
        .fn()
        .mockResolvedValue(negativeProfit)

      const result = await service.getFinancialMetrics('month')

      expect(result.grossProfit.value).toBeLessThan(0)
      expect(result.grossProfit.trend).toBe('down')
    })
  })

  describe('getShippingDifference', () => {
    const mockShippingData: ShippingDifferenceData = {
      value: 2500,
      currency: 'R$',
      trend: 'up',
      description: 'Diferença de frete cobrado vs pago',
    }

    it('should fetch shipping difference from repository', async () => {
      mockRepository.getShippingDifference = vi
        .fn()
        .mockResolvedValue(mockShippingData)

      const result = await service.getShippingDifference('month')

      expect(mockRepository.getShippingDifference).toHaveBeenCalledWith(
        'test-org-123',
        'month',
      )
      expect(result).toEqual(mockShippingData)
    })

    it('should handle neutral trend for zero difference', async () => {
      const neutralShipping = {
        ...mockShippingData,
        value: 0,
        trend: 'neutral' as const,
      }

      mockRepository.getShippingDifference = vi
        .fn()
        .mockResolvedValue(neutralShipping)

      const result = await service.getShippingDifference('month')

      expect(result.trend).toBe('neutral')
      expect(result.value).toBe(0)
    })

    it('should handle repository errors', async () => {
      mockRepository.getShippingDifference = vi
        .fn()
        .mockRejectedValue(new Error('Database error'))

      const result = await service.getShippingDifference('month')

      expect(result.value).toBe(0)
      expect(result.trend).toBe('neutral')
      expect(result.description).toBe('Erro ao carregar dados de frete')
    })
  })

  describe('getAllDashboardData', () => {
    it('should fetch all data in parallel', async () => {
      const mockChartData = [
        { date: '2024-01-01', current: 5000, previous: 4500, label: '1 Jan' },
      ]
      const mockMetrics = {
        totalSales: {
          value: 50000,
          currency: 'R$',
          change: 15,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
        itemsSold: {
          value: 150,
          unit: 'un',
          change: 10,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
        orders: {
          value: 45,
          change: 5,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
        averageTicket: {
          value: 1111,
          currency: 'R$',
          change: 8,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
      }
      const mockFinancial = {
        salesWithoutShipping: {
          value: 45000,
          currency: 'R$',
          change: 12,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
        costOfGoods: {
          value: 20000,
          currency: 'R$',
          change: 8,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
        taxes: {
          value: 5000,
          currency: 'R$',
          change: 10,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
        marketplaceFees: {
          value: 3000,
          currency: 'R$',
          change: 5,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
        grossProfit: {
          value: 17000,
          currency: 'R$',
          change: 15,
          trend: 'up' as const,
          description: '',
          subtext: '',
        },
      }
      const mockShipping = {
        value: 2500,
        currency: 'R$',
        trend: 'up' as const,
        description: '',
      }

      mockRepository.getChartData = vi.fn().mockResolvedValue(mockChartData)
      mockRepository.getSalesMetrics = vi.fn().mockResolvedValue(mockMetrics)
      mockRepository.getFinancialMetrics = vi
        .fn()
        .mockResolvedValue(mockFinancial)
      mockRepository.getShippingDifference = vi
        .fn()
        .mockResolvedValue(mockShipping)

      const startTime = Date.now()
      const result = await service.getAllDashboardData('month')
      const endTime = Date.now()

      // Should complete quickly due to parallel execution
      expect(endTime - startTime).toBeLessThan(100)

      expect(result).toEqual({
        chartData: mockChartData,
        metrics: mockMetrics,
        financialMetrics: mockFinancial,
        shippingDifference: mockShipping,
      })

      // Verify all methods were called
      expect(mockRepository.getChartData).toHaveBeenCalledTimes(1)
      expect(mockRepository.getSalesMetrics).toHaveBeenCalledTimes(1)
      expect(mockRepository.getFinancialMetrics).toHaveBeenCalledTimes(1)
      expect(mockRepository.getShippingDifference).toHaveBeenCalledTimes(1)
    })

    it('should handle partial failures gracefully', async () => {
      mockRepository.getChartData = vi.fn().mockResolvedValue([])
      mockRepository.getSalesMetrics = vi
        .fn()
        .mockRejectedValue(new Error('Metrics error'))
      mockRepository.getFinancialMetrics = vi.fn().mockResolvedValue({
        salesWithoutShipping: {
          value: 45000,
          currency: 'R$',
          change: 12,
          trend: 'up',
          description: '',
          subtext: '',
        },
        costOfGoods: {
          value: 20000,
          currency: 'R$',
          change: 8,
          trend: 'up',
          description: '',
          subtext: '',
        },
        taxes: {
          value: 5000,
          currency: 'R$',
          change: 10,
          trend: 'up',
          description: '',
          subtext: '',
        },
        marketplaceFees: {
          value: 3000,
          currency: 'R$',
          change: 5,
          trend: 'up',
          description: '',
          subtext: '',
        },
        grossProfit: {
          value: 17000,
          currency: 'R$',
          change: 15,
          trend: 'up',
          description: '',
          subtext: '',
        },
      })
      mockRepository.getShippingDifference = vi.fn().mockResolvedValue({
        value: 2500,
        currency: 'R$',
        trend: 'up',
        description: 'Test',
      })

      const result = await service.getAllDashboardData('month')

      expect(result.chartData).toEqual([])
      expect(result.metrics.totalSales.value).toBe(0)
      expect(result.metrics.totalSales.description).toBe(
        'Erro ao carregar métricas',
      )
      expect(result.financialMetrics.salesWithoutShipping.value).toBe(45000)
      expect(result.shippingDifference.value).toBe(2500)
    })

    it('should handle complete failure with error response', async () => {
      const error = new Error('Complete system failure')
      mockRepository.getChartData = vi.fn().mockRejectedValue(error)
      mockRepository.getSalesMetrics = vi.fn().mockRejectedValue(error)
      mockRepository.getFinancialMetrics = vi.fn().mockRejectedValue(error)
      mockRepository.getShippingDifference = vi.fn().mockRejectedValue(error)

      const result = await service.getAllDashboardData('month')

      expect(result.chartData).toEqual([])
      expect(result.metrics.totalSales.description).toContain('Erro')
      expect(
        result.financialMetrics.salesWithoutShipping.description,
      ).toContain('Erro')
      expect(result.shippingDifference.description).toContain('Erro')
    })
  })

  describe('Mock Data Mode', () => {
    it('should use mock data when enabled in development', async () => {
      const { ENV_CONFIG } = require('@/modules/core/config/environment')
      ENV_CONFIG.useMockData = true
      ENV_CONFIG.isDevelopment = true

      const result = await service.getChartData('month')

      // Should not call repository when using mock data
      expect(mockRepository.getChartData).not.toHaveBeenCalled()

      // Should return mock data
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)

      // Restore settings
      ENV_CONFIG.useMockData = false
      ENV_CONFIG.isDevelopment = false
    })

    it('should never use mock data in production', async () => {
      const { ENV_CONFIG } = require('@/modules/core/config/environment')
      ENV_CONFIG.useMockData = true // Try to force mock data
      ENV_CONFIG.isProduction = true
      ENV_CONFIG.isDevelopment = false

      mockRepository.getChartData = vi.fn().mockResolvedValue([])

      await service.getChartData('month')

      // Should call repository even if useMockData is true in production
      expect(mockRepository.getChartData).toHaveBeenCalled()

      // Restore settings
      ENV_CONFIG.useMockData = false
    })
  })

  describe('Error Handling & Logging', () => {
    it('should log errors to console in development', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')

      mockRepository.getChartData = vi.fn().mockRejectedValue(error)

      await service.getChartData('month')

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DashboardService] Error fetching chart data:',
        error,
      )

      consoleSpy.mockRestore()
    })

    it('should not throw errors to caller', async () => {
      mockRepository.getChartData = vi
        .fn()
        .mockRejectedValue(new Error('Fatal error'))

      // Should not throw
      await expect(service.getChartData('month')).resolves.toEqual([])
    })
  })

  describe('Performance', () => {
    it('should cache repository instance', () => {
      const service1 = new DashboardService()
      const service2 = new DashboardService()

      const {
        DashboardRepository,
      } = require('@/modules/dashboard/repositories/dashboard-repository')

      // Repository should be created for each service instance
      expect(DashboardRepository).toHaveBeenCalledTimes(2)
    })

    it('should execute getAllDashboardData in parallel', async () => {
      const delays = {
        chart: 50,
        metrics: 60,
        financial: 40,
        shipping: 30,
      }

      mockRepository.getChartData = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve([]), delays.chart),
            ),
        )
      mockRepository.getSalesMetrics = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({}), delays.metrics),
            ),
        )
      mockRepository.getFinancialMetrics = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({}), delays.financial),
            ),
        )
      mockRepository.getShippingDifference = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({}), delays.shipping),
            ),
        )

      const startTime = Date.now()
      await service.getAllDashboardData('month')
      const endTime = Date.now()

      const executionTime = endTime - startTime
      const maxDelay = Math.max(...Object.values(delays))

      // Should take approximately the time of the longest operation
      // Adding buffer for test reliability
      expect(executionTime).toBeLessThan(maxDelay + 50)
      expect(executionTime).toBeGreaterThanOrEqual(maxDelay - 10)
    })
  })
})
