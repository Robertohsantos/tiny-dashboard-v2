import { cn } from '@/modules/ui'
import React from 'react'

interface MetricGroupProps {
  children: React.ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4 | 5 | 6
}

export function MetricGroup({
  children,
  className,
  columns = 4,
}: MetricGroupProps) {
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  }[columns]

  return (
    <div className={cn('grid gap-4', gridColsClass, className)}>{children}</div>
  )
}
