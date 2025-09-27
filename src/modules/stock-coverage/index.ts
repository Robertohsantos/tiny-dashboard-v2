/**
 * Stock Coverage Module
 * Main export file for all stock coverage functionality
 */

// Components
export * from './components/stock-coverage-details'
export * from './components/badges'

// Main calculator
export { StockCoverageCalculator } from './calculator'

// Data processing modules
export { DataPreprocessor } from './data-preprocessor'
export { WeightedMovingAverage } from './weighted-average'
export { TrendAnalyzer } from './trend-analysis'
export { SeasonalityAdjuster } from './seasonality'

// Configuration and validation
export {
  validateConfig,
  safeValidateConfig,
  mergeAndValidateConfig,
  formatConfigErrors,
  ConfigPresets,
  getPresetConfig,
  StockCoverageConfigSchema,
} from './config-validator'

// Types
export type {
  StockCoverageConfig,
  StockCoverageInput,
  StockCoverageResult,
  ProcessedDataPoint,
  SeasonalityFactors,
  TrendAnalysis,
  WeightedAverageResult,
  DataQualityScore,
  BatchProcessingResult,
} from './types'

// Constants and errors
export {
  DEFAULT_CONFIG,
  Z_SCORES,
  StockCoverageError,
  StockCoverageCalculationError,
} from './types'

// Services & repositories
export * from './services/stock-coverage.service'
export * from './repositories/stock-coverage.repository'

export * from './jobs/stock-coverage.job'
export * from './utils/stock-coverage-api'
