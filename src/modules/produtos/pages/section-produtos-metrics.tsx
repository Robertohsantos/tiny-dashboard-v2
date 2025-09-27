import { Card, CardContent } from '@/components/ui/card'
import { MetricItem } from '@/modules/dashboard/components/metric-item'
import { ProductMetricItem } from '@/modules/dashboard/components/product-metric-item'
import type { ProdutoMetrics } from '@/modules/produtos/types/produtos.types'

interface SectionProdutosMetricsProps {
  metrics: ProdutoMetrics
}

/**
 * Product metrics section
 * Displays primary product KPIs in a horizontal layout
 * Following the same pattern as SectionMetrics from dashboard-vendas
 */
export function SectionProdutosMetrics({
  metrics,
}: SectionProdutosMetricsProps) {
  return (
    <Card className="w-full border border-gray-100 hover:shadow-md transition-shadow bg-gray-50 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x">
          <MetricItem
            title="Total em Estoque"
            metric={metrics.totalEstoque}
            valueColor="default"
            showPercentage={true}
          />
          <MetricItem
            title="Venda Total Estoque"
            metric={metrics.vendaTotalEstoque}
            valueColor="green"
            showPercentage={true}
          />
          <ProductMetricItem
            title="Markup Médio"
            metric={metrics.markupMedio}
            valueColor={metrics.markupMedio.trend === 'up' ? 'green' : 'red'}
            showPercentage={true}
          />
          <ProductMetricItem
            title="Produtos em Falta"
            metric={metrics.produtosEmFalta}
            valueColor="red"
            showPercentage={true}
          />
          <MetricItem
            title="Necessidade de Compra"
            metric={metrics.necessidadeCompra}
            valueColor="default"
            showPercentage={true}
          />
        </div>
      </CardContent>
    </Card>
  )
}
