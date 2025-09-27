/**
 * Lazy-loaded Dashboard Page
 * Implements code-splitting and dynamic imports for better performance
 */

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { QueryProvider } from '@/modules/core/providers/query-provider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getChartData,
  getDashboardMetrics,
  getFinancialMetrics,
  getShippingDifference,
} from '@/modules/dashboard/data/data-fetchers'

// Dynamic imports with code-splitting
const AppSidebar = dynamic(
  () =>
    import('@/components/ui/app-sidebar').then((mod) => ({
      default: mod.AppSidebar,
    })),
  {
    loading: () => <SidebarSkeleton />,
    ssr: true, // Keep SSR for SEO
  },
)

const DashboardContentV2 = dynamic(
  () =>
    import('@/modules/dashboard/pages/dashboard-vendas/dashboard-content-v2').then(
      (mod) => ({
        default: mod.DashboardContentV2,
      }),
    ),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false, // Disable SSR for dashboard content
  },
)

const PeriodProvider = dynamic(
  () =>
    import('@/modules/dashboard/pages/dashboard-vendas/period-context').then(
      (mod) => ({
        default: mod.PeriodProvider,
      }),
    ),
  { ssr: true },
)

const SiteHeader = dynamic(
  () =>
    import('@/components/ui/site-header').then((mod) => ({
      default: mod.SiteHeader,
    })),
  {
    loading: () => <HeaderSkeleton />,
    ssr: true,
  },
)

const SidebarProvider = dynamic(
  () =>
    import('@/components/ui/sidebar').then((mod) => ({
      default: mod.SidebarProvider,
    })),
  { ssr: true },
)

const SidebarInset = dynamic(
  () =>
    import('@/components/ui/sidebar').then((mod) => ({
      default: mod.SidebarInset,
    })),
  { ssr: true },
)

/**
 * Sidebar skeleton loader
 */
function SidebarSkeleton() {
  return (
    <div className="w-64 h-screen bg-gray-50 border-r">
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

/**
 * Header skeleton loader
 */
function HeaderSkeleton() {
  return (
    <div className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Dashboard content skeleton loader
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Metrics grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-lg border">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white p-6 rounded-lg border">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>

      {/* Financial metrics skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-lg border">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Main loading skeleton for the entire page
 */
function PageSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarSkeleton />
      <div className="flex-1 flex flex-col">
        <HeaderSkeleton />
        <div className="flex-1 p-6">
          <DashboardSkeleton />
        </div>
      </div>
    </div>
  )
}

export default async function Page() {
  // Pre-fetch critical data for initial render
  const initialDataPromise = Promise.all([
    getChartData(),
    getDashboardMetrics(),
    getFinancialMetrics(),
    getShippingDifference(),
  ])

  return (
    <QueryProvider>
      <Suspense fallback={<PageSkeleton />}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col bg-gray-100">
              <div className="@container/main flex flex-1 flex-col p-6">
                <PeriodProvider initialPeriod="month">
                  <DashboardContentV2
                    initialData={await initialDataPromise.then(
                      ([
                        chartData,
                        metrics,
                        financialMetrics,
                        shippingDifference,
                      ]) => ({
                        chartData,
                        metrics,
                        financialMetrics,
                        shippingDifference,
                      }),
                    )}
                  />
                </PeriodProvider>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </Suspense>
    </QueryProvider>
  )
}
