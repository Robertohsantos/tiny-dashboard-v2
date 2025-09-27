/**
 * MarkupIndicator Component
 * Displays markup percentage with color-coded indication based on value ranges
 * Follows single responsibility principle - only handles markup display
 */

import * as React from 'react'
import { cn } from '@/modules/ui'
import { formatPercentage } from '@/modules/core/utils/formatters'

export interface MarkupIndicatorProps {
  /** Markup percentage value */
  value: number
  /** Threshold configuration for color coding */
  thresholds?: {
    /** Values >= this are shown in success color (default: 50) */
    high?: number
    /** Values >= this but < high are shown in info color (default: 30) */
    medium?: number
  }
  /** Whether to show as a badge or plain text */
  variant?: 'badge' | 'text'
  /** Number of decimal places (default: 1) */
  decimals?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Determines the color class based on markup value and thresholds
 */
function getMarkupColorClass(
  value: number,
  thresholds: { high: number; medium: number },
): string {
  if (value >= thresholds.high) {
    return 'text-green-600'
  }
  if (value >= thresholds.medium) {
    return 'text-blue-600'
  }
  return 'text-orange-600'
}

/**
 * A reusable component for displaying markup percentages with visual indication
 * Automatically color-codes based on configurable thresholds
 */
export const MarkupIndicator = React.memo(function MarkupIndicator({
  value,
  thresholds = { high: 50, medium: 30 },
  variant = 'text',
  decimals = 1,
  className,
}: MarkupIndicatorProps) {
  const colorClass = getMarkupColorClass(value, {
    high: thresholds.high || 50,
    medium: thresholds.medium || 30,
  })

  const formattedValue = formatPercentage(value, decimals)

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          'bg-gray-100 dark:bg-gray-800',
          colorClass,
          className,
        )}
      >
        {formattedValue}
      </span>
    )
  }

  return (
    <span
      className={cn('font-mono text-sm font-medium', colorClass, className)}
    >
      {formattedValue}
    </span>
  )
})

MarkupIndicator.displayName = 'MarkupIndicator'
