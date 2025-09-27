/**
 * Tests for dashboard Zod schemas
 * Comprehensive validation testing for all dashboard-related schemas
 */

import { describe, it, expect } from 'vitest'
import {
  ChartDataPointSchema,
  MetricDataSchema,
  DashboardMetricsSchema,
  DashboardFinancialMetricsSchema,
  ShippingDifferenceDataSchema,
  DashboardDataSchema,
  validateDashboardMetrics,
  safeParseDashboardMetrics,
  validateDashboardData,
  safeParseDashboardData,
} from '../dashboard.schemas'

import {
  validChartDataPoints,
  validMetricData,
  validDashboardMetrics,
  validFinancialMetrics,
  validShippingDifference,
  validCompleteDashboardData,
  minimalValidDashboardData,
} from './fixtures/dashboard-valid-data'

import {
  invalidChartDataPoints,
  invalidMetricData,
  invalidDashboardMetrics,
  invalidShippingDifference,
  invalidCompleteDashboardData,
  edgeCaseInvalidData,
} from './fixtures/dashboard-invalid-data'

import {
  createSchemaTestSuite,
  testOptionalFields,
} from '@/modules/core/testing/schema-testing-utils'

describe('Dashboard Schemas', () => {
  describe('ChartDataPointSchema', () => {
    it('should validate correct chart data points', () => {
      validChartDataPoints.forEach((point) => {
        const result = ChartDataPointSchema.safeParse(point)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid chart data points', () => {
      invalidChartDataPoints.forEach((point) => {
        const result = ChartDataPointSchema.safeParse(point)
        expect(result.success).toBe(false)
      })
    })

    it('should require date in YYYY-MM-DD format', () => {
      const invalidDate = {
        date: '01/01/2024',
        current: 1000,
        previous: 900,
      }
      const result = ChartDataPointSchema.safeParse(invalidDate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('YYYY-MM-DD')
      }
    })

    it('should allow null values for current and previous', () => {
      const nullValues = {
        date: '2024-01-01',
        current: null,
        previous: null,
      }
      const result = ChartDataPointSchema.safeParse(nullValues)
      expect(result.success).toBe(true)
    })

    testOptionalFields(
      ChartDataPointSchema,
      {
        date: '2024-01-01',
        current: 1000,
        previous: 900,
        twoPeriodsBefore: 800,
        projection: 1100,
      },
      ['twoPeriodsBefore', 'projection'],
    )
  })

  describe('MetricDataSchema', () => {
    it('should validate correct metric data', () => {
      validMetricData.forEach((metric) => {
        const result = MetricDataSchema.safeParse(metric)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid metric data', () => {
      invalidMetricData.forEach((metric) => {
        const result = MetricDataSchema.safeParse(metric)
        expect(result.success).toBe(false)
      })
    })

    it('should enforce trend enum values', () => {
      const invalidTrend = {
        value: 1000,
        change: 10,
        trend: 'sideways',
        description: 'Test',
        subtext: 'Test',
      }
      const result = MetricDataSchema.safeParse(invalidTrend)
      expect(result.success).toBe(false)
      if (!result.success) {
        const trendError = result.error.errors.find((err) =>
          err.path.includes('trend'),
        )
        expect(trendError).toBeDefined()
      }
    })

    it('should require all mandatory fields', () => {
      const incomplete = { value: 1000 }
      const result = MetricDataSchema.safeParse(incomplete)
      expect(result.success).toBe(false)
      if (!result.success) {
        const requiredFields = ['change', 'trend', 'description', 'subtext']
        requiredFields.forEach((field) => {
          const hasError = result.error.errors.some((err) =>
            err.path.includes(field),
          )
          expect(hasError).toBe(true)
        })
      }
    })

    testOptionalFields(
      MetricDataSchema,
      {
        value: 1000,
        currency: 'BRL',
        unit: 'items',
        change: 10,
        trend: 'up',
        description: 'Test',
        subtext: 'Test',
      },
      ['currency', 'unit'],
    )
  })

  describe('DashboardMetricsSchema', () => {
    it('should validate complete dashboard metrics', () => {
      const result = DashboardMetricsSchema.safeParse(validDashboardMetrics)
      expect(result.success).toBe(true)
    })

    it('should require all metric fields', () => {
      const incomplete = {
        totalSales: validDashboardMetrics.totalSales,
        // Missing: itemsSold, orders, averageTicket
      }
      const result = DashboardMetricsSchema.safeParse(incomplete)
      expect(result.success).toBe(false)
    })

    it('should validate each metric independently', () => {
      const invalidMetric = {
        ...validDashboardMetrics,
        totalSales: { value: 'not-a-number' }, // Invalid
      }
      const result = DashboardMetricsSchema.safeParse(invalidMetric)
      expect(result.success).toBe(false)
    })
  })

  describe('ShippingDifferenceDataSchema', () => {
    it('should validate correct shipping difference data', () => {
      const result = ShippingDifferenceDataSchema.safeParse(
        validShippingDifference,
      )
      expect(result.success).toBe(true)
    })

    it('should enforce trend enum values', () => {
      const invalidTrend = {
        value: 1000,
        currency: 'BRL',
        trend: 'up', // Should be 'positive', 'negative', or 'neutral'
        description: 'Test',
      }
      const result = ShippingDifferenceDataSchema.safeParse(invalidTrend)
      expect(result.success).toBe(false)
    })

    it('should require all fields', () => {
      invalidShippingDifference.forEach((invalid) => {
        const result = ShippingDifferenceDataSchema.safeParse(invalid)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('DashboardDataSchema', () => {
    it('should validate complete dashboard data', () => {
      const result = DashboardDataSchema.safeParse(validCompleteDashboardData)
      expect(result.success).toBe(true)
    })

    it('should validate minimal valid data', () => {
      const result = DashboardDataSchema.safeParse(minimalValidDashboardData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid complete data', () => {
      invalidCompleteDashboardData.forEach((invalid) => {
        const result = DashboardDataSchema.safeParse(invalid)
        expect(result.success).toBe(false)
      })
    })

    it('should validate nested structures', () => {
      const partiallyInvalid = {
        ...validCompleteDashboardData,
        chartData: [{ date: 'invalid-date', current: 100, previous: 90 }],
      }
      const result = DashboardDataSchema.safeParse(partiallyInvalid)
      expect(result.success).toBe(false)
    })

    it('should handle empty arrays', () => {
      const emptyChart = {
        ...validCompleteDashboardData,
        chartData: [],
      }
      const result = DashboardDataSchema.safeParse(emptyChart)
      expect(result.success).toBe(true)
    })
  })

  describe('Validation Functions', () => {
    describe('validateDashboardMetrics', () => {
      it('should return validated data for valid input', () => {
        const validated = validateDashboardMetrics(validDashboardMetrics)
        expect(validated).toEqual(validDashboardMetrics)
      })

      it('should throw ZodError for invalid input', () => {
        expect(() => {
          validateDashboardMetrics({ invalid: 'data' })
        }).toThrow()
      })
    })

    describe('safeParseDashboardMetrics', () => {
      it('should return success result for valid input', () => {
        const result = safeParseDashboardMetrics(validDashboardMetrics)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validDashboardMetrics)
        }
      })

      it('should return error result for invalid input', () => {
        const result = safeParseDashboardMetrics({ invalid: 'data' })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeDefined()
        }
      })
    })

    describe('validateDashboardData', () => {
      it('should return validated data for valid input', () => {
        const validated = validateDashboardData(validCompleteDashboardData)
        expect(validated).toEqual(validCompleteDashboardData)
      })

      it('should throw ZodError for invalid input', () => {
        expect(() => {
          validateDashboardData(null)
        }).toThrow()
      })
    })

    describe('safeParseDashboardData', () => {
      it('should handle valid data', () => {
        const result = safeParseDashboardData(validCompleteDashboardData)
        expect(result.success).toBe(true)
      })

      it('should handle invalid data', () => {
        const result = safeParseDashboardData(undefined)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should reject null', () => {
      const result = DashboardDataSchema.safeParse(null)
      expect(result.success).toBe(false)
    })

    it('should reject undefined', () => {
      const result = DashboardDataSchema.safeParse(undefined)
      expect(result.success).toBe(false)
    })

    it('should reject empty object', () => {
      const result = DashboardDataSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject arrays', () => {
      const result = DashboardDataSchema.safeParse([])
      expect(result.success).toBe(false)
    })

    it('should reject primitive values', () => {
      edgeCaseInvalidData.forEach((edgeCase) => {
        const result = DashboardDataSchema.safeParse(edgeCase)
        expect(result.success).toBe(false)
      })
    })

    it('should handle very large numbers', () => {
      const largeNumber = {
        value: Number.MAX_SAFE_INTEGER,
        change: 999999999,
        trend: 'up',
        description: 'Large number',
        subtext: 'Test',
      }
      const result = MetricDataSchema.safeParse(largeNumber)
      expect(result.success).toBe(true)
    })

    it('should handle zero values', () => {
      const zeroMetric = {
        value: 0,
        change: 0,
        trend: 'up',
        description: 'Zero metric',
        subtext: 'All zeros',
      }
      const result = MetricDataSchema.safeParse(zeroMetric)
      expect(result.success).toBe(true)
    })

    it('should handle negative values', () => {
      const negativeMetric = {
        value: -1000,
        change: -50,
        trend: 'down',
        description: 'Negative metric',
        subtext: 'Loss',
      }
      const result = MetricDataSchema.safeParse(negativeMetric)
      expect(result.success).toBe(true)
    })
  })
})
