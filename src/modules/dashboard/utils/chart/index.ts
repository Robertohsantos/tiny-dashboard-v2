/**
 * Chart utilities main export
 * Consolidates all chart-related utilities
 */

import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'
import type { PeriodType } from '../period-utils'
import type { ProjectionConfig } from './constants'
import { applyMonthProjection } from './projections-month'
import { applyWeekProjection } from './projections-week'
import { applyYearProjection } from './projections-year'
import { ENV_CONFIG } from '@/modules/core/config/environment'

// Re-export all modules
export * from './constants'
export * from './calculations'
export * from './projections-month'
export * from './projections-week'
export * from './projections-year'
export { default as ProjectionFactory } from './projection-factory'

/**
 * Main function to apply projections based on period type
 * @param data - Original chart data
 * @param periodType - Type of period (today, week, month, year)
 * @param config - Optional configuration overrides
 * @returns Processed data with projections where applicable
 */
export function applyProjections(
  data: ChartDataPoint[],
  periodType: PeriodType,
  config?: ProjectionConfig,
): ChartDataPoint[] {
  if (!data || data.length === 0) return []

  // Sort data chronologically
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  switch (periodType) {
    case 'month':
      return applyMonthProjection(sortedData, config)

    case 'week':
      return applyWeekProjection(sortedData, config)

    case 'year':
      return applyYearProjection(sortedData, config)

    case 'today':
      // Today view doesn't have projections in current implementation
      return sortedData

    default:
      return sortedData
  }
}

/**
 * Debug logger that only logs in development mode
 * @param message - Debug message
 * @param data - Optional data to log
 */
export function debugLog(message: string, data?: unknown): void {
  if (ENV_CONFIG.isChartDebugEnabled) {
    console.log(`[Chart Debug] ${message}`, data)
  }
}
