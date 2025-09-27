/**
 * Stock Coverage Calculator
 * Main calculation engine that orchestrates all modules
 */

import type {
  StockCoverageConfig,
  StockCoverageInput,
  StockCoverageResult,
  ProcessedDataPoint,
  DataQualityScore,
} from './types'
import {
  DEFAULT_CONFIG,
  Z_SCORES,
  StockCoverageCalculationError,
  StockCoverageError,
} from './types'
import { DataPreprocessor } from './data-preprocessor'
import { WeightedMovingAverage } from './weighted-average'
import { TrendAnalyzer } from './trend-analysis'
import { SeasonalityAdjuster } from './seasonality'
import { mergeAndValidateConfig } from './config-validator'

export class StockCoverageCalculator {
  private config: StockCoverageConfig
  private preprocessor: DataPreprocessor
  private weightedAverage: WeightedMovingAverage
  private trendAnalyzer: TrendAnalyzer
  private seasonalityAdjuster: SeasonalityAdjuster

  constructor(config?: Partial<StockCoverageConfig>) {
    try {
      // Validate and merge configuration
      this.config = mergeAndValidateConfig(config, DEFAULT_CONFIG)
    } catch (error) {
      throw new StockCoverageCalculationError(
        StockCoverageError.INVALID_CONFIGURATION,
        'Invalid configuration provided',
        { error, providedConfig: config },
      )
    }

    this.preprocessor = new DataPreprocessor(this.config)
    this.weightedAverage = new WeightedMovingAverage(this.config)
    this.trendAnalyzer = new TrendAnalyzer(this.config)
    this.seasonalityAdjuster = new SeasonalityAdjuster(this.config)
  }

  /**
   * Main calculation method
   */
  calculate(input: StockCoverageInput): StockCoverageResult {
    const startTime = Date.now()

    // Step 1: Preprocess data
    const processedData = this.preprocessor.preprocess(input)

    // Step 2: Calculate data quality
    const dataQuality = this.preprocessor.calculateDataQuality(
      input,
      processedData,
    )

    // Step 3: Calculate seasonality factors
    const seasonalityFactors =
      this.seasonalityAdjuster.calculateSeasonalityFactors(processedData)

    // Step 4: Deseasonalize data for trend analysis
    const deseasonalizedData = this.seasonalityAdjuster.deseasonalize(
      processedData,
      seasonalityFactors,
    )

    // Step 5: Analyze trend
    const trendAnalysis = this.trendAnalyzer.analyze(deseasonalizedData)

    // Step 6: Calculate weighted moving average
    const weightedAvgResult = this.weightedAverage.calculate(deseasonalizedData)

    // Step 7: Generate forecast
    const forecast = this.generateForecast(
      weightedAvgResult.mean,
      trendAnalysis,
      seasonalityFactors,
      input.currentDate || new Date(),
    )

    // Step 8: Calculate coverage days
    const coverageResults = this.calculateCoverage(
      input.product.currentStock,
      forecast.demandForecast,
      forecast.demandStdDev,
    )

    // Step 9: Calculate recommendations
    const recommendations = this.calculateRecommendations(
      input.product,
      forecast.demandForecast,
      forecast.demandStdDev,
    )

    // Step 10: Calculate confidence score
    const confidence = this.calculateOverallConfidence(
      dataQuality,
      trendAnalysis.confidence,
      processedData.length,
    )

    // Build result
    const result: StockCoverageResult = {
      // Coverage calculations
      coverageDays: coverageResults.p50,
      coverageDaysP90: coverageResults.p90,
      coverageDaysP10: coverageResults.p10,

      // Demand metrics
      demandForecast: forecast.demandForecast,
      demandStdDev: forecast.demandStdDev,
      adjustedDemand: forecast.adjustedDemand,

      // Analysis components
      trendFactor: trendAnalysis.trendFactor,
      seasonalityIndex: forecast.seasonalityIndex,
      availabilityAdjustment: forecast.availabilityAdjustment,

      // Metadata
      confidence,
      dataQuality,

      // Recommendations
      reorderPoint: recommendations.reorderPoint,
      reorderQuantity: recommendations.reorderQuantity,
      stockoutRisk: recommendations.stockoutRisk,

      // Diagnostic information
      historicalDaysUsed: processedData.length,
      algorithm: 'EWMA_TREND_SEASONALITY_V1',
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.cacheTimeoutSeconds * 1000),
    }

    return result
  }

  /**
   * Generate demand forecast
   */
  private generateForecast(
    baseDemand: number,
    trendAnalysis: any,
    seasonalityFactors: any,
    targetDate: Date,
  ): {
    demandForecast: number
    demandStdDev: number
    adjustedDemand: number
    seasonalityIndex: number
    availabilityAdjustment: number
  } {
    // Apply trend to base demand
    let trendAdjustedDemand = baseDemand

    if (this.config.enableTrendCorrection && trendAnalysis.confidence > 0.3) {
      // Project trend for forecast horizon
      const projectedDays = Math.floor(this.config.forecastHorizon / 2) // Use midpoint
      trendAdjustedDemand =
        trendAnalysis.currentLevel *
        Math.pow(trendAnalysis.trendFactor, projectedDays)
    }

    // Calculate average seasonality for forecast period
    let averageSeasonality = 1.0

    if (this.config.enableSeasonality) {
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ]
      let seasonalitySum = 0

      for (let i = 0; i < this.config.forecastHorizon; i++) {
        const futureDate = new Date(targetDate)
        futureDate.setDate(futureDate.getDate() + i)
        const dayOfWeek = futureDate.getDay()
        seasonalitySum += seasonalityFactors[dayNames[dayOfWeek]]
      }

      averageSeasonality = seasonalitySum / this.config.forecastHorizon
    }

    // Apply seasonality
    const seasonalizedDemand = trendAdjustedDemand * averageSeasonality

    // Calculate standard deviation (simplified - should use proper error propagation)
    const baseStdDev = Math.sqrt(baseDemand) // Poisson assumption
    const trendUncertainty =
      Math.abs(trendAnalysis.slope) * this.config.forecastHorizon
    const demandStdDev = baseStdDev * (1 + trendUncertainty)

    return {
      demandForecast: Math.max(0, seasonalizedDemand),
      demandStdDev: demandStdDev,
      adjustedDemand: trendAdjustedDemand,
      seasonalityIndex: averageSeasonality,
      availabilityAdjustment: 1.0, // Placeholder - calculate from processed data if needed
    }
  }

  /**
   * Calculate coverage days for different percentiles
   */
  private calculateCoverage(
    currentStock: number,
    demandForecast: number,
    demandStdDev: number,
  ): {
    p10: number
    p50: number
    p90: number
  } {
    // Avoid division by zero
    if (demandForecast <= 0) {
      return {
        p10: currentStock > 0 ? 999 : 0,
        p50: currentStock > 0 ? 999 : 0,
        p90: currentStock > 0 ? 999 : 0,
      }
    }

    // Calculate coverage for different confidence levels
    const p50Demand = demandForecast
    const p10Demand = Math.max(
      0.1,
      demandForecast + Z_SCORES.P10 * demandStdDev,
    )
    const p90Demand = demandForecast + Z_SCORES.P90 * demandStdDev

    return {
      p10: currentStock / p10Demand, // Optimistic (low demand)
      p50: currentStock / p50Demand, // Median
      p90: currentStock / p90Demand, // Conservative (high demand)
    }
  }

  /**
   * Calculate reorder recommendations
   */
  private calculateRecommendations(
    product: any,
    demandForecast: number,
    demandStdDev: number,
  ): {
    reorderPoint: number
    reorderQuantity: number
    stockoutRisk: number
  } {
    // Calculate reorder point based on lead time and safety stock
    const leadTimeDemand = demandForecast * product.leadTimeDays
    const leadTimeStdDev = demandStdDev * Math.sqrt(product.leadTimeDays)
    const safetyStock =
      Z_SCORES.P95 * leadTimeStdDev +
      this.config.safetyStockDays * demandForecast

    const reorderPoint = Math.ceil(leadTimeDemand + safetyStock)

    // Calculate economic order quantity (simplified)
    const orderingCost = 50 // Assumed fixed ordering cost
    const holdingCostRate = 0.25 // 25% annual holding cost
    const annualDemand = demandForecast * 365
    const unitCost = Number(product.costPrice) || 0

    const eoq =
      unitCost > 0
        ? Math.sqrt(
            (2 * annualDemand * orderingCost) / (holdingCostRate * unitCost),
          )
        : product.maximumStock - product.currentStock

    // Adjust EOQ to respect min/max constraints
    const reorderQuantity = Math.min(
      Math.max(Math.ceil(eoq), product.minimumStock),
      product.maximumStock - product.currentStock,
    )

    // Calculate stockout risk
    const daysUntilStockout = product.currentStock / demandForecast
    const stockoutRisk = this.calculateStockoutProbability(
      daysUntilStockout,
      product.leadTimeDays,
      demandStdDev / demandForecast,
    )

    return {
      reorderPoint,
      reorderQuantity,
      stockoutRisk,
    }
  }

  /**
   * Calculate probability of stockout
   */
  private calculateStockoutProbability(
    daysUntilStockout: number,
    leadTimeDays: number,
    coefficientOfVariation: number,
  ): number {
    if (daysUntilStockout > leadTimeDays * 2) {
      return 0 // Very low risk
    }

    if (daysUntilStockout <= 0) {
      return 1 // Already stocked out
    }

    // Simplified calculation - should use proper probability distribution
    const ratio = daysUntilStockout / leadTimeDays
    const variabilityFactor = 1 + coefficientOfVariation

    if (ratio > 1.5) {
      return Math.max(0, 0.1 * variabilityFactor - 0.1)
    } else if (ratio > 1) {
      return Math.max(0, 0.3 * variabilityFactor - 0.2)
    } else if (ratio > 0.5) {
      return Math.max(0, 0.6 * variabilityFactor - 0.3)
    } else {
      return Math.min(1, 0.9 * variabilityFactor)
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    dataQuality: DataQualityScore,
    trendConfidence: number,
    datapointsUsed: number,
  ): number {
    // Weighted average of different confidence factors
    const weights = {
      dataQuality: 0.4,
      trendConfidence: 0.3,
      dataVolume: 0.3,
    }

    // Calculate data volume score
    const minDataPoints = 30
    const dataVolumeScore = Math.min(1, datapointsUsed / minDataPoints)

    const overallConfidence =
      dataQuality.overallScore * weights.dataQuality +
      trendConfidence * weights.trendConfidence +
      dataVolumeScore * weights.dataVolume

    return Math.max(0, Math.min(1, overallConfidence))
  }

  /**
   * Batch calculation for multiple SKUs
   */
  async calculateBatch(
    inputs: StockCoverageInput[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<Map<string, StockCoverageResult>> {
    const results = new Map<string, StockCoverageResult>()
    const batchSize = this.config.batchSize

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, Math.min(i + batchSize, inputs.length))

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (input) => {
          try {
            const result = this.calculate(input)
            return { sku: input.product.sku, result }
          } catch (error) {
            console.error(
              `Failed to calculate coverage for ${input.product.sku}:`,
              error,
            )
            return null
          }
        }),
      )

      // Store results
      batchResults.forEach((item) => {
        if (item) {
          results.set(item.sku, item.result)
        }
      })

      // Report progress
      if (onProgress) {
        onProgress(Math.min(i + batchSize, inputs.length), inputs.length)
      }
    }

    return results
  }
}
