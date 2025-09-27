import type { PeriodType } from './period-utils'
import { parseLocalDate } from './period-utils'
import {
  WEEKDAY_LABELS,
  DATE_FORMAT_OPTIONS,
  TICK_CONFIG,
} from '@/modules/dashboard/constants/chart-config'
import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'

/**
 * Formats X-axis tick values based on the period type
 * @param value - Date string to format
 * @param periodType - Type of period being displayed
 * @param chartData - Optional chart data for context-aware formatting
 * @returns Formatted tick label
 */
export function formatXAxisTick(
  value: string,
  periodType: PeriodType,
  chartData?: ChartDataPoint[],
): string {
  // Parse date properly to avoid timezone issues
  const date = parseLocalDate(value)

  switch (periodType) {
    case 'today':
      // For today, show hours
      return date.toLocaleTimeString('pt-BR', DATE_FORMAT_OPTIONS.today)

    case 'week':
      // For week, show weekday abbreviations
      // We need to determine the position in the week based on the data
      if (chartData && chartData.length > 0) {
        const firstDate = new Date(chartData[0].date)
        const currentDate = new Date(value)
        const daysDiff = Math.floor(
          (currentDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
        )

        if (daysDiff >= 0 && daysDiff < 7) {
          return WEEKDAY_LABELS.ordered[daysDiff]
        }
      }
      // Fallback to actual day
      return WEEKDAY_LABELS.standard[date.getDay()]

    case 'month':
      // For month, show day numbers
      return date.getDate().toString()

    case 'year':
      // For year, show month names without period
      return date
        .toLocaleDateString('pt-BR', DATE_FORMAT_OPTIONS.year)
        .replace('.', '')

    default:
      return date.toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
      })
  }
}

/**
 * Gets the appropriate tick interval for the X-axis
 * @param periodType - Type of period being displayed
 * @returns Tick interval configuration
 */
export function getTickInterval(
  periodType: PeriodType,
): number | 'preserveStartEnd' {
  return TICK_CONFIG.interval[periodType] ?? 'preserveStartEnd'
}

/**
 * Gets the appropriate font size for X-axis ticks
 * @param periodType - Type of period being displayed
 * @returns Font size in pixels
 */
export function getTickFontSize(periodType: PeriodType): number {
  return TICK_CONFIG.fontSize[periodType] ?? 11
}

/**
 * Formats tooltip labels with consistent date formatting
 * @param value - Date value to format
 * @returns Formatted date string for tooltip
 */
export function formatTooltipLabel(value: string | number | Date): string {
  const date =
    typeof value === 'string'
      ? new Date(value)
      : value instanceof Date
        ? value
        : new Date(value)

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formats currency values for display
 * @param value - Numeric value to format
 * @param currency - Currency code (default: 'BRL')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'BRL',
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats large numbers with abbreviations (K, M, B)
 * @param value - Number to format
 * @returns Abbreviated string
 */
export function formatAbbreviatedNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toFixed(0)
}

/**
 * Calculates percentage change between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Formats percentage values with sign
 * @param value - Percentage value
 * @param showSign - Whether to show + for positive values
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  showSign: boolean = true,
): string {
  const formatted = `${Math.abs(value).toFixed(1)}%`
  if (showSign && value > 0) {
    return `+${formatted}`
  }
  if (value < 0) {
    return `-${formatted}`
  }
  return formatted
}
