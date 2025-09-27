'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'
import type { PeriodType } from '@/modules/dashboard/utils/period-utils'
import { applyProjections, debugLog } from '@/modules/dashboard/utils/chart'
import {
  formatXAxisTick,
  getTickInterval,
  getTickFontSize,
  formatTooltipLabel,
} from '@/modules/dashboard/utils/chart-formatters'
import {
  CHART_SERIES_CONFIG,
  CHART_STYLES,
  GRADIENT_CONFIG,
  BUTTON_TEXT,
  CARD_TEXT,
  RESPONSIVE_BREAKPOINT,
  TOOLTIP_CONFIG,
} from '@/modules/dashboard/constants/chart-config'

/**
 * Props for the ChartAreaInteractive component
 */
interface ChartAreaInteractiveProps {
  /** Chart data points to display */
  data?: ChartDataPoint[] | null
  /** Period type for formatting and projections */
  periodType?: PeriodType
}

/**
 * Interactive area chart component for comparing sales across periods
 * Displays current, previous, and optionally two periods before with projections
 */
function ChartAreaInteractiveBase({
  data,
  periodType = 'month',
}: ChartAreaInteractiveProps) {
  const safeData = data ?? []
  const [showThirdPeriod, setShowThirdPeriod] = React.useState(false)

  // Memoize debug info to avoid recalculating on every render
  const debugInfo = React.useMemo(
    () => ({
      length: safeData.length,
      firstDate: safeData[0]?.date,
      lastDate: safeData[safeData.length - 1]?.date,
    }),
    [safeData],
  )

  // Debug logging in development mode only
  React.useEffect(() => {
    debugLog(`ChartAreaInteractive received data for ${periodType}`, debugInfo)
  }, [debugInfo, periodType])

  // Process and prepare chart data with projections - already memoized
  const chartData = React.useMemo(() => {
    if (safeData.length === 0) {
      return []
    }

    // Apply projections based on period type
    const processedData = applyProjections(safeData, periodType)

    debugLog(`Processed data for ${periodType}`, {
      originalLength: safeData.length,
      processedLength: processedData.length,
      hasProjections: processedData.some((d) => d.projection !== undefined),
    })

    return processedData
  }, [safeData, periodType])

  // Memoize chart configuration to avoid recreating on every render
  const chartConfig = React.useMemo(
    () => ({
      margins: CHART_STYLES.margins,
      tickInterval: getTickInterval(periodType),
      tickFontSize: getTickFontSize(periodType),
      cursorStyle: TOOLTIP_CONFIG.cursor,
      indicatorStyle: TOOLTIP_CONFIG.indicator,
    }),
    [periodType],
  )

  // Memoize formatters to avoid recreating functions
  const formatters = React.useMemo(
    () => ({
      xAxis: (value: string) => formatXAxisTick(value, periodType, chartData),
      tooltip: formatTooltipLabel,
    }),
    [periodType, chartData],
  )

  return (
    <Card className="@container/card border border-gray-100 bg-gray-50">
      <CardHeader className="relative pb-4">
        <CardTitle className="text-lg font-bold text-foreground">
          {CARD_TEXT.title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          <span className={`${RESPONSIVE_BREAKPOINT}:block hidden`}>
            {CARD_TEXT.descriptionFull}
          </span>
          <span className={`${RESPONSIVE_BREAKPOINT}:hidden`}>
            {CARD_TEXT.descriptionShort}
          </span>
        </CardDescription>
        <Button
          variant="outline"
          onClick={() => setShowThirdPeriod(!showThirdPeriod)}
          className="absolute right-4 top-4 h-8"
        >
          {showThirdPeriod
            ? BUTTON_TEXT.hideThirdPeriod
            : BUTTON_TEXT.showThirdPeriod}
        </Button>
      </CardHeader>
      <CardContent className="px-4 pt-4 sm:px-6 sm:pt-6 overflow-hidden">
        {chartData.length > 0 ? (
          <ChartContainer
            config={CHART_SERIES_CONFIG}
            className="aspect-auto h-[250px] w-full overflow-visible"
          >
            <AreaChart data={chartData} margin={chartConfig.margins}>
              <defs>
                <linearGradient
                  id={GRADIENT_CONFIG.current.id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-current)"
                    stopOpacity={GRADIENT_CONFIG.current.startOpacity}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-current)"
                    stopOpacity={GRADIENT_CONFIG.current.endOpacity}
                  />
                </linearGradient>
                <linearGradient
                  id={GRADIENT_CONFIG.previous.id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-previous)"
                    stopOpacity={GRADIENT_CONFIG.previous.startOpacity}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-previous)"
                    stopOpacity={GRADIENT_CONFIG.previous.endOpacity}
                  />
                </linearGradient>
                <linearGradient
                  id={GRADIENT_CONFIG.twoPeriodsBefore.id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-twoPeriodsBefore)"
                    stopOpacity={GRADIENT_CONFIG.twoPeriodsBefore.startOpacity}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-twoPeriodsBefore)"
                    stopOpacity={GRADIENT_CONFIG.twoPeriodsBefore.endOpacity}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={CHART_STYLES.grid.vertical} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={chartConfig.tickInterval}
                tickFormatter={formatters.xAxis}
                tick={{ fontSize: chartConfig.tickFontSize }}
              />
              <ChartTooltip
                cursor={chartConfig.cursorStyle}
                content={
                  <ChartTooltipContent
                    labelFormatter={formatters.tooltip}
                    indicator={chartConfig.indicatorStyle}
                  />
                }
              />
              <Area
                dataKey="previous"
                type={CHART_STYLES.area.type}
                fill={`url(#${GRADIENT_CONFIG.previous.id})`}
                stroke="var(--color-previous)"
              />
              <Area
                dataKey="current"
                type={CHART_STYLES.area.type}
                fill={`url(#${GRADIENT_CONFIG.current.id})`}
                stroke="var(--color-current)"
              />
              <Area
                dataKey="projection"
                type={CHART_STYLES.area.type}
                fill={`url(#${GRADIENT_CONFIG.current.id})`}
                stroke="var(--color-current)"
                strokeDasharray={CHART_STYLES.area.projectionStrokeDasharray}
                fillOpacity={CHART_STYLES.area.projectionFillOpacity}
                connectNulls={false}
              />
              {showThirdPeriod && (
                <Area
                  dataKey="twoPeriodsBefore"
                  type={CHART_STYLES.area.type}
                  fill={`url(#${GRADIENT_CONFIG.twoPeriodsBefore.id})`}
                  stroke="var(--color-twoPeriodsBefore)"
                />
              )}
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            <p>{CARD_TEXT.noData}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Memoized version of ChartAreaInteractive
 * Only re-renders when data or periodType changes
 */
export const ChartAreaInteractive = React.memo(
  ChartAreaInteractiveBase,
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    // Component should only re-render if data or periodType actually changed
    return (
      prevProps.periodType === nextProps.periodType &&
      prevProps.data?.length === nextProps.data?.length &&
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
    )
  },
)

// Also export as default for backward compatibility
export default ChartAreaInteractive
