/**
 * Validation Telemetry System
 * Tracks validation errors, success rates, and performance metrics
 * Integrates with existing telemetry service for comprehensive monitoring
 */

import * as React from 'react'
import { ValidationError } from '@/modules/core/utils/validation'
import { FEATURE_FLAGS } from '@/modules/core/utils/feature-flags'

type TelemetryService = {
  recordEvent: (eventName: string, payload: Record<string, unknown>) => void
  recordMetric: (metricName: string, payload: Record<string, unknown>) => void
}

let telemetry: TelemetryService | null = null
if (typeof window === 'undefined') {
  const telemetryModule = await import('@/modules/core/services/telemetry')
  telemetry = telemetryModule.telemetry as unknown as TelemetryService
}

/**
 * Validation metrics structure
 */
export interface ValidationErrorRecord {
  context: string
  errorCount: number
  errorTypes: string[]
  timestamp: number
  rawData?: unknown
}

/**
 * Validation performance record
 */
interface ValidationPerformance {
  context: string
  duration: number
  dataSize: number
  timestamp: number
}

interface ValidationMetrics {
  validationErrors: number
  validationSuccess: number
  fallbackUsed: number
  averageValidationTime: number
  totalValidationTime: number
  errorsByContext: Map<string, number>
  errorsByType: Map<string, number>
  lastErrors: ValidationErrorRecord[]
}

export interface ValidationTelemetryReport {
  validationErrors: number
  validationSuccess: number
  fallbackUsed: number
  totalValidations: number
  errorRate: number
  fallbackRate: number
  successRate: number
  averageValidationTime: number
  p50ValidationTime: number
  p95ValidationTime: number
  p99ValidationTime: number
  topErrorContexts: Array<[string, number]>
  topErrorTypes: Array<[string, number]>
  recentErrors: ValidationErrorRecord[]
  health: 'healthy' | 'warning' | 'critical'
  rollbackTriggered: boolean
}

/**
 * Validation Telemetry class for monitoring validation health
 */
export class ValidationTelemetry {
  private static metrics: ValidationMetrics = {
    validationErrors: 0,
    validationSuccess: 0,
    fallbackUsed: 0,
    averageValidationTime: 0,
    totalValidationTime: 0,
    errorsByContext: new Map(),
    errorsByType: new Map(),
    lastErrors: [],
  }

  private static performanceBuffer: ValidationPerformance[] = []
  private static readonly MAX_ERROR_HISTORY = 100
  private static readonly MAX_PERFORMANCE_BUFFER = 1000
  private static rollbackTriggered = false

  /**
   * Track a validation error
   * @param error - The validation error that occurred
   * @param context - Context where the error occurred (e.g., component name)
   */
  static trackValidationError(error: ValidationError, context: string): void {
    if (!FEATURE_FLAGS.VALIDATION_MONITORING) return

    this.metrics.validationErrors++

    // Update error counts by context
    const currentContextErrors = this.metrics.errorsByContext.get(context) || 0
    this.metrics.errorsByContext.set(context, currentContextErrors + 1)

    // Update error counts by type
    error.errors.forEach((err) => {
      const currentTypeErrors = this.metrics.errorsByType.get(err.code) || 0
      this.metrics.errorsByType.set(err.code, currentTypeErrors + 1)
    })

    // Add to error history
    const errorRecord: ValidationErrorRecord = {
      context,
      errorCount: error.errors.length,
      errorTypes: error.errors.map((e) => e.code),
      timestamp: Date.now(),
      rawData: FEATURE_FLAGS.VALIDATION_DEBUG ? error.rawData : undefined,
    }

    this.metrics.lastErrors.unshift(errorRecord)
    if (this.metrics.lastErrors.length > this.MAX_ERROR_HISTORY) {
      this.metrics.lastErrors.pop()
    }

    // Record in telemetry service (server-side only)
    if (telemetry) {
      telemetry.recordEvent('validation.error', {
        context,
        errorCount: error.errors.length,
        errorTypes: error.errors.map((e) => e.code),
        timestamp: Date.now(),
      })
    }

    // Log to console in debug mode
    if (FEATURE_FLAGS.VALIDATION_DEBUG) {
      console.error(`[ValidationTelemetry] Error in ${context}:`, {
        errors: error.errors,
        rawData: error.rawData,
      })
    }

    // Check for auto-rollback
    this.checkAutoRollback()

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(error, context)
    }
  }

  /**
   * Track a successful validation
   * @param context - Context where the validation succeeded
   * @param duration - Time taken for validation in milliseconds
   * @param dataSize - Size of validated data (optional)
   */
  static trackValidationSuccess(
    context: string,
    duration: number,
    dataSize?: number,
  ): void {
    if (!FEATURE_FLAGS.VALIDATION_MONITORING) return

    this.metrics.validationSuccess++
    this.metrics.totalValidationTime += duration
    this.updateAverageTime(duration)

    // Add to performance buffer
    const perfRecord: ValidationPerformance = {
      context,
      duration,
      dataSize: dataSize || 0,
      timestamp: Date.now(),
    }

    this.performanceBuffer.push(perfRecord)
    if (this.performanceBuffer.length > this.MAX_PERFORMANCE_BUFFER) {
      this.performanceBuffer.shift()
    }

    // Record in telemetry service (server-side only)
    if (telemetry) {
      telemetry.recordMetric('validation.success', {
        context,
        duration,
        dataSize,
        timestamp: Date.now(),
      })
    }

    // Log slow validations
    if (duration > 100 && FEATURE_FLAGS.VALIDATION_DEBUG) {
      console.warn(
        `[ValidationTelemetry] Slow validation in ${context}: ${duration}ms`,
      )
    }
  }

  /**
   * Track fallback data usage
   * @param context - Context where fallback was used
   * @param reason - Reason for using fallback
   */
  static trackFallbackUsage(context: string, reason?: string): void {
    if (!FEATURE_FLAGS.VALIDATION_MONITORING) return

    this.metrics.fallbackUsed++

    // Record in telemetry service (server-side only)
    if (telemetry) {
      telemetry.recordEvent('validation.fallback', {
        context,
        reason,
        timestamp: Date.now(),
      })
    }

    if (FEATURE_FLAGS.VALIDATION_DEBUG) {
      console.info(
        `[ValidationTelemetry] Fallback used in ${context}: ${reason || 'validation failed'}`,
      )
    }
  }

  /**
   * Get current validation report
   * @returns Comprehensive validation metrics report
   */
  static getReport(): ValidationTelemetryReport {
    const total = this.metrics.validationSuccess + this.metrics.validationErrors
    const errorRate = total > 0 ? this.metrics.validationErrors / total : 0
    const fallbackRate = total > 0 ? this.metrics.fallbackUsed / total : 0

    // Calculate performance percentiles
    const sortedPerf = [...this.performanceBuffer].sort(
      (a, b) => a.duration - b.duration,
    )
    const p50 = this.getPercentile(sortedPerf, 50)
    const p95 = this.getPercentile(sortedPerf, 95)
    const p99 = this.getPercentile(sortedPerf, 99)

    // Get top error contexts
    const topErrorContexts = Array.from(this.metrics.errorsByContext.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Get top error types
    const topErrorTypes = Array.from(this.metrics.errorsByType.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      // Basic metrics
      validationErrors: this.metrics.validationErrors,
      validationSuccess: this.metrics.validationSuccess,
      fallbackUsed: this.metrics.fallbackUsed,
      totalValidations: total,

      // Rates
      errorRate,
      fallbackRate,
      successRate: 1 - errorRate,

      // Performance
      averageValidationTime: this.metrics.averageValidationTime,
      p50ValidationTime: p50,
      p95ValidationTime: p95,
      p99ValidationTime: p99,

      // Error analysis
      topErrorContexts,
      topErrorTypes,
      recentErrors: this.metrics.lastErrors.slice(0, 10),

      // Health status
      health: this.getHealthStatus(
        errorRate,
        this.metrics.averageValidationTime,
      ),
      rollbackTriggered: this.rollbackTriggered,
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  static reset(): void {
    this.metrics = {
      validationErrors: 0,
      validationSuccess: 0,
      fallbackUsed: 0,
      averageValidationTime: 0,
      totalValidationTime: 0,
      errorsByContext: new Map(),
      errorsByType: new Map(),
      lastErrors: [],
    }
    this.performanceBuffer = []
    this.rollbackTriggered = false
  }

  /**
   * Export metrics for analysis
   * @returns JSON string of current metrics
   */
  static exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: {
          ...this.metrics,
          errorsByContext: Array.from(this.metrics.errorsByContext.entries()),
          errorsByType: Array.from(this.metrics.errorsByType.entries()),
        },
        performanceBuffer: this.performanceBuffer,
        report: this.getReport(),
        timestamp: Date.now(),
      },
      null,
      2,
    )
  }

  /**
   * Check if auto-rollback should be triggered
   */
  private static checkAutoRollback(): void {
    if (!FEATURE_FLAGS.AUTO_ROLLBACK_ENABLED || this.rollbackTriggered) return

    const total = this.metrics.validationSuccess + this.metrics.validationErrors
    if (total < 100) return // Need minimum sample size

    const errorRate = this.metrics.validationErrors / total

    if (errorRate > FEATURE_FLAGS.AUTO_ROLLBACK_THRESHOLD) {
      this.rollbackTriggered = true
      console.error(
        '[ValidationTelemetry] AUTO-ROLLBACK TRIGGERED! Error rate:',
        errorRate,
      )
      ;(FEATURE_FLAGS as any).USE_VALIDATED_HOOKS = false

      // Send alert
      this.sendRollbackAlert(errorRate)
    }
  }

  /**
   * Send error to monitoring service
   */
  private static sendToMonitoringService(
    error: ValidationError,
    context: string,
  ): void {
    // This would integrate with Sentry, DataDog, etc.
    fetch('/api/monitoring/validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'validation_error',
        context,
        error: {
          message: error.message,
          errors: error.errors,
          timestamp: Date.now(),
        },
        metrics: this.getReport(),
      }),
    }).catch((err) => {
      console.error(
        '[ValidationTelemetry] Failed to send to monitoring service:',
        err,
      )
    })
  }

  /**
   * Send rollback alert
   */
  private static sendRollbackAlert(errorRate: number): void {
    fetch('/api/monitoring/rollback-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'validation_rollback',
        errorRate,
        metrics: this.getReport(),
        timestamp: Date.now(),
      }),
    }).catch((err) => {
      console.error('[ValidationTelemetry] Failed to send rollback alert:', err)
    })
  }

  /**
   * Update average validation time
   */
  private static updateAverageTime(duration: number): void {
    const total = this.metrics.validationSuccess + this.metrics.validationErrors
    if (total === 0) {
      this.metrics.averageValidationTime = duration
    } else {
      this.metrics.averageValidationTime =
        (this.metrics.averageValidationTime * (total - 1) + duration) / total
    }
  }

  /**
   * Get percentile from sorted array
   */
  private static getPercentile(
    sorted: ValidationPerformance[],
    percentile: number,
  ): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]?.duration || 0
  }

  /**
   * Get health status based on metrics
   */
  private static getHealthStatus(
    errorRate: number,
    avgTime: number,
  ): 'healthy' | 'warning' | 'critical' {
    if (errorRate > 0.1 || avgTime > 200) return 'critical'
    if (errorRate > 0.05 || avgTime > 100) return 'warning'
    return 'healthy'
  }
}

/**
 * React hook for validation telemetry
 */
export function useValidationTelemetry() {
  const [report, setReport] = React.useState<ValidationTelemetryReport>(() =>
    ValidationTelemetry.getReport(),
  )

  React.useEffect(() => {
    const interval = setInterval(() => {
      setReport(ValidationTelemetry.getReport())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return report
}

// Note: HOC functionality removed from this file
// For React component wrapping, use the telemetry methods directly in components

// Export singleton instance for easy access
export const validationTelemetry = ValidationTelemetry
