import type { CyclePeriod } from '@/@saas-boilerplate/types/payment.types'
import { igniter } from '@/igniter'

export const BillingFeatureProcedure = igniter.procedure({
  name: 'BillingFeatureProcedure',
  handler: (_, { context }) => {
    return {
      billing: {
        getBilling: async (params: { id: string }) => {
          const organization =
            await context.services.database.organization.findUnique({
              where: { id: params.id },
            })

          if (!organization) throw new Error('Organization not found')

          return context.services.payment.getCustomerById(params.id)
        },

        createBillingCheckoutSession: async (params: {
          id: string
          plan: string
          cycle: CyclePeriod
          cancelUrl?: string
          successUrl?: string
        }) => {
          const organization =
            await context.services.database.organization.findUnique({
              where: { id: params.id },
            })

          if (!organization) throw new Error('Organization not found')

          return context.services.payment.createCheckoutSession({
            customerId: params.id,
            plan: params.plan,
            cycle: params.cycle,
            cancelUrl: params.cancelUrl,
            successUrl: params.successUrl,
          })
        },

        createBillingSessionManager: async (params: {
          id: string
          returnUrl: string
        }) => {
          const organization =
            await context.services.database.organization.findUnique({
              where: { id: params.id },
            })

          if (!organization) throw new Error('Organization not found')

          return context.services.payment.createBillingPortal(
            organization.id,
            params.returnUrl,
          )
        },
      },
    }
  },
})
