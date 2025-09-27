/**
 * Performance Provider
 * Context provider for Web Vitals monitoring
 */

'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import type { Metric } from 'web-vitals'
import {
  enhanceMetric,
  defaultPerformanceConfig,
  type PerformanceConfig,
  type ExtendedMetric,
  type PerformanceReport,
  type Rating,
} from '@/modules/core/performance/web-vitals'

/**
 * Performance context value
 */
interface PerformanceContextValue {
  /** Current metrics */
  metrics: Map<string, ExtendedMetric>
  /** Performance report */
  report: PerformanceReport | null
  /** Configuration */
  config: PerformanceConfig
  /** Force report generation */
  generateReport: () => Promise<PerformanceReport>
  /** Clear stored metrics */
  clearMetrics: () => Promise<void>
  /** Get metric by name */
  getMetric: (name: string) => ExtendedMetric | undefined
  /** Check if monitoring is enabled */
  isEnabled: boolean
  /** Session ID */
  sessionId: string
}

const PerformanceContext = createContext<PerformanceContextValue | undefined>(
  undefined,
)

/**
 * Performance Provider Props
 */
interface PerformanceProviderProps {
  children: ReactNode
  config?: Partial<PerformanceConfig>
  /** Enable monitoring only for specific routes */
  enabledRoutes?: string[]
  /** Disable monitoring for specific routes */
  disabledRoutes?: string[]
}

/**
 * Performance Provider Component
 */
export function PerformanceProvider({
  children,
  config: userConfig = {},
  enabledRoutes,
  disabledRoutes,
}: PerformanceProviderProps) {
  const config = { ...defaultPerformanceConfig, ...userConfig }
  const [metrics, setMetrics] = useState<Map<string, ExtendedMetric>>(new Map())
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const sessionId = useRef<string>(generateSessionId())
  const reportedMetrics = useRef<Set<string>>(new Set())

  // Check if monitoring should be enabled for current route
  const isEnabled = useCallback(() => {
    if (!config.enabled) return false

    // Check sample rate
    if (Math.random() > config.sampleRate) return false

    const currentPath = window.location.pathname

    // Check enabled routes
    if (enabledRoutes && enabledRoutes.length > 0) {
      return enabledRoutes.some((route) => currentPath.startsWith(route))
    }

    // Check disabled routes
    if (disabledRoutes && disabledRoutes.length > 0) {
      return !disabledRoutes.some((route) => currentPath.startsWith(route))
    }

    return true
  }, [config.enabled, config.sampleRate, enabledRoutes, disabledRoutes])

  /**
   * Handle metric reporting
   */
  const handleMetric = useCallback(
    async (metric: Metric) => {
      if (!isEnabled()) return

      // Prevent duplicate reporting
      if (reportedMetrics.current.has(metric.id)) return
      reportedMetrics.current.add(metric.id)

      // Enhance metric with metadata
      const enhanced = enhanceMetric(metric)

      // Update local state
      setMetrics((prev) => new Map(prev).set(metric.name, enhanced))

      // Save to storage
      await config.storage.save(enhanced)

      // Log to console if enabled
      if (config.logToConsole) {
        const emoji =
          enhanced.rating === 'good'
            ? '✅'
            : enhanced.rating === 'needs-improvement'
              ? '⚠️'
              : '❌'

        console.log(
          `${emoji} [Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`,
          `(${enhanced.rating})`,
          metric,
        )
      }

      // Call custom reporter if provided
      config.onReport?.(enhanced)
    },
    [config, isEnabled],
  )

  /**
   * Generate performance report
   */
  const generateReport = useCallback(async (): Promise<PerformanceReport> => {
    const newReport = await config.storage.getReport(sessionId.current)
    setReport(newReport)

    if (config.debug) {
      console.log('[Performance Report]', newReport)
    }

    return newReport
  }, [config])

  /**
   * Clear stored metrics
   */
  const clearMetrics = useCallback(async () => {
    await config.storage.clear()
    setMetrics(new Map())
    setReport(null)
    reportedMetrics.current.clear()
  }, [config.storage])

  /**
   * Get metric by name
   */
  const getMetric = useCallback(
    (name: string): ExtendedMetric | undefined => {
      return metrics.get(name)
    },
    [metrics],
  )

  // Set up Web Vitals monitoring
  useEffect(() => {
    if (!isEnabled()) return

    // Register Web Vitals handlers
    const unsubscribers = [
      onCLS(handleMetric),
      onFCP(handleMetric),
      onINP(handleMetric),
      onLCP(handleMetric),
      onTTFB(handleMetric),
    ]

    // Generate initial report after a delay
    const reportTimer = setTimeout(() => {
      generateReport()
    }, 10000) // Generate report after 10 seconds

    return () => {
      // Cleanup is handled by web-vitals internally
      clearTimeout(reportTimer)
    }
  }, [handleMetric, generateReport, isEnabled])

  // Monitor route changes
  useEffect(() => {
    const handleRouteChange = () => {
      // Reset metrics for new page
      reportedMetrics.current.clear()
    }

    // Listen for route changes (Next.js specific)
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  const contextValue: PerformanceContextValue = {
    metrics,
    report,
    config,
    generateReport,
    clearMetrics,
    getMetric,
    isEnabled: isEnabled(),
    sessionId: sessionId.current,
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  )
}

/**
 * Hook to use performance context
 */
export function usePerformance() {
  const context = useContext(PerformanceContext)

  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider')
  }

  return context
}

/**
 * Hook to get specific metric
 */
export function useMetric(name: string) {
  const { getMetric } = usePerformance()
  return getMetric(name)
}

/**
 * Hook to get performance score
 */
export function usePerformanceScore() {
  const { report } = usePerformance()
  return report?.summary.averageScore ?? null
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Performance indicator component
 */
export function PerformanceIndicator() {
  const { metrics, isEnabled, report } = usePerformance()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show indicator only in development
    if (process.env.NODE_ENV === 'development' && isEnabled) {
      setVisible(true)
    }
  }, [isEnabled])

  if (!visible) return null

  // Calculate overall rating
  let worstRating: Rating = 'good'
  metrics.forEach((metric) => {
    if (metric.rating === 'poor') {
      worstRating = 'poor'
    } else if (
      metric.rating === 'needs-improvement' &&
      worstRating === 'good'
    ) {
      worstRating = 'needs-improvement'
    }
  })

  const color =
    worstRating === 'good'
      ? 'bg-green-500'
      : worstRating === 'needs-improvement'
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => {
          console.log('Performance Metrics:', Object.fromEntries(metrics))
          console.log('Performance Report:', report)
        }}
        className={`${color} text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg hover:opacity-90 transition-opacity`}
        title="Click to log performance metrics"
      >
        {worstRating === 'good'
          ? 'Good'
          : worstRating === 'needs-improvement'
            ? 'Needs Work'
            : 'Poor'}{' '}
        Perf
      </button>
    </div>
  )
}
