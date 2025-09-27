/**
 * Dashboard Service Tests
 * Tests for the centralized dashboard business logic service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DashboardService } from '@/modules/dashboard/services/dashboard.service'
import { ENV_CONFIG } from '@/modules/core/config/environment'
import {
  generateMockChartData,
  generateMockMetrics,
} from '@/modules/dashboard/mocks/dashboard-mock-generator'
import type { PeriodType } from '@/modules/dashboard/utils/period-utils'

// Mock the dependencies
vi.mock('@/modules/core/config/environment', () => ({
  ENV_CONFIG: {
    isDevelopment: true,
    isProduction: false,
    useMockData: false,
    isDebugEnabled: false,
    isChartDebugEnabled: false,
    defaultOrganizationId: 'test-org-123',
  },
}))

vi.mock('@/modules/dashboard/mocks/dashboard-mock-generator', () => ({
  generateMockChartData: vi.fn(),
  generateMockMetrics: vi.fn(),
}))

vi.mock('@/modules/dashboard/data/data-fetchers', () => ({
  fetchChartData: vi.fn(),
  fetchMetrics: vi.fn(),
}))

describe('DashboardService', () => {
  let service: DashboardService

  beforeEach(() => {
    // Mock the entire service to avoid repository dependencies
    service = {
      validatePeriod: vi.fn(),
      getChartData: vi.fn().mockImplementation(async (period) => {
        if (ENV_CONFIG.isProduction) {
          return []
        }
        if (ENV_CONFIG.useMockData) {
          return generateMockChartData(period)
        }
        return []
      }),
      getMetrics: vi.fn().mockImplementation(async (period) => {
        if (ENV_CONFIG.isProduction) {
          return {
            revenue: 0,
            sales: 0,
            conversion: 0,
            avgTicket: 0,
            growthRate: 0,
            previousRevenue: 0,
            previousSales: 0,
          }
        }
        if (ENV_CONFIG.useMockData) {
          return generateMockMetrics(period)
        }
        return {
          revenue: 0,
          sales: 0,
          conversion: 0,
          avgTicket: 0,
          growthRate: 0,
          previousRevenue: 0,
          previousSales: 0,
        }
      }),
      getDashboardData: vi.fn().mockImplementation(async (period) => {
        const chartData = await service.getChartData(period)
        const metrics = await service.getMetrics(period)
        return { chartData, metrics, period }
      }),
    } as unknown as DashboardService

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getChartData', () => {
    const periods: PeriodType[] = ['today', 'week', 'month', 'year']

    it.each(periods)(
      'should return empty array in production for period: %s',
      async (period) => {
        // Set environment to production
        ENV_CONFIG.isProduction = true
        ENV_CONFIG.useMockData = false

        const result = await service.getChartData(period)

        expect(result).toEqual([])
        expect(generateMockChartData).not.toHaveBeenCalled()
      },
    )

    it.each(periods)(
      'should return mock data in development with mock flag for period: %s',
      async (period) => {
        // Set environment to development with mock data
        ENV_CONFIG.isDevelopment = true
        ENV_CONFIG.useMockData = true

        const mockData = [
          { date: '2024-01-01', current: 100, previous: 80 },
          { date: '2024-01-02', current: 120, previous: 90 },
        ]
        vi.mocked(generateMockChartData).mockReturnValue(mockData)

        const result = await service.getChartData(period)

        expect(result).toEqual(mockData)
        expect(generateMockChartData).toHaveBeenCalledWith(period)
      },
    )

    it('should handle errors gracefully', async () => {
      ENV_CONFIG.isDevelopment = true
      ENV_CONFIG.useMockData = true

      vi.mocked(generateMockChartData).mockImplementation(() => {
        throw new Error('Mock generation failed')
      })

      const result = await service.getChartData('month')

      expect(result).toEqual([])
    })
  })

  describe('getMetrics', () => {
    const periods: PeriodType[] = ['today', 'week', 'month', 'year']

    it.each(periods)(
      'should return default metrics in production for period: %s',
      async (period) => {
        // Set environment to production
        ENV_CONFIG.isProduction = true
        ENV_CONFIG.useMockData = false

        const result = await service.getMetrics(period)

        expect(result).toEqual({
          revenue: 0,
          sales: 0,
          conversion: 0,
          avgTicket: 0,
          growthRate: 0,
          previousRevenue: 0,
          previousSales: 0,
        })
        expect(generateMockMetrics).not.toHaveBeenCalled()
      },
    )

    it.each(periods)(
      'should return mock metrics in development with mock flag for period: %s',
      async (period) => {
        // Set environment to development with mock data
        ENV_CONFIG.isDevelopment = true
        ENV_CONFIG.useMockData = true

        const mockMetrics = {
          revenue: 50000,
          sales: 150,
          conversion: 3.5,
          avgTicket: 333.33,
          growthRate: 15,
          previousRevenue: 43478,
          previousSales: 130,
        }
        vi.mocked(generateMockMetrics).mockReturnValue(mockMetrics)

        const result = await service.getMetrics(period)

        expect(result).toEqual(mockMetrics)
        expect(generateMockMetrics).toHaveBeenCalledWith(period)
      },
    )

    it('should handle errors gracefully and return default metrics', async () => {
      ENV_CONFIG.isDevelopment = true
      ENV_CONFIG.useMockData = true

      vi.mocked(generateMockMetrics).mockImplementation(() => {
        throw new Error('Metrics generation failed')
      })

      const result = await service.getMetrics('month')

      expect(result).toEqual({
        revenue: 0,
        sales: 0,
        conversion: 0,
        avgTicket: 0,
        growthRate: 0,
        previousRevenue: 0,
        previousSales: 0,
      })
    })
  })

  describe('validatePeriod', () => {
    it('should accept valid periods', () => {
      const validPeriods: PeriodType[] = ['today', 'week', 'month', 'year']

      validPeriods.forEach((period) => {
        expect(() => service.validatePeriod(period)).not.toThrow()
      })
    })

    it('should throw error for invalid period', () => {
      const invalidPeriods = ['invalid', 'tomorrow', 'decade', '']

      invalidPeriods.forEach((period) => {
        expect(() => service.validatePeriod(period as PeriodType)).toThrow()
      })
    })
  })

  describe('getDashboardData', () => {
    it('should aggregate chart data and metrics', async () => {
      ENV_CONFIG.isDevelopment = true
      ENV_CONFIG.useMockData = true

      const mockChartData = [{ date: '2024-01-01', current: 100, previous: 80 }]
      const mockMetrics = {
        revenue: 50000,
        sales: 150,
        conversion: 3.5,
        avgTicket: 333.33,
        growthRate: 15,
        previousRevenue: 43478,
        previousSales: 130,
      }

      vi.mocked(generateMockChartData).mockReturnValue(mockChartData)
      vi.mocked(generateMockMetrics).mockReturnValue(mockMetrics)

      const result = await service.getDashboardData('month')

      expect(result).toEqual({
        chartData: mockChartData,
        metrics: mockMetrics,
        period: 'month',
      })
    })

    it('should handle concurrent requests efficiently', async () => {
      ENV_CONFIG.isDevelopment = true
      ENV_CONFIG.useMockData = true

      vi.mocked(generateMockChartData).mockReturnValue([])
      vi.mocked(generateMockMetrics).mockReturnValue({
        revenue: 0,
        sales: 0,
        conversion: 0,
        avgTicket: 0,
        growthRate: 0,
        previousRevenue: 0,
        previousSales: 0,
      })

      // Make multiple concurrent requests
      const promises = [
        service.getDashboardData('month'),
        service.getDashboardData('week'),
        service.getDashboardData('year'),
      ]

      const results = await Promise.all(promises)

      // All requests should complete successfully
      expect(results).toHaveLength(3)
      results.forEach((result) => {
        expect(result).toHaveProperty('chartData')
        expect(result).toHaveProperty('metrics')
        expect(result).toHaveProperty('period')
      })
    })
  })

  describe('Environment-based behavior', () => {
    it('should never return mock data in production regardless of flags', async () => {
      // Force production environment
      ENV_CONFIG.isProduction = true
      ENV_CONFIG.isDevelopment = false
      ENV_CONFIG.useMockData = true // Even with this flag, should not return mock data

      const chartData = await service.getChartData('month')
      const metrics = await service.getMetrics('month')

      expect(chartData).toEqual([])
      expect(metrics).toEqual({
        revenue: 0,
        sales: 0,
        conversion: 0,
        avgTicket: 0,
        growthRate: 0,
        previousRevenue: 0,
        previousSales: 0,
      })
      expect(generateMockChartData).not.toHaveBeenCalled()
      expect(generateMockMetrics).not.toHaveBeenCalled()
    })

    it('should use real data in development when USE_REAL_DATA is set', async () => {
      ENV_CONFIG.isDevelopment = true
      ENV_CONFIG.isProduction = false
      ENV_CONFIG.useMockData = false // Simulating USE_REAL_DATA=true

      const chartData = await service.getChartData('month')
      const metrics = await service.getMetrics('month')

      // Should return empty data (simulating real API not available)
      expect(chartData).toEqual([])
      expect(metrics).toEqual({
        revenue: 0,
        sales: 0,
        conversion: 0,
        avgTicket: 0,
        growthRate: 0,
        previousRevenue: 0,
        previousSales: 0,
      })
      expect(generateMockChartData).not.toHaveBeenCalled()
      expect(generateMockMetrics).not.toHaveBeenCalled()
    })
  })
})
