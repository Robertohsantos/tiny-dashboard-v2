/**
 * Data Preprocessor Module
 * Handles data cleaning, validation, and preparation for stock coverage calculation
 */

import type {
  StockCoverageInput,
  ProcessedDataPoint,
  StockCoverageConfig,
  DataQualityScore,
} from './types'
import { StockCoverageCalculationError, StockCoverageError } from './types'

export class DataPreprocessor {
  constructor(private config: StockCoverageConfig) {}

  /**
   * Preprocess raw data for calculation
   */
  preprocess(input: StockCoverageInput): ProcessedDataPoint[] {
    const { salesHistory, stockAvailability } = input

    // Validate input data
    this.validateInput(input)

    // Create a map of stock availability by date
    const availabilityMap = new Map<string, number>()
    stockAvailability.forEach((sa) => {
      const dateKey = sa.date.toISOString().split('T')[0]
      availabilityMap.set(dateKey, sa.minutesInStock / 1440) // Convert to factor 0-1
    })

    // Get the last N days based on config
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.historicalDays)

    // Filter and process sales history
    const processedData: ProcessedDataPoint[] = []
    const salesByDate = new Map<string, (typeof salesHistory)[0]>()

    salesHistory
      .filter((sh) => sh.date >= cutoffDate)
      .forEach((sh) => {
        const dateKey = sh.date.toISOString().split('T')[0]
        salesByDate.set(dateKey, sh)
      })

    // Generate continuous date range (fill missing dates)
    const currentDate = new Date()
    for (let i = this.config.historicalDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(currentDate.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]

      const sales = salesByDate.get(dateKey)
      const availabilityFactor = availabilityMap.get(dateKey) ?? 1.0

      // Calculate time-based weight (exponential decay)
      const daysAgo = i
      const weight = Math.pow(0.5, daysAgo / this.config.halfLife)

      const dataPoint: ProcessedDataPoint = {
        date,
        dayOfWeek: date.getDay(),
        originalSales: sales?.unitsSold ?? 0,
        availabilityFactor,
        adjustedDemand: 0, // Will be calculated next
        weight,
        isPromotion: sales?.promotionFlag ?? false,
        isOutlier: false, // Will be detected next
      }

      processedData.push(dataPoint)
    }

    // Calculate adjusted demand for each point
    this.adjustForAvailability(processedData)

    // Detect and mark outliers
    this.detectOutliers(processedData)

    // Apply promotion adjustments if enabled
    if (this.config.enablePromotionAdjustment) {
      this.adjustForPromotions(processedData)
    }

    return processedData
  }

  /**
   * Validate input data
   */
  private validateInput(input: StockCoverageInput): void {
    if (!input.product) {
      throw new StockCoverageCalculationError(
        StockCoverageError.INVALID_CONFIGURATION,
        'Product data is required',
      )
    }

    if (!input.salesHistory || input.salesHistory.length === 0) {
      throw new StockCoverageCalculationError(
        StockCoverageError.INSUFFICIENT_DATA,
        'Sales history is required for calculation',
        { sku: input.product.sku },
      )
    }

    // Check minimum data requirements
    const uniqueDates = new Set(
      input.salesHistory.map((sh) => sh.date.toISOString().split('T')[0]),
    )

    if (uniqueDates.size < 7) {
      throw new StockCoverageCalculationError(
        StockCoverageError.INSUFFICIENT_DATA,
        'At least 7 days of sales history required',
        {
          sku: input.product.sku,
          daysFound: uniqueDates.size,
          minimumRequired: 7,
        },
      )
    }
  }

  /**
   * Adjust demand based on availability factor
   */
  private adjustForAvailability(data: ProcessedDataPoint[]): void {
    // Calculate rolling median for outlier capping
    const windowSize = 7

    data.forEach((point, index) => {
      // Get window of sales for median calculation
      const windowStart = Math.max(0, index - windowSize)
      const windowEnd = Math.min(data.length, index + windowSize + 1)
      const window = data
        .slice(windowStart, windowEnd)
        .map((p) => p.originalSales)
        .filter((s) => s > 0)
        .sort((a, b) => a - b)

      const median =
        window.length > 0
          ? window[Math.floor(window.length / 2)]
          : point.originalSales

      // Apply availability adjustment
      if (point.availabilityFactor >= this.config.minAvailabilityFactor) {
        // Adjust for partial availability
        const adjustedSales =
          point.originalSales /
          Math.max(point.availabilityFactor, this.config.minAvailabilityFactor)

        // Cap at median * outlier multiplier
        const cap = median * this.config.outlierCapMultiplier
        point.adjustedDemand = Math.min(adjustedSales, cap)
      } else {
        // Severe stockout - use imputation
        point.adjustedDemand = this.imputeDemand(data, index, median)
      }
    })
  }

  /**
   * Impute demand for days with severe stockouts
   */
  private imputeDemand(
    data: ProcessedDataPoint[],
    index: number,
    fallbackMedian: number,
  ): number {
    // Find similar days (same day of week) in the last 4 weeks
    const targetDayOfWeek = data[index].dayOfWeek
    const similarDays = data
      .slice(Math.max(0, index - 28), index)
      .filter(
        (p) =>
          p.dayOfWeek === targetDayOfWeek &&
          p.availabilityFactor >= this.config.minAvailabilityFactor,
      )
      .map((p) => p.adjustedDemand || p.originalSales)

    if (similarDays.length > 0) {
      // Use average of similar days
      return similarDays.reduce((sum, val) => sum + val, 0) / similarDays.length
    }

    // Fallback to median
    return fallbackMedian
  }

  /**
   * Detect outliers using modified z-score
   */
  private detectOutliers(data: ProcessedDataPoint[]): void {
    // Calculate median and MAD (Median Absolute Deviation)
    const demands = data
      .filter((p) => p.adjustedDemand > 0)
      .map((p) => p.adjustedDemand)
      .sort((a, b) => a - b)

    if (demands.length === 0) return

    const median = demands[Math.floor(demands.length / 2)]
    const deviations = demands.map((d) => Math.abs(d - median))
    deviations.sort((a, b) => a - b)
    const mad = deviations[Math.floor(deviations.length / 2)]

    // Modified z-score threshold (typically 3.5)
    const threshold = 3.5

    data.forEach((point) => {
      if (point.adjustedDemand === 0 || mad === 0) {
        point.isOutlier = false
        return
      }

      const modifiedZScore = (0.6745 * (point.adjustedDemand - median)) / mad
      point.isOutlier = Math.abs(modifiedZScore) > threshold

      // Cap outliers
      if (point.isOutlier) {
        const maxValue = median + (threshold * mad) / 0.6745
        const minValue = Math.max(0, median - (threshold * mad) / 0.6745)
        point.adjustedDemand = Math.max(
          minValue,
          Math.min(maxValue, point.adjustedDemand),
        )
      }
    })
  }

  /**
   * Adjust for promotional periods
   */
  private adjustForPromotions(data: ProcessedDataPoint[]): void {
    // Calculate average uplift during promotions
    const promoData = data.filter((p) => p.isPromotion && !p.isOutlier)
    const normalData = data.filter((p) => !p.isPromotion && !p.isOutlier)

    if (promoData.length === 0 || normalData.length === 0) return

    const avgPromoSales =
      promoData.reduce((sum, p) => sum + p.adjustedDemand, 0) / promoData.length
    const avgNormalSales =
      normalData.reduce((sum, p) => sum + p.adjustedDemand, 0) /
      normalData.length

    if (avgNormalSales === 0) return

    const promoUplift = avgPromoSales / avgNormalSales

    // Normalize promotional sales to baseline
    data.forEach((point) => {
      if (point.isPromotion && promoUplift > 1.2) {
        // Only adjust if uplift is significant (>20%)
        point.adjustedDemand = point.adjustedDemand / promoUplift
      }
    })
  }

  /**
   * Calculate data quality score
   */
  calculateDataQuality(
    input: StockCoverageInput,
    processedData: ProcessedDataPoint[],
  ): DataQualityScore {
    const totalDays = this.config.historicalDays
    const daysWithSales = processedData.filter(
      (p) => p.originalSales > 0,
    ).length
    const daysWithLowAvailability = processedData.filter(
      (p) => p.availabilityFactor < this.config.minAvailabilityFactor,
    ).length
    const outliers = processedData.filter((p) => p.isOutlier).length

    // Calculate consistency (coefficient of variation)
    const demands = processedData
      .filter((p) => !p.isOutlier)
      .map((p) => p.adjustedDemand)

    const mean = demands.reduce((sum, d) => sum + d, 0) / demands.length
    const variance =
      demands.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      demands.length
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1

    const completeness = daysWithSales / totalDays
    const consistency = Math.max(0, 1 - coefficientOfVariation)
    const availabilityIssues = daysWithLowAvailability / totalDays
    const outlierPercentage = outliers / totalDays

    // Calculate overall score (weighted average)
    const overallScore =
      completeness * 0.3 +
      consistency * 0.3 +
      (1 - availabilityIssues) * 0.2 +
      (1 - outlierPercentage) * 0.2

    return {
      completeness,
      consistency,
      availabilityIssues,
      outlierPercentage,
      overallScore,
    }
  }
}
