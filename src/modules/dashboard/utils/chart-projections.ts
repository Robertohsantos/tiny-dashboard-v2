import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'
import type { PeriodType } from './period-utils'
import { parseLocalDate } from './period-utils'

/**
 * Configuration for projection limits per period type
 * These values determine when to start showing projections
 */
export const PROJECTION_LIMITS = {
  today: { limit: 18, unit: 'hours' }, // Show projections after 6pm
  week: { limit: 4, unit: 'days' }, // Show projections after Thursday
  month: { limit: 20, unit: 'days' }, // Show projections after day 20
  year: { limit: 9, unit: 'months' }, // Show projections after September
} as const

/**
 * Variation patterns for different period types
 * Used to create natural-looking projections
 */
export const VARIATION_PATTERNS = {
  today: 0.08, // 8% variation for hourly data
  week: 0.12, // 12% variation for daily data
  month: 0.15, // 15% variation for daily data
  year: 0.1, // 10% variation for monthly data
} as const

/**
 * Wave frequencies for sine-based variations
 * Creates different oscillation patterns per period
 */
export const WAVE_FREQUENCIES = {
  today: 0.3,
  week: 0.8,
  month: 0.5,
  year: 0.4,
} as const

interface ProjectionConfig {
  dayLimit?: number
  monthLimit?: number
  variationPattern?: number
  waveFrequency?: number
}

/**
 * Calculates the average value from a dataset
 * @param data - Array of data points with current values
 * @returns Average value or 0 if no data
 */
function calculateAverage(data: ChartDataPoint[]): number {
  const validData = data.filter((d) => d.current !== null && d.current > 0)
  if (validData.length === 0) return 0

  const total = validData.reduce((sum, d) => sum + (d.current || 0), 0)
  return total / validData.length
}

/**
 * Calculates the average variation between consecutive data points
 * @param data - Array of data points with current values
 * @param defaultVariation - Default variation if calculation fails
 * @returns Average variation as a decimal (0.15 = 15%)
 */
function calculateVariationPattern(
  data: ChartDataPoint[],
  defaultVariation: number,
): number {
  const variations: number[] = []

  for (let i = 1; i < data.length; i++) {
    const current = data[i].current
    const previous = data[i - 1].current
    if (
      current !== null &&
      current !== undefined &&
      previous !== null &&
      previous !== undefined
    ) {
      const variation = (current - previous) / previous
      variations.push(Math.abs(variation))
    }
  }

  if (variations.length === 0) return defaultVariation
  return variations.reduce((a, b) => a + b, 0) / variations.length
}

/**
 * Generates a projected value using sine wave variation
 * @param avgValue - Average baseline value
 * @param dayFromLimit - Days from the projection start point
 * @param variation - Variation amount (0.15 = 15%)
 * @param frequency - Wave frequency for sine calculation
 * @returns Projected value with natural variation
 */
function generateProjectedValue(
  avgValue: number,
  dayFromLimit: number,
  variation: number,
  frequency: number,
): number {
  const sineVariation = Math.sin(dayFromLimit * frequency) * variation
  const projectedValue = avgValue * (1 + sineVariation)
  // Ensure positive values with minimum threshold
  return Math.max(projectedValue, avgValue * 0.5)
}

/**
 * Applies projection to monthly data
 * @param data - Original chart data
 * @param config - Configuration for limits and variations
 * @returns Data with projections added
 */
function applyMonthProjection(
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
  if (currentPeriodData.length === 0) return filteredData

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
 * Applies projection to weekly data
 * @param data - Original chart data
 * @param config - Configuration for limits and variations
 * @returns Data with projections added
 */
function applyWeekProjection(
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
  if (currentPeriodData.length === 0) return filteredData

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
 * Applies projection to yearly data
 * @param data - Original chart data
 * @param config - Configuration for limits and variations
 * @returns Data with projections added
 */
function applyYearProjection(
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
  if (currentPeriodData.length === 0) return filteredData

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
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEBUG_CHARTS === 'true'
  ) {
    console.log(`[Chart Debug] ${message}`, data)
  }
}
