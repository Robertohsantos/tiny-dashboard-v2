/**
 * Year-specific projection logic
 * Handles yearly period projections
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
 * Applies projection to yearly data
 * @param data - Original chart data (monthly aggregated)
 * @param config - Configuration for limits and variations
 * @returns Data with projections added for future months
 */
export function applyYearProjection(
  data: ChartDataPoint[],
  config?: ProjectionConfig,
): ChartDataPoint[] {
  const monthLimit = config?.monthLimit ?? PROJECTION_LIMITS.year.limit
  const defaultVariation = config?.variationPattern ?? VARIATION_PATTERNS.year
  const waveFrequency = config?.waveFrequency ?? WAVE_FREQUENCIES.year

  // Filter data to simulate partial current period
  const filteredData = data.map((d, index) => {
    if (index < monthLimit) {
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

  const avgMonthly = calculateAverage(currentPeriodData)
  const avgVariation = calculateVariationPattern(
    currentPeriodData.slice(0, 6), // Use first 6 months for pattern
    defaultVariation,
  )

  // Apply projections using cosine for year view
  return filteredData.map((d, index) => {
    // Connect projection at the transition point
    if (index === monthLimit - 1 && d.current !== null) {
      return { ...d, projection: d.current }
    }

    // Generate projection for future months
    if (index >= monthLimit) {
      const monthsFromLimit = index - monthLimit + 1

      // Use cosine for yearly pattern (different from daily sine)
      const cosineVariation =
        Math.cos(monthsFromLimit * waveFrequency) * avgVariation
      const projectedValue = avgMonthly * (1 + cosineVariation)
      const projection = Math.max(projectedValue, avgMonthly * 0.7)

      return { ...d, projection }
    }

    return d
  })
}

/**
 * Calculate year-specific metrics for projections
 * @param data - Chart data points (monthly data)
 * @returns Metrics specific to yearly projections
 */
export function calculateYearMetrics(data: ChartDataPoint[]) {
  const currentYearData = data.filter((d) => d.current !== null)
  const projectionData = data.filter((d) => d.projection !== undefined)

  const actualMonths = currentYearData.length
  const projectedMonths = projectionData.length
  const totalMonths = 12 // Always 12 for a year

  const actualTotal = currentYearData.reduce(
    (sum, d) => sum + (d.current || 0),
    0,
  )
  const projectedTotal = projectionData.reduce(
    (sum, d) => sum + (d.projection || 0),
    0,
  )

  const avgActual = actualMonths > 0 ? actualTotal / actualMonths : 0
  const avgProjected =
    projectedMonths > 0 ? projectedTotal / projectedMonths : 0

  // Calculate quarter totals
  const quarters = {
    Q1: { actual: 0, projected: 0 },
    Q2: { actual: 0, projected: 0 },
    Q3: { actual: 0, projected: 0 },
    Q4: { actual: 0, projected: 0 },
  }

  data.forEach((d, index) => {
    const quarter = Math.floor(index / 3) + 1
    const key = `Q${quarter}` as keyof typeof quarters

    if (d.current !== null) {
      quarters[key].actual += d.current
    }
    if (d.projection !== undefined) {
      quarters[key].projected += d.projection
    }
  })

  // Calculate year-over-year growth if we have previous year data
  let yoyGrowth = 0
  const previousYearTotal = data.reduce((sum, d) => sum + (d.previous || 0), 0)
  if (previousYearTotal > 0) {
    const currentYearEstimate = actualTotal + projectedTotal
    yoyGrowth =
      ((currentYearEstimate - previousYearTotal) / previousYearTotal) * 100
  }

  return {
    actualMonths,
    projectedMonths,
    totalMonths,
    actualTotal,
    projectedTotal,
    estimatedTotal: actualTotal + projectedTotal,
    avgActual,
    avgProjected,
    completionRate: actualMonths / totalMonths,
    quarters,
    yearOverYearGrowth: yoyGrowth,
  }
}

/**
 * Apply seasonal adjustments to year projections
 * @param projections - Array of projected values
 * @param month - Starting month (0-11)
 * @returns Seasonally adjusted projections
 */
export function applySeasonalAdjustment(
  projections: number[],
  startMonth: number = 0,
): number[] {
  // Seasonal factors (example: retail typically higher in Q4)
  const seasonalFactors = [
    0.95,
    0.97,
    1.0, // Q1 (Jan-Mar)
    1.02,
    1.03,
    1.01, // Q2 (Apr-Jun)
    0.98,
    0.96,
    0.99, // Q3 (Jul-Sep)
    1.05,
    1.08,
    1.1, // Q4 (Oct-Dec)
  ]

  return projections.map((value, index) => {
    const monthIndex = (startMonth + index) % 12
    return value * seasonalFactors[monthIndex]
  })
}
