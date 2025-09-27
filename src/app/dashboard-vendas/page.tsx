import { AppSidebar } from '@/components/ui/app-sidebar'
import { DashboardContentV2 } from '@/modules/dashboard/pages/dashboard-vendas/dashboard-content-v2'
import { PeriodProvider } from '@/modules/dashboard/pages/dashboard-vendas/period-context'
import { MarketplaceProvider } from '@/modules/dashboard/pages/dashboard-vendas/marketplace-context'
import { AppProviders } from '@/modules/core/providers/app-providers'
import { SiteHeader } from '@/components/ui/site-header'
import { SidebarInset } from '@/components/ui/sidebar'
import {
  getChartData,
  getDashboardMetrics,
  getFinancialMetrics,
  getShippingDifference,
} from '@/modules/dashboard/data/data-fetchers'
import { calculateDateRange } from '@/modules/dashboard/utils/period-utils'

export default async function Page() {
  // Calculate initial period (current month as default)
  const initialPeriod = calculateDateRange('month')

  // Fetch initial data for SSR with the correct period
  // This improves initial load performance and ensures correct data
  const [chartData, metrics, financialMetrics, shippingDifference] =
    await Promise.all([
      getChartData(initialPeriod),
      getDashboardMetrics(initialPeriod),
      getFinancialMetrics(initialPeriod),
      getShippingDifference(initialPeriod),
    ])

  return (
    <AppProviders>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col bg-gray-100">
          <div className="@container/main flex flex-1 flex-col p-6">
            <PeriodProvider initialPeriod="month">
              <MarketplaceProvider initialMarketplace="all">
                <DashboardContentV2
                  initialData={{
                    chartData,
                    metrics,
                    financialMetrics,
                    shippingDifference,
                  }}
                />
              </MarketplaceProvider>
            </PeriodProvider>
          </div>
        </div>
      </SidebarInset>
    </AppProviders>
  )
}
