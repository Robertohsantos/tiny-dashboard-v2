/**
 * Data fetchers for dashboard
 * This file provides backward compatibility while using the new service architecture
 * All business logic has been moved to appropriate service and mock files
 */

import { dashboardService } from '@/modules/dashboard/services/dashboard.service'
import type { PeriodFilter } from '@/modules/dashboard/types/dashboard.types'

// Re-export all types from the centralized types file
export type {
  DashboardItem,
  ChartDataPoint,
  MetricData,
  DashboardMetrics,
  DashboardFinancialMetrics,
  ShippingDifferenceData,
  PeriodFilter,
  DashboardData,
} from '@/modules/dashboard/types/dashboard.types'

/**
 * Get dashboard table data
 * @param period - Optional period filter
 * @returns Promise with dashboard items
 */
export async function getDashboardTableData(period?: PeriodFilter) {
  return dashboardService.getDashboardItems(period)
}

/**
 * Get chart data for visualization
 * @param period - Optional period filter
 * @returns Promise with chart data points
 */
export async function getChartData(period?: PeriodFilter) {
  return dashboardService.getChartData(period)
}

/**
 * Get sales metrics for dashboard cards
 * @param period - Optional period filter
 * @returns Promise with dashboard metrics
 */
export async function getDashboardMetrics(period?: PeriodFilter) {
  return dashboardService.getMetrics(period)
}

/**
 * Get financial metrics for dashboard
 * @param period - Optional period filter
 * @returns Promise with financial metrics
 */
export async function getFinancialMetrics(period?: PeriodFilter) {
  return dashboardService.getFinancialMetrics(period)
}

/**
 * Get shipping difference data
 * @param period - Optional period filter
 * @returns Promise with shipping difference data
 */
export async function getShippingDifference(period?: PeriodFilter) {
  return dashboardService.getShippingDifference(period)
}
