/**
 * Stock Coverage Repository
 * Handles all database operations for stock coverage calculations
 */

import { prisma } from '@/modules/core/services/prisma'
import type { 
  Product, 
  SalesHistory, 
  StockAvailability,
  StockCoverage,
  Prisma
} from '@/generated/prisma/client'
import redis from '@/modules/core/services/redis'

export class StockCoverageRepository {
  private readonly CACHE_PREFIX = 'stock_coverage:'
  private readonly CACHE_TTL = 3600 // 1 hour in seconds

  /**
   * Get product with related data for coverage calculation
   */
  async getProductWithHistory(
    productId: string,
    historicalDays: number = 90
  ): Promise<{
    product: Product
    salesHistory: SalesHistory[]
    stockAvailability: StockAvailability[]
  } | null> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - historicalDays)

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        salesHistory: {
          where: {
            date: {
              gte: cutoffDate
            }
          },
          orderBy: {
            date: 'asc'
          }
        },
        stockHistory: {
          where: {
            date: {
              gte: cutoffDate
            }
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    })

    if (!product) {
      return null
    }

    return {
      product,
      salesHistory: product.salesHistory,
      stockAvailability: product.stockHistory
    }
  }

  /**
   * Get products by organization
   */
  async getProductsByOrganization(
    organizationId: string,
    filters?: {
      warehouse?: string
      supplier?: string
      status?: string
      needsReorder?: boolean
    }
  ): Promise<Product[]> {
    let where: Prisma.ProductWhereInput = {
      organizationId,
      ...(filters?.warehouse && { warehouse: filters.warehouse }),
      ...(filters?.supplier && { supplier: filters.supplier }),
      ...(filters?.status && { status: filters.status as any })
    }

    if (filters?.needsReorder) {
      // Get products where current stock is below minimum
      // Using Prisma's raw SQL for self-referencing comparison
      where = {
        ...where,
        OR: [
          { currentStock: 0 }, // Out of stock
          { currentStock: { lte: 10 } } // Low stock (threshold)
        ]
      }
    }

    return prisma.product.findMany({
      where,
      orderBy: {
        sku: 'asc'
      }
    })
  }

  /**
   * Save calculated coverage to database
   */
  async saveStockCoverage(
    data: Prisma.StockCoverageUncheckedCreateInput,
  ): Promise<StockCoverage> {
    return prisma.stockCoverage.create({
      data,
    })
  }

  /**
   * Get latest coverage calculation for a product
   */
  async getLatestCoverage(productId: string): Promise<StockCoverage | null> {
    // Try to get from cache first
    if (redis) {
      const cacheKey = `${this.CACHE_PREFIX}${productId}`
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    }

    // Get from database
    const coverage = await prisma.stockCoverage.findFirst({
      where: {
        productId,
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      orderBy: {
        calculatedAt: 'desc'
      }
    })

    // Cache the result
    if (coverage && redis) {
      const cacheKey = `${this.CACHE_PREFIX}${productId}`
      await redis.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(coverage)
      )
    }

    return coverage
  }

  /**
   * Batch get latest coverages for multiple products
   */
  async getBatchCoverages(productIds: string[]): Promise<Map<string, StockCoverage>> {
    const results = new Map<string, StockCoverage>()

    // Try to get from cache first
    if (redis) {
      const pipeline = redis.pipeline()
      productIds.forEach(id => {
        pipeline.get(`${this.CACHE_PREFIX}${id}`)
      })
      const cached = await pipeline.exec()
      
      if (cached) {
        cached.forEach((result, index) => {
          if (result && result[1]) {
            const coverage = JSON.parse(result[1] as string)
            results.set(productIds[index], coverage)
          }
        })
      }
    }

    // Get missing ones from database
    const missingIds = productIds.filter(id => !results.has(id))
    
    if (missingIds.length > 0) {
      const coverages = await prisma.stockCoverage.findMany({
        where: {
          productId: { in: missingIds },
          expiresAt: { gt: new Date() }
        },
        orderBy: {
          calculatedAt: 'desc'
        }
      })

      // Group by product and take latest
      const coverageMap = new Map<string, StockCoverage>()
      coverages.forEach(coverage => {
        const existing = coverageMap.get(coverage.productId)
        if (!existing || coverage.calculatedAt > existing.calculatedAt) {
          coverageMap.set(coverage.productId, coverage)
        }
      })

      // Add to results and cache
      if (redis) {
        const pipeline = redis.pipeline()
        coverageMap.forEach((coverage, productId) => {
          results.set(productId, coverage)
          pipeline.setex(
            `${this.CACHE_PREFIX}${productId}`,
            this.CACHE_TTL,
            JSON.stringify(coverage)
          )
        })
        await pipeline.exec()
      } else {
        coverageMap.forEach((coverage, productId) => {
          results.set(productId, coverage)
        })
      }
    }

    return results
  }

  /**
   * Create or update sales history
   */
  async upsertSalesHistory(
    productId: string,
    date: Date,
    data: {
      unitsSold: number
      price: number
      revenue: number
      promotionFlag?: boolean
      promotionType?: string
      discountPercent?: number
    }
  ): Promise<SalesHistory> {
    return prisma.salesHistory.upsert({
      where: {
        productId_date: {
          productId,
          date
        }
      },
      update: data,
      create: {
        productId,
        date,
        ...data
      }
    })
  }

  /**
   * Create or update stock availability
   */
  async upsertStockAvailability(
    productId: string,
    date: Date,
    data: {
      minutesInStock: number
      stockoutEvents?: number
      averageStock?: number
      openingStock?: number
      closingStock?: number
      restockQuantity?: number
    }
  ): Promise<StockAvailability> {
    return prisma.stockAvailability.upsert({
      where: {
        productId_date: {
          productId,
          date
        }
      },
      update: data,
      create: {
        productId,
        date,
        ...data
      }
    })
  }

  /**
   * Get aggregated sales metrics for a period
   */
  async getAggregatedSalesMetrics(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalUnits: number
    totalRevenue: number
    averageDailySales: number
    daysWithSales: number
    promotionDays: number
  }> {
    const result = await prisma.salesHistory.aggregate({
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
      }
    })

    const promotionCount = await prisma.salesHistory.count({
      where: {
        productId,
        date: {
          gte: startDate,
          lte: endDate
        },
        promotionFlag: true
      }
    })

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      totalUnits: result._sum.unitsSold || 0,
      totalRevenue: Number(result._sum.revenue) || 0,
      averageDailySales: (result._sum.unitsSold || 0) / daysDiff,
      daysWithSales: result._count.date || 0,
      promotionDays: promotionCount
    }
  }

  /**
   * Clean up old coverage calculations
   */
  async cleanupExpiredCoverages(): Promise<number> {
    const result = await prisma.stockCoverage.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    return result.count
  }

  /**
   * Invalidate cache for a product
   */
  async invalidateCache(productId: string): Promise<void> {
    if (redis) {
      await redis.del(`${this.CACHE_PREFIX}${productId}`)
    }
  }

  /**
   * Invalidate all coverage caches
   */
  async invalidateAllCaches(): Promise<void> {
    if (redis) {
      const keys = await redis.keys(`${this.CACHE_PREFIX}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  }

  /**
   * Get products needing coverage recalculation
   */
  async getProductsNeedingRecalculation(
    organizationId: string,
    maxAge: number = 24 // hours
  ): Promise<Product[]> {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - maxAge)

    // Get products that either have no coverage or old coverage
    const products = await prisma.product.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        OR: [
          {
            stockCoverages: {
              none: {}
            }
          },
          {
            stockCoverages: {
              every: {
                calculatedAt: {
                  lt: cutoffDate
                }
              }
            }
          }
        ]
      },
      include: {
        stockCoverages: {
          orderBy: {
            calculatedAt: 'desc'
          },
          take: 1
        }
      }
    })

    return products
  }
}

// Export singleton instance
export const stockCoverageRepository = new StockCoverageRepository()
