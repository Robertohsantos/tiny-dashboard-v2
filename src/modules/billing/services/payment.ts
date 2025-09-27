import { PaymentProvider } from '@/@saas-boilerplate/providers/payment'
import type { PlanDTO } from '@/@saas-boilerplate/providers/payment/types'
import { prismaAdapter } from '@/@saas-boilerplate/providers/payment/databases/prisma'
import { stripeAdapter } from '@/@saas-boilerplate/providers/payment/providers/stripe.adapter'
import { AppConfig } from '@/config/boilerplate.config.server'
import { prisma } from '@/modules/core/services/prisma'

const { keys, paths, subscription } = AppConfig.providers.billing

export const payment = PaymentProvider.initialize({
  database: prismaAdapter(prisma),
  adapter: stripeAdapter(keys),
  paths: {
    checkoutCancelUrl: paths.checkoutCancelUrl,
    checkoutSuccessUrl: paths.checkoutSuccessUrl,
    portalReturnUrl: paths.portalReturnUrl,
    endSubscriptionUrl: paths.endSubscriptionUrl,
  },
  subscriptions: {
    enabled: subscription.enabled,
    trial: {
      enabled: subscription.trial.enabled,
      duration: subscription.trial.duration,
    },
    plans: {
      default: subscription.plans.default,
      options: Array.from(
        structuredClone(subscription.plans.options),
      ) as Omit<PlanDTO, 'providerId'>[],
    },
  },
  events: {},
})
