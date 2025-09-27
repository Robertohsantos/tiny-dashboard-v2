/**
 * StockCoverageBadge Component
 * Displays the stock coverage period in days with appropriate visual indicators
 * Follows single responsibility principle - only handles coverage period display
 */

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/modules/ui'

export interface StockCoverageBadgeProps {
  /** Number of days of stock coverage */
  days: number
  /** Current stock level (to check if out of stock) */
  currentStock: number
  /** Threshold configuration for badge variants */
  thresholds?: {
    /** Days <= this value show critical status (default: 7) */
    critical?: number
    /** Days <= this value show warning status (default: 15) */
    warning?: number
    /** Days > this value show info status (default: 90) */
    excess?: number
  }
  /** Additional CSS classes */
  className?: string
}

/**
 * Determines the badge configuration based on coverage days and stock
 */
function getCoverageConfig(
  days: number,
  currentStock: number,
  thresholds: { critical: number; warning: number; excess: number },
) {
  // Out of stock - special case
  if (currentStock === 0) {
    return {
      variant: 'destructive' as const,
      textColor: '',
      label: 'Sem estoque',
    }
  }

  // Critical coverage period
  if (days <= thresholds.critical) {
    return {
      variant: 'destructive' as const,
      textColor: '',
      label: `${days} dias`,
    }
  }

  // Warning coverage period
  if (days <= thresholds.warning) {
    return {
      variant: 'secondary' as const,
      textColor: 'text-orange-600',
      label: `${days} dias`,
    }
  }

  // Excess coverage period
  if (days > thresholds.excess) {
    return {
      variant: 'default' as const,
      textColor: 'text-blue-600',
      label: `${days} dias`,
    }
  }

  // Normal coverage period
  return {
    variant: 'default' as const,
    textColor: '',
    label: `${days} dias`,
  }
}

/**
 * A reusable badge component for displaying stock coverage periods
 * Automatically determines styling based on coverage days and thresholds
 */
export const StockCoverageBadge = React.memo(function StockCoverageBadge({
  days,
  currentStock,
  thresholds = { critical: 7, warning: 15, excess: 90 },
  className,
}: StockCoverageBadgeProps) {
  const { variant, textColor, label } = getCoverageConfig(days, currentStock, {
    critical: thresholds.critical || 7,
    warning: thresholds.warning || 15,
    excess: thresholds.excess || 90,
  })

  return (
    <Badge
      variant={variant}
      className={cn('font-mono text-xs', textColor, className)}
    >
      {label}
    </Badge>
  )
})

StockCoverageBadge.displayName = 'StockCoverageBadge'
