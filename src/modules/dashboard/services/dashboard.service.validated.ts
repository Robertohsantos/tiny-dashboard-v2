/**
 * Dashboard Service with Zod Validation
 * Enhanced version of dashboard.service.ts with runtime type safety
 * This demonstrates how to integrate Zod validation into existing services
 */

import { dashboardService } from './dashboard.service'
import {
  DashboardMetricsSchema,
  DashboardFinancialMetricsSchema,
  ChartDataPointSchema,
  ShippingDifferenceDataSchema,
  DashboardDataSchema,
  type DashboardMetricsValidated,
  type DashboardFinancialMetricsValidated,
  type ChartDataPointValidated,
  type ShippingDifferenceDataValidated,
  type DashboardDataValidated,
} from '@/modules/dashboard/schemas/dashboard.schemas'
import {
  createValidatedFetcher,
  validateApiResponse,
  batchValidate,
} from '@/modules/core/utils/validation'
import type { PeriodFilter } from '@/modules/dashboard/types/dashboard.types'
import { z } from 'zod'

/**
 * Enhanced dashboard service with validation
 * All methods return validated data ensuring runtime type safety
 */
class ValidatedDashboardService {
  /**
   * Get validated dashboard metrics
   * @param period - Optional period filter
   * @returns Validated dashboard metrics
   */
  async getMetrics(period?: PeriodFilter): Promise<DashboardMetricsValidated> {
    const data = await dashboardService.getMetrics(period)
    return validateApiResponse(
      DashboardMetricsSchema,
      data,
      'Dashboard metrics validation failed',
    )
  }

  /**
   * Get validated financial metrics
   * @param period - Optional period filter
   * @returns Validated financial metrics
   */
  async getFinancialMetrics(
    period?: PeriodFilter,
  ): Promise<DashboardFinancialMetricsValidated> {
    const data = await dashboardService.getFinancialMetrics(period)
    return validateApiResponse(
      DashboardFinancialMetricsSchema,
      data,
      'Financial metrics validation failed',
    )
  }

  /**
   * Get validated chart data
   * @param period - Optional period filter
   * @returns Validated chart data points
   */
  async getChartData(
    period?: PeriodFilter,
  ): Promise<ChartDataPointValidated[]> {
    const data = await dashboardService.getChartData(period)

    // Validate each chart point individually for better error reporting
    const validation = batchValidate(ChartDataPointSchema, data)

    if (validation.invalid.length > 0) {
      console.warn(
        `Chart data validation: ${validation.invalid.length} invalid points skipped`,
        {
          invalidPoints: validation.invalid,
        },
      )
    }

    return validation.valid
  }

  /**
   * Get validated shipping difference data
   * @param period - Optional period filter
   * @returns Validated shipping difference data
   */
  async getShippingDifference(
    period?: PeriodFilter,
  ): Promise<ShippingDifferenceDataValidated> {
    const data = await dashboardService.getShippingDifference(period)
    return validateApiResponse(
      ShippingDifferenceDataSchema,
      data,
      'Shipping difference validation failed',
    )
  }

  /**
   * Get all dashboard data with validation
   * @param period - Optional period filter
   * @returns Complete validated dashboard data
   */
  async getCompleteDashboardData(
    period?: PeriodFilter,
  ): Promise<DashboardDataValidated> {
    // Fetch all data in parallel
    const [chartData, metrics, financialMetrics, shippingDifference] =
      await Promise.all([
        this.getChartData(period),
        this.getMetrics(period),
        this.getFinancialMetrics(period),
        this.getShippingDifference(period),
      ])

    // Construct and validate complete data object
    const completeData = {
      chartData,
      metrics,
      financialMetrics,
      shippingDifference,
    }

    return validateApiResponse(
      DashboardDataSchema,
      completeData,
      'Complete dashboard data validation failed',
    )
  }

  /**
   * Creates validated fetcher functions for React Query hooks
   * These can be used directly in React Query configurations
   */
  createValidatedFetchers() {
    return {
      metrics: createValidatedFetcher(
        (period?: PeriodFilter) => dashboardService.getMetrics(period),
        DashboardMetricsSchema,
      ),
      financialMetrics: createValidatedFetcher(
        (period?: PeriodFilter) => dashboardService.getFinancialMetrics(period),
        DashboardFinancialMetricsSchema,
      ),
      chartData: createValidatedFetcher(
        (period?: PeriodFilter) => dashboardService.getChartData(period),
        z.array(ChartDataPointSchema),
      ),
      shippingDifference: createValidatedFetcher(
        (period?: PeriodFilter) =>
          dashboardService.getShippingDifference(period),
        ShippingDifferenceDataSchema,
      ),
    }
  }
}

// Export singleton instance
export const validatedDashboardService = new ValidatedDashboardService()

// Export validated fetchers for direct use in React Query
export const dashboardFetchers =
  validatedDashboardService.createValidatedFetchers()

/**
 * Example usage in React Query hook:
 *
 * import { dashboardFetchers } from '@/modules/dashboard/services/dashboard.service.validated'
 *
 * export function useDashboardMetrics(period?: PeriodFilter) {
 *   return useQuery({
 *     queryKey: ['metrics', period],
 *     queryFn: () => dashboardFetchers.metrics(period),
 *     // Data is guaranteed to be validated
 *   })
 * }
 */
