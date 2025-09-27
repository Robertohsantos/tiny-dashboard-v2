/**
 * Week-specific projection logic
 * Handles weekly period projections
 */

import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'
import type { ProjectionConfig } from './constants'
import {
  PROJECTION_LIMITS,
  VARIATION_PATTERNS,
  WAVE_FREQUENCIES,
} from './constants'
import {
  calculateAverage,
  calculateVariationPattern,
  generateProjectedValue,
} from './calculations'

/**
 * Applies projection to weekly data
 * @param data - Original chart data
 * @param config - Configuration for limits and variations
 * @returns Data with projections added for future days
 */
export function applyWeekProjection(
  data: ChartDataPoint[],
  config?: ProjectionConfig,
): ChartDataPoint[] {
  const dayLimit = config?.dayLimit ?? PROJECTION_LIMITS.week.limit
  const defaultVariation = config?.variationPattern ?? VARIATION_PATTERNS.week
  const waveFrequency = config?.waveFrequency ?? WAVE_FREQUENCIES.week

  // Filter data to simulate partial current period
  const filteredData = data.map((d, index) => {
    if (index < dayLimit) {
      return d
    } else {
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
    currentPeriodData,
    defaultVariation,
  )

  // Apply projections
  return filteredData.map((d, index) => {
    // Connect projection at the transition point
    if (index === dayLimit - 1 && d.current !== null) {
      return { ...d, projection: d.current }
    }

    // Generate projection for future days
    if (index >= dayLimit) {
      const daysFromLimit = index - dayLimit + 1
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
 * Calculate week-specific metrics for projections
 * @param data - Chart data points
 * @returns Metrics specific to weekly projections
 */
export function calculateWeekMetrics(data: ChartDataPoint[]) {
  const currentWeekData = data.filter((d) => d.current !== null)
  const projectionData = data.filter((d) => d.projection !== undefined)

  const actualDays = currentWeekData.length
  const projectedDays = projectionData.length
  const totalDays = 7 // Always 7 for a week

  const actualTotal = currentWeekData.reduce(
    (sum, d) => sum + (d.current || 0),
    0,
  )
  const projectedTotal = projectionData.reduce(
    (sum, d) => sum + (d.projection || 0),
    0,
  )

  const avgActual = actualDays > 0 ? actualTotal / actualDays : 0
  const avgProjected = projectedDays > 0 ? projectedTotal / projectedDays : 0

  // Calculate day-over-day growth
  const dayOverDayGrowth: number[] = []
  for (let i = 1; i < currentWeekData.length; i++) {
    const prev = currentWeekData[i - 1].current || 0
    const curr = currentWeekData[i].current || 0
    if (prev > 0) {
      dayOverDayGrowth.push(((curr - prev) / prev) * 100)
    }
  }

  const avgGrowth =
    dayOverDayGrowth.length > 0
      ? dayOverDayGrowth.reduce((a, b) => a + b, 0) / dayOverDayGrowth.length
      : 0

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
    avgDayOverDayGrowth: avgGrowth,
  }
}
