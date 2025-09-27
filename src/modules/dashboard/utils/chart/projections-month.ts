/**
 * Month-specific projection logic
 * Handles monthly period projections
 */

import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'
import type { ProjectionConfig } from './constants'
import {
  PROJECTION_LIMITS,
  VARIATION_PATTERNS,
  WAVE_FREQUENCIES,
} from './constants'
import { parseLocalDate } from '../period-utils'
import {
  calculateAverage,
  calculateVariationPattern,
  generateProjectedValue,
} from './calculations'

/**
 * Applies projection to monthly data
 * @param data - Original chart data
 * @param config - Configuration for limits and variations
 * @returns Data with projections added for future days
 */
export function applyMonthProjection(
  data: ChartDataPoint[],
  config?: ProjectionConfig,
): ChartDataPoint[] {
  const dayLimit = config?.dayLimit ?? PROJECTION_LIMITS.month.limit
  const defaultVariation = config?.variationPattern ?? VARIATION_PATTERNS.month
  const waveFrequency = config?.waveFrequency ?? WAVE_FREQUENCIES.month

  // Filter data to simulate partial current period
  const filteredData = data.map((d) => {
    const date = parseLocalDate(d.date)
    const day = date.getDate()

    if (day <= dayLimit) {
      return d
    } else {
      // Keep previous period data but null out current
      return { ...d, current: null }
    }
  })

  // Calculate projection parameters
  const currentPeriodData = filteredData.filter(
    (d) => d.current !== null && d.current > 0,
  )

  if (currentPeriodData.length === 0) {
    return filteredData
  }

  const avgDaily = calculateAverage(currentPeriodData)
  const avgVariation = calculateVariationPattern(
    currentPeriodData.slice(-7), // Use last 7 days for pattern
    defaultVariation,
  )

  // Apply projections
  const firstDate = parseLocalDate(data[0].date)
  const lastDayOfMonth = new Date(
    firstDate.getFullYear(),
    firstDate.getMonth() + 1,
    0,
  ).getDate()

  return filteredData.map((d) => {
    const date = parseLocalDate(d.date)
    const day = date.getDate()

    // Connect projection at the transition point
    if (day === dayLimit && d.current !== null) {
      return { ...d, projection: d.current }
    }

    // Generate projection for future days
    if (day > dayLimit && day <= lastDayOfMonth) {
      const daysFromLimit = day - dayLimit
      const projection = generateProjectedValue(
        avgDaily,
        daysFromLimit,
        avgVariation,
        waveFrequency,
      )
      return { ...d, projection }
    }

    return d
  })
}

/**
 * Calculate month-specific metrics for projections
 * @param data - Chart data points
 * @returns Metrics specific to monthly projections
 */
export function calculateMonthMetrics(data: ChartDataPoint[]) {
  const currentMonthData = data.filter((d) => d.current !== null)
  const projectionData = data.filter((d) => d.projection !== undefined)

  const actualDays = currentMonthData.length
  const projectedDays = projectionData.length
  const totalDays = data.length

  const actualTotal = currentMonthData.reduce(
    (sum, d) => sum + (d.current || 0),
    0,
  )
  const projectedTotal = projectionData.reduce(
    (sum, d) => sum + (d.projection || 0),
    0,
  )

  const avgActual = actualDays > 0 ? actualTotal / actualDays : 0
  const avgProjected = projectedDays > 0 ? projectedTotal / projectedDays : 0

  return {
    actualDays,
    projectedDays,
    totalDays,
    actualTotal,
    projectedTotal,
    estimatedTotal: actualTotal + projectedTotal,
    avgActual,
    avgProjected,
    completionRate: actualDays / totalDays,
  }
}
