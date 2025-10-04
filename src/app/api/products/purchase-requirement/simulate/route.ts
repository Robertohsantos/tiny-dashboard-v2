import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { purchaseRequirementService } from '@/modules/purchase-requirement'

const SimulateRequestSchema = z.object({
  organizationId: z.string(),
  scenarios: z.array(
    z.object({
      name: z.string(),
      coverageDays: z.number().min(1).max(1095),
      leadTimeStrategy: z.enum(['P50', 'P90']),
      includeStockReserve: z.boolean(),
    }),
  ),
  compareResults: z.boolean().default(true),
  exportFormat: z.enum(['CSV', 'EXCEL', 'PDF']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SimulateRequestSchema.parse(body)

    const results = await purchaseRequirementService.simulateScenarios(
      validatedData.organizationId,
      validatedData,
    )

    const scenarioResults: Record<string, any> = {}
    results.forEach((value, key) => {
      scenarioResults[key] = value
    })

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

    if (investment < comparison.bestInvestment.value) {
      comparison.bestInvestment = { name, value: investment }
    }
    if (productCount > comparison.mostProducts.count) {
      comparison.mostProducts = { name, count: productCount }
    }
    if (criticalCount < comparison.leastRisk.criticalCount) {
      comparison.leastRisk = { name, criticalCount }
    }

    comparison.summary.push({
      scenario: name,
      investment,
      products: productCount,
      criticalProducts: criticalCount,
    })
  }

  return comparison
}
