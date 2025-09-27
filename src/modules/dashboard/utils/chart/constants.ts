/**
 * Chart constants and configuration
 * Centralized configuration for chart projections
 */

import type { PeriodType } from '../period-utils'

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

/**
 * Projection configuration interface
 */
export interface ProjectionConfig {
  /** Day limit for projections */
  dayLimit?: number
  /** Month limit for projections */
  monthLimit?: number
  /** Variation pattern percentage */
  variationPattern?: number
  /** Wave frequency for sine variations */
  waveFrequency?: number
}

/**
 * Type for projection limit configuration
 */
export type ProjectionLimitConfig =
  (typeof PROJECTION_LIMITS)[keyof typeof PROJECTION_LIMITS]

/**
 * Get projection configuration for a period type
 */
export function getProjectionConfig(periodType: PeriodType): {
  limit: ProjectionLimitConfig
  variation: number
  frequency: number
} {
  return {
    limit: PROJECTION_LIMITS[periodType],
    variation: VARIATION_PATTERNS[periodType],
    frequency: WAVE_FREQUENCIES[periodType],
  }
}
