/**
 * React Query Provider Configuration
 * Provides optimized caching and data fetching for the application
 */

'use client'

import * as React from 'react'
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ENV_CONFIG } from '@/modules/core/config/environment'

/**
 * Query client configuration with optimized settings
 * for dashboard data caching and refetching
 */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests 2 times with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error) {
          const message = error.message
          if (message.includes('4') && message.includes('0')) {
            return false
          }
        }
        return failureCount < 2
      },

      // Exponential backoff delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus in production only
      refetchOnWindowFocus: ENV_CONFIG.isProduction,

      // Don't refetch on reconnect by default
      refetchOnReconnect: 'always',

      // Enable smart refetching
      refetchInterval: false,

      // Network mode
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Exponential backoff for mutations
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode for mutations
      networkMode: 'online',
    },
  },
}

/**
 * Create a singleton query client
 * Prevents creating multiple clients in React strict mode
 */
function makeQueryClient() {
  return new QueryClient(queryClientConfig)
}

let browserQueryClient: QueryClient | undefined

const DEVTOOLS_POSITION: React.ComponentProps<
  typeof ReactQueryDevtools
>['position'] = 'bottom'
const DEVTOOLS_BUTTON_POSITION: React.ComponentProps<
  typeof ReactQueryDevtools
>['buttonPosition'] = 'bottom-left'

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a singleton query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

/**
 * Props for QueryProvider component
 */
interface QueryProviderProps {
  /** Child components */
  children: React.ReactNode
}

/**
 * React Query Provider Component
 * Wraps the application with React Query context
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Use singleton client for browser, new client for SSR
  const queryClient = React.useMemo(() => getQueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ENV_CONFIG.isDevelopment && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position={DEVTOOLS_POSITION}
          buttonPosition={DEVTOOLS_BUTTON_POSITION}
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Hook to access the query client
 * Useful for imperative cache updates
 */
export function useQueryClientInstance() {
  const [queryClient] = React.useState(() => getQueryClient())
  return queryClient
}

/**
 * Prefetch configuration for dashboard data
 * Can be used to prefetch adjacent periods
 */
export const PREFETCH_CONFIG = {
  // Prefetch stale time (shorter than regular stale time)
  staleTime: 2 * 60 * 1000, // 2 minutes

  // Don't retry prefetch requests
  retry: false,
} as const

/**
 * Query key factory for consistent cache keys
 * Ensures proper cache invalidation and sharing
 */
export const queryKeys = {
  all: ['dashboard'] as const,

  metrics: (period?: {
    startDate?: Date
    endDate?: Date
    marketplaceId?: string
  }) => ['dashboard', 'metrics', period] as const,

  financialMetrics: (period?: {
    startDate?: Date
    endDate?: Date
    marketplaceId?: string
  }) => ['dashboard', 'financial', period] as const,

  chartData: (period?: {
    startDate?: Date
    endDate?: Date
    marketplaceId?: string
  }) => ['dashboard', 'chart', period] as const,

  shippingDifference: (period?: {
    startDate?: Date
    endDate?: Date
    marketplaceId?: string
  }) => ['dashboard', 'shipping', period] as const,

  dashboardItems: (period?: {
    startDate?: Date
    endDate?: Date
    marketplaceId?: string
  }) => ['dashboard', 'items', period] as const,
} as const

/**
 * Type-safe query key types
 */
export type QueryKeys = typeof queryKeys
type QueryKeyValue<T> = T extends (...args: any[]) => infer R ? R : T
export type QueryKey = QueryKeyValue<QueryKeys[keyof QueryKeys]>
