/**
 * No Movement Products Types
 * Type definitions for products without movement analysis
 */

import { z } from 'zod'
import type { Decimal } from '@prisma/client/runtime/library'

/**
 * Configuration schema for no movement analysis
 */
export const NoMovementConfigSchema = z.object({
  organizationId: z.string(),
  
  // Analysis period
  period: z.object({
    days: z.number().min(1).max(365).default(90),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).default({ days: 90 }),
  
  // Movement threshold
  threshold: z.object({
    minUnits: z.number().min(0).optional(),
    minUnitsPerDay: z.number().min(0).optional(),
    considerAsLow: z.boolean().default(true),
  }).default({ considerAsLow: true }),
  
  // Filters
  filters: z.object({
    depositos: z.array(z.string()).optional(),
    marcas: z.array(z.string()).optional(),
    fornecedores: z.array(z.string()).optional(),
    categorias: z.array(z.string()).optional(),
    skus: z.array(z.string()).optional(),
    onlyActive: z.boolean().default(true),
  }).default({ onlyActive: true }),
  
  // Analysis options
  options: z.object({
    includeDiscontinued: z.boolean().default(false),
    includeZeroStock: z.boolean().default(true),
    calculateFinancialImpact: z.boolean().default(true), // Always true, kept for backwards compatibility
    groupByWarehouse: z.boolean().default(false),
    // Opportunity cost rate configuration
    opportunityCostRate: z.object({
      type: z.enum(['cdi', 'selic', 'working_capital', 'manual']).default('manual'),
      value: z.number().min(0).max(100).default(1), // Monthly percentage rate (1% = 0.01 in calculations)
      description: z.string().optional(),
    }).default({
      type: 'manual',
      value: 1, // 1% monthly default
      description: 'Taxa padrão de 1% ao mês'
    }),
  }).default({
    includeDiscontinued: false,
    includeZeroStock: true,
    calculateFinancialImpact: true,
    groupByWarehouse: false,
    opportunityCostRate: {
      type: 'manual',
      value: 1,
      description: 'Taxa padrão de 1% ao mês'
    }
  }),
})

export type NoMovementConfig = z.infer<typeof NoMovementConfigSchema>

/**
 * Product movement data
 */
export interface ProductMovement {
  productId: string
  sku: string
  name: string
  brand: string
  category: string
  warehouse: string
  supplier: string
  
  // Stock data
  currentStock: number
  minimumStock: number
  costPrice: number
  sellingPrice: number
  stockValue: number
  
  // Movement metrics
  totalUnitsSold: number
  totalRevenue: number
  averageDailySales: number
  lastSaleDate: Date | null
  daysWithoutMovement: number
  movementStatus: 'no_movement' | 'low_movement' | 'normal'
  
  // Financial impact
  capitalImmobilized: number
  opportunityCost: number
  storageTime: number
  
  // Recommendations
  suggestedAction: 'promote' | 'transfer' | 'return' | 'discontinue' | 'monitor'
  actionPriority: 'low' | 'medium' | 'high' | 'critical'
  actionReason: string
}

/**
 * Analysis result for batch processing
 */
export interface NoMovementResult {
  config: NoMovementConfig
  analysisDate: Date
  periodStart: Date
  periodEnd: Date
  
  // Summary metrics
  summary: {
    totalProducts: number
    productsWithoutMovement: number
    productsWithLowMovement: number
    totalCapitalImmobilized: number
    totalOpportunityCost: number
    averageDaysWithoutMovement: number
  }
  
  // Product details
  products: ProductMovement[]
  
  // Grouped data (if requested)
  groupedByWarehouse?: Record<string, ProductMovement[]>
  groupedByCategory?: Record<string, ProductMovement[]>
  groupedBySupplier?: Record<string, ProductMovement[]>
  
  // Processing metadata
  metadata: {
    processingTime: number
    cached: boolean
    cacheKey?: string
    warnings?: string[]
  }
}

/**
 * Export configuration
 */
export interface NoMovementExportConfig {
  format: 'csv' | 'excel' | 'pdf'
  includeCharts: boolean
  includeSummary: boolean
  includeRecommendations: boolean
  groupBy?: 'warehouse' | 'category' | 'supplier'
  sortBy?: 'daysWithoutMovement' | 'capitalImmobilized' | 'name' | 'lastSaleDate'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Action recommendation
 */
export interface ActionRecommendation {
  productId: string
  action: ProductMovement['suggestedAction']
  priority: ProductMovement['actionPriority']
  reason: string
  estimatedRecovery: number
  implementationSteps: string[]
  expectedOutcome: string
}

/**
 * Historical sales data for movement analysis
 */
export interface SalesHistoryData {
  date: Date
  unitsSold: number
  revenue: number
  hasPromotion: boolean
  discountPercent?: number
}

/**
 * Filter options for UI
 */
export interface NoMovementFilterOptions {
  depositos: Array<{ value: string; label: string; count: number }>
  marcas: Array<{ value: string; label: string; count: number }>
  fornecedores: Array<{ value: string; label: string; count: number }>
  categorias: Array<{ value: string; label: string; count: number }>
}

/**
 * Request/Response types for API
 */
export interface NoMovementRequest {
  config: Partial<NoMovementConfig>
}

export interface NoMovementResponse {
  success: boolean
  data?: NoMovementResult
  error?: {
    message: string
    code: string
    details?: unknown
  }
}

/**
 * Cache configuration
 */
export interface NoMovementCacheConfig {
  enabled: boolean
  ttl: number // seconds
  keyPrefix: string
}
