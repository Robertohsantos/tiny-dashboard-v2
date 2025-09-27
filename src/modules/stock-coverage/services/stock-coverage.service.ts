/**
 * Stock Coverage Service
 * Business logic layer for stock coverage calculations
 */

import { stockCoverageRepository } from '@/modules/stock-coverage/repositories/stock-coverage.repository'
import { StockCoverageCalculator } from '@/modules/stock-coverage/calculator'
import { batchProcess } from '@/modules/core/utils/concurrency'
import type {
  StockCoverageConfig,
  StockCoverageResult,
  StockCoverageInput,
  BatchProcessingResult,
} from '@/modules/stock-coverage/types'
import {
  StockCoverageCalculationError,
  StockCoverageError,
} from '@/modules/stock-coverage/types'
import { ENV_CONFIG } from '@/modules/core/config/environment'
import { Prisma } from '@/generated/prisma/client'
import type {
  Product,
  SalesHistory,
  StockAvailability,
  StockCoverage,
} from '@/generated/prisma/client'
import { logger } from '@/modules/core/services/logger'

export class StockCoverageService {
  private calculator: StockCoverageCalculator
  private repository = stockCoverageRepository

  constructor(config?: Partial<StockCoverageConfig>) {
    this.calculator = new StockCoverageCalculator(config)
  }

  /**
   * Calculate stock coverage for a single product
   */
  async calculateCoverage(
    productId: string,
    useCache: boolean = true,
  ): Promise<StockCoverageResult> {
    // In development mode with mock data, return mock coverage
    if (ENV_CONFIG.useMockData) {
      return this.getMockCoverage(productId)
    }

    // Check cache first if enabled
    if (useCache) {
      const cached = await this.repository.getLatestCoverage(productId)
      if (cached) {
        // Convert cached data to result format
        return this.convertCacheToResult(cached)
      }
    }

    // Get product data with history
    const productData = await this.repository.getProductWithHistory(productId)

    if (!productData) {
      throw new StockCoverageCalculationError(
        StockCoverageError.INSUFFICIENT_DATA,
        'Product not found',
        { productId },
      )
    }

    // For development with mock data
    if (
      ENV_CONFIG.useMockData &&
      (!productData.salesHistory || productData.salesHistory.length === 0)
    ) {
      // Generate mock history
      const mockHistory = this.generateMockHistory(productData.product)
      productData.salesHistory = mockHistory.salesHistory
      productData.stockAvailability = mockHistory.stockAvailability
    }

    // Prepare input for calculator
    const input: StockCoverageInput = {
      product: productData.product,
      salesHistory: productData.salesHistory,
      stockAvailability: productData.stockAvailability,
      currentDate: new Date(),
    }

    // Calculate coverage
    const result = this.calculator.calculate(input)

    // Save to database and cache
    await this.saveCoverageResult(productId, result)

    return result
  }

  /**
   * Calculate coverage for multiple products
   */
  async calculateBatchCoverage(
    organizationId: string,
    filters?: {
      warehouse?: string
      supplier?: string
      forceRecalculation?: boolean
    },
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now()
    const successful: string[] = []
    const failed: string[] = []
    const errors: Record<string, string> = {}

    // Get products
    const products = await this.repository.getProductsByOrganization(
      organizationId,
      filters,
    )

    // Check cache unless force recalculation
    const coverages = filters?.forceRecalculation
      ? new Map()
      : await this.repository.getBatchCoverages(products.map((p) => p.id))

    // Process products that need calculation
    const productsToCalculate = products.filter((p) => !coverages.has(p.id))

    for (const product of productsToCalculate) {
      try {
        const result = await this.calculateCoverage(product.id, false)
        successful.push(product.sku)
      } catch (error) {
        failed.push(product.sku)
        errors[product.sku] =
          error instanceof Error ? error.message : 'Unknown error'
        logger.error('Batch calculation failed for product', {
          sku: product.sku,
          error,
        })
      }
    }

    // Add cached results to successful
    coverages.forEach((_, productId) => {
      const product = products.find((p) => p.id === productId)
      if (product) {
        successful.push(product.sku)
      }
    })

    const totalTime = Date.now() - startTime
    const totalProcessed = successful.length + failed.length

    return {
      successful,
      failed,
      errors,
      totalTime,
      averageTimePerSku: totalProcessed > 0 ? totalTime / totalProcessed : 0,
    }
  }

  /**
   * Get coverage with product details
   */
  async getCoverageWithProduct(productId: string) {
    const [coverage, product] = await Promise.all([
      this.calculateCoverage(productId),
      this.repository.getProductWithHistory(productId, 7), // Get last 7 days for context
    ])

    if (!product) {
      throw new StockCoverageCalculationError(
        StockCoverageError.INSUFFICIENT_DATA,
        'Product not found',
        { productId },
      )
    }

    // Calculate additional insights
    const recentSales = product.salesHistory.reduce(
      (sum, sh) => sum + sh.unitsSold,
      0,
    )
    const avgDailySales = recentSales / 7
    const stockTurnover =
      avgDailySales > 0
        ? 365 / (product.product.currentStock / avgDailySales)
        : 0

    return {
      product: product.product,
      coverage,
      insights: {
        recentAverageDailySales: avgDailySales,
        stockTurnover,
        daysOfSupply: coverage.coverageDays,
        isOverstocked: coverage.coverageDays > 60,
        needsReorder:
          product.product.currentStock <= product.product.minimumStock,
        stockoutRisk: coverage.stockoutRisk,
      },
    }
  }

  /**
   * Update product sales and recalculate coverage
   */
  async updateSalesAndRecalculate(
    productId: string,
    date: Date,
    salesData: {
      unitsSold: number
      price: number
      revenue: number
      promotionFlag?: boolean
    },
  ): Promise<StockCoverageResult> {
    // Update sales history
    await this.repository.upsertSalesHistory(productId, date, salesData)

    // Update stock availability (simplified - should get from inventory system)
    const minutesInStock = salesData.unitsSold > 0 ? 1440 : 720 // Full day if sales, half if no sales
    await this.repository.upsertStockAvailability(productId, date, {
      minutesInStock,
      stockoutEvents: salesData.unitsSold === 0 ? 1 : 0,
    })

    // Invalidate cache
    await this.repository.invalidateCache(productId)

    // Recalculate coverage
    return this.calculateCoverage(productId, false)
  }

  /**
   * Get products at risk of stockout
   */
  async getStockoutRiskProducts(
    organizationId: string,
    riskThreshold: number = 0.5,
  ): Promise<
    Array<{
      product: Product
      coverage: StockCoverageResult
      daysUntilStockout: number
    }>
  > {
    // Get all active products
    const products = await this.repository.getProductsByOrganization(
      organizationId,
      {
        status: 'ACTIVE',
      },
    )

    // Process products in parallel with concurrency limit
    type ProductCoverageCandidate = {
      product: Product
      coverage: StockCoverageResult
      daysUntilStockout: number
    }

    const processor = async (
      product: Product,
    ): Promise<ProductCoverageCandidate | null> => {
      const coverage = await this.calculateCoverage(product.id)

      if (coverage.stockoutRisk >= riskThreshold) {
        return {
          product,
          coverage,
          daysUntilStockout: Math.floor(coverage.coverageDays),
        }
      }
      return null
    }

    const { successful } = await batchProcess<Product, ProductCoverageCandidate | null>(
      products,
      processor,
      {
        concurrency: 5,
        batchSize: 20,
        onError: (product, error: unknown) => {
          logger.error('Failed to calculate coverage', {
            sku: product.sku,
            error,
          })
        },
      },
    )

    // Filter out null results and sort by risk
    const results = successful
      .filter(
        (result): result is ProductCoverageCandidate => result !== null,
      )
      .sort(
        (a, b) => b.coverage.stockoutRisk - a.coverage.stockoutRisk,
      )

    return results
  }

  /**
   * Schedule recalculation for all products
   */
  async scheduleRecalculation(organizationId: string): Promise<void> {
    const products =
      await this.repository.getProductsNeedingRecalculation(organizationId)

    logger.info('Scheduling recalculation', {
      productCount: products.length,
      organizationId,
    })

    // Process products in parallel with concurrency limit
    await batchProcess(
      products,
      (product) => this.calculateCoverage(product.id, false),
      {
        concurrency: 5,
        batchSize: 10,
        onProgress: (completed, total) => {
          if (completed % 50 === 0) {
            logger.info('Recalculation progress', {
              completed,
              total,
              organizationId,
            })
          }
        },
        onError: (product, error: unknown) => {
          logger.error('Failed to calculate coverage in batch', {
            sku: product.sku,
            error,
          })
        },
      },
    )
  }

  /**
   * Clean up expired coverage calculations
   */
  async cleanup(): Promise<number> {
    return this.repository.cleanupExpiredCoverages()
  }

  /**
   * Convert cached coverage to result format
   */
  private convertCacheToResult(cached: StockCoverage): StockCoverageResult {
    return {
      coverageDays: cached.coverageDays,
      coverageDaysP90: cached.coverageDaysP90,
      coverageDaysP10: cached.coverageDaysP10,
      demandForecast: cached.demandForecast,
      demandStdDev: cached.demandStdDev,
      adjustedDemand: cached.adjustedDemand,
      trendFactor: cached.trendFactor,
      seasonalityIndex: cached.seasonalityIndex,
      availabilityAdjustment: cached.confidence, // Using confidence as proxy
      confidence: cached.confidence,
      dataQuality: this.extractDataQuality(cached),
      reorderPoint: cached.reorderPoint || 0,
      reorderQuantity: cached.reorderQuantity || 0,
      stockoutRisk: this.calculateStockoutRiskFromCoverage(
        cached.coverageDays,
        cached.demandForecast,
      ),
      historicalDaysUsed: cached.historicalDays,
      algorithm: cached.algorithm,
      calculatedAt: cached.calculatedAt,
      expiresAt: cached.expiresAt,
    }
  }

  /**
   * Save coverage result to database
   */
  private async saveCoverageResult(
    productId: string,
    result: StockCoverageResult,
  ): Promise<void> {
    const parameters: Prisma.InputJsonValue = {
      dataQuality: {
        completeness: result.dataQuality.completeness,
        consistency: result.dataQuality.consistency,
        availabilityIssues: result.dataQuality.availabilityIssues,
        outlierPercentage: result.dataQuality.outlierPercentage,
        overallScore: result.dataQuality.overallScore,
      },
      stockoutRisk: result.stockoutRisk,
    }

    await this.repository.saveStockCoverage({
      productId,
      calculatedAt: result.calculatedAt,
      coverageDays: result.coverageDays,
      coverageDaysP90: result.coverageDaysP90,
      coverageDaysP10: result.coverageDaysP10,
      demandForecast: result.demandForecast,
      demandStdDev: result.demandStdDev,
      trendFactor: result.trendFactor,
      seasonalityIndex: result.seasonalityIndex,
      adjustedDemand: result.adjustedDemand,
      confidence: result.confidence,
      historicalDays: result.historicalDaysUsed,
      algorithm: result.algorithm,
      parameters,
      reorderPoint: result.reorderPoint,
      reorderQuantity: result.reorderQuantity,
      expiresAt: result.expiresAt,
    })
  }

  /**
   * Extract data quality from cached coverage
   */
  private extractDataQuality(
    cached: StockCoverage,
  ): StockCoverageResult['dataQuality'] {
    // Try to extract from parameters JSON field
    const params = cached.parameters
    if (params && typeof params === 'object') {
      const record = params as Record<string, unknown>
      const dataQualityCandidate = record.dataQuality

      if (
        dataQualityCandidate &&
        typeof dataQualityCandidate === 'object'
      ) {
        return dataQualityCandidate as StockCoverageResult['dataQuality']
      }
    }

    // Return default values if not available
    return {
      completeness: 0.85,
      consistency: 0.85,
      availabilityIssues: 0.05,
      outlierPercentage: 0.03,
      overallScore: 0.85,
    }
  }

  /**
   * Calculate stockout risk from coverage days
   */
  private calculateStockoutRiskFromCoverage(
    coverageDays: number,
    demandForecast: number,
  ): number {
    // Simple risk calculation based on days of coverage
    if (coverageDays <= 0) return 1.0 // Already out of stock
    if (coverageDays <= 3) return 0.9 // Very high risk
    if (coverageDays <= 7) return 0.7 // High risk
    if (coverageDays <= 14) return 0.5 // Medium risk
    if (coverageDays <= 30) return 0.3 // Low risk
    if (coverageDays <= 60) return 0.1 // Very low risk
    return 0.05 // Minimal risk
  }

  /**
   * Get mock coverage for development mode
   */
  private getMockCoverage(productId: string): StockCoverageResult {
    // Generate deterministic mock data based on product ID
    const seed = productId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const random = (min: number, max: number) => min + (seed % (max - min))

    const coverageDays = random(5, 60)
    const demandForecast = random(10, 100)

    return {
      coverageDays,
      coverageDaysP90: coverageDays * 1.2,
      coverageDaysP10: coverageDays * 0.8,
      demandForecast,
      demandStdDev: demandForecast * 0.2,
      adjustedDemand: demandForecast * 1.1,
      trendFactor: 1 + (random(0, 20) - 10) / 100,
      seasonalityIndex: 1 + (random(0, 30) - 15) / 100,
      availabilityAdjustment: 0.95,
      confidence: 0.85,
      dataQuality: {
        completeness: 0.9,
        consistency: 0.88,
        availabilityIssues: 0.05,
        outlierPercentage: 0.02,
        overallScore: 0.87,
      },
      reorderPoint: demandForecast * 7,
      reorderQuantity: demandForecast * 30,
      stockoutRisk: this.calculateStockoutRiskFromCoverage(
        coverageDays,
        demandForecast,
      ),
      historicalDaysUsed: 90,
      algorithm: 'MOVING_AVERAGE',
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }

  /**
   * Generate mock history for development
   */
  private generateMockHistory(product: Product): {
    salesHistory: SalesHistory[]
    stockAvailability: StockAvailability[]
  } {
    const salesHistory: SalesHistory[] = []
    const stockAvailability: StockAvailability[] = []
    const days = 90

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      // Generate realistic sales pattern
      const dayOfWeek = date.getDay()
      const baselineSales = 10
      const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.5 : 1.0
      const randomVariation = 0.5 + Math.random()
      const unitsSold = Math.floor(
        baselineSales * weekendMultiplier * randomVariation,
      )

      const unitPrice = product.sellPrice ?? new Prisma.Decimal(0)
      const revenue = unitPrice.mul(unitsSold)

      salesHistory.push({
        id: `mock-sh-${i}`,
        productId: product.id,
        date,
        unitsSold,
        price: unitPrice,
        revenue,
        promotionFlag: Math.random() > 0.9,
        promotionType: null,
        discountPercent: null,
        createdAt: date,
        updatedAt: date,
      })

      stockAvailability.push({
        id: `mock-sa-${i}`,
        productId: product.id,
        date,
        minutesInStock: unitsSold > 15 ? 1200 : 1440, // Partial stockout if high sales
        stockoutEvents: unitsSold > 15 ? 1 : 0,
        averageStock: product.currentStock,
        openingStock: product.currentStock,
        closingStock: product.currentStock - unitsSold,
        restockQuantity: 0,
        createdAt: date,
        updatedAt: date,
      })
    }

    return { salesHistory, stockAvailability }
  }
}

// Export singleton instance
export const stockCoverageService = new StockCoverageService()
