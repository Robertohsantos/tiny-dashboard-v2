import type {
  ChartDataPoint,
  DashboardMetrics,
  DashboardFinancialMetrics,
  ShippingDifferenceData,
  PeriodFilter,
} from '@/modules/dashboard/data/data-fetchers'
import {
  generateMockChartData,
  generateMockMetrics as generateDeterministicMetrics,
  generateMockFinancialMetrics as generateDeterministicFinancialMetrics,
  generateMockShippingDifference as generateDeterministicShippingDifference,
} from '@/modules/dashboard/mocks/dashboard-mock-generator'

/**
 * Service to handle mock data loading
 * Only loads mock data in development environment when enabled
 */
class MockDataService {
  private readonly isDevelopment = process.env.NODE_ENV === 'development'
  private readonly useMocks = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

  /**
   * Check if mock data should be used
   */
  private shouldUseMocks(): boolean {
    return this.isDevelopment && this.useMocks
  }

  /**
   * Get mock chart data
   */
  getChartData(period?: PeriodFilter): Promise<ChartDataPoint[] | null> {
    if (!this.shouldUseMocks()) {
      return Promise.resolve(null)
    }

    try {
      return Promise.resolve(generateMockChartData(period))
    } catch (error) {
      console.error('Failed to load mock chart data:', error)
      return Promise.resolve(null)
    }
  }

  /**
   * Get mock dashboard metrics
   */
  getDashboardMetrics(
    period?: PeriodFilter,
  ): Promise<DashboardMetrics | null> {
    if (!this.shouldUseMocks()) {
      return Promise.resolve(null)
    }

    try {
      return Promise.resolve(generateDeterministicMetrics(period))
    } catch (error) {
      console.error('Failed to load mock metrics data:', error)
      return Promise.resolve(null)
    }
  }

  /**
   * Get mock financial metrics
   */
  getFinancialMetrics(
    period?: PeriodFilter,
  ): Promise<DashboardFinancialMetrics | null> {
    if (!this.shouldUseMocks()) {
      return Promise.resolve(null)
    }

    try {
      return Promise.resolve(generateDeterministicFinancialMetrics(period))
    } catch (error) {
      console.error('Failed to load mock financial metrics:', error)
      return Promise.resolve(null)
    }
  }

  /**
   * Get mock shipping difference data
   */
  getShippingDifference(
    period?: PeriodFilter,
  ): Promise<ShippingDifferenceData | null> {
    if (!this.shouldUseMocks()) {
      return Promise.resolve(null)
    }

    try {
      return Promise.resolve(generateDeterministicShippingDifference(period))
    } catch (error) {
      console.error('Failed to load mock shipping difference:', error)
      return Promise.resolve(null)
    }
  }
}

// Export singleton instance
export const mockDataService = new MockDataService()
