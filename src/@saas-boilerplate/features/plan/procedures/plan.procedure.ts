import { igniter } from '@/igniter'
import type { Plan } from '../plan.interface'

type PlanMetadataFeature = {
  slug: string
  name: string
  description?: string
  enabled?: boolean
  limit?: number | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const extractMetadataFeatures = (
  metadata: unknown,
): PlanMetadataFeature[] => {
  if (!isRecord(metadata)) {
    return []
  }

  const rawFeatures = metadata.features

  if (!Array.isArray(rawFeatures)) {
    return []
  }

  return rawFeatures.filter(isRecord).reduce<PlanMetadataFeature[]>((acc, feature) => {
    if (typeof feature.slug !== 'string' || typeof feature.name !== 'string') {
      return acc
    }

    acc.push({
      slug: feature.slug,
      name: feature.name,
      description:
        typeof feature.description === 'string' ? feature.description : undefined,
      enabled:
        typeof feature.enabled === 'boolean' ? feature.enabled : undefined,
      limit: typeof feature.limit === 'number' ? feature.limit : null,
    })

    return acc
  }, [])
}

export const PlanFeatureProcedure = igniter.procedure({
  name: 'PlanFeatureProcedure',
  handler: (_, { context }) => ({
    plan: {
      async findMany(): Promise<Plan[]> {
        const plans = await context.services.payment.listPlans()

        return plans.map((plan) => {
          const metadataFeatures = extractMetadataFeatures(plan.metadata)

          return {
            id: plan.id,
            slug: plan.slug,
            name: plan.name,
            description: plan.description,
            features: metadataFeatures.map((feature) => ({
              id: feature.slug,
              planId: plan.id,
              name: feature.name,
              description: feature.description,
              value:
                feature.limit !== null && feature.limit !== undefined
                  ? feature.limit
                  : Boolean(feature.enabled),
              type:
                feature.limit !== null && feature.limit !== undefined
                  ? 'limit'
                  : 'boolean',
            })),
            prices: (plan.prices ?? []).map((price) => ({
              id: price.id,
              planId: price.planId,
              amount: price.amount,
              currency: price.currency,
              interval:
                price.interval === 'year'
                  ? 'year'
                  : price.interval === 'month'
                    ? 'month'
                    : 'month',
              intervalCount: price.intervalCount,
              type: 'recurring',
              metadata: price.metadata,
              createdAt: price.createdAt,
              updatedAt: price.updatedAt,
            })),
            metadata: plan.metadata,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
          }
        })
      },
    },
  }),
})
