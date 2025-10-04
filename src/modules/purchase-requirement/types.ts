/**
 * TypeScript interfaces for Purchase Requirement Calculation Module
 * Defines all types used in the purchase requirement/necessity calculation system
 */

import type { Product, StockCoverage } from '@/generated/prisma/client'

/**
 * Configuration parameters for purchase requirement calculation
 */
export type CalculationMethod = 'RAPID' | 'TIME_PHASED'

export interface PurchaseRequirementConfig {
  // Horizon configuration
  coverageDays: number // Days of coverage desired (30, 60, 75, 90, etc.)
  leadTimeDays: number // Average delivery time in days

  // Calculation method
  method?: CalculationMethod // 'RAPID' or 'TIME_PHASED', defaults to 'RAPID'

  // Lead time strategy
  leadTimeStrategy?: 'P50' | 'P90' // Percentile for lead time calculation, defaults to 'P50'

  // Filters
  filters: PurchaseRequirementFilters

  // Stock reserve
  includeStockReserve: boolean // Whether to include stock reserve in calculations
  stockReserveDays?: number // Additional stock reserve days

  // Constraints
  respectPackSize?: boolean // Whether to round to pack size multiples

  // Delivery buffer configuration
  includeDeliveryBuffer: boolean // Whether to add delivery buffer days to coverage horizon
  deliveryBufferDays?: number // Additional days to add when buffer is enabled

  // Performance settings
  enableParallel: boolean // Enable parallel processing for batch
  maxConcurrency: number // Max concurrent calculations

  // Display options
  showOnlyNeeded: boolean // Show only SKUs that need ordering
  consolidateBySupplier: boolean // Group results by supplier

  // UI metadata (nao enviado ao backend)
  filterTotals?: {
    depositos: number
    marcas: number
    fornecedores: number
    categorias: number
  }
  primaryFilter?: 'deposito' | 'marca' | 'fornecedor' | 'categoria'
}

/**
 * Filters for selecting products
 */
export interface PurchaseRequirementFilters {
  marcas?: string[] // Brand filters (empty = all)
  fornecedores?: string[] // Supplier filters (empty = all)
  depositos?: string[] // Warehouse filters (empty = all)
  categorias?: string[] // Category filters (empty = all)
  skus?: string[] // Specific SKUs (optional)
  onlyActive?: boolean // Only active products
  onlyBelowMinimum?: boolean // Only products below minimum stock
}

/**
 * Open purchase order information
 */
export interface OpenPurchaseOrder {
  id: string
  orderNumber: string
  productId: string
  sku: string
  quantity: number // Total ordered quantity
  receivedQuantity: number // Already received
  pendingQuantity: number // Still pending
  eta: Date // Expected arrival date
  supplierId: string
  supplier: string
  status: 'PENDING' | 'PARTIAL' | 'TRANSIT' | 'DELAYED'
}

/**
 * Input data for purchase requirement calculation
 */
export interface PurchaseRequirementInput {
  product: Product & {
    stockCoverage?: StockCoverage | null
    packSize?: number | null
  }
  currentStock: number // On-hand inventory
  allocatedStock: number // Already committed/reserved
  openPurchaseOrders: OpenPurchaseOrder[] // Open POs for this SKU

  // Demand forecast (from stock coverage)
  dailyDemand: number // Average daily demand
  demandStdDev: number // Demand standard deviation
  trendFactor: number // Growth/decline trend
  seasonalityIndex: number // Current seasonality factor

  // Lead time
  leadTimeDays: number // Average delivery time in days

  // Constraints
  packSize?: number // Pack size for ordering

  // Optional overrides
  customDemand?: number // Override calculated demand
}

/**
 * Result of purchase requirement calculation for a single SKU
 */
export interface PurchaseRequirementResult {
  // Product identification
  sku: string
  name: string
  brand: string
  supplier: string
  warehouse: string
  category: string

  // Current position
  currentStock: number
  allocatedStock: number
  availableStock: number // currentStock - allocatedStock
  openOrderQuantity: number // Sum of pending POs
  inventoryPosition: number // available + openOrders

  // Demand and coverage
  dailyDemand: number
  currentCoverageDays: number // Current coverage without new order
  targetCoverageDays: number // Desired coverage from config
  targetCoverageDaysBase: number // Base coverage configured before buffer
  targetCoverageBufferDays: number // Additional delivery buffer days applied

  // Lead time protection
  leadTimeDays: number
  demandDuringLeadTime: number // Demand expected during lead time

  // Calculation results
  targetInventory: number // Desired inventory level
  requiredQuantity: number // Raw requirement (can be negative)
  suggestedQuantity: number // Final suggested quantity
  grossRequirement: number // Demand over coverage horizon
  netRequirement: number // Gross requirement minus stock & open orders
  moq?: number | null // Minimum order quantity if applicable
  packSize: number // Pack size for ordering

  // Gap analysis
  gapBeforeLeadTime: number // Units short before new order arrives
  needsExpediting: boolean // Gap exists before lead time

  // Dates
  stockoutDate?: Date // Projected stockout without order
  suggestedOrderDate: Date // When to place order
  expectedArrivalDate: Date // ETA for new order

  // Risk assessment
  stockoutRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number // Confidence in calculation (0-1)

  // Financial
  estimatedCost?: number // suggestedQuantity * costPrice
  estimatedInvestment?: number // Total investment needed

  // Alerts and notes
  alerts: PurchaseAlert[]
  notes?: string[]
}

/**
 * Alert/warning for purchase requirement
 */
export interface PurchaseAlert {
  type: 'WARNING' | 'ERROR' | 'INFO'
  code: string
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * Batch calculation result
 */
export interface PurchaseBatchResult {
  // Summary
  totalProducts: number
  productsNeedingOrder: number
  totalInvestment: number

  // Metadata
  method: CalculationMethod

  // Results by product
  products: PurchaseRequirementResult[]

  // Aggregations by supplier
  bySupplier: SupplierAggregation[]

  // Aggregations by warehouse
  byWarehouse: WarehouseAggregation[]

  // Processing metadata
  calculationTime: number // Time in ms
  config: PurchaseRequirementConfig
  timestamp: Date

  // Errors
  errors: Array<{
    sku: string
    error: string
  }>
}

/**
 * Supplier aggregation for batch results
 */
export interface SupplierAggregation {
  supplier: string
  productCount: number
  totalQuantity: number
  totalInvestment: number
  meetsMinimumOrder: boolean
  minimumOrderValue?: number
  products: Array<{
    sku: string
    name: string
    quantity: number
    cost: number
  }>
}

/**
 * Warehouse aggregation for batch results
 */
export interface WarehouseAggregation {
  warehouse: string
  productCount: number
  totalQuantity: number
  totalInvestment: number
  criticalProducts: number // Products with high stockout risk
  products: Array<{
    sku: string
    name: string
    quantity: number
    risk: string
  }>
}

/**
 * Time-phased projection data point
 */
export interface TimePhaseProjection {
  date: Date
  dayOffset: number // Days from today
  projectedStock: number // Stock level on this day
  demand: number // Expected demand
  receipts: number // Expected receipts from POs
  cumDemand: number // Cumulative demand
  cumReceipts: number // Cumulative receipts
  netPosition: number // Net inventory position
  belowSafety: boolean // Below safety stock level
}

/**
 * Purchase simulation parameters
 */
export interface PurchaseSimulation {
  scenarios: Array<{
    name: string
    coverageDays: number
    leadTimeStrategy: 'P50' | 'P90'
    includeStockReserve: boolean
  }>
  compareResults: boolean
  exportFormat?: 'CSV' | 'EXCEL' | 'PDF'
}

/**
 * Error types specific to purchase requirement calculations
 */
export enum PurchaseRequirementError {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  CALCULATION_FAILED = 'CALCULATION_FAILED',
  NO_PRODUCTS_FOUND = 'NO_PRODUCTS_FOUND',
  SUPPLIER_CONSTRAINT_VIOLATION = 'SUPPLIER_CONSTRAINT_VIOLATION',
}

/**
 * Custom error class for purchase requirement calculations
 */
export class PurchaseRequirementCalculationError extends Error {
  constructor(
    public code: PurchaseRequirementError,
    message: string,
    public details?: any,
  ) {
    super(message)
    this.name = 'PurchaseRequirementCalculationError'
  }
}



