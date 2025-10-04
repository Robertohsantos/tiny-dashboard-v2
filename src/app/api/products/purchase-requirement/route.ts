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
