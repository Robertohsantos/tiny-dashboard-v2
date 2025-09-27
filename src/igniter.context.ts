import { isServer } from '@igniter-js/core'

// Cache function that works in both Node and React environments
const createCache = () => {
  // Only use React cache in React Server Components environment
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { cache } = require('react')
      return cache
    } catch {
      // Fall back to identity function if React cache not available
      return <T extends (...args: any[]) => any>(fn: T) => fn
    }
  }
  // Identity function for client-side and Node CLI
  return <T extends (...args: any[]) => any>(fn: T) => fn
}

const cacheWrapper = createCache()

const getServices = cacheWrapper(async () => {
  const { prisma } = await import('@/modules/core/services/prisma')
  const { plugins } = await import('@/modules/core/services/plugin-manager')
  const { mail } = await import('@/modules/core/services/mail')
  const { payment } = await import('@/modules/billing/services/payment')
  const { auth } = await import('@/modules/auth/services/auth')
  const { logger } = await import('@/modules/core/services/logger')
  const { notification } = await import('@/modules/notification/services/notification')

  return {
    auth,
    database: prisma,
    mail,
    payment,
    plugins,
    logger,
    notification,
  }
})

type Services = Awaited<ReturnType<typeof getServices>>

export const createIgniterAppContext = cacheWrapper(async () => {
  return {
    services: isServer ? await getServices() : ({} as Services),
  }
})

/**
 * @description The context of the application
 * @see https://igniter.felipebarcelospro.github.io/docs/getting-started/installation
 */
export type IgniterAppContext = Awaited<
  ReturnType<typeof createIgniterAppContext>
>
