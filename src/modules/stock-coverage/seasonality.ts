/**
 * Seasonality Adjustment Module
 * Handles day-of-week and other seasonal patterns in demand
 */

import type {
  ProcessedDataPoint,
  SeasonalityFactors,
  StockCoverageConfig,
} from './types'

export class SeasonalityAdjuster {
  constructor(private config: StockCoverageConfig) {}

  /**
   * Calculate seasonality factors by day of week
   */
  calculateSeasonalityFactors(data: ProcessedDataPoint[]): SeasonalityFactors {
    if (!this.config.enableSeasonality || data.length < 14) {
      // Return neutral factors if disabled or insufficient data
      return this.getNeutralFactors()
    }

    // Calculate weighted average demand by day of week
    const demandByDayOfWeek = new Map<number, { sum: number; weight: number }>()

    // Initialize map
    for (let dow = 0; dow < 7; dow++) {
      demandByDayOfWeek.set(dow, { sum: 0, weight: 0 })
    }

    // Aggregate demand by day of week
    data.forEach((point) => {
      if (point.adjustedDemand > 0 && !point.isOutlier) {
        const current = demandByDayOfWeek.get(point.dayOfWeek)!
        current.sum += point.adjustedDemand * point.weight
        current.weight += point.weight
      }
    })

    // Calculate weighted average for each day
    const avgByDayOfWeek = new Map<number, number>()
    let totalAvg = 0
    let totalWeight = 0

    demandByDayOfWeek.forEach((value, dow) => {
      const avg = value.weight > 0 ? value.sum / value.weight : 0
      avgByDayOfWeek.set(dow, avg)
      totalAvg += avg
      totalWeight += value.weight > 0 ? 1 : 0
    })

    // Calculate overall average
    const overallAvg = totalWeight > 0 ? totalAvg / totalWeight : 0

    // Calculate seasonality indices (multiplicative factors)
    const factors: SeasonalityFactors = {
      sunday: 1.0,
      monday: 1.0,
      tuesday: 1.0,
      wednesday: 1.0,
      thursday: 1.0,
      friday: 1.0,
      saturday: 1.0,
    }

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]

    avgByDayOfWeek.forEach((avg, dow) => {
      const factor = overallAvg > 0 ? avg / overallAvg : 1.0
      // Apply smoothing to avoid extreme factors
      const smoothedFactor = this.smoothFactor(factor)
      factors[dayNames[dow]] = smoothedFactor
    })

    return factors
  }

  /**
   * Apply seasonality adjustment to demand forecast
   */
  applySeasonality(
    baseDemand: number,
    targetDate: Date,
    factors: SeasonalityFactors,
  ): number {
    if (!this.config.enableSeasonality) {
      return baseDemand
    }

    const dayOfWeek = targetDate.getDay()
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]
    const factor = factors[dayNames[dayOfWeek]]

    return baseDemand * factor
  }

  /**
   * Remove seasonality from historical data (deseasonalization)
   */
  deseasonalize(
    data: ProcessedDataPoint[],
    factors: SeasonalityFactors,
  ): ProcessedDataPoint[] {
    if (!this.config.enableSeasonality) {
      return data
    }

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]

    return data.map((point) => ({
      ...point,
      adjustedDemand: point.adjustedDemand / factors[dayNames[point.dayOfWeek]],
    }))
  }

  /**
   * Detect weekly patterns and anomalies
   */
  detectWeeklyPatterns(data: ProcessedDataPoint[]): {
    hasWeeklyPattern: boolean
    patternStrength: number
    peakDays: number[]
    lowDays: number[]
  } {
    const factors = this.calculateSeasonalityFactors(data)
    const factorValues = Object.values(factors)

    // Calculate pattern strength (coefficient of variation)
    const mean =
      factorValues.reduce((sum, f) => sum + f, 0) / factorValues.length
    const variance =
      factorValues.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) /
      factorValues.length
    const cv = Math.sqrt(variance) / mean

    // Determine if there's a significant weekly pattern
    const hasWeeklyPattern = cv > 0.15 // 15% variation threshold

    // Find peak and low days
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]
    const threshold = 0.1 // 10% above/below average

    const peakDays: number[] = []
    const lowDays: number[] = []

    dayNames.forEach((day, index) => {
      const factor = factors[day]
      if (factor > 1 + threshold) {
        peakDays.push(index)
      } else if (factor < 1 - threshold) {
        lowDays.push(index)
      }
    })

    return {
      hasWeeklyPattern,
      patternStrength: cv,
      peakDays,
      lowDays,
    }
  }

  /**
   * Calculate monthly seasonality (if enough data)
   */
  calculateMonthlySeasonality(data: ProcessedDataPoint[]): Map<number, number> {
    const monthlyFactors = new Map<number, number>()

    // Need at least 3 months of data
    if (data.length < 90) {
      // Return neutral factors
      for (let month = 0; month < 12; month++) {
        monthlyFactors.set(month, 1.0)
      }
      return monthlyFactors
    }

    // Group by month
    const demandByMonth = new Map<number, { sum: number; count: number }>()

    data.forEach((point) => {
      if (point.adjustedDemand > 0 && !point.isOutlier) {
        const month = point.date.getMonth()
        const current = demandByMonth.get(month) || { sum: 0, count: 0 }
        current.sum += point.adjustedDemand
        current.count += 1
        demandByMonth.set(month, current)
      }
    })

    // Calculate average for each month
    let overallSum = 0
    let overallCount = 0

    demandByMonth.forEach((value) => {
      overallSum += value.sum
      overallCount += value.count
    })

    const overallAvg = overallCount > 0 ? overallSum / overallCount : 0

    // Calculate factors
    for (let month = 0; month < 12; month++) {
      const monthData = demandByMonth.get(month)
      if (monthData && monthData.count > 0) {
        const monthAvg = monthData.sum / monthData.count
        const factor = overallAvg > 0 ? monthAvg / overallAvg : 1.0
        monthlyFactors.set(month, this.smoothFactor(factor))
      } else {
        monthlyFactors.set(month, 1.0)
      }
    }

    return monthlyFactors
  }

  /**
   * Apply smoothing to seasonal factors to avoid extreme values
   */
  private smoothFactor(factor: number, maxDeviation: number = 0.5): number {
    // Limit factors to reasonable range (e.g., 0.5 to 1.5)
    const minFactor = 1 - maxDeviation
    const maxFactor = 1 + maxDeviation

    if (factor < minFactor) {
      // Apply logarithmic smoothing for very low factors
      return minFactor * (1 + Math.log(factor / minFactor) * 0.1)
    } else if (factor > maxFactor) {
      // Apply logarithmic smoothing for very high factors
      return maxFactor * (1 + Math.log(factor / maxFactor) * 0.1)
    }

    return factor
  }

  /**
   * Get neutral seasonality factors (no adjustment)
   */
  private getNeutralFactors(): SeasonalityFactors {
    return {
      sunday: 1.0,
      monday: 1.0,
      tuesday: 1.0,
      wednesday: 1.0,
      thursday: 1.0,
      friday: 1.0,
      saturday: 1.0,
    }
  }

  /**
   * Detect and adjust for holiday effects
   */
  adjustForHolidays(
    data: ProcessedDataPoint[],
    holidays: Date[],
  ): ProcessedDataPoint[] {
    // Create a set of holiday date strings for quick lookup
    const holidaySet = new Set(
      holidays.map((h) => h.toISOString().split('T')[0]),
    )

    // Mark holiday data points and calculate holiday impact
    const holidayData: ProcessedDataPoint[] = []
    const normalData: ProcessedDataPoint[] = []

    data.forEach((point) => {
      const dateStr = point.date.toISOString().split('T')[0]
      if (holidaySet.has(dateStr)) {
        holidayData.push(point)
      } else {
        normalData.push(point)
      }
    })

    if (holidayData.length === 0 || normalData.length === 0) {
      return data
    }

    // Calculate average demand for holidays vs normal days
    const avgHolidayDemand =
      holidayData.reduce((sum, p) => sum + p.adjustedDemand, 0) /
      holidayData.length
    const avgNormalDemand =
      normalData.reduce((sum, p) => sum + p.adjustedDemand, 0) /
      normalData.length

    if (avgNormalDemand === 0) {
      return data
    }

    const holidayFactor = avgHolidayDemand / avgNormalDemand

    // Adjust holiday demands to baseline
    return data.map((point) => {
      const dateStr = point.date.toISOString().split('T')[0]
      if (holidaySet.has(dateStr) && holidayFactor > 1.2) {
        // Only adjust if holiday effect is significant
        return {
          ...point,
          adjustedDemand: point.adjustedDemand / holidayFactor,
        }
      }
      return point
    })
  }
}
