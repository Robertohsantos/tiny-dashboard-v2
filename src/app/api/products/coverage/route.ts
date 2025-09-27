/**
 * API Route for Stock Coverage Calculations
 * Provides endpoints for calculating and retrieving stock coverage metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { stockCoverageService } from '@/modules/stock-coverage'
import { ENV_CONFIG } from '@/modules/core/config/environment'

/**
 * GET /api/products/coverage
 * Get stock coverage for a product or batch of products
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const organizationId = searchParams.get('organizationId')
    const warehouse = searchParams.get('warehouse')
    const supplier = searchParams.get('supplier')
    const forceRecalculation = searchParams.get('force') === 'true'

    // Single product coverage
    if (productId) {
      const coverage = await stockCoverageService.calculateCoverage(
        productId,
        !forceRecalculation,
      )

      return NextResponse.json({
        success: true,
        data: coverage,
      })
    }

    // Batch coverage for organization
    if (organizationId) {
      const result = await stockCoverageService.calculateBatchCoverage(
        organizationId,
        {
          warehouse: warehouse || undefined,
          supplier: supplier || undefined,
          forceRecalculation,
        },
      )

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // Mock data for development
    if (ENV_CONFIG.useMockData) {
      return NextResponse.json({
        success: true,
        data: generateMockCoverageData(),
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameters: productId or organizationId',
      },
      { status: 400 },
    )
  } catch (error) {
    console.error('Error calculating stock coverage:', error)

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
 * POST /api/products/coverage/update
 * Update sales data and recalculate coverage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, date, salesData } = body

    if (!productId || !date || !salesData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
        },
        { status: 400 },
      )
    }

    const result = await stockCoverageService.updateSalesAndRecalculate(
      productId,
      new Date(date),
      salesData,
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error updating sales and coverage:', error)

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
 * GET /api/products/coverage/risk
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
    const products = await stockCoverageService.getStockoutRiskProducts(
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
 * Generate mock coverage data for development
 */
function generateMockCoverageData() {
  return {
    coverageDays: 15.3,
    coverageDaysP90: 12.1,
    coverageDaysP10: 18.7,
    demandForecast: 5.2,
    demandStdDev: 1.8,
    adjustedDemand: 5.0,
    trendFactor: 1.02,
    seasonalityIndex: 1.15,
    availabilityAdjustment: 0.95,
    confidence: 0.82,
    dataQuality: {
      completeness: 0.9,
      consistency: 0.85,
      availabilityIssues: 0.05,
      outlierPercentage: 0.03,
      overallScore: 0.88,
    },
    reorderPoint: 45,
    reorderQuantity: 100,
    stockoutRisk: 0.25,
    historicalDaysUsed: 90,
    algorithm: 'EWMA_TREND_SEASONALITY_V1',
    calculatedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
  }
}
