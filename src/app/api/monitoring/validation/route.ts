import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Validation Error Schema
 */
const ValidationErrorSchema = z.object({
  type: z.literal('validation_error'),
  context: z.string(),
  error: z.object({
    message: z.string(),
    errors: z.array(
      z.object({
        code: z.string(),
        message: z.string().optional(),
        path: z.array(z.union([z.string(), z.number()])).optional(),
      }),
    ),
    timestamp: z.number(),
  }),
  metrics: z.object({
    validationErrors: z.number(),
    validationSuccess: z.number(),
    fallbackUsed: z.number(),
    totalValidations: z.number(),
    errorRate: z.number(),
    fallbackRate: z.number(),
    successRate: z.number(),
    averageValidationTime: z.number(),
    health: z.enum(['healthy', 'warning', 'critical']),
  }),
})

/**
 * Store validation errors in memory (in production, use a database or monitoring service)
 */
const validationErrors: any[] = []
const MAX_STORED_ERRORS = 1000

/**
 * POST /api/monitoring/validation
 * Receives validation error reports from the client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const result = ValidationErrorSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: result.error.errors,
        },
        { status: 400 },
      )
    }

    const data = result.data

    // Store the error (in production, send to monitoring service)
    validationErrors.unshift({
      ...data,
      receivedAt: Date.now(),
      userAgent: request.headers.get('user-agent'),
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
    })

    // Keep only the latest errors
    if (validationErrors.length > MAX_STORED_ERRORS) {
      validationErrors.splice(MAX_STORED_ERRORS)
    }

    // Log critical errors
    if (data.metrics.health === 'critical') {
      console.error('[Validation Monitor] CRITICAL ERROR DETECTED:', {
        context: data.context,
        errorRate: data.metrics.errorRate,
        timestamp: new Date(data.error.timestamp).toISOString(),
      })

      // In production, trigger alerts here
      // await sendSlackAlert(data)
      // await sendPagerDutyIncident(data)
    }

    // Analyze patterns for auto-rollback
    const recentErrors = validationErrors.filter(
      (e) => e.receivedAt > Date.now() - 5 * 60 * 1000, // Last 5 minutes
    )

    if (recentErrors.length > 50) {
      const avgErrorRate =
        recentErrors.reduce((sum, e) => sum + e.metrics.errorRate, 0) /
        recentErrors.length

      if (avgErrorRate > 0.1) {
        console.error('[Validation Monitor] HIGH ERROR RATE PATTERN DETECTED')
        // Trigger additional monitoring
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Validation error recorded',
      errorId: Date.now().toString(),
    })
  } catch (error) {
    console.error('[Validation API] Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/monitoring/validation
 * Returns stored validation errors for debugging
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const context = searchParams.get('context')

  let errors = validationErrors

  // Filter by context if provided
  if (context) {
    errors = errors.filter((e) => e.context === context)
  }

  // Limit results
  errors = errors.slice(0, limit)

  // Calculate summary statistics
  const summary = {
    totalErrors: validationErrors.length,
    contextsAffected: [...new Set(validationErrors.map((e) => e.context))]
      .length,
    criticalErrors: validationErrors.filter(
      (e) => e.metrics.health === 'critical',
    ).length,
    warningErrors: validationErrors.filter(
      (e) => e.metrics.health === 'warning',
    ).length,
    avgErrorRate:
      validationErrors.length > 0
        ? validationErrors.reduce((sum, e) => sum + e.metrics.errorRate, 0) /
          validationErrors.length
        : 0,
  }

  return NextResponse.json({
    summary,
    errors,
    timestamp: Date.now(),
  })
}
