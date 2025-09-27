/**
 * Dashboard Content Component with React Query
 * Optimized version using caching and parallel queries
 */

'use client'

import * as React from 'react'
import { ChartAreaInteractive } from './chart-area-interactive'
import { SectionCards } from './section-cards'
import { SectionMetrics } from './section-metrics'
import { ShippingDifferenceMetric } from './shipping-difference-metric'
import { PeriodFilterSimple } from './period-filter-simple'
import { MarketplaceFilter } from './marketplace-filter'
import { LoadingSkeleton } from '@/modules/dashboard/components/loading-skeleton-legacy'
import { DashboardErrorBoundary } from '@/modules/dashboard/components/dashboard-error-boundary'
import { usePeriod } from './period-context'
import { useMarketplace } from './marketplace-context'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  useDashboardData,
  usePrefetchDashboardData,
  useAdjacentPeriod,
} from '@/modules/dashboard/hooks/data/use-dashboard-data-switch'
import type { DashboardData } from '@/modules/dashboard/data/data-fetchers'

interface DashboardContentV2Props {
  /** Initial data for SSR (optional with React Query) */
  initialData?: DashboardData
}

/**
 * Optimized Dashboard Content using React Query
 * Features:
 * - Automatic caching and background refetching
 * - Parallel data fetching
 * - Prefetching of adjacent periods
 * - Optimistic updates
 * - Smart error recovery
 */
export function DashboardContentV2({ initialData }: DashboardContentV2Props) {
  const { periodType, startDate, endDate, setPeriod } = usePeriod()
  const { marketplaceId, setMarketplaceId } = useMarketplace()

  // Create period filter object (memoized for stable reference)
  const periodFilter = React.useMemo(
    () => ({ startDate, endDate, marketplaceId }),
    [startDate, endDate, marketplaceId],
  )

  // Fetch all dashboard data in parallel using React Query
  const { data, isLoading, isError, isFetching, errors, queries } =
    useDashboardData(periodFilter, (errors) => {
      console.error('Validation errors:', errors)
    })

  // Calculate adjacent periods for prefetching
  const nextPeriod = useAdjacentPeriod(periodFilter, 'next')
  const previousPeriod = useAdjacentPeriod(periodFilter, 'previous')

  // Prefetch adjacent periods for smooth navigation
  usePrefetchDashboardData(periodFilter, nextPeriod)
  usePrefetchDashboardData(periodFilter, previousPeriod)

  // Use initial data as fallback during first load
  const displayData = React.useMemo(
    () => data || initialData,
    [data, initialData],
  )

  // Handle refetch manually if needed - memoized to prevent recreation
  const handleRefresh = React.useCallback(() => {
    // Refetch all queries
    queries.metrics.refetch()
    queries.financial.refetch()
    queries.chart.refetch()
    queries.shipping.refetch()
  }, [queries.metrics, queries.financial, queries.chart, queries.shipping])

  // Show loading state
  if (isLoading && !displayData) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Carregando dados do dashboard...
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  // Show error state with retry option
  if (isError && !displayData) {
    const errorMessage =
      errors[0]?.message || 'Erro ao carregar dados do dashboard'

    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ops! Algo deu errado
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Main render with data
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
            {isFetching && (
              <span className="ml-2 inline-flex items-center">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back to your analytics dashboard
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <PeriodFilterSimple value={periodType} onPeriodChange={setPeriod} />

            <MarketplaceFilter
              value={marketplaceId}
              onMarketplaceChange={setMarketplaceId}
            />
          </div>

          {/* Manual refresh button (optional) */}
          {!isFetching && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
      </div>

      {/* Show stale error inline if data exists but query failed */}
      {isError && displayData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Usando dados em cache. Não foi possível atualizar os dados.
          </AlertDescription>
        </Alert>
      )}

      {displayData ? (
        <DashboardErrorBoundary>
          <SectionCards metrics={displayData.metrics} />
          <ChartAreaInteractive
            data={displayData.chartData}
            periodType={periodType}
          />
          <SectionMetrics metrics={displayData.financialMetrics} />
          <ShippingDifferenceMetric data={displayData.shippingDifference} />
        </DashboardErrorBoundary>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum dado disponível para o período selecionado
        </div>
      )}
    </div>
  )
}
