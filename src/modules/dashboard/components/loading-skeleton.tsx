/**
 * Dashboard Loading Skeleton Components
 * Reusable skeleton loaders for dashboard components
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Metric card skeleton loader
 */
export function MetricCardSkeleton() {
  return (
    <Card className="@container/card border border-gray-100 bg-gray-50">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32" />
        <div className="absolute right-4 top-4">
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  )
}

/**
 * Chart area skeleton loader
 */
export function ChartAreaSkeleton() {
  return (
    <Card className="@container/card border border-gray-100 bg-gray-50">
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
        <div className="absolute right-4 top-4">
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="relative">
          {/* Chart area skeleton */}
          <Skeleton className="h-[250px] w-full rounded" />

          {/* Fake chart lines */}
          <div className="absolute inset-0 flex items-end p-4">
            <div className="flex gap-2 w-full">
              {[40, 65, 45, 70, 55, 80, 60, 75, 50, 85].map((height, i) => (
                <div key={i} className="flex-1">
                  <Skeleton
                    className="w-full"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Financial metric skeleton loader
 */
export function FinancialMetricSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/**
 * Data table skeleton loader
 */
export function DataTableSkeleton() {
  return (
    <Card className="border border-gray-100 bg-gray-50">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 pb-2 border-b">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>

          {/* Table rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Complete dashboard skeleton loader
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Period selector skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      {/* Metrics grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Chart skeleton */}
      <ChartAreaSkeleton />

      {/* Financial metrics skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FinancialMetricSkeleton />
          <FinancialMetricSkeleton />
          <FinancialMetricSkeleton />
          <FinancialMetricSkeleton />
          <FinancialMetricSkeleton />
          <FinancialMetricSkeleton />
        </div>
      </div>

      {/* Table skeleton */}
      <DataTableSkeleton />
    </div>
  )
}

/**
 * Sidebar skeleton loader
 */
export function SidebarSkeleton() {
  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200">
      <div className="p-4 space-y-6">
        {/* Logo */}
        <Skeleton className="h-8 w-32" />

        {/* Navigation sections */}
        {[...Array(3)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
            <Skeleton className="h-3 w-20 mb-2" />
            {[...Array(4)].map((_, itemIndex) => (
              <Skeleton key={itemIndex} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ))}

        {/* User section at bottom */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

/**
 * Header skeleton loader
 */
export function HeaderSkeleton() {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    </header>
  )
}

/**
 * Full page skeleton loader
 */
export function PageSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarSkeleton />
      <div className="flex-1 flex flex-col">
        <HeaderSkeleton />
        <main className="flex-1 overflow-auto p-6">
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  )
}

/**
 * Loading state with animated pulse
 */
export function LoadingState({
  text = 'Carregando...',
  showSpinner = true,
}: {
  text?: string
  showSpinner?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      {showSpinner && (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      )}
      <p className="text-muted-foreground animate-pulse">{text}</p>
    </div>
  )
}
