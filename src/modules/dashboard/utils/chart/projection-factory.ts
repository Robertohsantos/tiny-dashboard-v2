/**
 * Projection Factory Pattern
 * Factory for creating and managing projection strategies
 */

import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'
import type { PeriodType } from '../period-utils'
import type { ProjectionConfig } from './constants'
import {
  applyMonthProjection,
  calculateMonthMetrics,
} from './projections-month'
import {
  applyWeekProjection,
  calculateWeekMetrics,
} from './projections-week'
import {
  applyYearProjection,
  calculateYearMetrics,
} from './projections-year'

/**
 * Projection strategy interface
 */
export interface ProjectionStrategy {
  /** Name of the strategy */
  name: string
  /** Period type this strategy handles */
  periodType: PeriodType
  /** Apply projection to data */
  apply: (data: ChartDataPoint[], config?: ProjectionConfig) => ChartDataPoint[]
  /** Calculate metrics for this projection type */
  calculateMetrics?: (data: ChartDataPoint[]) => Record<string, unknown>
}

/**
 * Today projection strategy (no projections)
 */
class TodayProjectionStrategy implements ProjectionStrategy {
  name = 'Today Projection'
  periodType: PeriodType = 'today'

  apply(data: ChartDataPoint[]): ChartDataPoint[] {
    // Today view doesn't have projections
    return data
  }

  calculateMetrics(data: ChartDataPoint[]) {
    const total = data.reduce((sum, d) => sum + (d.current || 0), 0)
    const count = data.filter((d) => d.current !== null).length
    const avg = count > 0 ? total / count : 0

    return {
      totalHours: count,
      totalValue: total,
      avgPerHour: avg,
    }
  }
}

/**
 * Week projection strategy
 */
class WeekProjectionStrategy implements ProjectionStrategy {
  name = 'Week Projection'
  periodType: PeriodType = 'week'

  apply(data: ChartDataPoint[], config?: ProjectionConfig): ChartDataPoint[] {
    return applyWeekProjection(data, config)
  }

  calculateMetrics(data: ChartDataPoint[]) {
    return calculateWeekMetrics(data)
  }
}

/**
 * Month projection strategy
 */
class MonthProjectionStrategy implements ProjectionStrategy {
  name = 'Month Projection'
  periodType: PeriodType = 'month'

  apply(data: ChartDataPoint[], config?: ProjectionConfig): ChartDataPoint[] {
    return applyMonthProjection(data, config)
  }

  calculateMetrics(data: ChartDataPoint[]) {
    return calculateMonthMetrics(data)
  }
}

/**
 * Year projection strategy
 */
class YearProjectionStrategy implements ProjectionStrategy {
  name = 'Year Projection'
  periodType: PeriodType = 'year'

  apply(data: ChartDataPoint[], config?: ProjectionConfig): ChartDataPoint[] {
    return applyYearProjection(data, config)
  }

  calculateMetrics(data: ChartDataPoint[]) {
    return calculateYearMetrics(data)
  }
}

/**
 * Projection Factory
 * Creates and manages projection strategies
 */
class ProjectionFactory {
  private strategies: Map<PeriodType, ProjectionStrategy> = new Map()

  constructor() {
    // Register default strategies
    this.registerStrategy(new TodayProjectionStrategy())
    this.registerStrategy(new WeekProjectionStrategy())
    this.registerStrategy(new MonthProjectionStrategy())
    this.registerStrategy(new YearProjectionStrategy())
  }

  /**
   * Register a new projection strategy
   * @param strategy - The strategy to register
   */
  registerStrategy(strategy: ProjectionStrategy): void {
    this.strategies.set(strategy.periodType, strategy)
  }

  /**
   * Get a projection strategy by period type
   * @param periodType - The period type
   * @returns The projection strategy or undefined
   */
  getStrategy(periodType: PeriodType): ProjectionStrategy | undefined {
    return this.strategies.get(periodType)
  }

  /**
   * Apply projections using the appropriate strategy
   * @param data - Chart data
   * @param periodType - Period type
   * @param config - Optional configuration
   * @returns Processed data with projections
   */
  applyProjections(
    data: ChartDataPoint[],
    periodType: PeriodType,
    config?: ProjectionConfig,
  ): ChartDataPoint[] {
    const strategy = this.getStrategy(periodType)

    if (!strategy) {
      console.warn(
        `No projection strategy found for period type: ${periodType}`,
      )
      return data
    }

    return strategy.apply(data, config)
  }

  /**
   * Calculate metrics for a specific period type
   * @param data - Chart data
   * @param periodType - Period type
   * @returns Calculated metrics
   */
  calculateMetrics(
    data: ChartDataPoint[],
    periodType: PeriodType,
  ): Record<string, any> {
    const strategy = this.getStrategy(periodType)

    if (!strategy || !strategy.calculateMetrics) {
      return {}
    }

    return strategy.calculateMetrics(data)
  }

  /**
   * List all registered strategies
   * @returns Array of strategy names and period types
   */
  listStrategies(): Array<{ name: string; periodType: PeriodType }> {
    return Array.from(this.strategies.values()).map((strategy) => ({
      name: strategy.name,
      periodType: strategy.periodType,
    }))
  }
}

// Export singleton instance
const projectionFactory = new ProjectionFactory()
export default projectionFactory

// Export factory class for extension
export { ProjectionFactory }
