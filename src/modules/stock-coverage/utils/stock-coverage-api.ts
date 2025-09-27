/**
 * Stock Coverage API Client
 * Client-side utilities for fetching stock coverage data
 */

import type { StockCoverageResult } from '@/modules/stock-coverage/types'

interface ApiResponse<T> {
  data: T
}

type BatchCoverageItem = {
  product: unknown
  coverage: StockCoverageResult
}

type StockoutRiskItem = {
  product: unknown
  coverage: StockCoverageResult
  daysUntilStockout: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const hasDataProperty = <T>(value: unknown): value is ApiResponse<T> => {
  return isRecord(value) && 'data' in value
}

async function parseApiResponse<T>(
  response: Response,
  errorPrefix: string,
): Promise<T> {
  const payload = (await response.json()) as unknown

  if (!hasDataProperty<T>(payload)) {
    throw new Error(`${errorPrefix}: invalid response payload`)
  }

  return payload.data
}

/**
 * Fetch stock coverage for a single product
 */
export async function fetchStockCoverage(
  productId: string,
  forceRecalculation: boolean = false,
): Promise<StockCoverageResult> {
  const params = new URLSearchParams({
    productId,
    ...(forceRecalculation && { force: 'true' }),
  })

  const response = await fetch(`/api/products/coverage?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch stock coverage: ${response.statusText}`)
  }

  return parseApiResponse<StockCoverageResult>(
    response,
    'Failed to parse stock coverage',
  )
}

/**
 * Fetch batch stock coverage for an organization
 */
export async function fetchBatchStockCoverage(
  organizationId: string,
  options?: {
    warehouse?: string
    supplier?: string
    forceRecalculation?: boolean
  },
): Promise<BatchCoverageItem[]> {
  const params = new URLSearchParams({
    organizationId,
    ...(options?.warehouse && { warehouse: options.warehouse }),
    ...(options?.supplier && { supplier: options.supplier }),
    ...(options?.forceRecalculation && { force: 'true' }),
  })

  const response = await fetch(`/api/products/coverage?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch batch coverage: ${response.statusText}`)
  }

  return parseApiResponse<BatchCoverageItem[]>(
    response,
    'Failed to parse batch coverage response',
  )
}

/**
 * Update sales data and recalculate coverage
 */
export async function updateSalesAndRecalculate(
  productId: string,
  date: Date,
  salesData: {
    unitsSold: number
    price: number
    revenue: number
    promotionFlag?: boolean
  },
): Promise<StockCoverageResult> {
  const response = await fetch('/api/products/coverage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      date: date.toISOString(),
      salesData,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update sales data: ${response.statusText}`)
  }

  return parseApiResponse<StockCoverageResult>(
    response,
    'Failed to parse stock coverage recalculation response',
  )
}

/**
 * Get products at risk of stockout
 */
export async function fetchStockoutRiskProducts(
  organizationId: string,
  threshold: number = 0.5,
): Promise<StockoutRiskItem[]> {
  const params = new URLSearchParams({
    organizationId,
    threshold: threshold.toString(),
  })

  const response = await fetch(`/api/products/coverage/risk?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch risk products: ${response.statusText}`)
  }

  return parseApiResponse<StockoutRiskItem[]>(
    response,
    'Failed to parse stockout risk response',
  )
}

/**
 * Format coverage days for display
 */
export function formatCoverageDays(days: number): string {
  if (days === 0) return 'Sem estoque'
  if (days < 1) return '< 1 dia'
  if (days === 1) return '1 dia'
  if (days > 365) return '> 1 ano'
  if (days > 90) return `${Math.floor(days / 30)} meses`
  return `${Math.floor(days)} dias`
}

/**
 * Get coverage status color
 */
export function getCoverageStatusColor(days: number): string {
  if (days <= 7) return 'text-red-600 bg-red-50'
  if (days <= 15) return 'text-orange-600 bg-orange-50'
  if (days <= 30) return 'text-yellow-600 bg-yellow-50'
  if (days <= 60) return 'text-green-600 bg-green-50'
  return 'text-blue-600 bg-blue-50'
}

/**
 * Calculate reorder urgency
 */
export function getReorderUrgency(
  coverageDays: number,
  leadTime: number,
): 'immediate' | 'urgent' | 'soon' | 'normal' | 'none' {
  const daysUntilReorder = coverageDays - leadTime

  if (daysUntilReorder <= 0) return 'immediate'
  if (daysUntilReorder <= 3) return 'urgent'
  if (daysUntilReorder <= 7) return 'soon'
  if (daysUntilReorder <= 14) return 'normal'
  return 'none'
}
