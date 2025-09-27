/**
 * Filter Counter Component
 * Displays active filter count with badge
 * Follows Single Responsibility Principle
 */

'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Filter } from 'lucide-react'
import { cn } from '@/modules/ui'

interface FilterCounterProps {
  /** Number of active filters */
  count: number
  /** Whether to show the filter icon */
  showIcon?: boolean
  /** Additional CSS classes */
  className?: string
  /** Badge variant */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

/**
 * Memoized component for displaying filter count
 * Prevents unnecessary re-renders when count hasn't changed
 */
export const FilterCounter = React.memo(function FilterCounter({
  count,
  showIcon = true,
  className,
  variant = 'secondary',
}: FilterCounterProps) {
  // Don't render if no filters are active
  if (count === 0) {
    return null
  }

  const text = `${count} ${count === 1 ? 'filtro' : 'filtros'}`

  return (
    <Badge
      variant={variant}
      className={cn('h-6', className)}
      aria-label={`${count} filtros ativos`}
    >
      {showIcon && <Filter className="h-3 w-3 mr-1" aria-hidden="true" />}
      {text}
    </Badge>
  )
})

FilterCounter.displayName = 'FilterCounter'
