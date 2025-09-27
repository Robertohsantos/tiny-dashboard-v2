import type { IgniterTelemetryProvider } from '@igniter-js/core'
import { store } from '@/modules/core/services/store'

let telemetryInstance: IgniterTelemetryProvider | null = null

if (typeof window === 'undefined') {
  const { createConsoleTelemetryAdapter } = await import(
    '@igniter-js/core/adapters'
  )

  const nodeEnv = process.env.NODE_ENV
  const appEnv = process.env.APP_ENV ?? nodeEnv
  const environment: 'production' | 'staging' | 'development' =
    appEnv === 'production'
      ? 'production'
      : appEnv === 'staging'
        ? 'staging'
        : 'development'

  telemetryInstance = createConsoleTelemetryAdapter(
    {
      serviceName: 'SaaS Boilerplate',
      environment,
      enableTracing: true,
      enableMetrics: true,
      enableEvents: true,
    },
    {
      store: store ?? undefined,
      enableCliIntegration: true,
    },
  )
}

export const telemetry = telemetryInstance
