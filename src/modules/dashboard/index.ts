// Components
export * from './components/dashboard-error-boundary'
export * from './components/dashboard-main-sidebar'
export * from './components/dashboard-mobile-nav-menu'
export * from './components/dashboard-notification-bell'
export * from './components/dashboard-section'
export * from './components/dashboard-settings-sidebar'
export * from './components/chart-wrapper'
export * from './components/loading-skeleton'
export {
  LoadingSkeleton as DashboardLoadingSkeletonLegacy,
  DashboardLoadingSkeleton as DashboardLoadingSkeletonLegacyComponent,
} from './components/loading-skeleton-legacy'
export * from './components/metric-card'
export * from './components/metric-group'
export * from './components/metric-item'
export * from './components/metrics-grid'
export * from './components/product-metric-item'
export * from './components/performance/performance-dashboard'

// Pages / UI
export * from './pages/dashboard-vendas/dashboard-content'
export * from './pages/dashboard-vendas/dashboard-content-v2'
export * from './pages/dashboard-vendas/dashboard-content-validated'
export * from './pages/dashboard-vendas/dashboard-content-switch'
export * from './pages/dashboard-vendas/dashboard-loading'
export * from './pages/dashboard-vendas/chart-area-interactive'
export * from './pages/dashboard-vendas/section-cards'
export * from './pages/dashboard-vendas/section-metrics'
export * from './pages/dashboard-vendas/shipping-difference-metric'
export * from './pages/dashboard-vendas/period-context'
export * from './pages/dashboard-vendas/period-filter-simple'
export * from './pages/dashboard-vendas/marketplace-context'
export * from './pages/dashboard-vendas/marketplace-filter'

// Hooks - original implementation
export {
  useDashboardData,
  useDashboardMetrics,
  useFinancialMetrics,
  useChartData,
  useShippingDifference,
  useDashboardItems,
  usePrefetchDashboardData,
  useAdjacentPeriod,
} from './hooks/data/use-dashboard-data'

// Hooks - validated implementation
export {
  useDashboardMetricsValidated,
  useFinancialMetricsValidated,
  useChartDataValidated,
  useShippingDifferenceValidated,
  useDashboardDataValidated,
  usePrefetchDashboardDataValidated,
  useIsDataStale,
} from './hooks/data/use-dashboard-data-validated'

// Hooks - switch implementation (aliased to avoid name collisions)
export {
  useDashboardMetrics as useDashboardMetricsValidatedSwitch,
  useFinancialMetrics as useFinancialMetricsValidatedSwitch,
  useChartData as useChartDataValidatedSwitch,
  useShippingDifference as useShippingDifferenceValidatedSwitch,
  useDashboardData as useDashboardDataValidatedSwitch,
  usePrefetchDashboardData as usePrefetchDashboardDataValidatedSwitch,
} from './hooks/data/use-dashboard-data-switch'

// Services & Mocks
export * from './services/dashboard.service'
export * from './services/dashboard.service.validated'
export * from './mocks/dashboard-mock-generator'
export * from './repositories/dashboard-repository'

// Types & utilities
export * from './types/dashboard.types'
export * from './constants/chart-config'
export * from './constants/marketplace.constants'
export * from './utils/period-utils'
export * from './utils/chart-formatters'
export * from './utils/chart-projections'
export * from './utils/chart'

// Data fetchers
export {
  getDashboardTableData,
  getChartData,
  getDashboardMetrics,
  getFinancialMetrics,
  getShippingDifference,
} from './data/data-fetchers'

export {
  getDashboardTableData as getDashboardTableDataExperimental,
  getChartData as getChartDataExperimental,
  getDashboardMetrics as getDashboardMetricsExperimental,
  getFinancialMetrics as getFinancialMetricsExperimental,
  getShippingDifference as getShippingDifferenceExperimental,
} from './data/data-fetchers-refactored'
