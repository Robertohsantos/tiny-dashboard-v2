/**
 * Environment configuration for the dashboard
 * Centralizes all environment-based decisions
 */

/**
 * Check if we're in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Check if we're in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Determines if mock data should be used
 * Only uses mock data in development and when not explicitly disabled
 */
export const useMockData = isDevelopment && process.env.USE_REAL_DATA !== 'true'

/**
 * Check if debug mode is enabled
 * Only works in development
 */
export const isDebugEnabled =
  isDevelopment && process.env.NEXT_PUBLIC_DEBUG === 'true'

/**
 * Check if chart debug mode is enabled
 */
export const isChartDebugEnabled =
  isDevelopment && process.env.NEXT_PUBLIC_DEBUG_CHARTS === 'true'

/**
 * Get the default organization ID for database queries
 */
export const getDefaultOrganizationId = () => {
  return process.env.DEFAULT_ORGANIZATION_ID || ''
}

/**
 * Environment configuration object
 */
export const ENV_CONFIG = {
  isDevelopment,
  isProduction,
  useMockData,
  isDebugEnabled,
  isChartDebugEnabled,
  defaultOrganizationId: getDefaultOrganizationId(),
} as const

/**
 * Type-safe environment variables
 */
export type EnvironmentConfig = typeof ENV_CONFIG
