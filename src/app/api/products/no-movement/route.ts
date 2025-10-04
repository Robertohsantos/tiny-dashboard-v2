/**
 * No Movement Products API Route
 * Endpoint for analyzing products without movement
 */

import { NextRequest, NextResponse } from 'next/server'
import { noMovementService } from '@/modules/no-movement/services/no-movement.service'
import { NoMovementConfigSchema } from '@/modules/no-movement/types'
import { api } from '@/igniter.client'
import { ENV_CONFIG } from '@/modules/core/config/environment'
import {
  generateMockNoMovementAnalysis,
  generateMockNoMovementFilters,
} from '@/modules/no-movement/mocks/no-movement-mock.service'

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
    console.warn('Failed to resolve session for no-movement route:', error)
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

function resolveFiltersForTelemetry(filters: Record<string, unknown>): string[] {
  return Object.entries(filters)
    .filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return Boolean(value)
    })
    .map(([key]) => key)
}

/**
 * POST /api/products/no-movement
 * Analyze products without movement
 */
export async function POST(request: NextRequest) {
  try {
    const bypassAuth = shouldBypassAuth()

    const requestBody = await request
      .json()
      .catch(() => ({ config: undefined })) as {
      config?: Record<string, unknown>
    }

    const requestedOrganizationId =
      typeof requestBody?.config === 'object'
        ? (requestBody.config as { organizationId?: string }).organizationId
        : undefined

    const sessionOrganizationId = await getSessionOrganizationId()

    if (
      sessionOrganizationId &&
      requestedOrganizationId &&
      requestedOrganizationId !== sessionOrganizationId &&
      !bypassAuth
    ) {
      return unauthorizedResponse()
    }

    let organizationId =
      requestedOrganizationId ?? sessionOrganizationId ?? null

    if (!organizationId && bypassAuth) {
      organizationId = 'mock-org-123'
    }

    if (!organizationId) {
      return unauthorizedResponse()
    }

    const configData = {
      ...requestBody?.config,
      organizationId,
    }

    const validationResult = NoMovementConfigSchema.safeParse(configData)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid configuration',
            code: 'VALIDATION_ERROR',
            details: validationResult.error.errors,
          },
        },
        { status: 400 },
      )
    }

    const config = validationResult.data

    telemetry?.recordEvent?.('no_movement_analysis_requested', {
      organizationId: config.organizationId,
      periodDays: config.period.days,
      filters: resolveFiltersForTelemetry(config.filters),
      source: ENV_CONFIG.useMockData ? 'mock' : 'production',
    })

    const shouldUseMock =
      ENV_CONFIG.useMockData ||
      bypassAuth ||
      config.organizationId.startsWith('mock-')

    const result = shouldUseMock
      ? await generateMockNoMovementAnalysis(config)
      : await noMovementService.analyzeProducts(config)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('No movement analysis error:', error)

    telemetry?.recordEvent?.('no_movement_analysis_error', {
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
 * GET /api/products/no-movement
 * Get filter options for no movement analysis
 */
export async function GET(request: NextRequest) {
  try {
    const bypassAuth = shouldBypassAuth()
    const requestedOrganizationId = request.nextUrl.searchParams.get(
      'organizationId',
    )

    const sessionOrganizationId = await getSessionOrganizationId()

    if (
      sessionOrganizationId &&
      requestedOrganizationId &&
      requestedOrganizationId !== sessionOrganizationId &&
      !bypassAuth
    ) {
      return unauthorizedResponse()
    }

    let organizationId =
      requestedOrganizationId ?? sessionOrganizationId ?? null

    if (!organizationId && bypassAuth) {
      organizationId = 'mock-org-123'
    }

    if (!organizationId) {
      return unauthorizedResponse()
    }

    const shouldUseMock =
      ENV_CONFIG.useMockData ||
      bypassAuth ||
      organizationId.startsWith('mock-')

    if (shouldUseMock) {
      const filters = generateMockNoMovementFilters()
      return NextResponse.json({
        success: true,
        data: {
          filters,
        },
      })
    }

    const { noMovementRepository } = await import(
      '@/modules/no-movement/repositories/no-movement.repository'
    )

    const options = await noMovementRepository.getFilterOptions(organizationId)

    return NextResponse.json({
      success: true,
      data: {
        filters: options,
      },
    })
  } catch (error) {
    console.error('Get filter options error:', error)

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
