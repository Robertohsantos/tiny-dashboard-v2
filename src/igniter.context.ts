import { isServer } from '@igniter-js/core'
import { cache as reactCache } from 'react'

// Cache function that works em ambientes Node e React
const createCache = () => {
  if (typeof window === 'undefined' && typeof reactCache === 'function') {
    return reactCache
  }

  // Identity function para client-side, testes e CLIs
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
