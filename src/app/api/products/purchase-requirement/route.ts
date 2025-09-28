/**
 * API Route for Purchase Requirement Calculations
 * Provides endpoints for calculating purchase requirements/necessity
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequirementService } from '@/modules/purchase-requirement'
import { z } from 'zod'
import type { CalculationMethod } from '@/modules/purchase-requirement/types'

/**
 * Request validation schemas
 */
const CalculateRequestSchema = z.object({
  organizationId: z.string(), // Removido .uuid() para aceitar mock-org-123 em desenvolvimento
  coverageDays: z.number().min(1).max(1095).default(30), // Allow up to 3 years
  method: z.enum(['RAPID', 'TIME_PHASED']).default('RAPID'),
  leadTimeStrategy: z.enum(['P50', 'P90']).default('P50'),
  includeStockReserve: z.boolean().default(true),
  stockReserveDays: z.number().min(0).max(90).optional(),
  respectPackSize: z.boolean().default(true),
  includeDeliveryBuffer: z.boolean().default(false),
  deliveryBufferDays: z.number().min(0).max(365).optional(),
  showOnlyNeeded: z.boolean().default(true),
  consolidateBySupplier: z.boolean().default(false),
  filters: z
    .object({
      marcas: z.array(z.string()).optional(),
      fornecedores: z.array(z.string()).optional(),
      depositos: z.array(z.string()).optional(),
      skus: z.array(z.string()).optional(),
      onlyActive: z.boolean().optional(),
      onlyBelowMinimum: z.boolean().optional(),
    })
    .optional(),
})

const SimulateRequestSchema = z.object({
  organizationId: z.string(), // Removido .uuid() para aceitar mock-org-123 em desenvolvimento
  scenarios: z.array(
    z.object({
      name: z.string(),
      coverageDays: z.number().min(1).max(1095), // Allow up to 3 years
      leadTimeStrategy: z.enum(['P50', 'P90']),
      includeStockReserve: z.boolean(),
    }),
  ),
  compareResults: z.boolean().default(true),
  exportFormat: z.enum(['CSV', 'EXCEL', 'PDF']).optional(),
})

/**
 * GET /api/products/purchase-requirement
 * Calculate purchase requirements for products
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const includeDeliveryBuffer = searchParams.get('includeDeliveryBuffer') === 'true'
    const deliveryBufferDaysParam = searchParams.get('deliveryBufferDays')
    const parsedDeliveryBufferDays = (
      deliveryBufferDaysParam !== null && deliveryBufferDaysParam !== ''
        ? Number(deliveryBufferDaysParam)
        : undefined
    )
    const deliveryBufferDays =
      typeof parsedDeliveryBufferDays === 'number' && !Number.isNaN(parsedDeliveryBufferDays)
        ? Math.max(0, parsedDeliveryBufferDays)
        : 0

    // Single product calculation
    const productId = searchParams.get('productId')
    if (productId) {
      const config = {
        coverageDays: Number(searchParams.get('coverageDays') || 30),
        method: (searchParams.get('method') || 'RAPID') as CalculationMethod,
        leadTimeStrategy: (searchParams.get('leadTimeStrategy') || 'P50') as
          | 'P50'
          | 'P90',
        includeStockReserve:
          searchParams.get('includeStockReserve') !== 'false',
        respectPackSize: searchParams.get('respectPackSize') !== 'false',
        includeDeliveryBuffer,
        deliveryBufferDays: includeDeliveryBuffer ? deliveryBufferDays : 0,
      }

      const result = await purchaseRequirementService.calculateRequirement(
        productId,
        config,
      )

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // Batch calculation - requires organizationId
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'organizationId or productId is required',
        },
        { status: 400 },
      )
    }

    // Parse filters from query params
    const filters = {
      marcas: searchParams.get('marcas')?.split(',').filter(Boolean),
      fornecedores: searchParams
        .get('fornecedores')
        ?.split(',')
        .filter(Boolean),
      depositos: searchParams.get('depositos')?.split(',').filter(Boolean),
      onlyActive: searchParams.get('onlyActive') === 'true',
      onlyBelowMinimum: searchParams.get('onlyBelowMinimum') === 'true',
    }

    const config = {
      coverageDays: Number(searchParams.get('coverageDays') || 30),
      method: (searchParams.get('method') || 'RAPID') as CalculationMethod,
      leadTimeStrategy: (searchParams.get('leadTimeStrategy') || 'P50') as
        | 'P50'
        | 'P90',
      includeStockReserve: searchParams.get('includeStockReserve') !== 'false',
      respectPackSize: searchParams.get('respectPackSize') !== 'false',
      includeDeliveryBuffer,
      deliveryBufferDays: includeDeliveryBuffer ? deliveryBufferDays : 0,
      showOnlyNeeded: searchParams.get('showOnlyNeeded') !== 'false',
      consolidateBySupplier:
        searchParams.get('consolidateBySupplier') === 'true',
      filters,
    }

    const result = await purchaseRequirementService.calculateBatch(
      organizationId,
      config,
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error calculating purchase requirements:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/products/purchase-requirement
 * Calculate purchase requirements with complex configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = CalculateRequestSchema.parse(body)

    const config = {
      coverageDays: validatedData.coverageDays,
      method: validatedData.method as CalculationMethod,
      leadTimeStrategy: validatedData.leadTimeStrategy,
      includeStockReserve: validatedData.includeStockReserve,
      stockReserveDays: validatedData.stockReserveDays,
      respectPackSize: validatedData.respectPackSize,
      includeDeliveryBuffer: validatedData.includeDeliveryBuffer,
      deliveryBufferDays: validatedData.includeDeliveryBuffer
        ? validatedData.deliveryBufferDays ?? 0
        : 0,
      showOnlyNeeded: validatedData.showOnlyNeeded,
      consolidateBySupplier: validatedData.consolidateBySupplier,
      filters: validatedData.filters || {},
    }

    const result = await purchaseRequirementService.calculateBatch(
      validatedData.organizationId,
      config,
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    console.error('Error calculating purchase requirements:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/products/purchase-requirement/simulate
 * Simulate multiple purchase scenarios
 */
export async function POST_SIMULATE(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validatedData = SimulateRequestSchema.parse(body)

    const results = await purchaseRequirementService.simulateScenarios(
      validatedData.organizationId,
      validatedData,
    )

    // Convert Map to object for JSON serialization
    const scenarioResults: Record<string, any> = {}
    results.forEach((value, key) => {
      scenarioResults[key] = value
    })

    // If comparison requested, add comparison data
    if (validatedData.compareResults) {
      const comparison = compareScenarioResults(scenarioResults)
      return NextResponse.json({
        success: true,
        data: {
          scenarios: scenarioResults,
          comparison,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: scenarioResults,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    console.error('Error simulating scenarios:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/products/purchase-requirement/risk
 * Get products at risk of stockout
 */
export async function GET_RISK(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const threshold = searchParams.get('threshold')

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'organizationId is required',
        },
        { status: 400 },
      )
    }

    const riskThreshold = threshold ? parseFloat(threshold) : 0.5
    const products = await purchaseRequirementService.getStockoutRiskProducts(
      organizationId,
      riskThreshold,
    )

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error('Error getting risk products:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/products/purchase-requirement/validate
 * Validate supplier constraints for a purchase order
 */
export async function POST_VALIDATE(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplier, orders } = body

    if (!supplier || !orders || !Array.isArray(orders)) {
      return NextResponse.json(
        {
          success: false,
          error: 'supplier and orders array are required',
        },
        { status: 400 },
      )
    }

    const validation =
      await purchaseRequirementService.validateSupplierConstraints(
        supplier,
        orders,
      )

    return NextResponse.json({
      success: true,
      data: validation,
    })
  } catch (error) {
    console.error('Error validating supplier constraints:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}

/**
 * Compare scenario results for analysis
 */
function compareScenarioResults(scenarios: Record<string, any>) {
  const comparison = {
    bestInvestment: { name: '', value: Infinity },
    mostProducts: { name: '', count: 0 },
    leastRisk: { name: '', criticalCount: Infinity },
    summary: [] as Array<{
      scenario: string
      investment: number
      products: number
      criticalProducts: number
    }>,
  }

  for (const [name, result] of Object.entries(scenarios)) {
    const investment = result.totalInvestment
    const productCount = result.productsNeedingOrder
    const criticalCount = result.products.filter(
      (p: any) => p.stockoutRisk === 'HIGH' || p.stockoutRisk === 'CRITICAL',
    ).length

    // Track best metrics
    if (investment < comparison.bestInvestment.value) {
      comparison.bestInvestment = { name, value: investment }
    }
    if (productCount > comparison.mostProducts.count) {
      comparison.mostProducts = { name, count: productCount }
    }
    if (criticalCount < comparison.leastRisk.criticalCount) {
      comparison.leastRisk = { name, criticalCount }
    }

    // Add to summary
    comparison.summary.push({
      scenario: name,
      investment,
      products: productCount,
      criticalProducts: criticalCount,
    })
  }

  return comparison
}
