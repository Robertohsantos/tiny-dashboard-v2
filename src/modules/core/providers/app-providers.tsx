/**
 * App Providers Component
 * Centralizes all application providers to reduce nesting in pages
 * This pattern improves readability and maintainability
 */

'use client'

import * as React from 'react'
import { QueryProvider } from '@/modules/core/providers/query-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { PeriodType } from '@/modules/dashboard/utils/period-utils'

interface AppProvidersProps {
  /** Child components to be wrapped with providers */
  children: React.ReactNode
  /** Additional props for SidebarProvider if needed */
  sidebarProps?: React.ComponentProps<typeof SidebarProvider>
}

/**
 * Composite provider component that wraps children with all necessary providers
 * Order matters: outer providers should be independent of inner providers
 *
 * Current provider hierarchy:
 * 1. QueryProvider - React Query for data fetching
 * 2. SidebarProvider - Sidebar state management
 *
 * @param children - Components to be wrapped
 * @param sidebarProps - Optional props for sidebar provider
 */
export function AppProviders({ children, sidebarProps }: AppProvidersProps) {
  return (
    <QueryProvider>
      <SidebarProvider {...sidebarProps}>{children}</SidebarProvider>
    </QueryProvider>
  )
}

/**
 * Dashboard-specific providers
 * Includes period and marketplace context
 */
interface DashboardProvidersProps {
  /** Child components */
  children: React.ReactNode
  /** Initial period type */
  initialPeriod?: PeriodType
  /** Initial marketplace filter */
  initialMarketplace?: string
}

/**
 * Export for lazy loading if needed
 * This allows dynamic imports for code splitting
 */
export const DashboardProviders = React.lazy(async () => {
  const { PeriodProvider } = await import(
    '@/modules/dashboard/pages/dashboard-vendas/period-context'
  )
  const { MarketplaceProvider } = await import(
    '@/modules/dashboard/pages/dashboard-vendas/marketplace-context'
  )

  return {
    default: function DashboardProviders({
      children,
      initialPeriod = 'month',
      initialMarketplace = 'all',
    }: DashboardProvidersProps) {
      return (
        <PeriodProvider initialPeriod={initialPeriod}>
          <MarketplaceProvider initialMarketplace={initialMarketplace}>
            {children}
          </MarketplaceProvider>
        </PeriodProvider>
      )
    },
  }
})
