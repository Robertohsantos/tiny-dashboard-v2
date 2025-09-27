/**
 * Dashboard Service
 * Handles all data fetching logic for the dashboard
 * Single source of truth for data access
 */

import { prisma } from '@/modules/core/services/prisma'
import { DashboardRepository } from '@/modules/dashboard/repositories/dashboard-repository'
import { ENV_CONFIG } from '@/modules/core/config/environment'
import type {
  ChartDataPoint,
  DashboardMetrics,
  DashboardFinancialMetrics,
  ShippingDifferenceData,
  DashboardItem,
  PeriodFilter,
  DashboardData,
} from '@/modules/dashboard/types/dashboard.types'

/**
 * Creates empty metrics with appropriate messages
 */
function createEmptyMetrics(message: string): DashboardMetrics {
  const emptyMetric = {
    value: 0,
    currency: 'R$',
    change: 0,
    trend: 'up' as const,
    description: message,
    subtext: 'Nenhum dado disponível',
  }

  return {
    totalSales: { ...emptyMetric },
    itemsSold: { ...emptyMetric, currency: undefined, unit: 'un' },
    orders: { ...emptyMetric, currency: undefined },
    averageTicket: { ...emptyMetric },
  }
}

/**
 * Creates empty financial metrics with appropriate messages
 */
function createEmptyFinancialMetrics(
  message: string,
): DashboardFinancialMetrics {
  const emptyMetric = {
    value: 0,
    currency: 'R$',
    change: 0,
    trend: 'up' as const,
    description: message,
    subtext: 'Nenhum dado disponível',
  }

  return {
    salesWithoutShipping: { ...emptyMetric },
    costOfGoods: { ...emptyMetric },
    taxes: { ...emptyMetric },
    marketplaceFees: { ...emptyMetric },
    grossProfit: { ...emptyMetric },
  }
}

/**
 * Dashboard Service Class
 * Encapsulates all dashboard data operations
 */
export class DashboardService {
  private repository: DashboardRepository

  constructor() {
    this.repository = new DashboardRepository(prisma)
  }

  /**
   * Get chart data for visualization
   */
  async getChartData(period?: PeriodFilter): Promise<ChartDataPoint[]> {
    // In development with mock data enabled
    if (ENV_CONFIG.useMockData) {
      // Dynamically import mock generator only in development
      const { generateMockChartData } = await import(
        '@/modules/dashboard/mocks/dashboard-mock-generator'
      )
      return generateMockChartData(period)
    }

    // In production or with real data
    try {
      const organizationId = ENV_CONFIG.defaultOrganizationId

      if (!organizationId) {
        console.error('[DashboardService] No organization ID configured')
        return [] // Return empty array, no fake data in production
      }

      const data = await this.repository.getChartData(organizationId, period)

      // If no data found, return empty array (never generate fake data in production)
      if (!data || data.length === 0) {
        return []
      }

      return data
    } catch (error) {
      console.error('[DashboardService] Error fetching chart data:', error)
      return [] // Return empty array on error
    }
  }

  /**
   * Get sales metrics
   */
  async getMetrics(period?: PeriodFilter): Promise<DashboardMetrics> {
    // In development with mock data enabled
    if (ENV_CONFIG.useMockData) {
      // Dynamically import mock generator only in development
      const { generateMockMetrics } = await import(
        '@/modules/dashboard/mocks/dashboard-mock-generator'
      )
      return generateMockMetrics(period)
    }

    // In production or with real data
    try {
      const organizationId = ENV_CONFIG.defaultOrganizationId

      if (!organizationId) {
        return createEmptyMetrics('Configure o ID da organização')
      }

      const metrics = await this.repository.getSalesMetrics(
        organizationId,
        period,
      )

      // Check if we actually got data
      const hasData =
        metrics.totalSales.value > 0 ||
        metrics.itemsSold.value > 0 ||
        metrics.orders.value > 0

      if (!hasData) {
        return createEmptyMetrics('Sem dados para o período selecionado')
      }

      return metrics
    } catch (error) {
      console.error('[DashboardService] Error fetching metrics:', error)
      return createEmptyMetrics('Erro ao carregar métricas')
    }
  }

  /**
   * Get financial metrics
   */
  async getFinancialMetrics(
    period?: PeriodFilter,
  ): Promise<DashboardFinancialMetrics> {
    // In development with mock data enabled
    if (ENV_CONFIG.useMockData) {
      // Dynamically import mock generator only in development
      const { generateMockFinancialMetrics } = await import(
        '@/modules/dashboard/mocks/dashboard-mock-generator'
      )
      return generateMockFinancialMetrics(period)
    }

    // In production or with real data
    try {
      const organizationId = ENV_CONFIG.defaultOrganizationId

      if (!organizationId) {
        return createEmptyFinancialMetrics('Configure o ID da organização')
      }

      const metrics = await this.repository.getFinancialMetrics(
        organizationId,
        period,
      )

      // Check if we actually got data
      const hasData =
        metrics.salesWithoutShipping.value > 0 || metrics.grossProfit.value > 0

      if (!hasData) {
        return createEmptyFinancialMetrics(
          'Sem dados para o período selecionado',
        )
      }

      return metrics
    } catch (error) {
      console.error(
        '[DashboardService] Error fetching financial metrics:',
        error,
      )
      return createEmptyFinancialMetrics(
        'Erro ao carregar métricas financeiras',
      )
    }
  }

  /**
   * Get shipping difference data
   */
  async getShippingDifference(
    period?: PeriodFilter,
  ): Promise<ShippingDifferenceData> {
    // In development with mock data enabled
    if (ENV_CONFIG.useMockData) {
      // Dynamically import mock generator only in development
      const { generateMockShippingDifference } = await import(
        '@/modules/dashboard/mocks/dashboard-mock-generator'
      )
      return generateMockShippingDifference(period)
    }

    // In production or with real data
    try {
      const organizationId = ENV_CONFIG.defaultOrganizationId

      if (!organizationId) {
        return {
          value: 0,
          currency: 'R$',
          trend: 'neutral',
          description: 'Configure o ID da organização',
        }
      }

      return await this.repository.getShippingDifference(organizationId, period)
    } catch (error) {
      console.error(
        '[DashboardService] Error fetching shipping difference:',
        error,
      )
      return {
        value: 0,
        currency: 'R$',
        trend: 'neutral',
        description: 'Erro ao carregar dados de frete',
      }
    }
  }

  /**
   * Get dashboard table items
   */
  async getDashboardItems(period?: PeriodFilter): Promise<DashboardItem[]> {
    // In development with mock data enabled
    if (ENV_CONFIG.useMockData) {
      // Dynamically import mock generator only in development
      const { generateMockDashboardItems } = await import(
        '@/modules/dashboard/mocks/dashboard-mock-generator'
      )
      return generateMockDashboardItems()
    }

    // In production - not yet implemented in database
    // Return empty array instead of fake data
    return []
  }

  /**
   * Get all dashboard data at once
   * Useful for initial page load
   */
  async getAllDashboardData(period?: PeriodFilter): Promise<DashboardData> {
    try {
      // Fetch all data in parallel for performance
      const [chartData, metrics, financialMetrics, shippingDifference] =
        await Promise.all([
          this.getChartData(period),
          this.getMetrics(period),
          this.getFinancialMetrics(period),
          this.getShippingDifference(period),
        ])

      return {
        chartData,
        metrics,
        financialMetrics,
        shippingDifference,
      }
    } catch (error) {
      console.error('[DashboardService] Error fetching dashboard data:', error)

      // Return empty data structure on error
      return {
        chartData: [],
        metrics: createEmptyMetrics('Erro ao carregar dados'),
        financialMetrics: createEmptyFinancialMetrics('Erro ao carregar dados'),
        shippingDifference: {
          value: 0,
          currency: 'R$',
          trend: 'neutral',
          description: 'Erro ao carregar dados',
        },
      }
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()
