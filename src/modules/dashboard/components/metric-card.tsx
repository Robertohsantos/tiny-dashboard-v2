import * as React from 'react'
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/modules/ui'

export interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  description?: string
  subtext?: string
  format?: 'currency' | 'number'
  className?: string
  showBadge?: boolean
  badgeClassName?: string
}

function MetricCardBase({
  title,
  value,
  change = 0,
  trend = 'up',
  description,
  subtext,
  format = 'number',
  className,
  showBadge = true,
  badgeClassName,
}: MetricCardProps) {
  // Memoize formatted value to avoid recalculating on every render
  const formattedValue = React.useMemo(() => {
    if (format === 'currency') {
      return typeof value === 'number'
        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : value
    }
    return typeof value === 'number' ? value.toLocaleString('pt-BR') : value
  }, [value, format])

  // Memoize trend-related values
  const trendData = React.useMemo(() => {
    const TrendIcon = trend === 'up' ? TrendingUpIcon : TrendingDownIcon
    const trendColorClasses = {
      badge:
        trend === 'up'
          ? 'bg-success-50 text-success-600 hover:bg-success-100'
          : 'bg-danger-50 text-danger-600 hover:bg-danger-100',
      text: trend === 'up' ? 'text-success-600' : 'text-danger-600',
    }
    return { TrendIcon, trendColorClasses }
  }, [trend])

  const { TrendIcon, trendColorClasses } = trendData

  return (
    <Card
      className={cn(
        '@container/card border border-gray-100 hover:shadow-md transition-shadow bg-gray-50',
        className,
      )}
    >
      <CardHeader className="relative pb-2">
        <CardDescription className="text-muted-foreground text-sm font-medium">
          {title}
        </CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-bold tabular-nums text-foreground">
          {formattedValue}
        </CardTitle>
        {showBadge && change !== undefined && (
          <div className="absolute right-4 top-4">
            <Badge
              className={cn(
                'flex gap-0.5 rounded-md text-xs border-0 px-2 py-1',
                trendColorClasses.badge,
                badgeClassName,
              )}
            >
              <TrendIcon className="size-3" />
              {change > 0 ? '+' : ''}
              {change.toLocaleString('pt-BR')}%
            </Badge>
          </div>
        )}
      </CardHeader>
      {(description || subtext) && (
        <CardFooter className="flex-col items-start gap-1 text-sm pt-3">
          {description && (
            <div
              className={cn(
                'line-clamp-1 flex gap-1 font-medium',
                trendColorClasses.text,
              )}
            >
              {description} <TrendIcon className="size-4" />
            </div>
          )}
          {subtext && (
            <div className="text-muted-foreground text-xs">{subtext}</div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

/**
 * Memoized version of MetricCard
 * Only re-renders when props actually change
 */
export const MetricCard = React.memo(MetricCardBase)

// Also export as default for backward compatibility
export default MetricCard
