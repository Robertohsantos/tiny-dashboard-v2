import { cn } from '@/modules/ui'
import type { MetricData } from '@/modules/dashboard/types/dashboard.types'

interface MetricItemProps {
  title: string
  metric: MetricData
  valueColor?: 'default' | 'red' | 'green'
  percentageOfRevenue?: number
  className?: string
  showPercentage?: boolean
}

export function MetricItem({
  title,
  metric,
  valueColor = 'default',
  percentageOfRevenue,
  className,
  showPercentage = true,
}: MetricItemProps) {
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
        {metric.value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      </div>
      {showPercentage && (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {percentageOfRevenue !== undefined
            ? `${percentageOfRevenue.toFixed(2).replace('.', ',')}% do faturamento`
            : metric.subtext}
        </div>
      )}
    </div>
  )
}
