/**
 * MetricsGrid Component
 * A reusable grid component for displaying metric cards
 * Follows composition pattern for flexibility
 */

import * as React from 'react'
import { cn } from '@/modules/ui'
import { MetricCard, type MetricCardProps } from './metric-card'

/**
 * Props for MetricsGrid component
 */
interface MetricsGridProps {
  /** Child components to render in the grid */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** Number of columns for different breakpoints */
  columns?: {
    /** Columns on mobile devices */
    mobile?: number
    /** Columns on tablet devices */
    tablet?: number
    /** Columns on desktop devices */
    desktop?: number
  }
}

/**
 * Grid container for metrics
 * Provides responsive layout for metric cards
 */
export function MetricsGrid({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 4 },
}: MetricsGridProps) {
  // Use object-based class mapping for Tailwind to detect all possible classes
  const gridClasses = cn(
    'grid gap-4',
    // Mobile columns
    {
      'grid-cols-1': columns.mobile === 1,
      'grid-cols-2': columns.mobile === 2,
      'grid-cols-3': columns.mobile === 3,
      'grid-cols-4': columns.mobile === 4,
    },
    // Tablet columns
    {
      'md:grid-cols-1': columns.tablet === 1,
      'md:grid-cols-2': columns.tablet === 2,
      'md:grid-cols-3': columns.tablet === 3,
      'md:grid-cols-4': columns.tablet === 4,
      'md:grid-cols-5': columns.tablet === 5,
      'md:grid-cols-6': columns.tablet === 6,
    },
    // Desktop columns
    {
      'lg:grid-cols-1': columns.desktop === 1,
      'lg:grid-cols-2': columns.desktop === 2,
      'lg:grid-cols-3': columns.desktop === 3,
      'lg:grid-cols-4': columns.desktop === 4,
      'lg:grid-cols-5': columns.desktop === 5,
      'lg:grid-cols-6': columns.desktop === 6,
    },
    className,
  )

  return <div className={gridClasses}>{children}</div>
}

/**
 * Props for MetricsGrid.Item component
 */
interface MetricsGridItemProps extends MetricCardProps {
  /** Additional CSS classes */
  className?: string
}

/**
 * Individual metric item for the grid
 * Wraps MetricCard with additional grid-specific behavior
 */
MetricsGrid.Item = function MetricsGridItem(props: MetricsGridItemProps) {
  return <MetricCard {...props} />
}

/**
 * Props for MetricsGrid.Title component
 */
interface MetricsGridTitleProps {
  /** Title text */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Title component for the metrics section
 */
MetricsGrid.Title = function MetricsGridTitle({
  children,
  className,
}: MetricsGridTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold mb-4', className)}>{children}</h3>
  )
}

/**
 * Props for MetricsGrid.Section component
 */
interface MetricsGridSectionProps {
  /** Section content */
  children: React.ReactNode
  /** Section title */
  title?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Section wrapper for grouped metrics
 * Provides consistent spacing and layout
 */
MetricsGrid.Section = function MetricsGridSection({
  children,
  title,
  className,
}: MetricsGridSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && <MetricsGrid.Title>{title}</MetricsGrid.Title>}
      {children}
    </div>
  )
}
