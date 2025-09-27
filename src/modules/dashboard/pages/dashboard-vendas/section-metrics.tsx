import { Card, CardContent } from '@/components/ui/card'
import { MetricItem } from '@/modules/dashboard/components/metric-item'
import type { DashboardFinancialMetrics } from '@/modules/dashboard/data/data-fetchers'

interface SectionMetricsProps {
  metrics: DashboardFinancialMetrics
}

export function SectionMetrics({ metrics }: SectionMetricsProps) {
  // Calculate percentages relative to sales without shipping
  const salesValue = metrics.salesWithoutShipping.value

  const calculatePercentage = (value: number) => {
    if (salesValue === 0) return 0
    return (value / salesValue) * 100
  }

  return (
    <Card className="w-full border border-gray-100 hover:shadow-md transition-shadow bg-gray-50 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x">
          <MetricItem
            title="Vendas sem Frete"
            metric={metrics.salesWithoutShipping}
          />
          <MetricItem
            title="Custo da Mercadoria (CMV)"
            metric={metrics.costOfGoods}
            valueColor="red"
            percentageOfRevenue={calculatePercentage(metrics.costOfGoods.value)}
          />
          <MetricItem
            title="Impostos"
            metric={metrics.taxes}
            valueColor="red"
            percentageOfRevenue={calculatePercentage(metrics.taxes.value)}
          />
          <MetricItem
            title="Taxas de Marketplaces"
            metric={metrics.marketplaceFees}
            valueColor="red"
            percentageOfRevenue={calculatePercentage(
              metrics.marketplaceFees.value,
            )}
          />
          <MetricItem
            title="Lucro Bruto"
            metric={metrics.grossProfit}
            valueColor="green"
            percentageOfRevenue={calculatePercentage(metrics.grossProfit.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
