/**
 * No Movement Products Repository
 * Handles database operations for products without movement analysis
 */

import { prisma } from '@/modules/core/services/prisma'
import type { Product, SalesHistory, Prisma } from '@/generated/prisma/client'
import type { NoMovementConfig, SalesHistoryData } from '../types'
import redis from '@/modules/core/services/redis'

export class NoMovementRepository {
  private readonly CACHE_PREFIX = 'no_movement:'
  private readonly CACHE_TTL = 3600 // 1 hour

  /**
   * Get products with sales history for movement analysis
   */
  async getProductsWithSalesHistory(
    organizationId: string,
    config: NoMovementConfig
  ): Promise<Array<{
    product: Product
    salesHistory: SalesHistory[]
  }>> {
    // Calculate date range
    const endDate = config.period.endDate || new Date()
    const startDate = config.period.startDate || (() => {
      const date = new Date(endDate)
      date.setDate(date.getDate() - config.period.days)
      return date
    })()

    // Build where clause for products
    const productWhere: Prisma.ProductWhereInput = {
      organizationId,
      ...(config.filters.depositos?.length && {
        warehouse: { in: config.filters.depositos }
      }),
      ...(config.filters.marcas?.length && {
        brand: { in: config.filters.marcas }
      }),
      ...(config.filters.fornecedores?.length && {
        supplier: { in: config.filters.fornecedores }
      }),
      ...(config.filters.categorias?.length && {
        category: { in: config.filters.categorias }
      }),
      ...(config.filters.skus?.length && {
        sku: { in: config.filters.skus }
      }),
      ...(config.filters.onlyActive
        ? { status: 'ACTIVE' }
        : !config.options.includeDiscontinued
          ? { status: { not: 'DISCONTINUED' } }
          : {}),
      ...(!config.options.includeZeroStock && {
        currentStock: {
          gt: 0
        }
      }),
    }

    // Fetch products with their sales history
    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        salesHistory: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    return products.map(product => ({
      product,
      salesHistory: product.salesHistory
    }))
  }

  /**
   * Get aggregated sales data for a product
   */
  async getAggregatedSalesData(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalUnits: number
    totalRevenue: number
    salesDays: number
    lastSaleDate: Date | null
  }> {
    const aggregation = await prisma.salesHistory.aggregate({
      where: {
        productId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        unitsSold: true,
        revenue: true
      },
      _count: {
        date: true
      },
      _max: {
        date: true
      }
    })

    return {
      totalUnits: aggregation._sum.unitsSold || 0,
      totalRevenue: Number(aggregation._sum.revenue) || 0,
      salesDays: aggregation._count.date || 0,
      lastSaleDate: aggregation._max.date
    }
  }

  /**
   * Get products without any sales in period
   */
  async getProductsWithoutSales(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    filters: NoMovementConfig['filters'],
    options: NoMovementConfig['options']
  ): Promise<Product[]> {
    // Get all product IDs with sales in the period
    const productsWithSales = await prisma.salesHistory.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        productId: true
      },
      distinct: ['productId']
    })

    const productIdsWithSales = productsWithSales.map(p => p.productId)

    // Find products without sales
    const productsWithoutSales = await prisma.product.findMany({
      where: {
        organizationId,
        id: {
          notIn: productIdsWithSales
        },
        ...(filters.depositos?.length && {
          warehouse: { in: filters.depositos }
        }),
        ...(filters.marcas?.length && {
          brand: { in: filters.marcas }
        }),
        ...(filters.fornecedores?.length && {
          supplier: { in: filters.fornecedores }
        }),
        ...(filters.categorias?.length && {
          category: { in: filters.categorias }
        }),
        ...(filters.skus?.length && {
          sku: { in: filters.skus }
        }),
        ...(filters.onlyActive
          ? { status: 'ACTIVE' }
          : !options.includeDiscontinued
            ? { status: { not: 'DISCONTINUED' } }
            : {}),
      ...(!options.includeZeroStock && {
        currentStock: {
          gt: 0
        }
      }),
    }
    })

    return productsWithoutSales
  }

  /**
   * Get sales history grouped by date
   */
  async getSalesHistoryByDate(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesHistoryData[]> {
    const sales = await prisma.salesHistory.findMany({
      where: {
        productId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return sales.map(sale => ({
      date: sale.date,
      unitsSold: sale.unitsSold,
      revenue: Number(sale.revenue),
      hasPromotion: sale.promotionFlag,
      discountPercent: sale.discountPercent ? Number(sale.discountPercent) : undefined
    }))
  }

  /**
   * Get filter options based on available products
   */
  async getFilterOptions(organizationId: string): Promise<{
    depositos: string[]
    marcas: string[]
    fornecedores: string[]
    categorias: string[]
  }> {
    // Try to get from cache first
    if (redis) {
      try {
        const cacheKey = `${this.CACHE_PREFIX}filter_options:${organizationId}`
        const cached = await redis.get(cacheKey)
        if (cached) {
          return JSON.parse(cached)
        }
      } catch (error) {
        console.error('Redis cache error:', error)
      }
    }

    // Get unique values from database
    const [depositos, marcas, fornecedores, categorias] = await Promise.all([
      prisma.product.findMany({
        where: { organizationId },
        select: { warehouse: true },
        distinct: ['warehouse']
      }),
      prisma.product.findMany({
        where: { organizationId },
        select: { brand: true },
        distinct: ['brand']
      }),
      prisma.product.findMany({
        where: { organizationId },
        select: { supplier: true },
        distinct: ['supplier']
      }),
      prisma.product.findMany({
        where: { organizationId },
        select: { category: true },
        distinct: ['category']
      })
    ])

    const options = {
      depositos: depositos.map(d => d.warehouse).filter(Boolean),
      marcas: marcas.map(m => m.brand).filter(Boolean),
      fornecedores: fornecedores.map(f => f.supplier).filter(Boolean),
      categorias: categorias.map(c => c.category).filter(Boolean)
    }

    // Cache the results
    if (redis) {
      try {
        const cacheKey = `${this.CACHE_PREFIX}filter_options:${organizationId}`
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(options))
      } catch (error) {
        console.error('Redis cache error:', error)
      }
    }

    return options
  }

  /**
   * Clear cache for an organization
   */
  async clearCache(organizationId: string): Promise<void> {
    if (!redis) return

    try {
      const pattern = `${this.CACHE_PREFIX}*:${organizationId}:*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis cache clear error:', error)
    }
  }
}

export const noMovementRepository = new NoMovementRepository()
