/**
 * Chart calculation utilities
 * Mathematical functions for chart data processing
 */

import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'

/**
 * Calculates the average value from a dataset
 * @param data - Array of data points with current values
 * @returns Average value or 0 if no data
 */
export function calculateAverage(data: ChartDataPoint[]): number {
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
export function calculateVariationPattern(
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
      previous !== undefined &&
      previous !== 0
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
export function generateProjectedValue(
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
 * Calculate trend from a series of values
 * @param values - Array of numeric values
 * @returns Trend coefficient (positive = upward, negative = downward)
 */
export function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0

  const n = values.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumX2 += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

/**
 * Apply smoothing to a series of values
 * Uses simple moving average
 * @param values - Array of values to smooth
 * @param windowSize - Size of the smoothing window
 * @returns Smoothed values
 */
export function smoothValues(
  values: number[],
  windowSize: number = 3,
): number[] {
  if (values.length <= windowSize) return values

  const smoothed: number[] = []

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(values.length, i + Math.floor(windowSize / 2) + 1)
    const window = values.slice(start, end)
    const avg = window.reduce((a, b) => a + b, 0) / window.length
    smoothed.push(avg)
  }

  return smoothed
}

/**
 * Calculate confidence interval for projections
 * @param values - Historical values
 * @param confidence - Confidence level (0.95 for 95%)
 * @returns Upper and lower bounds
 */
export function calculateConfidenceInterval(
  values: number[],
  confidence: number = 0.95,
): { upper: number; lower: number } {
  if (values.length === 0) return { upper: 0, lower: 0 }

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length
  const stdDev = Math.sqrt(variance)

  // Z-score for confidence level (simplified)
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.64

  const margin = zScore * stdDev

  return {
    upper: mean + margin,
    lower: Math.max(0, mean - margin),
  }
}
