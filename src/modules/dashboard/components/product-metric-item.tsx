import { cn } from '@/modules/ui'
import type { ProdutoMetricDisplay } from '@/modules/produtos/types/produtos.types'

interface ProductMetricItemProps {
  title: string
  metric: ProdutoMetricDisplay
  valueColor?: 'default' | 'red' | 'green'
  className?: string
  showPercentage?: boolean
}

/**
 * Specialized metric item component for product metrics
 * Handles display values that are already formatted
 */
export function ProductMetricItem({
  title,
  metric,
  valueColor = 'default',
  className,
  showPercentage = true,
}: ProductMetricItemProps) {
  const valueColorClass =
    valueColor === 'red'
      ? 'text-red-600'
      : valueColor === 'green'
        ? 'text-green-600'
        : 'text-foreground'

  return (
    <div
      className={cn('flex flex-1 flex-col space-y-2 p-4 min-w-0', className)}
    >
      <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {title}
      </div>
      <div className={cn('text-xl font-bold tabular-nums', valueColorClass)}>
        {metric.displayValue}
      </div>
      {showPercentage && metric.subtext && (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {metric.subtext}
        </div>
      )}
    </div>
  )
}
