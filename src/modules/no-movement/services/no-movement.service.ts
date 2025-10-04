/**
 * No Movement Products Service
 * Business logic for analyzing products without movement
 */

import { noMovementRepository } from '../repositories/no-movement.repository'
import type {
  NoMovementConfig,
  NoMovementResult,
  ProductMovement,
  ActionRecommendation,
} from '../types'
import redis from '@/modules/core/services/redis'
// Import telemetry directly
let telemetry: any = null
if (typeof window === 'undefined') {
  import('@/modules/core/services/telemetry').then(module => {
    telemetry = module.telemetry
  })
}

export class NoMovementService {
  private readonly CACHE_PREFIX = 'no_movement:analysis:'
  private readonly CACHE_TTL = 1800 // 30 minutes

  /**
   * Analyze products without movement
   */
  async analyzeProducts(config: NoMovementConfig): Promise<NoMovementResult> {
    const startTime = Date.now()
    
    // Try to get from cache
    const cacheKey = this.getCacheKey(config)
    const cached = await this.getFromCache(cacheKey)
    if (cached) {
      telemetry?.recordEvent('no_movement_analysis_cache_hit', { 
        organizationId: config.organizationId 
      })
      return cached
    }

    // Calculate date range
    const endDate = config.period.endDate || new Date()
    const startDate = config.period.startDate || (() => {
      const date = new Date(endDate)
      date.setDate(date.getDate() - config.period.days)
      return date
    })()

    if (this.hasExplicitEmptySelection(config.filters)) {
      const emptyResult = this.buildEmptyResult(config, startDate, endDate, cacheKey)
      await this.saveToCache(cacheKey, emptyResult)
      return emptyResult
    }

    // Get products with sales history
    const productsData = await noMovementRepository.getProductsWithSalesHistory(
      config.organizationId,
      config
    )

    // Get products without any sales
    const productsWithoutSales = await noMovementRepository.getProductsWithoutSales(
      config.organizationId,
      startDate,
      endDate,
      config.filters,
      config.options
    )

    // Determine threshold for low movement based on daily sales
    const thresholdDailySales = this.resolveDailyThreshold(config)

    // Analyze each product
    const productMovements: ProductMovement[] = []
    
    // Process products with sales history
    for (const { product, salesHistory } of productsData) {
      const movement = await this.analyzeProductMovement(
        product,
        salesHistory,
        startDate,
        endDate,
        config,
        thresholdDailySales
      )
      productMovements.push(movement)
    }

    // Process products without any sales
    for (const product of productsWithoutSales) {
      const movement = await this.analyzeProductMovement(
        product,
        [],
        startDate,
        endDate,
        config,
        thresholdDailySales
      )
      productMovements.push(movement)
    }

    // Filter based on threshold
    const filteredMovements = productMovements.filter(pm => {
      if (!config.options.includeZeroStock && pm.currentStock <= 0) {
        return false
      }

      if (pm.movementStatus === 'no_movement') return true
      if (!config.threshold.considerAsLow) {
        return false
      }

      return pm.averageDailySales <= thresholdDailySales
    })

    // Sort by days without movement (descending)
    filteredMovements.sort((a, b) => b.daysWithoutMovement - a.daysWithoutMovement)

    // Calculate summary metrics
    const summary = this.calculateSummary(filteredMovements)

    // Group data if requested
    const groupedData = config.options.groupByWarehouse
      ? this.groupByWarehouse(filteredMovements)
      : undefined

    const result: NoMovementResult = {
      config,
      analysisDate: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
      summary,
      products: filteredMovements,
      groupedByWarehouse: groupedData,
      metadata: {
        processingTime: Date.now() - startTime,
        cached: false,
        cacheKey,
      }
    }

    // Cache the result
    await this.saveToCache(cacheKey, result)

    // Record telemetry
    telemetry?.recordEvent('no_movement_analysis_completed', {
      organizationId: config.organizationId,
      productsAnalyzed: productMovements.length,
      productsWithoutMovement: summary.productsWithoutMovement,
      processingTime: result.metadata.processingTime,
    })

    telemetry?.recordMetric('no_movement_capital_immobilized', summary.totalCapitalImmobilized, {
      organizationId: config.organizationId,
    })

    return result
  }

  /**
   * Analyze individual product movement
   */
  private async analyzeProductMovement(
    product: any,
    salesHistory: any[],
    startDate: Date,
    endDate: Date,
    config: NoMovementConfig,
    thresholdDailySales: number
  ): Promise<ProductMovement> {
    // Calculate total units sold and revenue
    const totalUnitsSold = salesHistory.reduce((sum, sale) => sum + sale.unitsSold, 0)
    const totalRevenue = salesHistory.reduce((sum, sale) => sum + Number(sale.revenue), 0)

    // Calculate days in period
    const daysInPeriod = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    )
    
    // Calculate average daily sales
    const averageDailySales = totalUnitsSold / daysInPeriod

    // Find last sale date
    const lastSaleDate = salesHistory.length > 0
      ? new Date(Math.max(...salesHistory.map(s => s.date.getTime())))
      : null

    // Calculate days without movement
    const daysWithoutMovement = lastSaleDate
      ? Math.ceil((endDate.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
      : daysInPeriod

    // Determine movement status
    let movementStatus: ProductMovement['movementStatus'] = 'normal'
    if (totalUnitsSold === 0) {
      movementStatus = 'no_movement'
    } else if (
      config.threshold.considerAsLow &&
      averageDailySales <= thresholdDailySales
    ) {
      movementStatus = 'low_movement'
    }

    // Calculate stock value
    const stockValue = product.currentStock * product.costPrice

    // Calculate financial impact
    const capitalImmobilized = stockValue
    const opportunityCost = this.calculateOpportunityCost(
      stockValue, 
      daysWithoutMovement,
      config.options.opportunityCostRate
    )
    const storageTime = daysWithoutMovement

    // Determine suggested action
    const { action, priority, reason } = this.determineSuggestedAction(
      product,
      totalUnitsSold,
      daysWithoutMovement,
      stockValue
    )

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      warehouse: product.warehouse,
      supplier: product.supplier,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stockValue,
      totalUnitsSold,
      totalRevenue,
      averageDailySales,
      lastSaleDate,
      daysWithoutMovement,
      movementStatus,
      capitalImmobilized,
      opportunityCost,
      storageTime,
      suggestedAction: action,
      actionPriority: priority,
      actionReason: reason,
    }
  }

  /**
   * Calculate opportunity cost
   * Using proportional monthly simple calculation
   * Formula: Capital * Monthly Rate * (Days/30)
   * 
   * @param stockValue - The capital immobilized in stock
   * @param daysWithoutMovement - Number of days without movement
   * @param rateConfig - Configuration for the opportunity cost rate
   */
  private calculateOpportunityCost(
    stockValue: number, 
    daysWithoutMovement: number,
    rateConfig?: {
      type: 'cdi' | 'selic' | 'working_capital' | 'manual'
      value: number
      description?: string
    }
  ): number {
    // Default to 1% monthly if no config provided
    const config = rateConfig || {
      type: 'manual' as const,
      value: 1,
      description: 'Taxa padrão de 1% ao mês'
    }
    
    // Get the monthly rate based on type
    let monthlyRate: number
    
    switch (config.type) {
      case 'cdi':
        // CDI current rate (would be fetched from external source in production)
        // Using approximate CDI rate for demonstration
        monthlyRate = config.value / 100 // Convert percentage to decimal
        break
      
      case 'selic':
        // SELIC rate (would be fetched from external source in production)
        monthlyRate = config.value / 100
        break
      
      case 'working_capital':
        // Working capital cost rate
        monthlyRate = config.value / 100
        break
      
      case 'manual':
      default:
        // Manual rate defined by user
        monthlyRate = config.value / 100
        break
    }
    
    // Calculate using proportional monthly approach
    // Formula: Capital * Monthly Rate * (Days/30)
    const proportionalDays = daysWithoutMovement / 30 // Convert days to month fraction
    return stockValue * monthlyRate * proportionalDays
  }

  /**
   * Build empty analysis result (used when filters explicitly exclude all data)
   */
  private buildEmptyResult(
    config: NoMovementConfig,
    startDate: Date,
    endDate: Date,
    cacheKey: string,
  ): NoMovementResult {
    return {
      config,
      analysisDate: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
      summary: {
        totalProducts: 0,
        productsWithoutMovement: 0,
        productsWithLowMovement: 0,
        totalCapitalImmobilized: 0,
        totalOpportunityCost: 0,
        averageDaysWithoutMovement: 0,
      },
      products: [],
      groupedByWarehouse: config.options.groupByWarehouse ? {} : undefined,
      metadata: {
        processingTime: 0,
        cached: false,
        cacheKey,
      },
    }
  }

  /**
   * Resolve threshold for low movement based on daily sales
   */
  private resolveDailyThreshold(config: NoMovementConfig): number {
    if (
      typeof config.threshold.minUnitsPerDay === 'number' &&
      Number.isFinite(config.threshold.minUnitsPerDay)
    ) {
      return Math.max(0, config.threshold.minUnitsPerDay)
    }

    if (
      typeof config.threshold.minUnits === 'number' &&
      Number.isFinite(config.threshold.minUnits)
    ) {
      const periodDays = Math.max(1, config.period.days)
      return Math.max(0, config.threshold.minUnits / periodDays)
    }

    return 0.1
  }

  /**
   * Check if filters contain explicit empty selections
   */
  private hasExplicitEmptySelection(filters: NoMovementConfig['filters']): boolean {
    const isExplicitEmpty = (values?: string[]) => values !== undefined && values.length === 0

    return (
      isExplicitEmpty(filters.depositos) ||
      isExplicitEmpty(filters.marcas) ||
      isExplicitEmpty(filters.fornecedores) ||
      isExplicitEmpty(filters.categorias) ||
      isExplicitEmpty(filters.skus)
    )
  }

  /**
   * Determine suggested action for a product
   */
  private determineSuggestedAction(
    product: any,
    totalUnitsSold: number,
    daysWithoutMovement: number,
    stockValue: number
  ): {
    action: ProductMovement['suggestedAction']
    priority: ProductMovement['actionPriority']
    reason: string
  } {
    // No movement for more than 180 days
    if (daysWithoutMovement > 180) {
      return {
        action: 'return',
        priority: 'critical',
        reason: 'Produto sem movimento há mais de 6 meses. Considere devolução ao fornecedor.'
      }
    }

    // No movement for more than 90 days with high stock value
    if (daysWithoutMovement > 90 && stockValue > 5000) {
      return {
        action: 'promote',
        priority: 'high',
        reason: 'Alto valor em estoque parado. Recomenda-se promoção agressiva.'
      }
    }

    // No movement for more than 60 days
    if (daysWithoutMovement > 60) {
      if (product.currentStock > product.minimumStock * 3) {
        return {
          action: 'transfer',
          priority: 'medium',
          reason: 'Excesso de estoque. Considere transferência para outra loja.'
        }
      }
      return {
        action: 'promote',
        priority: 'medium',
        reason: 'Produto parado há mais de 2 meses. Considere promoção.'
      }
    }

    // Low movement
    if (totalUnitsSold > 0 && totalUnitsSold <= 5) {
      return {
        action: 'monitor',
        priority: 'low',
        reason: 'Baixa movimentação. Monitorar tendência nos próximos 30 dias.'
      }
    }

    // Very low stock with no movement
    if (product.currentStock <= product.minimumStock && daysWithoutMovement > 30) {
      return {
        action: 'discontinue',
        priority: 'medium',
        reason: 'Baixo estoque sem demanda. Considere descontinuar o produto.'
      }
    }

    return {
      action: 'monitor',
      priority: 'low',
      reason: 'Acompanhar evolução da demanda.'
    }
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummary(products: ProductMovement[]): NoMovementResult['summary'] {
    const productsWithoutMovement = products.filter(p => p.movementStatus === 'no_movement').length
    const productsWithLowMovement = products.filter(p => p.movementStatus === 'low_movement').length
    const totalCapitalImmobilized = products.reduce((sum, p) => sum + p.capitalImmobilized, 0)
    const totalOpportunityCost = products.reduce((sum, p) => sum + p.opportunityCost, 0)
    
    const averageDaysWithoutMovement = products.length > 0
      ? products.reduce((sum, p) => sum + p.daysWithoutMovement, 0) / products.length
      : 0

    return {
      totalProducts: products.length,
      productsWithoutMovement,
      productsWithLowMovement,
      totalCapitalImmobilized,
      totalOpportunityCost,
      averageDaysWithoutMovement,
    }
  }

  /**
   * Group products by warehouse
   */
  private groupByWarehouse(products: ProductMovement[]): Record<string, ProductMovement[]> {
    return products.reduce((acc, product) => {
      const warehouse = product.warehouse || 'Sem Depósito'
      if (!acc[warehouse]) {
        acc[warehouse] = []
      }
      acc[warehouse].push(product)
      return acc
    }, {} as Record<string, ProductMovement[]>)
  }

  /**
   * Generate cache key
   */
  private getCacheKey(config: NoMovementConfig): string {
    const configHash = Buffer.from(JSON.stringify({
      organizationId: config.organizationId,
      period: config.period,
      threshold: config.threshold,
      filters: config.filters,
      options: config.options,
    })).toString('base64')
    return `${this.CACHE_PREFIX}${config.organizationId}:${configHash}`
  }

  /**
   * Get from cache
   */
  private async getFromCache(key: string): Promise<NoMovementResult | null> {
    if (!redis) return null

    try {
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.error('Cache get error:', error)
    }

    return null
  }

  /**
   * Save to cache
   */
  private async saveToCache(key: string, data: NoMovementResult): Promise<void> {
    if (!redis) return

    try {
      await redis.setex(key, this.CACHE_TTL, JSON.stringify(data))
    } catch (error) {
      console.error('Cache save error:', error)
    }
  }

  /**
   * Generate action recommendations
   */
  async generateRecommendations(products: ProductMovement[]): Promise<ActionRecommendation[]> {
    return products.map(product => ({
      productId: product.productId,
      action: product.suggestedAction,
      priority: product.actionPriority,
      reason: product.actionReason,
      estimatedRecovery: product.capitalImmobilized * 0.7, // Assume 70% recovery
      implementationSteps: this.getImplementationSteps(product.suggestedAction),
      expectedOutcome: this.getExpectedOutcome(product.suggestedAction, product),
    }))
  }

  /**
   * Get implementation steps for action
   */
  private getImplementationSteps(action: ProductMovement['suggestedAction']): string[] {
    const steps: Record<ProductMovement['suggestedAction'], string[]> = {
      promote: [
        'Definir desconto atrativo (20-40%)',
        'Criar campanha de marketing direcionada',
        'Destacar produto na vitrine/site',
        'Monitorar vendas diariamente',
      ],
      transfer: [
        'Identificar lojas com melhor desempenho para o produto',
        'Calcular quantidade ideal para transferência',
        'Programar logística de transferência',
        'Atualizar sistemas de estoque',
      ],
      return: [
        'Negociar devolução com fornecedor',
        'Preparar documentação necessária',
        'Organizar logística reversa',
        'Processar crédito ou troca',
      ],
      discontinue: [
        'Liquidar estoque remanescente',
        'Remover produto do catálogo',
        'Notificar equipe de vendas',
        'Avaliar produtos substitutos',
      ],
      monitor: [
        'Configurar alertas de vendas',
        'Revisar semanalmente',
        'Ajustar estratégia conforme necessário',
      ],
    }
    return steps[action]
  }

  /**
   * Get expected outcome for action
   */
  private getExpectedOutcome(
    action: ProductMovement['suggestedAction'],
    product: ProductMovement
  ): string {
    const outcomes: Record<ProductMovement['suggestedAction'], string> = {
      promote: `Redução de ${product.currentStock} unidades em estoque e recuperação de R$ ${(product.capitalImmobilized * 0.7).toFixed(2)}`,
      transfer: `Melhor distribuição do estoque e potencial aumento de vendas em 30%`,
      return: `Recuperação de ${product.capitalImmobilized.toFixed(2)} em capital e liberação de espaço`,
      discontinue: `Eliminação de custos de armazenagem e foco em produtos mais rentáveis`,
      monitor: `Identificação de tendência em 30 dias para tomada de decisão informada`,
    }
    return outcomes[action]
  }
}

export const noMovementService = new NoMovementService()
