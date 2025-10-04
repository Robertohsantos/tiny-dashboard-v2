import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequirementService } from '@/modules/purchase-requirement'

export async function POST(request: NextRequest) {
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
