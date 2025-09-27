/**
 * Root Layout with Performance Monitoring
 * Professional integration of Web Vitals monitoring
 */

import {
  PerformanceProvider,
  PerformanceIndicator,
} from '@/modules/core/providers/performance-provider'
import {
  RemotePerformanceStorage,
  LocalPerformanceStorage,
} from '@/modules/core/performance/web-vitals'
import type { ReactNode } from 'react'

/**
 * Get performance storage based on environment
 */
function getPerformanceStorage() {
  // Use remote storage in production if API is configured
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_PERFORMANCE_API_URL
  ) {
    return new RemotePerformanceStorage(
      process.env.NEXT_PUBLIC_PERFORMANCE_API_URL,
      process.env.NEXT_PUBLIC_PERFORMANCE_API_KEY,
    )
  }

  // Use local storage as fallback
  return new LocalPerformanceStorage()
}

/**
 * Root layout wrapper with performance monitoring
 */
export function RootLayoutWithPerformance({
  children,
}: {
  children: ReactNode
}) {
  return (
    <PerformanceProvider
      config={{
        enabled: true,
        debug: process.env.NODE_ENV === 'development',
        storage: getPerformanceStorage(),
        sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1, // 10% in production, 100% in dev
        logToConsole: process.env.NODE_ENV === 'development',
        onReport: (metric) => {
          // Send to analytics service if configured
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'web_vitals', {
              event_category: 'Performance',
              event_label: metric.name,
              value: Math.round(
                metric.name === 'CLS' ? metric.value * 1000 : metric.value,
              ),
              metric_rating: metric.rating,
              non_interaction: true,
            })
          }
        },
      }}
      enabledRoutes={['/dashboard', '/dashboard-vendas', '/app']}
      disabledRoutes={['/admin', '/api']}
    >
      {children}
      <PerformanceIndicator />
    </PerformanceProvider>
  )
}
