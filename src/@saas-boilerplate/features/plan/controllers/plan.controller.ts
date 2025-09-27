import { igniter } from '@/igniter'
import { PlanFeatureProcedure } from '../procedures/plan.procedure'

export const PlanController = igniter.controller({
  name: 'Plan',
  description: 'Subscription plan management and pricing information',
  path: '/plan',
  actions: {
    findMany: igniter.query({
      name: 'listPlans',
      description: 'List subscription plans',
      method: 'GET',
      path: '/',
      use: [PlanFeatureProcedure()],
      handler: async ({ response, context }) => {
        const result = await context.plan.findMany()
        return response.success(result)
      },
    }),
  },
})
