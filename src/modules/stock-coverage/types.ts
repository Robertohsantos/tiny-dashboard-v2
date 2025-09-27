/**
 * TypeScript interfaces for Stock Coverage Calculation Module
 * Defines all types used in the stock coverage calculation system
 */

import type {
  Product,
  SalesHistory,
  StockAvailability,
} from '@/generated/prisma/client'

/**
 * Configuration parameters for stock coverage calculation
 */
export interface StockCoverageConfig {
  // Data window configuration
  historicalDays: number // Number of days of historical data to use (default: 90)
  forecastHorizon: number // Number of days to forecast ahead (default: 7)

  // Weighted moving average parameters
  halfLife: number // Half-life in days for exponential decay (default: 14)

  // Availability adjustments
  minAvailabilityFactor: number // Minimum AF to avoid division issues (default: 0.6)
  outlierCapMultiplier: number // Cap for outlier detection (default: 3)

  // Feature flags
  enableSeasonality: boolean // Enable day-of-week seasonality adjustment
  enableTrendCorrection: boolean // Enable trend analysis and correction
  enablePromotionAdjustment: boolean // Adjust for promotional periods

  // Performance settings
  enableCache: boolean // Enable result caching
  cacheTimeoutSeconds: number // Cache timeout in seconds
  batchSize: number // Number of SKUs to process in batch

  // Service levels
  serviceLevel: number // Service level for P90 calculation (default: 0.95)
  safetyStockDays: number // Additional safety stock days
}

/**
 * Raw data input for calculation
 */
export interface StockCoverageInput {
  product: Product
  salesHistory: SalesHistory[]
  stockAvailability: StockAvailability[]
  currentDate?: Date
}

/**
 * Preprocessed data point for calculation
 */
export interface ProcessedDataPoint {
  date: Date
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  originalSales: number // Raw sales value
  availabilityFactor: number // AF (0-1)
  adjustedDemand: number // Sales adjusted for availability
  weight: number // Exponential weight for this point
  isPromotion: boolean // Promotion flag
  isOutlier: boolean // Outlier detection flag
}

/**
 * Seasonality factors by day of week
 */
export interface SeasonalityFactors {
  sunday: number
  monday: number
  tuesday: number
  wednesday: number
  thursday: number
  friday: number
  saturday: number
  [key: string]: number // Index signature for dynamic access
}

/**
 * Trend analysis results
 */
export interface TrendAnalysis {
  intercept: number // Regression intercept (alpha)
  slope: number // Regression slope (beta)
  rSquared: number // R-squared value
  trendFactor: number // Daily growth factor (e^beta)
  currentLevel: number // Current demand level
  confidence: number // Confidence in trend (0-1)
}

/**
 * Weighted average calculation result
 */
export interface WeightedAverageResult {
  mean: number // Weighted mean
  variance: number // Weighted variance
  standardDeviation: number // Standard deviation
  sumWeights: number // Total weight sum
  effectiveSamples: number // Effective sample size
}

/**
 * Final calculation results
 */
export interface StockCoverageResult {
  // Primary outputs
  coverageDays: number // P50 stock coverage in days
  coverageDaysP90: number // P90 (conservative) coverage
  coverageDaysP10: number // P10 (optimistic) coverage

  // Demand metrics
  demandForecast: number // Daily demand forecast
  demandStdDev: number // Demand standard deviation
  adjustedDemand: number // Demand adjusted for all factors

  // Analysis components
  trendFactor: number // Growth/decline trend factor
  seasonalityIndex: number // Current seasonality adjustment
  availabilityAdjustment: number // Average availability adjustment

  // Metadata
  confidence: number // Overall confidence score (0-1)
  dataQuality: DataQualityScore // Data quality assessment

  // Recommendations
  reorderPoint: number // Suggested reorder point
  reorderQuantity: number // Suggested order quantity
  stockoutRisk: number // Risk of stockout (0-1)

  // Diagnostic information
  historicalDaysUsed: number // Actual days of history used
  algorithm: string // Algorithm version/type
  calculatedAt: Date // Calculation timestamp
  expiresAt: Date // Cache expiration time
}

/**
 * Data quality assessment
 */
export interface DataQualityScore {
  completeness: number // % of days with data
  consistency: number // Data consistency score
  availabilityIssues: number // % of days with low availability
  outlierPercentage: number // % of outliers detected
  overallScore: number // Overall quality (0-1)
}

/**
 * Batch processing result
 */
export interface BatchProcessingResult {
  successful: string[] // Successfully processed SKUs
  failed: string[] // Failed SKUs
  errors: Record<string, string> // Error messages by SKU
  totalTime: number // Total processing time in ms
  averageTimePerSku: number // Average time per SKU
}

/**
 * Error types for the module
 */
export enum StockCoverageError {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
}

/**
 * Custom error class for stock coverage calculations
 */
export class StockCoverageCalculationError extends Error {
  constructor(
    public type: StockCoverageError,
    message: string,
    public details?: any,
  ) {
    super(message)
    this.name = 'StockCoverageCalculationError'
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: StockCoverageConfig = {
  historicalDays: 90,
  forecastHorizon: 7,
  halfLife: 14,
  minAvailabilityFactor: 0.6,
  outlierCapMultiplier: 3,
  enableSeasonality: true,
  enableTrendCorrection: true,
  enablePromotionAdjustment: true,
  enableCache: true,
  cacheTimeoutSeconds: 3600,
  batchSize: 100,
  serviceLevel: 0.95,
  safetyStockDays: 3,
}

/**
 * Statistical z-scores for confidence levels
 */
export const Z_SCORES = {
  P10: -1.28, // 10th percentile
  P50: 0, // 50th percentile (median)
  P90: 1.28, // 90th percentile
  P95: 1.645, // 95th percentile
  P99: 2.33, // 99th percentile
}
