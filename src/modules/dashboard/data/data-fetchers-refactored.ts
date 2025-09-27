import { mockDataService } from '@/modules/core/services/mock-data.service'
import { dashboardRepository } from '@/modules/dashboard/repositories/dashboard-repository'
import type {
  ChartDataPoint,
  DashboardItem,
  DashboardMetrics,
  DashboardFinancialMetrics,
  ShippingDifferenceData,
  PeriodFilter,
  MetricData,
} from '@/modules/dashboard/types/dashboard.types'

export type {
  ChartDataPoint,
  DashboardItem,
  DashboardMetrics,
  DashboardFinancialMetrics,
  ShippingDifferenceData,
  PeriodFilter,
} from '@/modules/dashboard/types/dashboard.types'

/**
 * Helper to get default empty metrics
 */
function getDefaultMetrics(): DashboardMetrics {
  return {
    totalSales: {
      value: 0,
      currency: 'R$',
      change: 0,
      trend: 'up',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
    itemsSold: {
      value: 0,
      change: 0,
      trend: 'up',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
    orders: {
      value: 0,
      change: 0,
      trend: 'up',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
    averageTicket: {
      value: 0,
      currency: 'R$',
      change: 0,
      trend: 'up',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
  }
}

/**
 * Helper to get default financial metrics
 */
function getDefaultFinancialMetrics(): DashboardFinancialMetrics {
  return {
    salesWithoutShipping: {
      value: 0,
      currency: 'R$',
      change: 0,
      trend: 'up',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
    costOfGoods: {
      value: 0,
      currency: 'R$',
      change: 0,
      trend: 'down',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
    taxes: {
      value: 0,
      currency: 'R$',
      change: 0,
      trend: 'down',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
    marketplaceFees: {
      value: 0,
      currency: 'R$',
      change: 0,
      trend: 'down',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
    grossProfit: {
      value: 0,
      currency: 'R$',
      change: 0,
      trend: 'up',
      description: 'Sem dados disponíveis',
      subtext: 'Configure o banco de dados',
    },
  }
}

/**
 * Get dashboard table data (legacy - to be implemented)
 */
export function getDashboardTableData(
  period?: PeriodFilter,
): Promise<DashboardItem[]> {
  // This is legacy from the old implementation
  // Will need to be implemented when needed
  return Promise.resolve([])
}

/**
 * Get chart data - uses mock in dev, real data in prod
 */
export async function getChartData(
  period?: PeriodFilter,
  organizationId?: string,
): Promise<ChartDataPoint[]> {
  // Try mock data first (only in development)
  const mockData = await mockDataService.getChartData(period)
  if (mockData) return mockData

  // Use real data from database
  if (!organizationId) {
    console.warn('Organization ID required for production data')
    return []
  }

  try {
    return await dashboardRepository.getChartData(organizationId, period)
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return []
  }
}

/**
 * Get dashboard metrics - uses mock in dev, real data in prod
 */
export async function getDashboardMetrics(
  period?: PeriodFilter,
  organizationId?: string,
): Promise<DashboardMetrics> {
  // Try mock data first (only in development)
  const mockData = await mockDataService.getDashboardMetrics(period)
  if (mockData) return mockData

  // Use real data from database
  if (!organizationId) {
    console.warn('Organization ID required for production data')
    return getDefaultMetrics()
  }

  try {
    return await dashboardRepository.getMetrics(organizationId, period)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return getDefaultMetrics()
  }
}

/**
 * Get financial metrics - uses mock in dev, real data in prod
 */
export async function getFinancialMetrics(
  period?: PeriodFilter,
  organizationId?: string,
): Promise<DashboardFinancialMetrics> {
  // Try mock data first (only in development)
  const mockData = await mockDataService.getFinancialMetrics(period)
  if (mockData) return mockData

  // Use real data from database
  if (!organizationId) {
    console.warn('Organization ID required for production data')
    return getDefaultFinancialMetrics()
  }

  try {
    return await dashboardRepository.getFinancialMetrics(organizationId, period)
  } catch (error) {
    console.error('Error fetching financial metrics:', error)
    return getDefaultFinancialMetrics()
  }
}

/**
 * Get shipping difference data - uses mock in dev, real data in prod
 */
export async function getShippingDifference(
  period?: PeriodFilter,
  organizationId?: string,
): Promise<ShippingDifferenceData> {
  // Try mock data first (only in development)
  const mockData = await mockDataService.getShippingDifference(period)
  if (mockData) return mockData

  // Use real data from database
  if (!organizationId) {
    console.warn('Organization ID required for production data')
    return {
      value: 0,
      currency: 'BRL',
      trend: 'neutral',
      description: 'Sem dados disponíveis',
    }
  }

  try {
    return await dashboardRepository.getShippingDifference(
      organizationId,
      period,
    )
  } catch (error) {
    console.error('Error fetching shipping difference:', error)
    return {
      value: 0,
      currency: 'BRL',
      trend: 'neutral',
      description: 'Sem dados disponíveis',
    }
  }
}
