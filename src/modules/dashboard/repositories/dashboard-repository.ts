import { prisma } from '@/modules/core/services/prisma'
import type {
  DashboardMetrics,
  DashboardFinancialMetrics,
  ChartDataPoint,
  ShippingDifferenceData,
  PeriodFilter,
} from '@/modules/dashboard/types/dashboard.types'

export class DashboardRepository {
  /**
   * Get aggregated sales metrics for the dashboard
   */
  async getMetrics(
    organizationId: string,
    period?: PeriodFilter,
  ): Promise<DashboardMetrics> {
    const where = {
      organizationId,
      ...(period && {
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      }),
    }

    // Get current period metrics
    const currentMetrics = await prisma.saleMetric.aggregate({
      where,
      _sum: {
        totalSales: true,
        itemsSold: true,
        orders: true,
      },
      _avg: {
        averageTicket: true,
      },
    })

    // Calculate previous period for comparison
    const previousPeriod = this.getPreviousPeriod(period)
    const previousMetrics = await prisma.saleMetric.aggregate({
      where: {
        organizationId,
        date: {
          gte: previousPeriod.startDate,
          lte: previousPeriod.endDate,
        },
      },
      _sum: {
        totalSales: true,
        itemsSold: true,
        orders: true,
      },
      _avg: {
        averageTicket: true,
      },
    })

    return {
      totalSales: {
        value: currentMetrics._sum.totalSales || 0,
        change: this.calculatePercentageChange(
          previousMetrics._sum.totalSales || 0,
          currentMetrics._sum.totalSales || 0,
        ),
        trend:
          (currentMetrics._sum.totalSales || 0) >=
          (previousMetrics._sum.totalSales || 0)
            ? 'up'
            : 'down',
        description: 'em comparação ao período anterior',
        subtext: 'Total de vendas realizadas',
      },
      itemsSold: {
        value: currentMetrics._sum.itemsSold || 0,
        change: this.calculatePercentageChange(
          previousMetrics._sum.itemsSold || 0,
          currentMetrics._sum.itemsSold || 0,
        ),
        trend:
          (currentMetrics._sum.itemsSold || 0) >=
          (previousMetrics._sum.itemsSold || 0)
            ? 'up'
            : 'down',
        description: 'em comparação ao período anterior',
        subtext: 'Total de itens vendidos',
      },
      orders: {
        value: currentMetrics._sum.orders || 0,
        change: this.calculatePercentageChange(
          previousMetrics._sum.orders || 0,
          currentMetrics._sum.orders || 0,
        ),
        trend:
          (currentMetrics._sum.orders || 0) >=
          (previousMetrics._sum.orders || 0)
            ? 'up'
            : 'down',
        description: 'em comparação ao período anterior',
        subtext: 'Total de pedidos realizados',
      },
      averageTicket: {
        value: currentMetrics._avg.averageTicket || 0,
        change: this.calculatePercentageChange(
          previousMetrics._avg.averageTicket || 0,
          currentMetrics._avg.averageTicket || 0,
        ),
        trend:
          (currentMetrics._avg.averageTicket || 0) >=
          (previousMetrics._avg.averageTicket || 0)
            ? 'up'
            : 'down',
        description: 'em comparação ao período anterior',
        subtext: 'Valor médio por pedido',
      },
    }
  }

  /**
   * Get financial metrics for the dashboard
   */
  async getFinancialMetrics(
    organizationId: string,
    period?: PeriodFilter,
  ): Promise<DashboardFinancialMetrics> {
    const where = {
      organizationId,
      ...(period && {
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      }),
    }

    const metrics = await prisma.financialMetric.aggregate({
      where,
      _sum: {
        salesWithoutShipping: true,
        costOfGoods: true,
        taxes: true,
        marketplaceFees: true,
        grossProfit: true,
      },
    })

    return {
      salesWithoutShipping: {
        value: metrics._sum.salesWithoutShipping || 0,
        currency: 'R$',
        change: 0,
        trend: 'up',
        description: 'Receita sem considerar frete',
        subtext: 'Total de vendas',
      },
      costOfGoods: {
        value: metrics._sum.costOfGoods || 0,
        currency: 'R$',
        change: 0,
        trend: 'down',
        description: 'Custo dos produtos vendidos',
        subtext: 'Total de custos',
      },
      taxes: {
        value: metrics._sum.taxes || 0,
        currency: 'R$',
        change: 0,
        trend: 'down',
        description: 'Impostos recolhidos',
        subtext: 'Total de impostos',
      },
      marketplaceFees: {
        value: metrics._sum.marketplaceFees || 0,
        currency: 'R$',
        change: 0,
        trend: 'down',
        description: 'Taxas de marketplace',
        subtext: 'Total de taxas',
      },
      grossProfit: {
        value: metrics._sum.grossProfit || 0,
        currency: 'R$',
        change: 0,
        trend: 'up',
        description: 'Lucro bruto',
        subtext: 'Receita - custos - taxas',
      },
    }
  }

  /**
   * Get chart data points
   */
  async getChartData(
    organizationId: string,
    period?: PeriodFilter,
  ): Promise<ChartDataPoint[]> {
    const where = {
      organizationId,
      ...(period && {
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      }),
    }

    const data = await prisma.visitorData.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
      select: {
        date: true,
        desktop: true,
        mobile: true,
        tablet: true,
      },
    })

    const previousPeriod = this.getPreviousPeriod(period)
    const comparisonData = await prisma.visitorData.findMany({
      where: {
        organizationId,
        date: {
          gte: previousPeriod.startDate,
          lte: previousPeriod.endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        date: true,
        desktop: true,
        mobile: true,
      },
    })

    return data.map((item, index) => ({
      date: item.date.toISOString().split('T')[0],
      desktop: item.desktop,
      mobile: item.mobile + item.tablet,
      comparison: comparisonData[index]
        ? comparisonData[index].desktop + comparisonData[index].mobile
        : undefined,
    }))
  }

  /**
   * Get shipping difference data
   */
  async getShippingDifference(
    organizationId: string,
    period?: PeriodFilter,
  ): Promise<ShippingDifferenceData> {
    const where = {
      organizationId,
      ...(period && {
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      }),
    }

    const metrics = await prisma.financialMetric.aggregate({
      where,
      _sum: {
        shippingDifference: true,
      },
    })

    const value = metrics._sum.shippingDifference || 0

    return {
      value: Math.abs(value),
      currency: 'BRL',
      trend: value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral',
      description:
        value > 0
          ? 'Economia no frete'
          : value < 0
          ? 'Custo adicional de frete'
          : 'Sem diferença no frete',
    }
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0
    return Math.round(((newValue - oldValue) / oldValue) * 100)
  }

  private getPreviousPeriod(period?: PeriodFilter): PeriodFilter {
    if (!period) {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      return {
        startDate: sixtyDaysAgo,
        endDate: thirtyDaysAgo,
      }
    }

    const duration = period.endDate.getTime() - period.startDate.getTime()
    const previousStart = new Date(period.startDate.getTime() - duration)
    const previousEnd = new Date(period.startDate.getTime() - 1)

    return {
      startDate: previousStart,
      endDate: previousEnd,
    }
  }
}

export const dashboardRepository = new DashboardRepository()
