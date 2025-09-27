/**
 * Custom Metrics Hook
 * Track and report custom performance metrics
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePerformance } from '@/modules/core/providers/performance-provider'
import type { Metric } from 'web-vitals'

/**
 * Custom metric options
 */
interface CustomMetricOptions {
  /** Metric name */
  name: string
  /** Good threshold */
  goodThreshold?: number
  /** Needs improvement threshold */
  needsImprovementThreshold?: number
  /** Unit of measurement */
  unit?: 'ms' | 's' | 'bytes' | 'count' | 'percentage'
  /** Whether to report immediately */
  immediate?: boolean
}

/**
 * Hook for measuring custom performance metrics
 */
export function useCustomMetric(options: CustomMetricOptions) {
  const { config } = usePerformance()
  const startTime = useRef<number | null>(null)
  const measurements = useRef<number[]>([])

  /**
   * Start measuring
   */
  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  /**
   * End measuring and report
   */
  const end = useCallback(() => {
    if (startTime.current === null) {
      console.warn(
        `[Custom Metric] ${options.name}: start() must be called before end()`,
      )
      return null
    }

    const duration = performance.now() - startTime.current
    startTime.current = null

    measurements.current.push(duration)

    // Create custom metric
    const metric: Metric = {
      name: options.name as any,
      value: duration,
      rating: 'good', // Will be calculated by enhanceMetric
      delta: duration,
      id: `${options.name}-${Date.now()}`,
      entries: [],
      navigationType: 'navigate',
    }

    // Report if immediate or storage is configured
    if (options.immediate && config.onReport) {
      config.onReport(metric as any)
    }

    return duration
  }, [options, config])

  /**
   * Measure a function execution
   */
  const measure = useCallback(
    async <T>(fn: () => T | Promise<T>): Promise<T> => {
      start()
      try {
        const result = await fn()
        end()
        return result
      } catch (error) {
        end()
        throw error
      }
    },
    [start, end],
  )

  /**
   * Get statistics
   */
  const getStats = useCallback(() => {
    const values = measurements.current

    if (values.length === 0) {
      return null
    }

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return {
      count: values.length,
      average: avg,
      median,
      min: Math.min(...values),
      max: Math.max(...values),
      p95,
      p99,
      sum,
    }
  }, [])

  /**
   * Clear measurements
   */
  const clear = useCallback(() => {
    measurements.current = []
    startTime.current = null
  }, [])

  return {
    start,
    end,
    measure,
    getStats,
    clear,
    measurements: measurements.current,
  }
}

/**
 * Hook for measuring component render performance
 */
export function useRenderMetrics(componentName: string) {
  const renderCount = useRef(0)
  const renderTimes = useRef<number[]>([])
  const lastRenderTime = useRef<number>(0)

  useEffect(() => {
    const renderTime = performance.now()

    if (lastRenderTime.current > 0) {
      const duration = renderTime - lastRenderTime.current
      renderTimes.current.push(duration)
    }

    lastRenderTime.current = renderTime
    renderCount.current++

    // Log excessive re-renders in development
    if (process.env.NODE_ENV === 'development') {
      if (renderCount.current > 10) {
        console.warn(
          `[Render Metrics] ${componentName}: Excessive re-renders detected (${renderCount.current} renders)`,
        )
      }
    }
  })

  return {
    renderCount: renderCount.current,
    averageRenderTime:
      renderTimes.current.length > 0
        ? renderTimes.current.reduce((a, b) => a + b, 0) /
          renderTimes.current.length
        : 0,
    lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
  }
}

/**
 * Hook for measuring API call performance
 */
export function useApiMetrics() {
  const metrics = useCustomMetric({
    name: 'api-call',
    goodThreshold: 1000,
    needsImprovementThreshold: 3000,
    unit: 'ms',
  })

  /**
   * Fetch with performance tracking
   */
  const trackedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      return metrics.measure(async () => {
        const response = await fetch(input, init)

        // Log slow API calls
        const stats = metrics.getStats()
        if (stats && stats.average > 3000) {
          console.warn('[API Metrics] Slow API detected:', {
            url: typeof input === 'string' ? input : input.toString(),
            averageTime: stats.average,
            callCount: stats.count,
          })
        }

        return response
      })
    },
    [metrics],
  )

  return {
    fetch: trackedFetch,
    stats: metrics.getStats,
    clear: metrics.clear,
  }
}

/**
 * Hook for measuring data processing performance
 */
export function useProcessingMetrics(processName: string) {
  const metrics = useCustomMetric({
    name: `processing-${processName}`,
    unit: 'ms',
    immediate: true,
  })

  return metrics
}

/**
 * Hook for measuring memory usage
 */
export function useMemoryMetrics() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null>(null)

  useEffect(() => {
    if (!('memory' in performance)) {
      return
    }

    const updateMemory = () => {
      const memory = (performance as any).memory
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      })
    }

    updateMemory()
    const interval = setInterval(updateMemory, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    memory: memoryInfo,
    heapUsagePercentage: memoryInfo
      ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      : null,
  }
}

/**
 * Hook for frame rate monitoring
 */
export function useFrameRate() {
  const [fps, setFps] = useState<number | null>(null)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useEffect(() => {
    let animationId: number

    const measureFps = () => {
      frameCount.current++
      const currentTime = performance.now()

      // Calculate FPS every second
      if (currentTime - lastTime.current >= 1000) {
        setFps(frameCount.current)
        frameCount.current = 0
        lastTime.current = currentTime
      }

      animationId = requestAnimationFrame(measureFps)
    }

    animationId = requestAnimationFrame(measureFps)

    return () => cancelAnimationFrame(animationId)
  }, [])

  return {
    fps,
    isSmooth: fps !== null && fps >= 55,
    isJanky: fps !== null && fps < 30,
  }
}
