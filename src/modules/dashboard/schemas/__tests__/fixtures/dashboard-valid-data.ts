/**
 * Valid test fixtures for dashboard schemas
 * These represent correct data structures that should pass validation
 */

import type {
  ChartDataPoint,
  MetricData,
  DashboardMetrics,
  DashboardFinancialMetrics,
  ShippingDifferenceData,
  DashboardData,
} from '@/modules/dashboard/types/dashboard.types'

/**
 * Valid chart data points
 */
export const validChartDataPoints: ChartDataPoint[] = [
  {
    date: '2024-01-01',
    current: 1000,
    previous: 900,
    twoPeriodsBefore: 850,
    projection: 1100,
  },
  {
    date: '2024-01-02',
    current: 1200,
    previous: 1000,
  },
  {
    date: '2024-01-03',
    current: null,
    previous: null,
  },
]

/**
 * Valid metric data samples
 */
export const validMetricData: MetricData[] = [
  {
    value: 50000,
    currency: 'BRL',
    change: 15.5,
    trend: 'up',
    description: 'Total sales for the period',
    subtext: 'Compared to last month',
  },
  {
    value: 250,
    unit: 'items',
    change: -5.2,
    trend: 'down',
    description: 'Items sold',
    subtext: 'Lower than expected',
  },
  {
    value: 0,
    change: 0,
    trend: 'up',
    description: 'New metric',
    subtext: 'Just started tracking',
  },
]

/**
 * Valid dashboard metrics
 */
export const validDashboardMetrics: DashboardMetrics = {
  totalSales: {
    value: 150000,
    currency: 'BRL',
    change: 12.5,
    trend: 'up',
    description: 'Total revenue this month',
    subtext: 'Best month ever',
  },
  itemsSold: {
    value: 450,
    unit: 'units',
    change: 8.3,
    trend: 'up',
    description: 'Products sold',
    subtext: 'Above target',
  },
  orders: {
    value: 120,
    change: -2.5,
    trend: 'down',
    description: 'Total orders',
    subtext: 'Slight decrease',
  },
  averageTicket: {
    value: 1250,
    currency: 'BRL',
    change: 15.0,
    trend: 'up',
    description: 'Average order value',
    subtext: 'Increasing steadily',
  },
}

/**
 * Valid financial metrics
 */
export const validFinancialMetrics: DashboardFinancialMetrics = {
  salesWithoutShipping: {
    value: 140000,
    currency: 'BRL',
    change: 10.0,
    trend: 'up',
    description: 'Sales excluding shipping',
    subtext: 'Core revenue',
  },
  costOfGoods: {
    value: 70000,
    currency: 'BRL',
    change: 5.0,
    trend: 'up',
    description: 'COGS',
    subtext: 'Material costs',
  },
  taxes: {
    value: 21000,
    currency: 'BRL',
    change: 12.0,
    trend: 'up',
    description: 'Tax obligations',
    subtext: 'Federal and state',
  },
  marketplaceFees: {
    value: 15000,
    currency: 'BRL',
    change: 8.0,
    trend: 'up',
    description: 'Platform fees',
    subtext: 'Marketplace commissions',
  },
  grossProfit: {
    value: 34000,
    currency: 'BRL',
    change: 15.0,
    trend: 'up',
    description: 'Gross profit',
    subtext: 'After all deductions',
  },
}

/**
 * Valid shipping difference data
 */
export const validShippingDifference: ShippingDifferenceData = {
  value: 2500,
  currency: 'BRL',
  trend: 'positive',
  description: 'Shipping profit margin',
}

/**
 * Complete valid dashboard data
 */
export const validCompleteDashboardData: DashboardData = {
  chartData: validChartDataPoints,
  metrics: validDashboardMetrics,
  financialMetrics: validFinancialMetrics,
  shippingDifference: validShippingDifference,
}

/**
 * Edge case: minimum valid data
 */
export const minimalValidDashboardData: DashboardData = {
  chartData: [],
  metrics: {
    totalSales: {
      value: 0,
      change: 0,
      trend: 'up',
      description: '',
      subtext: '',
    },
    itemsSold: {
      value: 0,
      change: 0,
      trend: 'down',
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
      change: 0,
      trend: 'down',
      description: '',
      subtext: '',
    },
  },
  financialMetrics: {
    salesWithoutShipping: {
      value: 0,
      change: 0,
      trend: 'up',
      description: '',
      subtext: '',
    },
    costOfGoods: {
      value: 0,
      change: 0,
      trend: 'down',
      description: '',
      subtext: '',
    },
    taxes: {
      value: 0,
      change: 0,
      trend: 'up',
      description: '',
      subtext: '',
    },
    marketplaceFees: {
      value: 0,
      change: 0,
      trend: 'down',
      description: '',
      subtext: '',
    },
    grossProfit: {
      value: 0,
      change: 0,
      trend: 'up',
      description: '',
      subtext: '',
    },
  },
  shippingDifference: {
    value: 0,
    currency: '',
    trend: 'neutral',
    description: '',
  },
}
