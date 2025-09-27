import { igniter } from '@/igniter'
import { BillingFeatureProcedure } from '../procedures/billing.procedure'
import { AuthFeatureProcedure } from '../../auth'
import { z } from 'zod'
import type { CyclePeriod } from '@/@saas-boilerplate/types/payment.types'

export const BillingController = igniter.controller({
  name: 'Billing',
  description:
    'Subscription billing management including checkout sessions and customer portal access',
  path: '/billing',
  actions: {
    getSessionCustomer: igniter.query({
      name: 'getSessionCustomer',
      description: 'Get billing customer info',
      method: 'GET',
      path: '/subscription',
      use: [BillingFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })
        const billingInfo = await context.billing.getBilling({
          id: session.organization.id,
        })
        return response.success(billingInfo)
      },
    }),

    createCheckoutSession: igniter.mutation({
      name: 'createCheckoutSession',
      description: 'Create payment checkout',
      method: 'POST',
      path: '/subscription',
      use: [BillingFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        plan: z.string(),
        cycle: z.enum(['month', 'year', 'week', 'day']),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })

        const result = await context.billing.createBillingCheckoutSession({
          id: session.organization.id,
          plan: request.body.plan,
          cycle: request.body.cycle as CyclePeriod,
        })

        return response.success(result)
      },
    }),

    createSessionManager: igniter.mutation({
      name: 'createSessionManager',
      description: 'Create billing manager',
      method: 'POST',
      path: '/subscription/open',
      use: [BillingFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        returnUrl: z.string(),
      }),
      handler: async ({ response, request, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })

        const result = await context.billing.createBillingSessionManager({
          id: session.organization.id,
          returnUrl: request.body.returnUrl,
        })

        return response.success(result)
      },
    }),
  },
})
