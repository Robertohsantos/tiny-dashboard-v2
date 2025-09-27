/**
 * Purchase Requirement Service
 * Business logic layer for purchase requirement/necessity calculations
 */

import { PurchaseRequirementCalculator } from '@/modules/purchase-requirement/calculator'
import { stockCoverageService } from '@/modules/stock-coverage'
import { batchProcess } from '@/modules/core/utils/concurrency'
import type {
  PurchaseRequirementConfig,
  PurchaseRequirementInput,
  PurchaseRequirementResult,
  PurchaseBatchResult,
  PurchaseRequirementFilters,
  OpenPurchaseOrder,
  SupplierAggregation,
  WarehouseAggregation,
  PurchaseSimulation,
  CalculationMethod,
} from '@/modules/purchase-requirement/types'
import {
  PurchaseRequirementCalculationError,
  PurchaseRequirementError,
} from '@/modules/purchase-requirement/types'
import { prisma } from '@/modules/core/services/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { ENV_CONFIG } from '@/modules/core/config/environment'
import {
  produtosDataAdapter,
  type ProductWithCoverage,
} from '@/modules/produtos/services/produtos-data-adapter'
import type { StockCoverageResult } from '@/modules/stock-coverage/types'

class PurchaseRequirementService {
  private calculator: PurchaseRequirementCalculator | null = null
  private defaultConfig: PurchaseRequirementConfig = {
    coverageDays: 30,
    leadTimeDays: 7, // Added default lead time
    method: 'RAPID' as CalculationMethod,
    filters: {},
    leadTimeStrategy: 'P50' as const,
    includeStockReserve: true,
    stockReserveDays: 7,
    respectPackSize: true, // Pack size mantido
    enableParallel: true,
    maxConcurrency: 5,
    showOnlyNeeded: true,
    consolidateBySupplier: false,
  }

  /**
   * Initialize calculator with configuration
   */
  private initCalculator(config: Partial<PurchaseRequirementConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config }
    this.calculator = new PurchaseRequirementCalculator(finalConfig)
  }

  /**
   * Calculate purchase requirement for a single product
   */
  async calculateRequirement(
    productId: string,
    config: Partial<PurchaseRequirementConfig>,
  ): Promise<PurchaseRequirementResult> {
    // Initialize calculator with config
    this.initCalculator(config)

    // Get product with stock coverage data
    const product = await this.getProductWithData(productId)
    if (!product) {
      throw new PurchaseRequirementCalculationError(
        PurchaseRequirementError.NO_PRODUCTS_FOUND,
        'Product not found',
        { productId },
      )
    }

    // Get stock coverage data
    const coverage = await stockCoverageService.calculateCoverage(
      productId,
      true,
    )

    // Get open purchase orders
    const openOrders = await this.getOpenPurchaseOrders(productId)

    // Prepare input for calculator
    const input = this.prepareInput(product, coverage, openOrders, config)

    // Calculate requirement
    return this.calculator!.calculate(input)
  }

  /**
   * Calculate purchase requirements for multiple products (batch)
   */
  async calculateBatch(
    organizationId: string,
    config: Partial<PurchaseRequirementConfig>,
  ): Promise<PurchaseBatchResult> {
    const startTime = Date.now()

    // Initialize calculator
    this.initCalculator(config)

    // Get products based on filters
    const products = await this.getFilteredProducts(
      organizationId,
      config.filters || {},
    )

    if (products.length === 0) {
      const calculationTime = Date.now() - startTime
      const finalConfig: PurchaseRequirementConfig = {
        ...this.defaultConfig,
        ...config,
        filters: config.filters || {},
      }

      return {
        totalProducts: 0,
        productsNeedingOrder: 0,
        totalInvestment: 0,
        products: [],
        bySupplier: [],
        byWarehouse: [],
        calculationTime,
        method: config.method || ('RAPID' as CalculationMethod),
        config: finalConfig,
        timestamp: new Date(),
        errors: [],
      }
    }

    // Process products in parallel batches
    const results: PurchaseRequirementResult[] = []
    const errors: Array<{ sku: string; error: string }> = []

    if (config.enableParallel !== false) {
      // Parallel processing
      const batchResults = await batchProcess(
        products,
        async (product) => {
          const coverage = await stockCoverageService.calculateCoverage(
            product.id,
            true,
          )
          const openOrders = await this.getOpenPurchaseOrders(product.id)
          const input = this.prepareInput(
            product,
            coverage,
            openOrders,
            config,
          )
          return this.calculator!.calculate(input)
        },
        {
          concurrency: config.maxConcurrency || 5,
          onError: (product, error) => {
            errors.push({
              sku: product.sku,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          },
        },
      )

      results.push(...batchResults.successful)
    } else {
      // Sequential processing
      for (const product of products) {
        try {
          const coverage = await stockCoverageService.calculateCoverage(
            product.id,
            true,
          )
          const openOrders = await this.getOpenPurchaseOrders(product.id)
          const input = this.prepareInput(
            product,
            coverage,
            openOrders,
            config,
          )
          const result = this.calculator!.calculate(input)
          results.push(result)
        } catch (error) {
          errors.push({
            sku: product.sku,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    // Filter results based on config
    let filteredResults = results
    if (config.showOnlyNeeded !== false) {
      filteredResults = results.filter((r) => r.suggestedQuantity > 0)
    }

    // Aggregate by supplier and warehouse
    const bySupplier = this.aggregateBySupplier(filteredResults)
    const byWarehouse = this.aggregateByWarehouse(filteredResults)

    // Calculate totals
    const totalInvestment = filteredResults.reduce(
      (sum, r) => sum + (r.estimatedInvestment || 0),
      0,
    )
    const productsNeedingOrder = filteredResults.filter(
      (r) => r.suggestedQuantity > 0,
    ).length

    return {
      totalProducts: products.length,
      productsNeedingOrder,
      totalInvestment,
      products: filteredResults,
      bySupplier,
      byWarehouse,
      calculationTime: Date.now() - startTime,
      method: config.method || ('RAPID' as CalculationMethod),
      config: { ...this.defaultConfig, ...config },
      timestamp: new Date(),
      errors,
    }
  }

  /**
   * Get open purchase orders for a product
   */
  getOpenPurchaseOrders(productId: string): Promise<OpenPurchaseOrder[]> {
    // For now, return mock data if in development
    if (ENV_CONFIG.useMockData) {
      return Promise.resolve(this.generateMockPurchaseOrders(productId))
    }

    // In production, this would query actual PurchaseOrder table
    // For now, return empty array as table doesn't exist yet
    return Promise.resolve([])
  }

  /**
   * Get filtered products based on criteria
   * Uses data adapter to unify mock and production data sources
   */
  private async getFilteredProducts(
    organizationId: string,
    filters: PurchaseRequirementFilters,
  ): Promise<ProductWithCoverage[]> {
    // Use the data adapter which handles both mock and production data
    return produtosDataAdapter.getFilteredProducts(organizationId, filters)
  }

  /**
   * Get product with all necessary data
   */
  private async getProductWithData(
    productId: string,
  ): Promise<ProductWithCoverage | null> {
    return prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockCoverages: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    })
  }

  /**
   * Prepare input for calculator
   */
  private prepareInput(
    product: ProductWithCoverage,
    coverage: StockCoverageResult,
    openOrders: OpenPurchaseOrder[],
    config: Partial<PurchaseRequirementConfig>,
  ): PurchaseRequirementInput {
    const { stockCoverages, ...productBase } = product
    const latestCoverage = stockCoverages?.[0] ?? null

    const resolvedProduct = {
      ...productBase,
      stockCoverage: latestCoverage ?? null,
    }

    const dailyDemand = coverage.demandForecast ?? 0
    const demandStdDev = coverage.demandStdDev ?? 0
    const trendFactor = coverage.trendFactor ?? 1
    const seasonalityIndex = coverage.seasonalityIndex ?? 1

    const leadTimeStrategy =
      config.leadTimeStrategy ?? this.defaultConfig.leadTimeStrategy
    const defaultLeadTime =
      config.leadTimeDays ?? this.defaultConfig.leadTimeDays ?? 0
    const productLeadTime = Number(product.leadTimeDays ?? defaultLeadTime)
    const baseLeadTime = Number.isFinite(productLeadTime)
      ? Math.max(productLeadTime, 1)
      : Math.max(defaultLeadTime, 1)
    const leadTimeDays =
      leadTimeStrategy === 'P90'
        ? Math.max(Math.round(baseLeadTime * 1.5), 1)
        : baseLeadTime

    const currentStock = Number(product.currentStock ?? 0)
    const allocatedStock = openOrders.reduce(
      (total, order) => total + (order.pendingQuantity ?? 0),
      0,
    )
    const packSize = Math.max(Number(product.packSize ?? 1), 1)

    return {
      product: resolvedProduct,
      currentStock,
      allocatedStock,
      openPurchaseOrders: openOrders,
      dailyDemand,
      demandStdDev,
      trendFactor,
      seasonalityIndex,
      leadTimeDays,
      packSize,
    }
  }

  /**
   * Aggregate results by supplier
   */
  private aggregateBySupplier(
    results: PurchaseRequirementResult[],
  ): SupplierAggregation[] {
    const supplierMap = new Map<string, SupplierAggregation>()

    for (const result of results) {
      if (!supplierMap.has(result.supplier)) {
        supplierMap.set(result.supplier, {
          supplier: result.supplier,
          productCount: 0,
          totalQuantity: 0,
          totalInvestment: 0,
          meetsMinimumOrder: true,
          products: [],
        })
      }

      const agg = supplierMap.get(result.supplier)!
      agg.productCount++
      agg.totalQuantity += result.suggestedQuantity
      agg.totalInvestment += result.estimatedInvestment || 0
      agg.products.push({
        sku: result.sku,
        name: result.name,
        quantity: result.suggestedQuantity,
        cost: result.estimatedCost || 0,
      })
    }

    return Array.from(supplierMap.values())
  }

  /**
   * Aggregate results by warehouse
   */
  private aggregateByWarehouse(
    results: PurchaseRequirementResult[],
  ): WarehouseAggregation[] {
    const warehouseMap = new Map<string, WarehouseAggregation>()

    for (const result of results) {
      if (!warehouseMap.has(result.warehouse)) {
        warehouseMap.set(result.warehouse, {
          warehouse: result.warehouse,
          productCount: 0,
          totalQuantity: 0,
          totalInvestment: 0,
          criticalProducts: 0,
          products: [],
        })
      }

      const agg = warehouseMap.get(result.warehouse)!
      agg.productCount++
      agg.totalQuantity += result.suggestedQuantity
      agg.totalInvestment += result.estimatedInvestment || 0
      if (
        result.stockoutRisk === 'HIGH' ||
        result.stockoutRisk === 'CRITICAL'
      ) {
        agg.criticalProducts++
      }
      agg.products.push({
        sku: result.sku,
        name: result.name,
        quantity: result.suggestedQuantity,
        risk: result.stockoutRisk,
      })
    }

    return Array.from(warehouseMap.values())
  }

  /**
   * Simulate different purchase scenarios
   */
  async simulateScenarios(
    organizationId: string,
    simulation: PurchaseSimulation,
  ): Promise<Map<string, PurchaseBatchResult>> {
    const results = new Map<string, PurchaseBatchResult>()

    for (const scenario of simulation.scenarios) {
      const config: Partial<PurchaseRequirementConfig> = {
        coverageDays: scenario.coverageDays,
        leadTimeStrategy: scenario.leadTimeStrategy,
        includeStockReserve: scenario.includeStockReserve,
      }

      const result = await this.calculateBatch(organizationId, config)
      results.set(scenario.name, result)
    }

    return results
  }

  /**
   * Generate mock purchase orders for development
   */
  private generateMockPurchaseOrders(productId: string): OpenPurchaseOrder[] {
    if (!ENV_CONFIG.useMockData) return []

    // Generate 0-2 random open orders
    const count = Math.floor(Math.random() * 3)
    const orders: OpenPurchaseOrder[] = []

    for (let i = 0; i < count; i++) {
      const quantity = Math.floor(Math.random() * 100) + 50
      const received = Math.floor(Math.random() * quantity * 0.3)
      const daysUntilArrival = Math.floor(Math.random() * 30) + 5

      orders.push({
        id: `po-${productId}-${i}`,
        orderNumber: `PO-2024-${Math.floor(Math.random() * 10000)}`,
        productId,
        sku: `SKU-${productId}`,
        quantity,
        receivedQuantity: received,
        pendingQuantity: quantity - received,
        eta: new Date(Date.now() + daysUntilArrival * 24 * 60 * 60 * 1000),
        supplierId: 'supplier-1',
        supplier: 'Fornecedor Exemplo',
        status: received > 0 ? 'PARTIAL' : 'PENDING',
      })
    }

    return orders
  }

  /**
   * Validate supplier constraints for an order
   */
  validateSupplierConstraints(
    supplier: string,
    orders: Array<{ sku: string; quantity: number }>,
  ): Promise<{
    valid: boolean
    totalValue: number
    meetsMinimum: boolean
    minimumRequired?: number
    issues: string[]
  }> {
    // This would check actual supplier constraints
    // For now, return mock validation
    const totalValue = orders.reduce((sum, o) => sum + o.quantity * 10, 0) // Mock price
    const minimumRequired = 1000
    const meetsMinimum = totalValue >= minimumRequired

    return Promise.resolve({
      valid: meetsMinimum,
      totalValue,
      meetsMinimum,
      minimumRequired,
      issues: meetsMinimum
        ? []
        : ['Pedido mínimo de R$ ' + minimumRequired + ' não atingido'],
    })
  }

  /**
   * Get products at risk of stockout
   */
  async getStockoutRiskProducts(
    organizationId: string,
    riskThreshold: number = 0.5,
  ): Promise<PurchaseRequirementResult[]> {
    const config: Partial<PurchaseRequirementConfig> = {
      showOnlyNeeded: false,
      method: 'RAPID' as CalculationMethod,
    }

    const batch = await this.calculateBatch(organizationId, config)

    return batch.products.filter((p) => {
      const riskScore =
        p.stockoutRisk === 'CRITICAL'
          ? 1.0
          : p.stockoutRisk === 'HIGH'
            ? 0.75
            : p.stockoutRisk === 'MEDIUM'
              ? 0.5
              : 0.25
      return riskScore >= riskThreshold
    })
  }
}

// Export singleton instance
export const purchaseRequirementService = new PurchaseRequirementService()
