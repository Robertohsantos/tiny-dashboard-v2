/**
 * Trend Analysis Module
 * Implements log-linear regression for trend detection and forecasting
 */

import type {
  ProcessedDataPoint,
  TrendAnalysis,
  StockCoverageConfig,
} from './types'

export class TrendAnalyzer {
  constructor(private config: StockCoverageConfig) {}

  /**
   * Perform weighted log-linear regression to detect trend
   */
  analyze(data: ProcessedDataPoint[]): TrendAnalysis {
    if (!this.config.enableTrendCorrection || data.length < 7) {
      // Not enough data or trend correction disabled
      return this.getDefaultTrend(data)
    }

    // Prepare data for regression (filter out zero values)
    const validData = data.filter((p) => p.adjustedDemand > 0)

    if (validData.length < 7) {
      return this.getDefaultTrend(data)
    }

    // Transform to log scale with small epsilon to avoid log(0)
    const epsilon = 0.1
    const logData = validData.map((point, index) => ({
      x: index + 1, // Time index (1 to n)
      y: Math.log(point.adjustedDemand + epsilon),
      weight: point.weight,
    }))

    // Perform weighted linear regression on log-transformed data
    const regression = this.weightedLinearRegression(logData)

    // Calculate trend factor (daily growth rate)
    const trendFactor = Math.exp(regression.slope)

    // Calculate current level (extrapolate to today)
    const mostRecentIndex = logData.length
    const currentLevelLog =
      regression.intercept + regression.slope * mostRecentIndex
    const currentLevel = Math.exp(currentLevelLog) - epsilon

    // Calculate confidence based on R-squared and data quality
    const confidence = this.calculateConfidence(
      regression.rSquared,
      validData,
      data,
    )

    return {
      intercept: regression.intercept,
      slope: regression.slope,
      rSquared: regression.rSquared,
      trendFactor,
      currentLevel: Math.max(0, currentLevel),
      confidence,
    }
  }

  /**
   * Perform weighted linear regression
   */
  private weightedLinearRegression(
    data: Array<{ x: number; y: number; weight: number }>,
  ): { intercept: number; slope: number; rSquared: number } {
    const n = data.length

    if (n < 2) {
      return { intercept: 0, slope: 0, rSquared: 0 }
    }

    // Calculate weighted sums
    let sumW = 0
    let sumWX = 0
    let sumWY = 0
    let sumWXX = 0
    let sumWXY = 0
    let sumWYY = 0

    data.forEach((point) => {
      const w = point.weight
      const x = point.x
      const y = point.y

      sumW += w
      sumWX += w * x
      sumWY += w * y
      sumWXX += w * x * x
      sumWXY += w * x * y
      sumWYY += w * y * y
    })

    // Calculate regression coefficients
    const denominator = sumW * sumWXX - sumWX * sumWX

    if (Math.abs(denominator) < 1e-10) {
      // Near-zero denominator, can't calculate regression
      return { intercept: sumWY / sumW, slope: 0, rSquared: 0 }
    }

    const slope = (sumW * sumWXY - sumWX * sumWY) / denominator
    const intercept = (sumWY - slope * sumWX) / sumW

    // Calculate R-squared
    const meanY = sumWY / sumW
    let ssTotal = 0
    let ssResidual = 0

    data.forEach((point) => {
      const predicted = intercept + slope * point.x
      const residual = point.y - predicted
      const totalDev = point.y - meanY

      ssResidual += point.weight * residual * residual
      ssTotal += point.weight * totalDev * totalDev
    })

    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0

    return {
      intercept,
      slope,
      rSquared: Math.max(0, Math.min(1, rSquared)),
    }
  }

  /**
   * Get default trend when regression cannot be performed
   */
  private getDefaultTrend(data: ProcessedDataPoint[]): TrendAnalysis {
    const validData = data.filter((p) => p.adjustedDemand > 0)
    const avgDemand =
      validData.length > 0
        ? validData.reduce((sum, p) => sum + p.adjustedDemand, 0) /
          validData.length
        : 0

    return {
      intercept: Math.log(Math.max(0.1, avgDemand)),
      slope: 0,
      rSquared: 0,
      trendFactor: 1.0,
      currentLevel: avgDemand,
      confidence: 0.5,
    }
  }

  /**
   * Calculate confidence in trend estimate
   */
  private calculateConfidence(
    rSquared: number,
    validData: ProcessedDataPoint[],
    allData: ProcessedDataPoint[],
  ): number {
    // Factors affecting confidence
    const dataCompleteness = validData.length / allData.length
    const minDataPoints = 14
    const dataPointsFactor = Math.min(1, validData.length / minDataPoints)

    // Weight the factors
    const confidence =
      rSquared * 0.5 + // R-squared contributes 50%
      dataCompleteness * 0.3 + // Data completeness contributes 30%
      dataPointsFactor * 0.2 // Having enough points contributes 20%

    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Detect change points in trend
   */
  detectChangePoints(data: ProcessedDataPoint[]): number[] {
    const changePoints: number[] = []
    const windowSize = 14 // Two weeks
    const threshold = 0.3 // 30% change threshold

    if (data.length < windowSize * 2) {
      return changePoints
    }

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const beforeWindow = data.slice(i - windowSize, i)
      const afterWindow = data.slice(i, i + windowSize)

      const beforeTrend = this.analyze(beforeWindow)
      const afterTrend = this.analyze(afterWindow)

      // Check for significant change in trend
      const trendChange = Math.abs(
        (afterTrend.trendFactor - beforeTrend.trendFactor) /
          beforeTrend.trendFactor,
      )

      if (trendChange > threshold) {
        changePoints.push(i)
      }
    }

    return changePoints
  }

  /**
   * Project trend into the future
   */
  projectTrend(trend: TrendAnalysis, daysAhead: number): number[] {
    const projections: number[] = []

    for (let day = 1; day <= daysAhead; day++) {
      // Apply compound growth
      const projectedDemand =
        trend.currentLevel * Math.pow(trend.trendFactor, day)

      // Apply dampening for longer projections (trend regression to mean)
      const dampeningFactor = 1 / (1 + 0.01 * day) // 1% dampening per day
      const dampenedTrend = 1 + (trend.trendFactor - 1) * dampeningFactor
      const dampenedProjection =
        trend.currentLevel * Math.pow(dampenedTrend, day)

      // Use dampened projection for longer horizons
      const projection = day <= 7 ? projectedDemand : dampenedProjection

      projections.push(Math.max(0, projection))
    }

    return projections
  }

  /**
   * Perform polynomial regression for non-linear trends
   */
  polynomialTrend(
    data: ProcessedDataPoint[],
    degree: number = 2,
  ): { coefficients: number[]; rSquared: number } {
    // This is a simplified version - for production, use a proper polynomial regression library
    // For now, we'll return a simple quadratic approximation

    const validData = data.filter((p) => p.adjustedDemand > 0)

    if (validData.length < degree + 1) {
      return { coefficients: [0], rSquared: 0 }
    }

    // Simple quadratic fitting (ax^2 + bx + c)
    // This is a placeholder - implement full polynomial regression if needed
    const linearTrend = this.analyze(data)

    return {
      coefficients: [linearTrend.currentLevel, linearTrend.slope, 0],
      rSquared: linearTrend.rSquared,
    }
  }
}
