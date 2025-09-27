/**
 * Web Vitals Configuration and Reporting
 * Professional performance monitoring system
 */

import type { Metric } from 'web-vitals'

/**
 * Web Vitals thresholds based on Google's recommendations
 */
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200,
    needsImprovement: 500,
  },
} as const

/**
 * Performance metric rating
 */
export type Rating = 'good' | 'needs-improvement' | 'poor'

/**
 * Extended metric with additional metadata
 */
export interface ExtendedMetric extends Metric {
  rating: Rating
  timestamp: number
  url: string
  userAgent: string
  connectionType?: string
  deviceMemory?: number
  hardwareConcurrency?: number
  viewport: {
    width: number
    height: number
  }
}

/**
 * Performance report structure
 */
export interface PerformanceReport {
  metrics: ExtendedMetric[]
  summary: {
    averageScore: number
    worstMetric: keyof typeof WEB_VITALS_THRESHOLDS | null
    bestMetric: keyof typeof WEB_VITALS_THRESHOLDS | null
  }
  timestamp: number
  sessionId: string
}

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  name: Metric['name'] | keyof typeof WEB_VITALS_THRESHOLDS,
  value: number,
): Rating {
  const thresholds = WEB_VITALS_THRESHOLDS[
    name as keyof typeof WEB_VITALS_THRESHOLDS
  ]

  if (!thresholds) {
    return 'good' // Default for unknown metrics
  }

  if (value <= thresholds.good) {
    return 'good'
  } else if (value <= thresholds.needsImprovement) {
    return 'needs-improvement'
  }

  return 'poor'
}

/**
 * Enhance metric with additional metadata
 */
export function enhanceMetric(metric: Metric): ExtendedMetric {
  const rating = getMetricRating(metric.name, metric.value)

  // Get connection information
  const connection = (navigator as any).connection
  const connectionType = connection?.effectiveType || 'unknown'

  // Get device capabilities
  const deviceMemory = (navigator as any).deviceMemory
  const hardwareConcurrency = navigator.hardwareConcurrency

  return {
    ...metric,
    rating,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connectionType,
    deviceMemory,
    hardwareConcurrency,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  }
}

/**
 * Performance data storage interface
 */
export interface PerformanceStorage {
  save(metric: ExtendedMetric): Promise<void>
  getAll(): Promise<ExtendedMetric[]>
  clear(): Promise<void>
  getReport(sessionId?: string): Promise<PerformanceReport>
}

/**
 * Local storage implementation
 */
export class LocalPerformanceStorage implements PerformanceStorage {
  private readonly storageKey = 'web-vitals-metrics'
  private readonly maxEntries = 100

  async save(metric: ExtendedMetric): Promise<void> {
    try {
      const stored = await this.getAll()
      stored.push(metric)

      // Keep only the latest entries
      const trimmed = stored.slice(-this.maxEntries)

      localStorage.setItem(this.storageKey, JSON.stringify(trimmed))
    } catch (error) {
      console.error('[Web Vitals] Failed to save metric:', error)
    }
  }

  async getAll(): Promise<ExtendedMetric[]> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('[Web Vitals] Failed to retrieve metrics:', error)
      return []
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey)
  }

  async getReport(sessionId?: string): Promise<PerformanceReport> {
    const allMetrics = await this.getAll()
    const metrics = sessionId
      ? allMetrics.filter((m) => m.id.includes(sessionId))
      : allMetrics

    // Calculate summary
    let totalScore = 0
    let worstMetric: ExtendedMetric['name'] | null = null
    let worstScore = 100
    let bestMetric: ExtendedMetric['name'] | null = null
    let bestScore = 0

    const metricScores = new Map<ExtendedMetric['name'], number>()

    metrics.forEach((metric) => {
      const score =
        metric.rating === 'good'
          ? 100
          : metric.rating === 'needs-improvement'
            ? 50
            : 0

      metricScores.set(metric.name, score)
      totalScore += score

      if (score < worstScore) {
        worstScore = score
        worstMetric = metric.name
      }

      if (score > bestScore) {
        bestScore = score
        bestMetric = metric.name
      }
    })

    return {
      metrics,
      summary: {
        averageScore: metrics.length > 0 ? totalScore / metrics.length : 0,
        worstMetric,
        bestMetric,
      },
      timestamp: Date.now(),
      sessionId: sessionId || 'all',
    }
  }
}

/**
 * Remote API storage implementation
 */
export class RemotePerformanceStorage implements PerformanceStorage {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey?: string,
  ) {}

  async save(metric: ExtendedMetric): Promise<void> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey
      }

      await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(metric),
      })
    } catch (error) {
      console.error('[Web Vitals] Failed to send metric to API:', error)
    }
  }

  async getAll(): Promise<ExtendedMetric[]> {
    try {
      const headers: HeadersInit = {}

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey
      }

      const response = await fetch(this.apiUrl, { headers })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('[Web Vitals] Failed to fetch metrics from API:', error)
      return []
    }
  }

  async clear(): Promise<void> {
    // Not implemented for remote storage
    console.warn('[Web Vitals] Clear not implemented for remote storage')
  }

  async getReport(sessionId?: string): Promise<PerformanceReport> {
    const metrics = await this.getAll()

    // Filter by session if provided
    const filteredMetrics = sessionId
      ? metrics.filter((m) => m.id.includes(sessionId))
      : metrics

    // Calculate summary
    const summary = this.calculateSummary(filteredMetrics)

    return {
      metrics: filteredMetrics,
      summary,
      timestamp: Date.now(),
      sessionId: sessionId || 'all',
    }
  }

  private calculateSummary(metrics: ExtendedMetric[]) {
    let totalScore = 0
    let worstMetric: ExtendedMetric['name'] | null = null
    let worstScore = 100
    let bestMetric: ExtendedMetric['name'] | null = null
    let bestScore = 0

    metrics.forEach((metric) => {
      const score =
        metric.rating === 'good'
          ? 100
          : metric.rating === 'needs-improvement'
            ? 50
            : 0

      totalScore += score

      if (score < worstScore) {
        worstScore = score
        worstMetric = metric.name
      }

      if (score > bestScore) {
        bestScore = score
        bestMetric = metric.name
      }
    })

    return {
      averageScore: metrics.length > 0 ? totalScore / metrics.length : 0,
      worstMetric,
      bestMetric,
    }
  }
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enabled: boolean
  /** Enable debug logging */
  debug: boolean
  /** Storage implementation */
  storage: PerformanceStorage
  /** Sample rate (0-1) */
  sampleRate: number
  /** Report to console */
  logToConsole: boolean
  /** Custom reporter function */
  onReport?: (metric: ExtendedMetric) => void
}

/**
 * Default configuration
 */
export const defaultPerformanceConfig: PerformanceConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  storage: new LocalPerformanceStorage(),
  sampleRate: 1,
  logToConsole: process.env.NODE_ENV === 'development',
  onReport: undefined,
}
