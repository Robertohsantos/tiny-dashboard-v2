import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { ShippingDifferenceData } from '@/modules/dashboard/data/data-fetchers'

interface ShippingDifferenceMetricProps {
  data: ShippingDifferenceData
}

export function ShippingDifferenceMetric({
  data,
}: ShippingDifferenceMetricProps) {
  const Icon =
    data.trend === 'positive'
      ? ArrowUpIcon
      : data.trend === 'negative'
        ? ArrowDownIcon
        : MinusIcon

  const iconColor =
    data.trend === 'positive'
      ? 'text-green-600'
      : data.trend === 'negative'
        ? 'text-red-600'
        : 'text-gray-500'

  const valueColor =
    data.trend === 'positive'
      ? 'text-green-600'
      : data.trend === 'negative'
        ? 'text-red-600'
        : 'text-foreground'

  return (
    <Card className="w-full border border-gray-100 hover:shadow-md transition-shadow bg-gray-50">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 p-3">
          <span className="text-sm font-medium text-muted-foreground">
            Diferença de Frete
          </span>
          <span className={`text-lg font-bold tabular-nums ${valueColor}`}>
            {data.value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-xs text-muted-foreground">
            {data.description}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
