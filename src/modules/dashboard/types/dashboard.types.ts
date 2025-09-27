/**
 * TypeScript interfaces for dashboard data
 * Single source of truth for all dashboard-related types
 */

/**
 * Represents a single data point in the chart
 */
export interface ChartDataPoint {
  /** Date in ISO string format (YYYY-MM-DD) */
  date: string
  /** Current period value */
  current: number | null
  /** Previous period value for comparison */
  previous: number | null
  /** Two periods before value (optional) */
  twoPeriodsBefore?: number
  /** Projected value (optional) */
  projection?: number
}

/**
 * Generic metric data structure
 */
export interface MetricData {
  /** Numeric value of the metric */
  value: number
  /** Currency symbol (optional) */
  currency?: string
  /** Unit of measurement (optional) */
  unit?: string
  /** Percentage change from previous period */
  change: number
  /** Trend direction */
  trend: 'up' | 'down'
  /** Human-readable description */
  description: string
  /** Additional context or subtext */
  subtext: string
}

/**
 * Sales metrics for the dashboard
 */
export interface DashboardMetrics {
  /** Total sales in the period */
  totalSales: MetricData
  /** Number of items sold */
  itemsSold: MetricData
  /** Number of orders */
  orders: MetricData
  /** Average ticket value */
  averageTicket: MetricData
}

/**
 * Financial metrics for the dashboard
 */
export interface DashboardFinancialMetrics {
  /** Sales excluding shipping costs */
  salesWithoutShipping: MetricData
  /** Cost of goods sold */
  costOfGoods: MetricData
  /** Taxes paid */
  taxes: MetricData
  /** Marketplace fees */
  marketplaceFees: MetricData
  /** Gross profit */
  grossProfit: MetricData
}

/**
 * Shipping difference data
 */
export interface ShippingDifferenceData {
  /** Difference value */
  value: number
  /** Currency symbol */
  currency: string
  /** Trend indicator */
  trend: 'positive' | 'negative' | 'neutral'
  /** Description of the metric */
  description: string
}

/**
 * Period filter parameters for data queries
 */
export interface PeriodFilter {
  /** Start date of the period */
  startDate?: Date
  /** End date of the period */
  endDate?: Date
  /** Marketplace filter */
  marketplaceId?: string
}

/**
 * Dashboard table item (for future implementation)
 */
export interface DashboardItem {
  /** Unique identifier */
  id: number
  /** Header text */
  header: string
  /** Item type */
  type: string
  /** Current status */
  status: string
  /** Target value */
  target: string
  /** Limit value */
  limit: string
  /** Reviewer name */
  reviewer: string
}

/**
 * Complete dashboard data structure
 */
export interface DashboardData {
  /** Chart visualization data */
  chartData: ChartDataPoint[]
  /** Sales metrics */
  metrics: DashboardMetrics
  /** Financial metrics */
  financialMetrics: DashboardFinancialMetrics
  /** Shipping difference metric */
  shippingDifference: ShippingDifferenceData
}

/**
 * Dashboard state discriminated union for better type safety
 */
export type DashboardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error; message: string }
  | { status: 'empty'; message: string }
  | { status: 'success'; data: DashboardData }

/**
 * Props for dashboard components
 */
export interface DashboardComponentProps {
  /** Initial data for server-side rendering */
  initialData?: DashboardData
  /** Whether to show loading state */
  isLoading?: boolean
  /** Error message if any */
  error?: string | null
}
