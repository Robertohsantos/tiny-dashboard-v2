import { ChartConfig } from '@/components/ui/chart'
import type { PeriodType } from '@/modules/dashboard/utils/period-utils'

/**
 * Chart series configuration for the comparison chart
 * Defines colors and labels for each data series
 */
export const CHART_SERIES_CONFIG = {
  current: {
    label: 'Período Atual',
    color: 'hsl(var(--chart-1))', // Blue
  },
  previous: {
    label: 'Período Anterior',
    color: 'hsl(var(--chart-2))', // Orange
  },
  twoPeriodsBefore: {
    label: '2 Períodos Anteriores',
    color: 'hsl(var(--chart-3))', // Green
  },
} satisfies ChartConfig

/**
 * Chart styling constants
 */
export const CHART_STYLES = {
  // Area chart styling
  area: {
    type: 'natural' as const,
    strokeWidth: 2,
    fillOpacity: 0.6,
    projectionStrokeDasharray: '5 5',
    projectionFillOpacity: 0.3,
  },

  // Grid and axis styling
  grid: {
    vertical: false,
    strokeDasharray: '3 3',
  },

  // Margins for chart container
  margins: {
    top: 10,
    right: 20,
    bottom: 0,
    left: 20,
  },

  // Container dimensions
  container: {
    height: 250,
    aspectRatio: 'auto',
  },
} as const

/**
 * X-axis tick formatting configuration
 */
export const TICK_CONFIG = {
  // Font sizes per period type
  fontSize: {
    today: 11,
    week: 11,
    month: 9, // Smaller for month view due to more data points
    year: 11,
  },

  // Tick intervals (0 = show all)
  interval: {
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  },

  // Tick margin from axis
  margin: 8,
} as const

/**
 * Gradient configuration for area fills
 */
export const GRADIENT_CONFIG = {
  current: {
    id: 'fillCurrent',
    startOpacity: 0.6,
    endOpacity: 0.1,
  },
  previous: {
    id: 'fillPrevious',
    startOpacity: 0.8,
    endOpacity: 0.1,
  },
  twoPeriodsBefore: {
    id: 'fillTwoPeriodsBefore',
    startOpacity: 0.8,
    endOpacity: 0.1,
  },
} as const

/**
 * Weekday labels for Portuguese locale
 */
export const WEEKDAY_LABELS = {
  ordered: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], // Monday first
  standard: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], // Sunday first
} as const

/**
 * Date formatting options per period type
 */
export const DATE_FORMAT_OPTIONS: Record<
  PeriodType,
  Intl.DateTimeFormatOptions
> = {
  today: { hour: '2-digit' },
  week: { weekday: 'short' },
  month: { day: 'numeric' },
  year: { month: 'short' },
} as const

/**
 * Tooltip configuration
 */
export const TOOLTIP_CONFIG = {
  dateFormat: {
    month: 'short' as const,
    day: 'numeric' as const,
  },
  indicator: 'dot' as const,
  cursor: false,
} as const

/**
 * Button text configuration
 */
export const BUTTON_TEXT = {
  showThirdPeriod: 'Adicionar 3º período',
  hideThirdPeriod: 'Ocultar 3º período',
} as const

/**
 * Card text configuration
 */
export const CARD_TEXT = {
  title: 'Comparação de Vendas por Período',
  descriptionFull: 'Análise comparativa entre períodos consecutivos',
  descriptionShort: 'Comparação entre períodos',
  noData: 'Nenhum dado disponível para este período',
} as const

/**
 * Responsive breakpoint for description text
 */
export const RESPONSIVE_BREAKPOINT = '@[540px]/card' as const
