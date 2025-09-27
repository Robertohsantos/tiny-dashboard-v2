/**
 * Configuration Validator for Stock Coverage
 * Uses Zod for runtime type checking and validation
 */

import { z } from 'zod'
import type { StockCoverageConfig } from './types'

/**
 * Zod schema for stock coverage configuration
 */
export const StockCoverageConfigSchema = z.object({
  // Data window configuration
  historicalDays: z
    .number()
    .min(7, 'Historical days must be at least 7')
    .max(365, 'Historical days cannot exceed 365')
    .int('Historical days must be an integer'),

  forecastHorizon: z
    .number()
    .min(1, 'Forecast horizon must be at least 1 day')
    .max(90, 'Forecast horizon cannot exceed 90 days')
    .int('Forecast horizon must be an integer'),

  // Weighted moving average parameters
  halfLife: z
    .number()
    .min(1, 'Half-life must be at least 1 day')
    .max(90, 'Half-life cannot exceed 90 days')
    .positive('Half-life must be positive'),

  // Availability adjustments
  minAvailabilityFactor: z
    .number()
    .min(0.1, 'Min availability factor must be at least 0.1')
    .max(1, 'Min availability factor cannot exceed 1')
    .positive('Min availability factor must be positive'),

  outlierCapMultiplier: z
    .number()
    .min(1, 'Outlier cap multiplier must be at least 1')
    .max(10, 'Outlier cap multiplier cannot exceed 10')
    .positive('Outlier cap multiplier must be positive'),

  // Feature flags
  enableSeasonality: z.boolean(),
  enableTrendCorrection: z.boolean(),
  enablePromotionAdjustment: z.boolean(),

  // Performance settings
  enableCache: z.boolean(),
  cacheTimeoutSeconds: z
    .number()
    .min(60, 'Cache timeout must be at least 60 seconds')
    .max(86400, 'Cache timeout cannot exceed 24 hours')
    .int('Cache timeout must be an integer'),

  batchSize: z
    .number()
    .min(1, 'Batch size must be at least 1')
    .max(1000, 'Batch size cannot exceed 1000')
    .int('Batch size must be an integer'),

  // Service levels
  serviceLevel: z
    .number()
    .min(0.5, 'Service level must be at least 0.5 (50%)')
    .max(0.999, 'Service level cannot exceed 0.999 (99.9%)')
    .positive('Service level must be positive'),

  safetyStockDays: z
    .number()
    .min(0, 'Safety stock days cannot be negative')
    .max(30, 'Safety stock days cannot exceed 30')
    .nonnegative('Safety stock days must be non-negative'),
})

/**
 * Validate and parse configuration
 * @param config Raw configuration object
 * @returns Validated configuration
 * @throws ZodError if validation fails
 */
export function validateConfig(config: unknown): StockCoverageConfig {
  return StockCoverageConfigSchema.parse(config)
}

/**
 * Safe validate configuration without throwing
 * @param config Raw configuration object
 * @returns Result with either validated config or error
 */
export function safeValidateConfig(
  config: unknown,
):
  | { success: true; data: StockCoverageConfig }
  | { success: false; error: z.ZodError } {
  const result = StockCoverageConfigSchema.safeParse(config)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error }
  }
}

/**
 * Merge partial config with defaults and validate
 * @param partialConfig Partial configuration to merge
 * @param defaultConfig Default configuration
 * @returns Validated merged configuration
 */
export function mergeAndValidateConfig(
  partialConfig: Partial<StockCoverageConfig> | undefined,
  defaultConfig: StockCoverageConfig,
): StockCoverageConfig {
  const merged = { ...defaultConfig, ...partialConfig }
  return validateConfig(merged)
}

/**
 * Get configuration validation errors in a readable format
 * @param error Zod validation error
 * @returns Formatted error messages
 */
export function formatConfigErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.')
    return `${path}: ${err.message}`
  })
}

/**
 * Configuration presets for common scenarios
 */
export const ConfigPresets = {
  // Conservative configuration for critical items
  conservative: {
    historicalDays: 120,
    forecastHorizon: 14,
    halfLife: 21,
    minAvailabilityFactor: 0.7,
    outlierCapMultiplier: 2.5,
    serviceLevel: 0.99,
    safetyStockDays: 7,
  },

  // Balanced configuration for normal items
  balanced: {
    historicalDays: 90,
    forecastHorizon: 7,
    halfLife: 14,
    minAvailabilityFactor: 0.6,
    outlierCapMultiplier: 3,
    serviceLevel: 0.95,
    safetyStockDays: 3,
  },

  // Aggressive configuration for fast-moving items
  aggressive: {
    historicalDays: 60,
    forecastHorizon: 5,
    halfLife: 7,
    minAvailabilityFactor: 0.5,
    outlierCapMultiplier: 4,
    serviceLevel: 0.9,
    safetyStockDays: 1,
  },

  // Minimal configuration for testing
  minimal: {
    historicalDays: 14,
    forecastHorizon: 3,
    halfLife: 3,
    minAvailabilityFactor: 0.4,
    outlierCapMultiplier: 5,
    serviceLevel: 0.85,
    safetyStockDays: 0,
  },
} as const

/**
 * Get preset configuration
 * @param preset Preset name
 * @returns Partial configuration for the preset
 */
export function getPresetConfig(
  preset: keyof typeof ConfigPresets,
): Partial<StockCoverageConfig> {
  return ConfigPresets[preset]
}
