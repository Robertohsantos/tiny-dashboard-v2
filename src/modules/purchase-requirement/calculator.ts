/**
 * Purchase Requirement Calculator
 * Implements both rapid (Order-Up-To) and time-phased (MRP) calculation methods
 */

import type {
  PurchaseRequirementConfig,
  PurchaseRequirementInput,
  PurchaseRequirementResult,
  TimePhaseProjection,
  PurchaseAlert,
} from './types'
import {
  PurchaseRequirementError,
  PurchaseRequirementCalculationError,
} from './types'

export class PurchaseRequirementCalculator {
  private config: PurchaseRequirementConfig

  constructor(config: PurchaseRequirementConfig) {
    this.config = config
    this.validateConfig()
  }

  /**
   * Validate configuration parameters
   */
  private validateConfig(): void {
    if (this.config.coverageDays <= 0) {
      throw new PurchaseRequirementCalculationError(
        PurchaseRequirementError.INVALID_CONFIGURATION,
        'Coverage days must be greater than 0',
      )
    }

    if (this.config.maxConcurrency <= 0) {
      throw new PurchaseRequirementCalculationError(
        PurchaseRequirementError.INVALID_CONFIGURATION,
        'Max concurrency must be greater than 0',
      )
    }
  }

  /**
   * Main calculation method - chooses between RAPID and TIME_PHASED based on config
   */
  calculate(input: PurchaseRequirementInput): PurchaseRequirementResult {
    // Validate input data
    this.validateInput(input)

    // Choose calculation method based on config
    if (this.config.method === 'RAPID') {
      return this.calculateRapid(input)
    } else {
      return this.calculateTimePhasedMRP(input)
    }
  }

  /**
   * Validate input data
   */
  private validateInput(input: PurchaseRequirementInput): void {
    if (!input.product) {
      throw new PurchaseRequirementCalculationError(
        PurchaseRequirementError.INSUFFICIENT_DATA,
        'Product data is required',
      )
    }

    if (input.dailyDemand < 0) {
      throw new PurchaseRequirementCalculationError(
        PurchaseRequirementError.INVALID_CONFIGURATION,
        'Daily demand cannot be negative',
      )
    }
  }

  /**
   * RAPID METHOD: Simple Order-Up-To calculation
   * Fast and straightforward method for purchase requirement calculation
   */
  private calculateRapid(
    input: PurchaseRequirementInput,
  ): PurchaseRequirementResult {
    const {
      product,
      currentStock,
      allocatedStock,
      openPurchaseOrders,
      dailyDemand,
      demandStdDev,
      trendFactor,
      seasonalityIndex,
    } = input

    // Get lead time from config
    const leadTimeDays = this.config.leadTimeDays
    const packSize = Math.max(input.packSize ?? product.packSize ?? 1, 1)

    // Calculate available stock
    const availableStock = currentStock - allocatedStock

    // Sum open purchase orders
    const openOrderQuantity = openPurchaseOrders.reduce(
      (sum, po) => sum + po.pendingQuantity,
      0,
    )

    // Calculate inventory position
    const inventoryPosition = availableStock + openOrderQuantity

    // Apply trend and seasonality adjustments to demand
    const adjustedDailyDemand = dailyDemand * trendFactor * seasonalityIndex

    // Calculate demand during lead time + coverage period
    const demandDuringLeadTime = adjustedDailyDemand * leadTimeDays
    const demandDuringCoverage = adjustedDailyDemand * this.config.coverageDays

    // Add safety stock if configured
    let safetyStock = 0
    if (this.config.includeStockReserve) {
      const safetyDays = this.config.stockReserveDays || 7
      safetyStock = adjustedDailyDemand * safetyDays
    }

    // Calculate target inventory level
    const targetInventory =
      demandDuringLeadTime + demandDuringCoverage + safetyStock

    // Calculate required quantity (can be negative if overstock)
    const requiredQuantity = Math.max(0, targetInventory - inventoryPosition)

    // Apply pack size if configured
    let suggestedQuantity = requiredQuantity
    if (this.config.respectPackSize !== false && packSize > 1) {
      suggestedQuantity = this.calculatePackSize(requiredQuantity, packSize)
    }

    // Calculate coverage metrics
    const currentCoverageDays = availableStock / adjustedDailyDemand

    // Check for gaps
    const gapBeforeLeadTime = Math.max(0, demandDuringLeadTime - availableStock)
    const needsExpediting = gapBeforeLeadTime > 0

    // Calculate dates
    const today = new Date()
    const stockoutDate =
      currentCoverageDays > 0
        ? new Date(today.getTime() + currentCoverageDays * 24 * 60 * 60 * 1000)
        : undefined
    const suggestedOrderDate = today // Order now for rapid method
    const expectedArrivalDate = new Date(
      today.getTime() + leadTimeDays * 24 * 60 * 60 * 1000,
    )

    // Assess risk
    const stockoutRisk = this.assessStockoutRisk(
      currentCoverageDays,
      leadTimeDays,
    )

    // Calculate confidence
    const confidence = this.calculateConfidence(input)

    // Generate alerts
    const alerts = this.generateAlerts(input, {
      needsExpediting,
      currentCoverageDays,
      leadTimeDays,
      suggestedQuantity,
      requiredQuantity,
    })

    // Return result
    return {
      // Product identification
      sku: product.sku,
      name: product.name || product.sku,
      brand: product.brand || 'Unknown',
      supplier: product.supplier || 'Unknown',
      warehouse: product.warehouse || 'Default',

      // Current position
      currentStock,
      allocatedStock,
      availableStock,
      openOrderQuantity,
      inventoryPosition,

      // Demand metrics
      dailyDemand: adjustedDailyDemand,
      currentCoverageDays,
      targetCoverageDays: this.config.coverageDays,
      leadTimeDays,
      demandDuringLeadTime,

      // Calculated quantities
      targetInventory,
      requiredQuantity,
      suggestedQuantity,
      packSize,

      // Gap analysis
      gapBeforeLeadTime,
      needsExpediting,

      // Dates
      stockoutDate,
      suggestedOrderDate,
      expectedArrivalDate,

      // Risk assessment
      stockoutRisk,
      confidence,

      // Financial
      estimatedCost: suggestedQuantity * Number(product.costPrice),
      estimatedInvestment: suggestedQuantity * Number(product.costPrice),

      // Alerts
      alerts,
    }
  }

  /**
   * DEPRECATED: Rapid method - kept for reference but not used
   */
  private calculateRapid_DEPRECATED(
    input: PurchaseRequirementInput,
  ): PurchaseRequirementResult {
    const {
      product,
      currentStock,
      allocatedStock,
      openPurchaseOrders,
      dailyDemand,
      demandStdDev,
      trendFactor,
      leadTimeDays,
    } = input

    // Calculate available stock
    const availableStock = currentStock - allocatedStock

    // Sum open purchase orders within relevant horizon
    const horizonEnd = this.config.coverageDays + leadTimeDays
    const relevantPOs = openPurchaseOrders.filter((po) => {
      const daysUntilArrival = Math.ceil(
        (po.eta.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
      return daysUntilArrival <= horizonEnd
    })
    const openOrderQuantity = relevantPOs.reduce(
      (sum, po) => sum + po.pendingQuantity,
      0,
    )

    // Calculate inventory position
    const inventoryPosition = availableStock + openOrderQuantity

    const packSize = Math.max(input.packSize ?? product.packSize ?? 1, 1)

    // Apply trend adjustment to demand
    const adjustedDailyDemand = dailyDemand * trendFactor

    // Calculate demand during protected period (lead time + coverage)
    const protectedPeriod = leadTimeDays + this.config.coverageDays
    const totalDemand = adjustedDailyDemand * protectedPeriod

    // Add safety stock if configured
    let safetyStock = 0
    if (this.config.includeStockReserve) {
      const safetyDays = this.config.stockReserveDays || 7
      safetyStock = adjustedDailyDemand * safetyDays
    }

    // Calculate target inventory level
    const targetInventory = totalDemand + safetyStock

    // Calculate required quantity (can be negative if overstock)
    const requiredQuantity = Math.max(0, targetInventory - inventoryPosition)

    // DEPRECATED method doesn't apply MOQ or pack size constraints
    const suggestedQuantity = requiredQuantity

    // Calculate coverage metrics
    const currentCoverageDays = availableStock / adjustedDailyDemand
    const demandDuringLeadTime = adjustedDailyDemand * leadTimeDays

    // Check for gaps
    const gapBeforeLeadTime = Math.max(0, demandDuringLeadTime - availableStock)
    const needsExpediting = gapBeforeLeadTime > 0

    // Calculate dates
    const today = new Date()
    const stockoutDate =
      currentCoverageDays > 0
        ? new Date(today.getTime() + currentCoverageDays * 24 * 60 * 60 * 1000)
        : undefined
    const suggestedOrderDate = today // Order now for rapid method
    const expectedArrivalDate = new Date(
      today.getTime() + leadTimeDays * 24 * 60 * 60 * 1000,
    )

    // Assess risk
    const stockoutRisk = this.assessStockoutRisk(
      currentCoverageDays,
      leadTimeDays,
    )

    // Calculate confidence
    const confidence = this.calculateConfidence(input)

    // Generate alerts
    const alerts = this.generateAlerts(input, {
      needsExpediting,
      currentCoverageDays,
      leadTimeDays,
      requiredQuantity,
      suggestedQuantity,
    })

    return {
      // Product identification
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      supplier: product.supplier,
      warehouse: product.warehouse,

      // Current position
      currentStock,
      allocatedStock,
      availableStock,
      openOrderQuantity,
      inventoryPosition,

      // Demand and coverage
      dailyDemand: adjustedDailyDemand,
      currentCoverageDays,
      targetCoverageDays: this.config.coverageDays,

      // Lead time protection
      leadTimeDays,
      demandDuringLeadTime,

      // Calculation results
      targetInventory,
      requiredQuantity,
      suggestedQuantity,
      moq: 0, // MOQ removed
      packSize,

      // Gap analysis
      gapBeforeLeadTime,
      needsExpediting,

      // Dates
      stockoutDate,
      suggestedOrderDate,
      expectedArrivalDate,

      // Risk assessment
      stockoutRisk,
      confidence,

      // Financial
      estimatedCost: suggestedQuantity * Number(product.costPrice),
      estimatedInvestment: suggestedQuantity * Number(product.costPrice),

      // Alerts
      alerts,
    }
  }

  /**
   * TIME-PHASED METHOD: MRP-style calculation with daily projections
   * Accurate method that simulates inventory levels day by day
   */
  private calculateTimePhasedMRP(
    input: PurchaseRequirementInput,
  ): PurchaseRequirementResult {
    const {
      product,
      currentStock,
      allocatedStock,
      openPurchaseOrders,
      dailyDemand,
      demandStdDev,
      trendFactor,
      seasonalityIndex,
    } = input

    // Use lead time from config
    const leadTimeDays = this.config.leadTimeDays

    // Generate time-phased projections
    const projections = this.generateProjections(input)

    // Find the minimum projected stock level
    const minBeforeLeadTime = projections
      .filter((p) => p.dayOffset <= leadTimeDays)
      .reduce((min, p) => Math.min(min, p.netPosition), Infinity)

    const minAfterLeadTime = projections
      .filter(
        (p) =>
          p.dayOffset > leadTimeDays &&
          p.dayOffset <= leadTimeDays + this.config.coverageDays,
      )
      .reduce((min, p) => Math.min(min, p.netPosition), Infinity)

    // Calculate safety stock requirement
    let safetyStock = 0
    if (this.config.includeStockReserve) {
      const safetyDays = this.config.stockReserveDays || 7
      safetyStock = dailyDemand * safetyDays
    }

    // Calculate gap before lead time (expediting needed)
    const gapBeforeLeadTime = Math.max(0, safetyStock - minBeforeLeadTime)
    const needsExpediting = gapBeforeLeadTime > 0

    // Calculate target inventory to cover the desired period
    // This should be: demand during lead time + demand during coverage period + safety stock
    const demandDuringLeadTime = dailyDemand * leadTimeDays
    const demandDuringCoverage = dailyDemand * this.config.coverageDays
    const targetInventory =
      demandDuringLeadTime + demandDuringCoverage + safetyStock

    // Calculate required quantity based on current inventory position
    const availableStock = currentStock - allocatedStock
    const openOrderQuantity = openPurchaseOrders.reduce(
      (sum, po) => sum + po.pendingQuantity,
      0,
    )
    const inventoryPosition = availableStock + openOrderQuantity

    const requiredQuantity = Math.max(0, targetInventory - inventoryPosition)

    // Apply pack size if configured
    let suggestedQuantity = requiredQuantity
    if (
      this.config.respectPackSize !== false &&
      product.packSize &&
      product.packSize > 1
    ) {
      suggestedQuantity = this.calculatePackSize(
        requiredQuantity,
        product.packSize,
      )
    }

    // Find first stockout date
    const stockoutProjection = projections.find(
      (p) => p.netPosition < safetyStock,
    )
    const stockoutDate = stockoutProjection
      ? new Date(
          Date.now() + stockoutProjection.dayOffset * 24 * 60 * 60 * 1000,
        )
      : undefined

    // Calculate other metrics (reusing values already calculated above)
    const adjustedDailyDemand = dailyDemand * trendFactor * seasonalityIndex
    const currentCoverageDays = availableStock / adjustedDailyDemand

    // Dates
    const today = new Date()
    const suggestedOrderDate = today
    const expectedArrivalDate = new Date(
      today.getTime() + leadTimeDays * 24 * 60 * 60 * 1000,
    )

    // Risk and confidence
    const stockoutRisk = this.assessStockoutRisk(
      currentCoverageDays,
      leadTimeDays,
    )
    const confidence = this.calculateConfidence(input)

    // Alerts
    const alerts = this.generateAlerts(input, {
      needsExpediting,
      currentCoverageDays,
      leadTimeDays,
      requiredQuantity,
      suggestedQuantity,
    })

    return {
      // Product identification
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      supplier: product.supplier,
      warehouse: product.warehouse,

      // Current position
      currentStock,
      allocatedStock,
      availableStock,
      openOrderQuantity,
      inventoryPosition,

      // Demand and coverage
      dailyDemand: adjustedDailyDemand,
      currentCoverageDays,
      targetCoverageDays: this.config.coverageDays,

      // Lead time protection
      leadTimeDays,
      demandDuringLeadTime,

      // Calculation results
      targetInventory:
        safetyStock + adjustedDailyDemand * this.config.coverageDays,
      requiredQuantity,
      suggestedQuantity,
      moq: 0, // MOQ removed
      packSize: 0, // Pack size removed

      // Gap analysis
      gapBeforeLeadTime,
      needsExpediting,

      // Dates
      stockoutDate,
      suggestedOrderDate,
      expectedArrivalDate,

      // Risk assessment
      stockoutRisk,
      confidence,

      // Financial
      estimatedCost: suggestedQuantity * Number(product.costPrice),
      estimatedInvestment: suggestedQuantity * Number(product.costPrice),

      // Alerts
      alerts,
    }
  }

  /**
   * Generate daily projections for time-phased calculation
   */
  private generateProjections(
    input: PurchaseRequirementInput,
  ): TimePhaseProjection[] {
    const projections: TimePhaseProjection[] = []
    const horizonDays = this.config.leadTimeDays + this.config.coverageDays

    let projectedStock = input.currentStock - input.allocatedStock
    let cumDemand = 0
    let cumReceipts = 0

    for (let day = 1; day <= horizonDays; day++) {
      const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000)

      // Get demand for this day (with trend and seasonality)
      const dayOfWeek = date.getDay()
      const seasonalFactor = this.getSeasonalFactor(
        dayOfWeek,
        input.seasonalityIndex,
      )
      const dailyDemand = input.dailyDemand * input.trendFactor * seasonalFactor

      // Check for receipts on this day
      const receipts = input.openPurchaseOrders
        .filter((po) => {
          const daysUntilArrival = Math.ceil(
            (po.eta.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
          return daysUntilArrival === day
        })
        .reduce((sum, po) => sum + po.pendingQuantity, 0)

      // Update cumulative values
      cumDemand += dailyDemand
      cumReceipts += receipts

      // Calculate projected stock
      projectedStock = projectedStock - dailyDemand + receipts

      // Determine safety stock level
      const safetyStock = this.config.includeStockReserve
        ? input.dailyDemand * (this.config.stockReserveDays || 7)
        : 0

      projections.push({
        date,
        dayOffset: day,
        projectedStock,
        demand: dailyDemand,
        receipts,
        cumDemand,
        cumReceipts,
        netPosition: projectedStock,
        belowSafety: projectedStock < safetyStock,
      })
    }

    return projections
  }

  /**
   * Get seasonal adjustment factor for day of week
   */
  private getSeasonalFactor(
    dayOfWeek: number,
    baseSeasonality: number,
  ): number {
    // Simple day-of-week pattern (can be enhanced with actual data)
    const dayFactors = [0.8, 1.0, 1.1, 1.1, 1.2, 1.3, 0.9] // Sun-Sat
    return dayFactors[dayOfWeek] * baseSeasonality
  }

  /**
   * Calculate pack size constraint
   * Rounds up to the nearest pack size multiple
   */
  private calculatePackSize(quantity: number, packSize: number): number {
    if (packSize <= 1) return quantity
    return Math.ceil(quantity / packSize) * packSize
  }

  /**
   * Assess stockout risk level
   */
  private assessStockoutRisk(
    coverageDays: number,
    leadTimeDays: number,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const ratio = coverageDays / leadTimeDays

    if (ratio > 2) return 'LOW'
    if (ratio > 1) return 'MEDIUM'
    if (ratio > 0.5) return 'HIGH'
    return 'CRITICAL'
  }

  /**
   * Calculate confidence score for the calculation
   */
  private calculateConfidence(input: PurchaseRequirementInput): number {
    let confidence = 1.0

    // Reduce confidence for high demand variability
    const cv = input.demandStdDev / Math.max(input.dailyDemand, 1) // Coefficient of variation
    if (cv > 0.5) confidence *= 0.8
    if (cv > 1.0) confidence *= 0.6

    // Reduce confidence for limited historical data
    const coverage = input.product.stockCoverage
    if (coverage) {
      const dataQuality = coverage.confidence
      confidence *= dataQuality
    }

    // Reduce confidence for extreme trend factors
    if (input.trendFactor < 0.5 || input.trendFactor > 2.0) {
      confidence *= 0.85
    }

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  /**
   * Generate alerts based on calculation results
   */
  private generateAlerts(
    input: PurchaseRequirementInput,
    results: {
      needsExpediting: boolean
      currentCoverageDays: number
      leadTimeDays: number
      requiredQuantity: number
      suggestedQuantity: number
    },
  ): PurchaseAlert[] {
    const alerts: PurchaseAlert[] = []

    // Critical stockout risk
    if (results.currentCoverageDays < results.leadTimeDays) {
      alerts.push({
        type: 'ERROR',
        code: 'STOCKOUT_IMMINENT',
        message: `Estoque atual cobre apenas ${results.currentCoverageDays.toFixed(1)} dias, menor que o lead time de ${results.leadTimeDays} dias`,
        severity: 'HIGH',
      })
    }

    // Needs expediting
    if (results.needsExpediting) {
      alerts.push({
        type: 'WARNING',
        code: 'EXPEDITE_REQUIRED',
        message:
          'Necessário acelerar entrega ou buscar alternativas de fornecimento',
        severity: 'HIGH',
      })
    }

    // High demand variability
    const cv = input.demandStdDev / Math.max(input.dailyDemand, 1)
    if (cv > 0.5) {
      alerts.push({
        type: 'WARNING',
        code: 'HIGH_VARIABILITY',
        message:
          'Alta variabilidade na demanda pode afetar a precisão da previsão',
        severity: 'MEDIUM',
      })
    }

    // Overstock situation
    if (
      results.requiredQuantity === 0 &&
      results.currentCoverageDays > this.config.coverageDays * 2
    ) {
      alerts.push({
        type: 'INFO',
        code: 'OVERSTOCK',
        message: `Estoque atual já cobre ${results.currentCoverageDays.toFixed(1)} dias, acima do objetivo`,
        severity: 'LOW',
      })
    }

    return alerts
  }
}
