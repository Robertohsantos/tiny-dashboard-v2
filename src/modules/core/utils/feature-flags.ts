/**
 * Feature Flags System for Controlled Migration
 * Enables gradual rollout and quick rollback of validated hooks
 */

/**
 * Feature flag configuration
 * These can be controlled via environment variables or a remote config service
 */
export const FEATURE_FLAGS = {
  /**
   * Enable validated hooks with Zod validation
   * When true, components will use the new validated hooks
   * When false, components will use the original hooks
   */
  USE_VALIDATED_HOOKS: process.env.NEXT_PUBLIC_USE_VALIDATED_HOOKS === 'true',

  /**
   * Enable validation monitoring and telemetry
   * Tracks validation errors, success rates, and performance
   */
  VALIDATION_MONITORING:
    process.env.NEXT_PUBLIC_VALIDATION_MONITORING === 'true',

  /**
   * Enable fallback data when validation fails
   * Uses cached or default data instead of showing errors
   */
  VALIDATION_FALLBACK: process.env.NEXT_PUBLIC_VALIDATION_FALLBACK === 'true',

  /**
   * Enable detailed validation logs in console
   * Useful for debugging validation issues
   */
  VALIDATION_DEBUG: process.env.NEXT_PUBLIC_VALIDATION_DEBUG === 'true',

  /**
   * Percentage of users to enable validated hooks for (0-100)
   * Used for gradual rollout
   */
  VALIDATION_ROLLOUT_PERCENTAGE: parseInt(
    process.env.NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE || '0',
  ),

  /**
   * List of specific components to enable validation for
   * Comma-separated list of component names
   */
  VALIDATION_ENABLED_COMPONENTS: (
    process.env.NEXT_PUBLIC_VALIDATION_ENABLED_COMPONENTS || ''
  )
    .split(',')
    .filter(Boolean),

  /**
   * Enable automatic rollback on high error rates
   */
  AUTO_ROLLBACK_ENABLED:
    process.env.NEXT_PUBLIC_AUTO_ROLLBACK_ENABLED === 'true',

  /**
   * Error rate threshold for automatic rollback (0-1)
   */
  AUTO_ROLLBACK_THRESHOLD: parseFloat(
    process.env.NEXT_PUBLIC_AUTO_ROLLBACK_THRESHOLD || '0.1',
  ),
} as const

/**
 * Check if validation is enabled for a specific component
 * @param componentName - Name of the component to check
 * @returns Whether validation should be used for this component
 */
export function isValidationEnabled(componentName: string): boolean {
  // Check if globally enabled
  if (!FEATURE_FLAGS.USE_VALIDATED_HOOKS) {
    return false
  }

  // Check if component is in the enabled list
  if (FEATURE_FLAGS.VALIDATION_ENABLED_COMPONENTS.length > 0) {
    return FEATURE_FLAGS.VALIDATION_ENABLED_COMPONENTS.includes(componentName)
  }

  // Check rollout percentage (simple hash-based distribution)
  if (FEATURE_FLAGS.VALIDATION_ROLLOUT_PERCENTAGE > 0) {
    // Use a stable hash based on user session or ID
    // For now, using a random value stored in sessionStorage
    const userHash = getUserHash()
    const userPercentage = (userHash % 100) + 1
    return userPercentage <= FEATURE_FLAGS.VALIDATION_ROLLOUT_PERCENTAGE
  }

  // Default to enabled if no specific rules apply
  return true
}

/**
 * Get or create a stable user hash for A/B testing
 * @returns A number between 0-99 for percentage-based rollout
 */
function getUserHash(): number {
  if (typeof window === 'undefined') {
    return 0 // SSR, default to disabled
  }

  const storageKey = 'validation-rollout-hash'
  const stored = sessionStorage.getItem(storageKey)

  if (stored) {
    return parseInt(stored, 10)
  }

  const hash = Math.floor(Math.random() * 100)
  sessionStorage.setItem(storageKey, hash.toString())
  return hash
}

/**
 * Feature flag overrides for testing
 * These can be set via URL parameters or developer tools
 */
export function applyFeatureFlagOverrides(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)

  // Check for URL parameter overrides
  if (params.has('validated-hooks')) {
    const value = params.get('validated-hooks')
    localStorage.setItem(
      'feature-flag-validated-hooks',
      value === 'true' ? 'true' : 'false',
    )
  }

  if (params.has('validation-debug')) {
    const value = params.get('validation-debug')
    localStorage.setItem(
      'feature-flag-validation-debug',
      value === 'true' ? 'true' : 'false',
    )
  }

  // Apply localStorage overrides
  const validatedHooksOverride = localStorage.getItem(
    'feature-flag-validated-hooks',
  )
  if (validatedHooksOverride !== null) {
    (FEATURE_FLAGS as unknown as Record<string, unknown>).USE_VALIDATED_HOOKS =
      validatedHooksOverride === 'true'
  }

  const debugOverride = localStorage.getItem('feature-flag-validation-debug')
  if (debugOverride !== null) {
    (FEATURE_FLAGS as unknown as Record<string, unknown>).VALIDATION_DEBUG =
      debugOverride === 'true'
  }
}

/**
 * Log feature flag status for debugging
 */
export function logFeatureFlagStatus(): void {
  if (
    FEATURE_FLAGS.VALIDATION_DEBUG ||
    process.env.NODE_ENV === 'development'
  ) {
    console.group('🚩 Feature Flags Status')
    console.table({
      'Validated Hooks': FEATURE_FLAGS.USE_VALIDATED_HOOKS,
      Monitoring: FEATURE_FLAGS.VALIDATION_MONITORING,
      Fallback: FEATURE_FLAGS.VALIDATION_FALLBACK,
      Debug: FEATURE_FLAGS.VALIDATION_DEBUG,
      'Rollout %': FEATURE_FLAGS.VALIDATION_ROLLOUT_PERCENTAGE,
      'Auto Rollback': FEATURE_FLAGS.AUTO_ROLLBACK_ENABLED,
      Components:
        FEATURE_FLAGS.VALIDATION_ENABLED_COMPONENTS.join(', ') || 'All',
    })
    console.groupEnd()
  }
}

/**
 * Feature flag React hook
 * Use this in components to check feature flag status
 */
export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS): boolean {
  // This could be enhanced to subscribe to remote config changes
  return FEATURE_FLAGS[flag] as boolean
}

/**
 * Initialize feature flags on app start
 */
export function initializeFeatureFlags(): void {
  applyFeatureFlagOverrides()
  logFeatureFlagStatus()
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  initializeFeatureFlags()
}
