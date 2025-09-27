/**
 * Zod schemas for dashboard data validation
 * Provides runtime type safety and data validation
 */

import { z } from 'zod'

/**
 * Schema for a single chart data point
 */
export const ChartDataPointSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  current: z.number().nullable(),
  previous: z.number().nullable(),
  twoPeriodsBefore: z.number().optional(),
  projection: z.number().optional(),
})

/**
 * Schema for generic metric data
 */
export const MetricDataSchema = z.object({
  value: z.number(),
  currency: z.string().optional(),
  unit: z.string().optional(),
  change: z.number(),
  trend: z.enum(['up', 'down']),
  description: z.string(),
  subtext: z.string(),
})

/**
 * Schema for dashboard sales metrics
 */
export const DashboardMetricsSchema = z.object({
  totalSales: MetricDataSchema,
  itemsSold: MetricDataSchema,
  orders: MetricDataSchema,
  averageTicket: MetricDataSchema,
})

/**
 * Schema for dashboard financial metrics
 */
export const DashboardFinancialMetricsSchema = z.object({
  salesWithoutShipping: MetricDataSchema,
  costOfGoods: MetricDataSchema,
  taxes: MetricDataSchema,
  marketplaceFees: MetricDataSchema,
  grossProfit: MetricDataSchema,
})

/**
 * Schema for shipping difference data
 */
export const ShippingDifferenceDataSchema = z.object({
  value: z.number(),
  currency: z.string(),
  trend: z.enum(['positive', 'negative', 'neutral']),
  description: z.string(),
})

/**
 * Schema for period filter parameters
 */
export const PeriodFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  marketplaceId: z.string().optional(),
})

/**
 * Complete dashboard data schema
 */
export const DashboardDataSchema = z.object({
  chartData: z.array(ChartDataPointSchema),
  metrics: DashboardMetricsSchema,
  financialMetrics: DashboardFinancialMetricsSchema,
  shippingDifference: ShippingDifferenceDataSchema,
})

/**
 * Dashboard item schema (for table data)
 */
export const DashboardItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  value: z.number(),
  date: z.date(),
  metadata: z.record(z.unknown()).optional(),
})

// Type inference from schemas
export type ChartDataPointValidated = z.infer<typeof ChartDataPointSchema>
export type MetricDataValidated = z.infer<typeof MetricDataSchema>
export type DashboardMetricsValidated = z.infer<typeof DashboardMetricsSchema>
export type DashboardFinancialMetricsValidated = z.infer<
  typeof DashboardFinancialMetricsSchema
>
export type ShippingDifferenceDataValidated = z.infer<
  typeof ShippingDifferenceDataSchema
>
export type DashboardDataValidated = z.infer<typeof DashboardDataSchema>

/**
 * Validation functions with error handling
 */

/**
 * Validates dashboard metrics data
 * @param data - Raw data to validate
 * @returns Validated data or throws ZodError
 */
export function validateDashboardMetrics(
  data: unknown,
): DashboardMetricsValidated {
  return DashboardMetricsSchema.parse(data)
}

/**
 * Safely validates dashboard metrics data
 * @param data - Raw data to validate
 * @returns Result with either validated data or error
 */
export function safeParseDashboardMetrics(data: unknown) {
  return DashboardMetricsSchema.safeParse(data)
}

/**
 * Validates complete dashboard data
 * @param data - Raw data to validate
 * @returns Validated data or throws ZodError
 */
export function validateDashboardData(data: unknown): DashboardDataValidated {
  return DashboardDataSchema.parse(data)
}

/**
 * Safely validates complete dashboard data
 * @param data - Raw data to validate
 * @returns Result with either validated data or error
 */
export function safeParseDashboardData(data: unknown) {
  return DashboardDataSchema.safeParse(data)
}
