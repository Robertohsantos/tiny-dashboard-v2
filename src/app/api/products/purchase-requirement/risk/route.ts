import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequirementService } from '@/modules/purchase-requirement'

export async function GET(request: NextRequest) {
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
