import { MetricsGrid } from '@/modules/dashboard/components/metrics-grid'
import type { DashboardMetrics } from '@/modules/dashboard/types/dashboard.types'

interface SectionCardsProps {
  metrics: DashboardMetrics
}

/**
 * Sales metrics section
 * Displays primary sales KPIs in a grid layout
 */
export function SectionCards({ metrics }: SectionCardsProps) {
  return (
    <MetricsGrid>
      <MetricsGrid.Item
        title="Total de Vendas"
        value={metrics.totalSales.value}
        change={metrics.totalSales.change}
        trend={metrics.totalSales.trend}
        description={metrics.totalSales.description}
        subtext={metrics.totalSales.subtext}
        format="currency"
      />
      <MetricsGrid.Item
        title="Itens Vendidos"
        value={metrics.itemsSold.value}
        change={metrics.itemsSold.change}
        trend={metrics.itemsSold.trend}
        description={metrics.itemsSold.description}
        subtext={metrics.itemsSold.subtext}
        format="number"
      />
      <MetricsGrid.Item
        title="Pedidos"
        value={metrics.orders.value}
        change={metrics.orders.change}
        trend={metrics.orders.trend}
        description={metrics.orders.description}
        subtext={metrics.orders.subtext}
        format="number"
      />
      <MetricsGrid.Item
        title="Ticket Médio"
        value={metrics.averageTicket.value}
        change={metrics.averageTicket.change}
        trend={metrics.averageTicket.trend}
        description={metrics.averageTicket.description}
        subtext={metrics.averageTicket.subtext}
        format="currency"
      />
    </MetricsGrid>
  )
}
