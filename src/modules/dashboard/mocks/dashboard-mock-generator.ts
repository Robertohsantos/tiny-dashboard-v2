/**
 * Safe mock data generator for development environment
 * Uses deterministic data generation without Math.random()
 */

import type {
  ChartDataPoint,
  DashboardMetrics,
  DashboardFinancialMetrics,
  ShippingDifferenceData,
  DashboardItem,
  PeriodFilter,
} from '@/modules/dashboard/types/dashboard.types'
import { MARKETPLACE_DATA_MULTIPLIERS } from '@/modules/dashboard/constants/marketplace.constants'

/**
 * Base values for consistent mock data generation
 */
const BASE_VALUES = {
  totalSales: 2758825.37,
  itemsSold: 12454,
  orders: 3412,
  averageTicket: 677.5,
  salesWithoutShipping: 2432175.5,
  costOfGoods: 1247386.21,
  taxes: 348789.45,
  marketplaceFees: 165385.12,
  grossProfit: 670614.72,
  shippingDifference: 45678.9,
} as const

/**
 * Generates a deterministic value based on a seed
 * Uses sine wave for variation instead of random
 */
function generateDeterministicValue(
  baseValue: number,
  dayIndex: number,
  variationPercent: number = 0.1,
): number {
  // Use sine wave for natural variation
  const variation = Math.sin(dayIndex * 0.3) * variationPercent
  return Math.round(baseValue * (1 + variation) * 100) / 100
}

/**
 * Calculate percentage change between two values
 */
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100 * 10) / 10
}

/**
 * Generate mock chart data for a period
 */
type ResolvedPeriod = PeriodFilter & { startDate: Date; endDate: Date }

export function generateMockChartData(period?: PeriodFilter): ChartDataPoint[] {
  // If no period provided, use current month as default
  const effectivePeriod =
    period?.startDate && period?.endDate
      ? ({
          ...period,
          startDate: period.startDate,
          endDate: period.endDate,
        } as ResolvedPeriod)
      : (() => {
          const now = new Date()
          const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          const endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          )
          return {
            startDate,
            endDate,
            marketplaceId: period?.marketplaceId,
          } satisfies ResolvedPeriod
        })()

  // Use the effective period for all calculations
  const data: ChartDataPoint[] = []
  const startDate = new Date(effectivePeriod.startDate)
  const endDate = new Date(effectivePeriod.endDate)
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  // Get marketplace multipliers
  const marketplaceKey = (effectivePeriod.marketplaceId || 'all') as keyof typeof MARKETPLACE_DATA_MULTIPLIERS
  const marketplaceMultipliers =
    MARKETPLACE_DATA_MULTIPLIERS[marketplaceKey] ??
    MARKETPLACE_DATA_MULTIPLIERS.all

  // Determine if it's a year view (more than 100 days)
  const isYearView = daysDiff > 100

  if (isYearView) {
    // Generate monthly data for year view
    const startMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    )
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    let monthIndex = 0

    for (
      let iterMonth = startMonth;
      iterMonth <= endMonth;
      iterMonth = new Date(iterMonth.getFullYear(), iterMonth.getMonth() + 1, 1)
    ) {
      const monthDate = new Date(
        iterMonth.getFullYear(),
        iterMonth.getMonth(),
        1,
      )

      data.push({
        date: monthDate.toISOString().split('T')[0],
        current: generateDeterministicValue(
          8000 * marketplaceMultipliers.sales,
          monthIndex,
          0.2,
        ),
        previous: generateDeterministicValue(
          7000 * marketplaceMultipliers.sales,
          monthIndex - 12,
          0.2,
        ),
        twoPeriodsBefore: generateDeterministicValue(
          7500 * marketplaceMultipliers.sales,
          monthIndex - 24,
          0.2,
        ),
      })

      monthIndex++
    }
  } else {
    // Generate daily data for week/month views
    let dayIndex = 0
    const startTime = startDate.getTime()
    const endTime = endDate.getTime()
    const dayInMs = 24 * 60 * 60 * 1000

    for (let iterTime = startTime; iterTime <= endTime; iterTime += dayInMs) {
      const currentDate = new Date(iterTime)
      data.push({
        date: currentDate.toISOString().split('T')[0],
        current: generateDeterministicValue(
          250 * marketplaceMultipliers.sales,
          dayIndex,
          0.3,
        ),
        previous: generateDeterministicValue(
          220 * marketplaceMultipliers.sales,
          dayIndex - 30,
          0.3,
        ),
        twoPeriodsBefore: generateDeterministicValue(
          235 * marketplaceMultipliers.sales,
          dayIndex - 60,
          0.3,
        ),
      })

      dayIndex++
    }
  }

  return data
}

/**
 * Generate default 30-day chart data
 */
function generateDefaultChartData(marketplaceId?: string): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const today = new Date()

  // Get marketplace multipliers
  const marketplace = (marketplaceId || 'all') as keyof typeof MARKETPLACE_DATA_MULTIPLIERS
  const marketplaceMultipliers =
    MARKETPLACE_DATA_MULTIPLIERS[marketplace] ??
    MARKETPLACE_DATA_MULTIPLIERS.all

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split('T')[0],
      current: generateDeterministicValue(
        250 * marketplaceMultipliers.sales,
        30 - i,
        0.3,
      ),
      previous: generateDeterministicValue(
        220 * marketplaceMultipliers.sales,
        30 - i - 30,
        0.3,
      ),
      twoPeriodsBefore: generateDeterministicValue(
        235 * marketplaceMultipliers.sales,
        30 - i - 60,
        0.3,
      ),
    })
  }

  return data
}

/**
 * Generate mock sales metrics
 */
export function generateMockMetrics(period?: PeriodFilter): DashboardMetrics {
  // Calculate a multiplier based on period length
  let multiplier = 1
  if (period?.startDate && period?.endDate) {
    const days = Math.ceil(
      (period.endDate.getTime() - period.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    )
    multiplier = days / 30 // Normalize to 30-day period
  }

  // Get marketplace multipliers
  const marketplaceId = (period?.marketplaceId || 'all') as keyof typeof MARKETPLACE_DATA_MULTIPLIERS
  const marketplaceMultipliers =
    MARKETPLACE_DATA_MULTIPLIERS[marketplaceId] ??
    MARKETPLACE_DATA_MULTIPLIERS.all

  const currentSales =
    BASE_VALUES.totalSales * multiplier * marketplaceMultipliers.sales
  const previousSales = currentSales * 0.92 // Previous period had 8% less

  const currentItems = Math.round(
    BASE_VALUES.itemsSold * multiplier * marketplaceMultipliers.items,
  )
  const previousItems = Math.round(currentItems * 0.88)

  const currentOrders = Math.round(
    BASE_VALUES.orders * multiplier * marketplaceMultipliers.orders,
  )
  const previousOrders = Math.round(currentOrders * 0.95)

  const currentTicket =
    BASE_VALUES.averageTicket * marketplaceMultipliers.averageTicket
  const previousTicket = currentTicket * 0.97

  return {
    totalSales: {
      value: currentSales,
      currency: 'R$',
      change: calculateChange(currentSales, previousSales),
      trend: currentSales >= previousSales ? 'up' : 'down',
      description: 'Crescimento consistente',
      subtext: `Base: ${previousSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    },
    itemsSold: {
      value: currentItems,
      unit: 'un',
      change: calculateChange(currentItems, previousItems),
      trend: currentItems >= previousItems ? 'up' : 'down',
      description: 'Aumento no volume',
      subtext: `Base: ${previousItems.toLocaleString('pt-BR')} un`,
    },
    orders: {
      value: currentOrders,
      change: calculateChange(currentOrders, previousOrders),
      trend: currentOrders >= previousOrders ? 'up' : 'down',
      description: 'Mais pedidos',
      subtext: `Base: ${previousOrders.toLocaleString('pt-BR')} pedidos`,
    },
    averageTicket: {
      value: currentTicket,
      currency: 'R$',
      change: calculateChange(currentTicket, previousTicket),
      trend: currentTicket >= previousTicket ? 'up' : 'down',
      description: 'Ticket médio estável',
      subtext: `Base: ${previousTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    },
  }
}

/**
 * Generate mock financial metrics
 */
export function generateMockFinancialMetrics(
  period?: PeriodFilter,
): DashboardFinancialMetrics {
  let multiplier = 1
  if (period?.startDate && period?.endDate) {
    const days = Math.ceil(
      (period.endDate.getTime() - period.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    )
    multiplier = days / 30
  }

  // Get marketplace multipliers
  const marketplaceId = (period?.marketplaceId || 'all') as keyof typeof MARKETPLACE_DATA_MULTIPLIERS
  const marketplaceMultipliers =
    MARKETPLACE_DATA_MULTIPLIERS[marketplaceId] ??
    MARKETPLACE_DATA_MULTIPLIERS.all

  const salesValue =
    BASE_VALUES.salesWithoutShipping * multiplier * marketplaceMultipliers.sales
  const cmvValue = salesValue * 0.5125 // ~51.25% of sales
  const taxesValue = salesValue * 0.1434 // ~14.34% of sales
  const feesValue = salesValue * 0.068 // ~6.8% of sales
  const profitValue = salesValue - cmvValue - taxesValue - feesValue

  // Previous period values (5-10% less)
  const prevSales = salesValue * 0.94
  const prevCMV = prevSales * 0.5125
  const prevTaxes = prevSales * 0.1434
  const prevFees = prevSales * 0.068
  const prevProfit = prevSales - prevCMV - prevTaxes - prevFees

  return {
    salesWithoutShipping: {
      value: salesValue,
      currency: 'R$',
      change: calculateChange(salesValue, prevSales),
      trend: 'up',
      description: 'Vendas líquidas crescendo',
      subtext: 'Sem custos de frete',
    },
    costOfGoods: {
      value: cmvValue,
      currency: 'R$',
      change: calculateChange(cmvValue, prevCMV),
      trend: 'up',
      description: 'Custo da mercadoria',
      subtext: 'CMV - Custo da Mercadoria Vendida',
    },
    taxes: {
      value: taxesValue,
      currency: 'R$',
      change: calculateChange(taxesValue, prevTaxes),
      trend: 'up',
      description: 'Impostos no período',
      subtext: 'Total de tributos recolhidos',
    },
    marketplaceFees: {
      value: feesValue,
      currency: 'R$',
      change: calculateChange(feesValue, prevFees),
      trend: 'down',
      description: 'Taxas de marketplace',
      subtext: 'Comissões de marketplaces',
    },
    grossProfit: {
      value: profitValue,
      currency: 'R$',
      change: calculateChange(profitValue, prevProfit),
      trend: 'up',
      description: 'Lucro bruto',
      subtext: 'Após custos e taxas',
    },
  }
}

/**
 * Generate mock shipping difference data
 */
export function generateMockShippingDifference(
  period?: PeriodFilter,
): ShippingDifferenceData {
  let multiplier = 1
  if (period?.startDate && period?.endDate) {
    const days = Math.ceil(
      (period.endDate.getTime() - period.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    )
    multiplier = days / 30
  }

  // Get marketplace multipliers
  const marketplaceId = (period?.marketplaceId || 'all') as keyof typeof MARKETPLACE_DATA_MULTIPLIERS
  const marketplaceMultipliers =
    MARKETPLACE_DATA_MULTIPLIERS[marketplaceId] ??
    MARKETPLACE_DATA_MULTIPLIERS.all

  const value =
    BASE_VALUES.shippingDifference * multiplier * marketplaceMultipliers.sales

  return {
    value,
    currency: 'R$',
    trend: value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral',
    description: 'Saldo do frete cobrado do cliente vs. pago à transportadora',
  }
}

/**
 * Generate mock dashboard table data
 */
export function generateMockDashboardItems(): DashboardItem[] {
  return [
    {
      id: 1,
      header: 'Vendas Q1',
      type: 'revenue',
      status: 'completed',
      target: 'R$ 1.000.000',
      limit: 'R$ 1.200.000',
      reviewer: 'João Silva',
    },
    {
      id: 2,
      header: 'Vendas Q2',
      type: 'revenue',
      status: 'in_progress',
      target: 'R$ 1.100.000',
      limit: 'R$ 1.300.000',
      reviewer: 'Maria Santos',
    },
    {
      id: 3,
      header: 'Vendas Q3',
      type: 'revenue',
      status: 'pending',
      target: 'R$ 1.200.000',
      limit: 'R$ 1.400.000',
      reviewer: 'Pedro Costa',
    },
  ]
}
