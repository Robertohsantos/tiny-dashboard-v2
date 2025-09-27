/**
 * Dashboard Content Switch Component
 * Switches between validated and non-validated versions based on feature flags
 * Enables A/B testing and gradual rollout of validated hooks
 */

'use client'

import * as React from 'react'
import { DashboardContent } from './dashboard-content'
import { DashboardContentValidated } from './dashboard-content-validated'
import { isValidationEnabled, FEATURE_FLAGS } from '@/modules/core/utils/feature-flags'
import type { DashboardData } from '@/modules/dashboard/data/data-fetchers'

interface DashboardContentSwitchProps {
  /** Initial data for both versions */
  initialData: DashboardData
}

/**
 * Switch component that selects which dashboard version to render
 * based on feature flags and rollout configuration
 */
export function DashboardContentSwitch({
  initialData,
}: DashboardContentSwitchProps) {
  const componentName = 'dashboard-content'

  // Determine which version to use
  const [useValidatedVersion, setUseValidatedVersion] = React.useState(() => {
    return isValidationEnabled(componentName)
  })

  // Allow runtime switching in debug mode
  React.useEffect(() => {
    if (FEATURE_FLAGS.VALIDATION_DEBUG) {
      // Listen for custom events to switch versions
      const handleSwitch = (event: CustomEvent) => {
        if (event.detail?.component === componentName) {
          setUseValidatedVersion(event.detail.useValidated)
        }
      }

      window.addEventListener('validation-switch' as any, handleSwitch as any)
      return () => {
        window.removeEventListener(
          'validation-switch' as any,
          handleSwitch as any,
        )
      }
    }
  }, [])

  // Log which version is being used
  React.useEffect(() => {
    if (
      FEATURE_FLAGS.VALIDATION_DEBUG ||
      process.env.NODE_ENV === 'development'
    ) {
      console.log(
        `[DashboardContentSwitch] Using ${useValidatedVersion ? 'VALIDATED' : 'ORIGINAL'} version`,
        {
          component: componentName,
          featureFlags: {
            globalEnabled: FEATURE_FLAGS.USE_VALIDATED_HOOKS,
            rolloutPercentage: FEATURE_FLAGS.VALIDATION_ROLLOUT_PERCENTAGE,
            enabledComponents: FEATURE_FLAGS.VALIDATION_ENABLED_COMPONENTS,
          },
        },
      )
    }
  }, [useValidatedVersion])

  // Track which version is being used for analytics
  React.useEffect(() => {
    // This could send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'validation_version_loaded', {
        component: componentName,
        version: useValidatedVersion ? 'validated' : 'original',
      })
    }
  }, [useValidatedVersion])

  // Render the appropriate version
  if (useValidatedVersion) {
    return (
      <>
        {FEATURE_FLAGS.VALIDATION_DEBUG && (
          <div className="mb-2 flex justify-end">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Using Validated Version
            </span>
          </div>
        )}
        <DashboardContentValidated initialData={initialData} />
      </>
    )
  }

  return (
    <>
      {FEATURE_FLAGS.VALIDATION_DEBUG && (
        <div className="mb-2 flex justify-end">
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Using Original Version
          </span>
        </div>
      )}
      <DashboardContent initialData={initialData} />
    </>
  )
}

/**
 * HOC to add version switching to any component pair
 */
export function withVersionSwitch<P extends object>(
  OriginalComponent: React.ComponentType<P>,
  ValidatedComponent: React.ComponentType<P>,
  componentName: string,
) {
  return function VersionSwitchWrapper(props: P) {
    const useValidated = isValidationEnabled(componentName)

    React.useEffect(() => {
      if (FEATURE_FLAGS.VALIDATION_DEBUG) {
        console.log(
          `[VersionSwitch] ${componentName} using ${useValidated ? 'VALIDATED' : 'ORIGINAL'} version`,
        )
      }
    }, [useValidated])

    const Component = useValidated ? ValidatedComponent : OriginalComponent

    return (
      <>
        {FEATURE_FLAGS.VALIDATION_DEBUG && (
          <div className="relative">
            <div className="absolute -top-6 right-0 text-xs opacity-50">
              {useValidated ? '🛡️ Validated' : '📦 Original'}
            </div>
          </div>
        )}
        <Component {...props} />
      </>
    )
  }
}

// Extend window for debugging
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    switchValidation?: (component: string, useValidated: boolean) => void
  }
}

// Add debug helper to window
if (typeof window !== 'undefined' && FEATURE_FLAGS.VALIDATION_DEBUG) {
  window.switchValidation = (component: string, useValidated: boolean) => {
    const event = new CustomEvent('validation-switch', {
      detail: { component, useValidated },
    })
    window.dispatchEvent(event)
    console.log(
      `[Debug] Switched ${component} to ${useValidated ? 'validated' : 'original'} version`,
    )
  }
}
