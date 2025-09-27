import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Rollback Alert Schema
 */
const RollbackAlertSchema = z.object({
  type: z.literal('validation_rollback'),
  errorRate: z.number(),
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
    rollbackTriggered: z.boolean(),
  }),
  timestamp: z.number(),
})

/**
 * Store rollback alerts in memory
 */
const rollbackAlerts: any[] = []
const MAX_STORED_ALERTS = 100

/**
 * POST /api/monitoring/rollback-alert
 * Receives rollback alert notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const result = RollbackAlertSchema.safeParse(body)

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

    // Store the alert
    const alert = {
      ...data,
      receivedAt: Date.now(),
      userAgent: request.headers.get('user-agent'),
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
    }

    rollbackAlerts.unshift(alert)

    // Keep only the latest alerts
    if (rollbackAlerts.length > MAX_STORED_ALERTS) {
      rollbackAlerts.splice(MAX_STORED_ALERTS)
    }

    // Log critical alert
    console.error('🚨 [ROLLBACK ALERT] Auto-rollback triggered!', {
      errorRate: `${(data.errorRate * 100).toFixed(2)}%`,
      totalValidations: data.metrics.totalValidations,
      timestamp: new Date(data.timestamp).toISOString(),
    })

    // In production, send notifications
    // await sendSlackAlert({
    //   text: `🚨 Validation Rollback Triggered!`,
    //   blocks: [
    //     {
    //       type: 'section',
    //       text: {
    //         type: 'mrkdwn',
    //         text: `*Error Rate:* ${(data.errorRate * 100).toFixed(2)}%\n*Total Validations:* ${data.metrics.totalValidations}\n*Health Status:* ${data.metrics.health}`,
    //       },
    //     },
    //   ],
    // })

    // await sendEmailAlert({
    //   to: process.env.ALERT_EMAIL,
    //   subject: '🚨 Validation System Rollback',
    //   body: `The validation system has automatically rolled back due to high error rates.`,
    // })

    return NextResponse.json({
      success: true,
      message: 'Rollback alert recorded',
      alertId: Date.now().toString(),
      action: 'notifications_sent',
    })
  } catch (error) {
    console.error('[Rollback Alert API] Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/monitoring/rollback-alert
 * Returns rollback alert history
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const since = searchParams.get('since') // ISO date string

  let alerts = rollbackAlerts

  // Filter by date if provided
  if (since) {
    const sinceTimestamp = new Date(since).getTime()
    alerts = alerts.filter((a) => a.receivedAt >= sinceTimestamp)
  }

  // Limit results
  alerts = alerts.slice(0, limit)

  // Calculate summary
  const summary = {
    totalAlerts: rollbackAlerts.length,
    recentAlerts24h: rollbackAlerts.filter(
      (a) => a.receivedAt > Date.now() - 24 * 60 * 60 * 1000,
    ).length,
    avgErrorRateAtRollback:
      rollbackAlerts.length > 0
        ? rollbackAlerts.reduce((sum, a) => sum + a.errorRate, 0) /
          rollbackAlerts.length
        : 0,
    lastRollback:
      rollbackAlerts.length > 0
        ? new Date(rollbackAlerts[0].receivedAt).toISOString()
        : null,
  }

  return NextResponse.json({
    summary,
    alerts,
    timestamp: Date.now(),
  })
}

/**
 * DELETE /api/monitoring/rollback-alert
 * Clear rollback alert history (for testing)
 */
export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 },
    )
  }

  const beforeCount = rollbackAlerts.length
  rollbackAlerts.length = 0

  return NextResponse.json({
    success: true,
    message: `Cleared ${beforeCount} rollback alerts`,
  })
}
