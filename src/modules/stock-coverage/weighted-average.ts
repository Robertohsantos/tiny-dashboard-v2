/**
 * Weighted Moving Average Module
 * Implements exponentially weighted moving average with half-life decay
 */

import type {
  ProcessedDataPoint,
  WeightedAverageResult,
  StockCoverageConfig,
} from './types'

export class WeightedMovingAverage {
  constructor(private config: StockCoverageConfig) {}

  /**
   * Calculate weighted moving average with exponential decay
   */
  calculate(data: ProcessedDataPoint[]): WeightedAverageResult {
    if (data.length === 0) {
      return {
        mean: 0,
        variance: 0,
        standardDeviation: 0,
        sumWeights: 0,
        effectiveSamples: 0,
      }
    }

    // Filter out outliers if configured
    const filteredData = data.filter(
      (p) => !p.isOutlier || this.config.outlierCapMultiplier === 0,
    )

    // Calculate weighted mean
    let sumWeightedValues = 0
    let sumWeights = 0

    filteredData.forEach((point) => {
      // Apply time-based weight with half-life decay
      const weight = this.calculateWeight(point, data)
      sumWeightedValues += point.adjustedDemand * weight
      sumWeights += weight
    })

    const weightedMean = sumWeights > 0 ? sumWeightedValues / sumWeights : 0

    // Calculate weighted variance
    let sumWeightedSquaredDiff = 0

    filteredData.forEach((point) => {
      const weight = this.calculateWeight(point, data)
      const diff = point.adjustedDemand - weightedMean
      sumWeightedSquaredDiff += weight * diff * diff
    })

    const weightedVariance =
      sumWeights > 0 ? sumWeightedSquaredDiff / sumWeights : 0
    const weightedStdDev = Math.sqrt(weightedVariance)

    // Calculate effective sample size (for statistical inference)
    let sumSquaredWeights = 0
    filteredData.forEach((point) => {
      const weight = this.calculateWeight(point, data)
      sumSquaredWeights += weight * weight
    })

    const effectiveSamples =
      sumWeights > 0 ? (sumWeights * sumWeights) / sumSquaredWeights : 0

    return {
      mean: weightedMean,
      variance: weightedVariance,
      standardDeviation: weightedStdDev,
      sumWeights,
      effectiveSamples,
    }
  }

  /**
   * Calculate weight for a specific data point
   */
  private calculateWeight(
    point: ProcessedDataPoint,
    allData: ProcessedDataPoint[],
  ): number {
    const currentDate = allData[allData.length - 1].date
    const daysDiff = Math.floor(
      (currentDate.getTime() - point.date.getTime()) / (1000 * 60 * 60 * 24),
    )

    // Exponential decay based on half-life
    const timeWeight = Math.pow(0.5, daysDiff / this.config.halfLife)

    // Additional weight adjustments
    let adjustmentFactor = 1.0

    // Reduce weight for days with low availability
    if (point.availabilityFactor < 1.0) {
      adjustmentFactor *= Math.max(0.5, point.availabilityFactor)
    }

    // Reduce weight for promotional periods (if adjustment enabled)
    if (this.config.enablePromotionAdjustment && point.isPromotion) {
      adjustmentFactor *= 0.8 // Give less weight to promotional sales
    }

    return timeWeight * adjustmentFactor
  }

  /**
   * Calculate weighted average by day of week
   */
  calculateByDayOfWeek(
    data: ProcessedDataPoint[],
  ): Map<number, WeightedAverageResult> {
    const resultsByDay = new Map<number, WeightedAverageResult>()

    // Group data by day of week
    for (let dow = 0; dow < 7; dow++) {
      const dayData = data.filter((p) => p.dayOfWeek === dow)
      if (dayData.length > 0) {
        resultsByDay.set(dow, this.calculate(dayData))
      } else {
        // No data for this day of week - use overall average
        resultsByDay.set(dow, this.calculate(data))
      }
    }

    return resultsByDay
  }

  /**
   * Calculate rolling weighted average (for time series visualization)
   */
  calculateRolling(
    data: ProcessedDataPoint[],
    windowDays: number = 7,
  ): number[] {
    const results: number[] = []

    data.forEach((_, index) => {
      // Get window of data points
      const windowStart = Math.max(0, index - windowDays + 1)
      const window = data.slice(windowStart, index + 1)

      // Calculate weighted average for this window
      const result = this.calculate(window)
      results.push(result.mean)
    })

    return results
  }

  /**
   * Calculate confidence interval for the weighted average
   */
  calculateConfidenceInterval(
    result: WeightedAverageResult,
    confidenceLevel: number = 0.95,
  ): { lower: number; upper: number } {
    // Z-score for confidence level
    const zScore = this.getZScore(confidenceLevel)

    // Standard error
    const standardError =
      result.effectiveSamples > 0
        ? result.standardDeviation / Math.sqrt(result.effectiveSamples)
        : result.standardDeviation

    // Confidence interval
    const marginOfError = zScore * standardError

    return {
      lower: Math.max(0, result.mean - marginOfError),
      upper: result.mean + marginOfError,
    }
  }

  /**
   * Get z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    const zScores: Record<number, number> = {
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    }

    return zScores[confidenceLevel] || 1.96
  }

  /**
   * Adaptive weight calculation based on data variability
   */
  calculateAdaptiveWeights(data: ProcessedDataPoint[]): number[] {
    // Calculate coefficient of variation for recent vs older data
    const recentDays = 14
    const recentData = data.slice(-recentDays)
    const olderData = data.slice(0, -recentDays)

    const recentResult = this.calculate(recentData)
    const olderResult = this.calculate(olderData)

    // Calculate coefficient of variation
    const recentCV =
      recentResult.mean > 0
        ? recentResult.standardDeviation / recentResult.mean
        : 0
    const olderCV =
      olderResult.mean > 0
        ? olderResult.standardDeviation / olderResult.mean
        : 0

    // If recent data is more stable, give it more weight
    const adaptiveFactor = recentCV < olderCV ? 0.7 : 1.3

    // Calculate adjusted weights
    return data.map((point) => {
      const baseWeight = this.calculateWeight(point, data)
      const currentDate = data[data.length - 1].date
      const daysDiff = Math.floor(
        (currentDate.getTime() - point.date.getTime()) / (1000 * 60 * 60 * 24),
      )

      // Apply adaptive factor to recent data
      if (daysDiff <= recentDays) {
        return baseWeight * adaptiveFactor
      }

      return baseWeight
    })
  }
}
