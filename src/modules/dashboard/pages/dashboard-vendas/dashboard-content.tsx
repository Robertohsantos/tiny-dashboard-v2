'use client'

import * as React from 'react'
import { ChartAreaInteractive } from './chart-area-interactive'
import { SectionCards } from './section-cards'
import { SectionMetrics } from './section-metrics'
import { ShippingDifferenceMetric } from './shipping-difference-metric'
import { PeriodFilterSimple } from './period-filter-simple'
import { DashboardLoadingSkeleton } from './dashboard-loading'
import {
  DashboardErrorBoundary,
  useDashboardErrorHandler,
} from '@/modules/dashboard/components/dashboard-error-boundary'
import { usePeriod } from './period-context'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getChartData,
  getDashboardMetrics,
  getFinancialMetrics,
  getShippingDifference,
  type DashboardData,
} from '@/modules/dashboard/data/data-fetchers'

interface DashboardContentProps {
  initialData: DashboardData
}

export function DashboardContent({ initialData }: DashboardContentProps) {
  const { periodType, startDate, endDate, setPeriod, isLoading, setIsLoading } =
    usePeriod()
  const { error, handleError, clearError } = useDashboardErrorHandler()

  const [data, setData] = React.useState<DashboardData>(initialData)

  // Update data when period changes
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      clearError()

      try {
        const period = { startDate, endDate }
        const [chartData, metrics, financialMetrics, shippingDifference] =
          await Promise.all([
            getChartData(period),
            getDashboardMetrics(period),
            getFinancialMetrics(period),
            getShippingDifference(period),
          ])

        setData({
          chartData,
          metrics,
          financialMetrics,
          shippingDifference,
        })
      } catch (error) {
        handleError(
          error instanceof Error
            ? error
            : new Error('Failed to fetch dashboard data'),
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, setIsLoading, handleError, clearError])

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back to your analytics dashboard
          </p>
        </div>

        <div className="flex justify-between items-center">
          <PeriodFilterSimple value={periodType} onPeriodChange={setPeriod} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados do dashboard. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <DashboardLoadingSkeleton />
      ) : (
        <DashboardErrorBoundary>
          <SectionCards metrics={data.metrics} />
          <ChartAreaInteractive data={data.chartData} periodType={periodType} />
          <SectionMetrics metrics={data.financialMetrics} />
          <ShippingDifferenceMetric data={data.shippingDifference} />
        </DashboardErrorBoundary>
      )}
    </div>
  )
}
