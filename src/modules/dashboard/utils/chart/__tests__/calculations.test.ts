/**
 * Chart Calculations Tests
 * Tests for mathematical utility functions used in chart data processing
 */

import { describe, it, expect } from 'vitest'
import {
  calculateAverage,
  calculateVariationPattern,
  generateProjectedValue,
  calculateTrend,
  smoothValues,
  calculateConfidenceInterval,
} from '../calculations'
import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'

describe('Chart Calculations', () => {
  describe('calculateAverage', () => {
    it('should calculate average of valid data points', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', current: 100, previous: 80 },
        { date: '2024-01-02', current: 200, previous: 90 },
        { date: '2024-01-03', current: 300, previous: 100 },
      ]
      expect(calculateAverage(data)).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should handle empty array', () => {
      expect(calculateAverage([])).toBe(0)
    })

    it('should filter out null values', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', current: 100, previous: 80 },
        { date: '2024-01-02', current: null, previous: 90 },
        { date: '2024-01-03', current: 200, previous: 100 },
      ]
      expect(calculateAverage(data)).toBe(150) // (100 + 200) / 2
    })

    it('should filter out zero and negative values', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', current: 100, previous: 80 },
        { date: '2024-01-02', current: 0, previous: 90 },
        { date: '2024-01-03', current: -50, previous: 100 },
        { date: '2024-01-04', current: 200, previous: 110 },
      ]
      expect(calculateAverage(data)).toBe(150) // (100 + 200) / 2
    })
  })

  describe('calculateVariationPattern', () => {
    it('should calculate variation between consecutive points', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', current: 100, previous: 80 },
        { date: '2024-01-02', current: 110, previous: 90 },
        { date: '2024-01-03', current: 121, previous: 100 },
      ]
      // 10% increase from 100 to 110, 10% increase from 110 to 121
      const variation = calculateVariationPattern(data, 0.15)
      expect(variation).toBeCloseTo(0.1, 2)
    })

    it('should return default variation for insufficient data', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', current: 100, previous: 80 },
      ]
      expect(calculateVariationPattern(data, 0.15)).toBe(0.15)
    })

    it('should handle null values in data', () => {
      const data: ChartDataPoint[] = [
        { date: '2024-01-01', current: 100, previous: 80 },
        { date: '2024-01-02', current: null, previous: 90 },
        { date: '2024-01-03', current: 110, previous: 100 },
      ]
      const variation = calculateVariationPattern(data, 0.15)
      expect(variation).toBeCloseTo(0.1, 2) // 10% from 100 to 110
    })
  })

  describe('generateProjectedValue', () => {
    it('should generate projected value based on variation', () => {
      const result = generateProjectedValue(100, 0.1, 0.05)
      // Base value 100 + 10% variation ± 5% confidence
      expect(result).toBeGreaterThanOrEqual(100 * 1.05) // 100 * (1 + 0.1 - 0.05)
      expect(result).toBeLessThanOrEqual(100 * 1.15) // 100 * (1 + 0.1 + 0.05)
    })

    it('should handle zero base value', () => {
      const result = generateProjectedValue(0, 0.1, 0.05)
      expect(result).toBe(0)
    })

    it('should handle negative variation', () => {
      const result = generateProjectedValue(100, -0.1, 0.05)
      expect(result).toBeGreaterThanOrEqual(100 * 0.85) // 100 * (1 - 0.1 - 0.05)
      expect(result).toBeLessThanOrEqual(100 * 0.95) // 100 * (1 - 0.1 + 0.05)
    })
  })

  describe('calculateTrend', () => {
    it('should identify upward trend', () => {
      const values = [1, 2, 3, 4, 5]
      const trend = calculateTrend(values)
      expect(trend).toBeGreaterThan(0)
    })

    it('should identify downward trend', () => {
      const values = [5, 4, 3, 2, 1]
      const trend = calculateTrend(values)
      expect(trend).toBeLessThan(0)
    })

    it('should return 0 for flat trend', () => {
      const values = [3, 3, 3, 3, 3]
      const trend = calculateTrend(values)
      expect(trend).toBe(0)
    })

    it('should handle empty array', () => {
      expect(calculateTrend([])).toBe(0)
    })

    it('should handle single value', () => {
      expect(calculateTrend([42])).toBe(0)
    })
  })

  describe('smoothValues', () => {
    it('should apply moving average with default window', () => {
      const values = [1, 5, 3, 7, 2]
      const smoothed = smoothValues(values)

      // With window size 3:
      // [1, 5, 3, 7, 2] -> [(1+5+3)/3, (5+3+7)/3, (3+7+2)/3, (7+2+2)/3, (2+2+2)/3]
      // Note: edge values are padded
      expect(smoothed[0]).toBeCloseTo(3, 1)
      expect(smoothed[1]).toBeCloseTo(5, 1)
      expect(smoothed[2]).toBeCloseTo(4, 1)
    })

    it('should handle custom window size', () => {
      const values = [1, 2, 3, 4, 5]
      const smoothed = smoothValues(values, 2)

      // With window size 2:
      expect(smoothed.length).toBe(values.length)
      expect(smoothed[0]).toBeCloseTo(1.5, 1) // (1+2)/2
      expect(smoothed[1]).toBeCloseTo(2.5, 1) // (2+3)/2
    })

    it('should handle window size of 1', () => {
      const values = [1, 2, 3, 4, 5]
      const smoothed = smoothValues(values, 1)
      expect(smoothed).toEqual(values)
    })

    it('should handle empty array', () => {
      expect(smoothValues([])).toEqual([])
    })

    it('should handle single value', () => {
      expect(smoothValues([42])).toEqual([42])
    })
  })

  describe('calculateConfidenceInterval', () => {
    it('should calculate confidence interval for trend', () => {
      const trend = 0.1 // 10% growth
      const dataSize = 100
      const volatility = 0.2

      const interval = calculateConfidenceInterval(trend, dataSize, volatility)

      expect(interval).toBeGreaterThan(0)
      expect(interval).toBeLessThan(volatility)
    })

    it('should return higher interval for smaller data size', () => {
      const trend = 0.1
      const smallDataSize = 10
      const largeDataSize = 1000
      const volatility = 0.2

      const smallInterval = calculateConfidenceInterval(
        trend,
        smallDataSize,
        volatility,
      )
      const largeInterval = calculateConfidenceInterval(
        trend,
        largeDataSize,
        volatility,
      )

      expect(smallInterval).toBeGreaterThan(largeInterval)
    })

    it('should return base confidence for very small datasets', () => {
      const trend = 0.1
      const dataSize = 2
      const volatility = 0.2

      const interval = calculateConfidenceInterval(trend, dataSize, volatility)

      // Should use base confidence of 0.1 for very small datasets
      expect(interval).toBeGreaterThanOrEqual(0.1)
    })

    it('should scale with volatility', () => {
      const trend = 0.1
      const dataSize = 100
      const lowVolatility = 0.1
      const highVolatility = 0.5

      const lowInterval = calculateConfidenceInterval(
        trend,
        dataSize,
        lowVolatility,
      )
      const highInterval = calculateConfidenceInterval(
        trend,
        dataSize,
        highVolatility,
      )

      expect(highInterval).toBeGreaterThan(lowInterval)
    })
  })
})
