/**
 * No Movement Products Export API Route
 * Endpoint for exporting no movement analysis results
 */

import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/igniter.client'
import type { ProductMovement } from '@/modules/no-movement/types'
import { ENV_CONFIG } from '@/modules/core/config/environment'

// Import telemetry directly
let telemetry: any = null
if (typeof window === 'undefined') {
  import('@/modules/core/services/telemetry').then((module) => {
    telemetry = module.telemetry
  })
}

function shouldBypassAuth(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.DISABLE_AUTH_IN_DEV !== 'false'
  )
}

async function getSessionOrganizationId(): Promise<string | null> {
  try {
    const session = await api.auth.getSession.query()
    return session.data?.organization?.id ?? null
  } catch (error) {
    console.warn('Failed to resolve session for no-movement export:', error)
    return null
  }
}

function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: 'UNAUTHORIZED',
      },
    },
    { status: 401 },
  )
}

/**
 * POST /api/products/no-movement/export
 * Export no movement analysis results
 */
export async function POST(request: NextRequest) {
  try {
    const bypassAuth = shouldBypassAuth()
    const sessionOrganizationId = await getSessionOrganizationId()

    if (!sessionOrganizationId && !bypassAuth) {
      return unauthorizedResponse()
    }

    const organizationId =
      sessionOrganizationId ?? (bypassAuth ? 'mock-org-123' : null)

    if (!organizationId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { products, format = 'csv', summary } = body ?? {}

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Products data is required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      )
    }

    telemetry?.recordEvent?.('no_movement_export_requested', {
      organizationId,
      format,
      productsCount: products.length,
      source: ENV_CONFIG.useMockData ? 'mock' : 'production',
    })

    let content: string
    let contentType: string
    let filename: string

    switch (format) {
      case 'csv':
        content = generateCSV(products as ProductMovement[], summary)
        contentType = 'text/csv'
        filename = `produtos-sem-movimentacao-${new Date()
          .toISOString()
          .split('T')[0]}.csv`
        break

      case 'excel':
        content = generateCSV(products as ProductMovement[], summary)
        contentType = 'application/vnd.ms-excel'
        filename = `produtos-sem-movimentacao-${new Date()
          .toISOString()
          .split('T')[0]}.xls`
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid export format',
              code: 'VALIDATION_ERROR',
            },
          },
          { status: 400 },
        )
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Export error:', error)

    telemetry?.recordEvent?.('no_movement_export_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    )
  }
}

/**
 * Generate CSV content
 */
function generateCSV(products: ProductMovement[], summary?: any): string {
  const headers = [
    'SKU',
    'Nome',
    'Marca',
    'Categoria',
    'Depósito',
    'Fornecedor',
    'Estoque Atual',
    'Estoque Mínimo',
    'Preço Custo',
    'Preço Venda',
    'Valor em Estoque',
    'Unidades Vendidas',
    'Receita Total',
    'Média Diária',
    'Última Venda',
    'Dias sem Movimento',
    'Status',
    'Capital Imobilizado',
    'Custo de Oportunidade',
    'Ação Sugerida',
    'Prioridade',
    'Motivo',
  ]

  const rows = products.map((product) => [
    product.sku,
    product.name,
    product.brand,
    product.category,
    product.warehouse,
    product.supplier,
    product.currentStock,
    product.minimumStock,
    product.costPrice.toFixed(2),
    product.sellingPrice.toFixed(2),
    product.stockValue.toFixed(2),
    product.totalUnitsSold,
    product.totalRevenue.toFixed(2),
    product.averageDailySales.toFixed(2),
    product.lastSaleDate
      ? new Date(product.lastSaleDate).toLocaleDateString('pt-BR')
      : 'Nunca',
    product.daysWithoutMovement,
    getStatusLabel(product.movementStatus),
    product.capitalImmobilized.toFixed(2),
    product.opportunityCost.toFixed(2),
    getActionLabel(product.suggestedAction),
    getPriorityLabel(product.actionPriority),
    product.actionReason,
  ])

  let csvContent = ''

  if (summary) {
    csvContent += 'RESUMO DA ANÁLISE\n'
    csvContent += `Total de Produtos,${summary.totalProducts}\n`
    csvContent += `Produtos sem Movimento,${summary.productsWithoutMovement}\n`
    csvContent += `Produtos com Baixa Movimentação,${summary.productsWithLowMovement}\n`
    csvContent += `Capital Imobilizado Total,R$ ${summary.totalCapitalImmobilized.toFixed(2)}\n`
    csvContent += `Custo de Oportunidade Total,R$ ${summary.totalOpportunityCost.toFixed(2)}\n`
    csvContent += `Média de Dias sem Movimento,${summary.averageDaysWithoutMovement.toFixed(0)}\n`
    csvContent += '\n\n'
  }

  csvContent += headers.join(',') + '\n'
  csvContent += rows.map((row) => row.join(',')).join('\n')

  return csvContent
}

function getStatusLabel(status: ProductMovement['movementStatus']): string {
  switch (status) {
    case 'no_movement':
      return 'Sem Movimento'
    case 'low_movement':
      return 'Baixa Movimentação'
    default:
      return 'Normal'
  }
}

function getActionLabel(action: ProductMovement['suggestedAction']): string {
  const labels: Record<ProductMovement['suggestedAction'], string> = {
    promote: 'Promover',
    transfer: 'Transferir',
    return: 'Devolver',
    discontinue: 'Descontinuar',
    monitor: 'Monitorar',
  }

  return labels[action] ?? action
}

function getPriorityLabel(priority: ProductMovement['actionPriority']): string {
  const labels: Record<ProductMovement['actionPriority'], string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  }

  return labels[priority] ?? priority
}
