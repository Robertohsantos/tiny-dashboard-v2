import { Prisma } from '@/generated/prisma/client'
import type {
  Customer as PrismaCustomer,
  Price as PrismaPrice,
  Subscription as PrismaSubscription,
  SubscriptionStatus as PrismaSubscriptionStatus,
  PrismaClient,
} from '@/generated/prisma/client'
import { PaymentProvider } from '../payment.provider'
import type {
  CustomerDTO,
  PlanDTO,
  CyclePeriod,
  PriceDTO,
  SubscriptionDTO,
  Customer,
  Plan,
  Usage,
  Subscription,
  PlanMetadata,
  Price,
} from '../types'
import type { DatabaseAdapterQueryParams } from './database-adapter.interface'
import { String } from '@/@saas-boilerplate/utils/string'

const CYCLE_PERIODS: readonly CyclePeriod[] = ['day', 'week', 'month', 'year']
const SUBSCRIPTION_STATUSES: readonly PrismaSubscriptionStatus[] = [
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'trialing',
  'unpaid',
]
const ACTIVE_SUBSCRIPTION_STATUS_FILTER: readonly PrismaSubscriptionStatus[] = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
]

const planWithPricesArgs = Prisma.validator<Prisma.PlanDefaultArgs>()({
  include: { prices: true },
})
type PlanWithPrices = Prisma.PlanGetPayload<typeof planWithPricesArgs>

const subscriptionWithPlanArgs = Prisma.validator<
  Prisma.SubscriptionDefaultArgs
>()({
  include: {
    price: {
      include: { plan: true },
    },
  },
})
type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<
  typeof subscriptionWithPlanArgs
>

const customerWithActiveSubscriptionsArgs =
  Prisma.validator<Prisma.CustomerDefaultArgs>()({
    include: {
      subscriptions: {
        where: {
          status: {
            in: [...ACTIVE_SUBSCRIPTION_STATUS_FILTER],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: subscriptionWithPlanArgs.include,
      },
    },
  })

type CountDelegate = {
  count: (args: { where?: Record<string, unknown> }) => Promise<number>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

type JsonPrimitive = string | number | boolean | null

function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function isJsonValue(value: unknown): value is Prisma.JsonValue {
  if (isJsonPrimitive(value)) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }

  if (isRecord(value)) {
    return Object.values(value).every(isJsonValue)
  }

  return false
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined
  }

  return isJsonValue(value) ? (value as Prisma.InputJsonValue) : undefined
}

function toJsonObject(value: unknown): Prisma.JsonObject | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  if (!Object.values(value).every(isJsonValue)) {
    return undefined
  }

  return value as Prisma.JsonObject
}

function toMetadataRecord(
  value: unknown,
): Record<string, unknown> | undefined {
  const jsonObject = toJsonObject(value)
  return jsonObject ? (jsonObject as Record<string, unknown>) : undefined
}

function ensureCyclePeriod(
  value: unknown,
  fallback: CyclePeriod = 'month',
): CyclePeriod {
  return typeof value === 'string' && CYCLE_PERIODS.includes(value as CyclePeriod)
    ? (value as CyclePeriod)
    : fallback
}

function ensureSubscriptionStatus(value: unknown): Subscription['status'] {
  return typeof value === 'string' &&
    SUBSCRIPTION_STATUSES.includes(value as PrismaSubscriptionStatus)
    ? (value as Subscription['status'])
    : 'active'
}

function toProrationBehavior(
  value: unknown,
): Subscription['prorationBehavior'] {
  return value === 'create_prorations' || value === 'none' ? value : undefined
}

type PlanFeatureInput = {
  slug?: unknown
  name?: unknown
  enabled?: unknown
  description?: unknown
  table?: unknown
  limit?: unknown
  cycle?: unknown
}

function parsePlanMetadata(metadata: unknown): PlanMetadata {
  if (!isRecord(metadata)) {
    return { features: [] }
  }

  const rawFeatures = Array.isArray(metadata.features)
    ? (metadata.features as unknown[])
    : []

  const features = rawFeatures
    .map((feature): PlanMetadata['features'][number] | null => {
      if (!isRecord(feature)) return null

      const {
        slug,
        name,
        enabled = true,
        description,
        table,
        limit,
        cycle,
      } = feature as PlanFeatureInput

      if (!enabled) return null
      if (typeof slug !== 'string' || typeof name !== 'string') return null

      return {
        slug,
        name,
        enabled: true,
        description: typeof description === 'string' ? description : undefined,
        table: typeof table === 'string' ? table : undefined,
        limit: typeof limit === 'number' ? limit : undefined,
        cycle: ensureCyclePeriod(cycle, 'month'),
      }
    })
    .filter((feature): feature is PlanMetadata['features'][number] => feature !== null)

  return { features }
}

function hasCountDelegate(value: unknown): value is CountDelegate {
  return (
    isRecord(value) &&
    typeof (value as { count?: unknown }).count === 'function'
  )
}

function mapPrice(price: PrismaPrice): Price {
  const metadata = toMetadataRecord(price.metadata)

  return {
    id: price.id,
    providerId: price.providerId,
    planId: price.planId,
    slug: price.slug,
    amount: price.amount,
    currency: price.currency,
    interval: ensureCyclePeriod(price.interval, 'month'),
    intervalCount: price.intervalCount,
    ...(metadata ? { metadata } : {}),
    active: true,
    createdAt: price.createdAt ?? undefined,
    updatedAt: price.updatedAt ?? undefined,
  }
}

function mapPlan(plan: PlanWithPrices): Plan {
  const metadata = parsePlanMetadata(plan.metadata)

  return {
    id: plan.id,
    providerId: plan.providerId,
    slug: plan.slug,
    name: plan.name,
    description: plan.description ?? '',
    metadata,
    prices: plan.prices.map((price) => mapPrice(price)),
    archived: plan.archived ?? undefined,
    createdAt: plan.createdAt ?? undefined,
    updatedAt: plan.updatedAt ?? undefined,
  }
}

function mapCustomer(customer: PrismaCustomer): Customer {
  const metadata = toMetadataRecord(customer.metadata)

  return {
    id: customer.id,
    providerId: customer.providerId,
    organizationId: customer.organizationId,
    name: customer.name,
    email: customer.email ?? '',
    ...(metadata ? { metadata } : {}),
    createdAt: customer.createdAt ?? undefined,
    updatedAt: customer.updatedAt ?? undefined,
  }
}

function mapSubscription(subscription: PrismaSubscription): Subscription {
  const metadata = toMetadataRecord(subscription.metadata)

  return {
    id: subscription.id,
    customerId: subscription.customerId,
    providerId: subscription.providerId,
    priceId: subscription.priceId,
    quantity: subscription.quantity ?? undefined,
    trialDays: subscription.trialDays ?? undefined,
    status: ensureSubscriptionStatus(subscription.status),
    ...(metadata ? { metadata } : {}),
    billingCycleAnchor: subscription.billingCycleAnchor ?? undefined,
    prorationBehavior: toProrationBehavior(subscription.prorationBehavior),
    createdAt: subscription.createdAt ?? undefined,
    updatedAt: subscription.updatedAt ?? undefined,
  }
}

function mapCustomerSubscription(
  subscription: SubscriptionWithPlan,
  usage: Usage[],
): NonNullable<Customer['subscription']> {
  const plan = subscription.price.plan
  const price = subscription.price

  return {
    id: subscription.id,
    providerId: subscription.providerId,
    status: ensureSubscriptionStatus(subscription.status),
    trialDays: subscription.trialDays ?? null,
    plan: {
      id: plan.id,
      providerId: plan.providerId,
      slug: plan.slug,
      name: plan.name,
      description: plan.description ?? '',
      metadata: parsePlanMetadata(plan.metadata),
      price: {
        id: price.id,
        providerId: price.providerId,
        slug: price.slug,
        amount: price.amount,
        currency: price.currency,
        interval: ensureCyclePeriod(price.interval, 'month'),
      },
    },
    usage,
    createdAt: subscription.createdAt ?? undefined,
    updatedAt: subscription.updatedAt ?? undefined,
  }
}

function mapListOrder<T extends string>(
  field: T | undefined,
  direction: 'asc' | 'desc' | undefined,
  allowed: ReadonlyArray<T>,
): { field: T; direction: 'asc' | 'desc' } | undefined {
  if (!field || !allowed.includes(field)) {
    return undefined
  }

  return {
    field,
    direction: direction ?? 'asc',
  }
}

export const prismaAdapter = PaymentProvider.database<PrismaClient>(
  (prisma) => {
    async function getCustomerUsageByRefId(
      customerId: string,
    ): Promise<Usage[]> {
      try {
        const customer = await prisma.customer.findFirst({
          where: {
            OR: [{ id: customerId }, { organizationId: customerId }],
          },
        })

        if (!customer) {
          console.warn(`Customer ${customerId} not found`)
          return []
        }

        const subscription = await prisma.subscription.findFirst({
          where: {
            customerId: customer.id,
            status: {
              in: [...ACTIVE_SUBSCRIPTION_STATUS_FILTER],
            },
          },
          include: subscriptionWithPlanArgs.include,
        })

        if (!subscription) {
          console.warn(
            `No active subscription found for customer ${customerId}`,
          )
          return []
        }

        const metadata = parsePlanMetadata(subscription.price.plan.metadata)
        if (metadata.features.length === 0) {
          console.warn(
            `No features found in plan metadata for subscription ${subscription.id}`,
          )
          return []
        }

        const usage: Usage[] = []
        const now = new Date()
        const organizationId = customer.organizationId

        for (const feature of metadata.features) {
          if (!feature.enabled || !feature.limit) {
            continue
          }

          let lastReset = new Date()
          let nextReset = new Date()

          switch (feature.cycle) {
            case 'day':
              lastReset.setHours(0, 0, 0, 0)
              nextReset = new Date(lastReset)
              nextReset.setDate(nextReset.getDate() + 1)
              break
            case 'week':
              lastReset.setDate(lastReset.getDate() - lastReset.getDay())
              lastReset.setHours(0, 0, 0, 0)
              nextReset = new Date(lastReset)
              nextReset.setDate(nextReset.getDate() + 7)
              break
            case 'month':
              lastReset.setDate(1)
              lastReset.setHours(0, 0, 0, 0)
              nextReset = new Date(lastReset)
              nextReset.setMonth(nextReset.getMonth() + 1)
              break
            case 'year':
              lastReset = new Date(now.getFullYear(), 0, 1)
              nextReset = new Date(now.getFullYear() + 1, 0, 1)
              break
            default:
              lastReset = new Date(0)
              nextReset = new Date(8640000000000000)
          }

          try {
            let usageCount = 0

            if (feature.table && organizationId) {
              const modelName = String.toCamelCase(feature.table)

              if (!modelName) {
                continue
              }

              const delegate = prisma[modelName as keyof PrismaClient]

              if (!hasCountDelegate(delegate)) {
                console.warn(`Table ${modelName} not found in Prisma client`)
                continue
              }

              usageCount = await delegate.count({
                where: { organizationId },
              })
            }

            usage.push({
              slug: feature.slug,
              name: feature.name,
              description: feature.description,
              limit: feature.limit,
              usage: usageCount,
              cycle: feature.cycle ?? 'month',
              lastReset,
              nextReset,
            })
          } catch (error) {
            console.error(
              `Error getting usage for feature ${feature.slug}:`,
              error,
            )
            usage.push({
              slug: feature.slug,
              name: feature.name,
              description: feature.description,
              limit: feature.limit,
              usage: 0,
              cycle: feature.cycle ?? 'month',
              lastReset,
              nextReset,
            })
          }
        }

        return usage
      } catch (error) {
        console.error('Error in getCustomerUsageByRefId:', error)
        throw new Error(
          `Failed to get customer usage: ${(error as Error).message}`,
        )
      }
    }

    return {
      // Customer Management
      async createCustomer(params: CustomerDTO): Promise<Customer> {
        if (!params.referenceId) {
          throw new Error('referenceId é obrigatório')
        }
        if (!params.providerId) {
          throw new Error('providerId é obrigatório')
        }

        const newCustomer = await prisma.customer.create({
          data: {
            providerId: params.providerId,
            name: params.name,
            email: params.email,
            metadata: toJsonValue(params.metadata),
            organizationId: params.referenceId,
          },
        })

        return mapCustomer(newCustomer)
      },

      async updateCustomer(
        customerId: string,
        params: Partial<CustomerDTO>,
      ): Promise<Customer> {
        const data: Prisma.CustomerUpdateInput = {}

        if (params.providerId !== undefined) data.providerId = params.providerId
        if (params.name !== undefined) data.name = params.name
        if (params.email !== undefined) data.email = params.email
        if (params.metadata !== undefined)
          data.metadata = toJsonValue(params.metadata)

        const updatedCustomer = await prisma.customer.update({
          where: { id: customerId },
          data,
        })

        return mapCustomer(updatedCustomer)
      },

      async deleteCustomer(customerId: string): Promise<void> {
        await prisma.customer.delete({
          where: { id: customerId },
        })
      },

      async listCustomers(
        search?: DatabaseAdapterQueryParams<Customer>,
      ): Promise<Customer[]> {
        const limit = search?.limit ?? 10
        const offset = search?.offset ?? 0

        const where: Prisma.CustomerWhereInput = {}

        if (search?.where) {
          const { id, providerId, organizationId, name, email } = search.where

          if (id) where.id = id
          if (providerId) where.providerId = providerId
          if (organizationId) where.organizationId = organizationId
          if (name) where.name = name
          if (email) where.email = email
        }

        const order = mapListOrder(
          search?.orderBy,
          search?.orderDirection,
          ['id', 'name', 'providerId', 'organizationId', 'createdAt', 'updatedAt'],
        )

        const customers = await prisma.customer.findMany({
          where,
          orderBy: order ? { [order.field]: order.direction } : undefined,
          take: limit,
          skip: offset,
        })

        return customers.map((customer) => mapCustomer(customer))
      },

      async getPlanById(planId: string): Promise<Plan | null> {
        const plan = await prisma.plan.findUnique({
          where: { id: planId },
          include: planWithPricesArgs.include,
        })

        return plan ? mapPlan(plan) : null
      },

      async getPriceById(priceId: string): Promise<Price | null> {
        const price = await prisma.price.findFirst({
          where: {
            OR: [{ id: priceId }, { providerId: priceId }],
          },
        })

        return price ? mapPrice(price) : null
      },

      async getCustomerById(customerRefId: string): Promise<Customer | null> {
        const result = await prisma.customer.findFirst({
          where: {
            OR: [
              { id: customerRefId },
              { organizationId: customerRefId },
              { providerId: customerRefId },
            ],
          },
          include: customerWithActiveSubscriptionsArgs.include,
        })

        if (!result) {
          return null
        }

        const [subscription] = result.subscriptions

        const customer = mapCustomer(result)

        if (subscription) {
          const usage = await getCustomerUsageByRefId(result.id)
          customer.subscription = mapCustomerSubscription(subscription, usage)
        }

        return customer
      },

      async createPrice(params: PriceDTO): Promise<Price> {
        if (!params.providerId) {
          throw new Error('providerId é obrigatório')
        }

        const createdPrice = await prisma.price.create({
          data: {
            providerId: params.providerId,
            planId: params.planId,
            slug: params.slug,
            amount: params.amount,
            currency: params.currency,
            interval: params.interval,
            intervalCount: params.intervalCount,
            metadata: toJsonValue(params.metadata),
          },
        })

        return mapPrice(createdPrice)
      },

      async getCustomerActiveSubscription(
        customerId: string,
      ): Promise<Subscription | null> {
        const subscription = await prisma.subscription.findFirst({
          where: {
            customer: {
              organizationId: customerId,
            },
            status: 'active',
          },
        })

        return subscription ? mapSubscription(subscription) : null
      },

      // Plans and Prices
      async createPlan(options: PlanDTO): Promise<Plan> {
        if (!options.providerId) {
          throw new Error('providerId é obrigatório')
        }

        const priceData: Prisma.PriceCreateWithoutPlanInput[] = options.prices.map((price) => {
          if (!price.providerId) {
            throw new Error('price.providerId é obrigatório')
          }

          return {
            slug: price.slug,
            providerId: price.providerId,
            amount: price.amount,
            currency: price.currency,
            interval: price.interval,
            intervalCount: price.intervalCount,
            metadata: toJsonValue(price.metadata),
          }
        })

        const plan = await prisma.plan.create({
          data: {
            slug: options.slug,
            providerId: options.providerId,
            name: options.name,
            description: options.description,
            metadata: toJsonValue(options.metadata),
            prices: {
              create: priceData,
            },
          },
          include: planWithPricesArgs.include,
        })

        return mapPlan(plan)
      },

      async updatePlan(params: Partial<PlanDTO>): Promise<Plan> {
        if (!params.slug) {
          throw new Error('slug é obrigatório')
        }

        const data: Prisma.PlanUpdateInput = {}

        if (params.name !== undefined) data.name = params.name
        if (params.description !== undefined) data.description = params.description
        if (params.metadata !== undefined)
          data.metadata = toJsonValue(params.metadata)
        if (params.providerId !== undefined) data.providerId = params.providerId

        const plan = await prisma.plan.update({
          where: { slug: params.slug },
          data,
          include: planWithPricesArgs.include,
        })

        return mapPlan(plan)
      },

      async upsertPlan(options: PlanDTO): Promise<Plan> {
        const existingPlan = await prisma.plan.findFirst({
          where: {
            slug: options.slug,
          },
        })

        if (existingPlan) {
          await prisma.plan.update({
            where: { id: existingPlan.id },
            data: {
              name: options.name,
              description: options.description,
              metadata: toJsonValue(options.metadata),
              providerId: options.providerId ?? existingPlan.providerId,
            },
          })

          await prisma.price.deleteMany({
            where: { planId: existingPlan.id },
          })

          const priceData: Prisma.PriceCreateManyInput[] = options.prices.map((price) => {
            if (!price.providerId) {
              throw new Error('price.providerId é obrigatório')
            }

            return {
              slug: price.slug,
              providerId: price.providerId,
              planId: existingPlan.id,
              amount: price.amount,
              currency: price.currency,
              interval: price.interval,
              intervalCount: price.intervalCount,
              metadata: toJsonValue(price.metadata),
            }
          })

          if (priceData.length > 0) {
            await prisma.price.createMany({
              data: priceData,
            })
          }

          const updatedPlan = await prisma.plan.findUniqueOrThrow({
            where: { id: existingPlan.id },
            include: planWithPricesArgs.include,
          })

          return mapPlan(updatedPlan)
        }

        if (!options.providerId) {
          throw new Error('providerId é obrigatório')
        }

        const priceData: Prisma.PriceCreateWithoutPlanInput[] = options.prices.map((price) => {
          if (!price.providerId) {
            throw new Error('price.providerId é obrigatório')
          }

          return {
            slug: price.slug,
            providerId: price.providerId,
            amount: price.amount,
            currency: price.currency,
            interval: price.interval,
            intervalCount: price.intervalCount,
            metadata: toJsonValue(price.metadata),
          }
        })

        const plan = await prisma.plan.create({
          data: {
            slug: options.slug,
            providerId: options.providerId,
            name: options.name,
            description: options.description,
            metadata: toJsonValue(options.metadata),
            prices: {
              create: priceData,
            },
          },
          include: planWithPricesArgs.include,
        })

        return mapPlan(plan)
      },

      async archivePlan(planId: string): Promise<void> {
        await prisma.plan.update({
          where: { id: planId },
          data: { archived: true },
        })
      },

      async listPlans(
        search?: DatabaseAdapterQueryParams<Plan>,
      ): Promise<Plan[]> {
        const limit = search?.limit ?? 10
        const offset = search?.offset ?? 0

        const where: Prisma.PlanWhereInput = {}

        if (search?.where) {
          const { id, slug, providerId, archived, name } = search.where

          if (id) where.id = id
          if (slug) where.slug = slug
          if (providerId) where.providerId = providerId
          if (typeof archived === 'boolean') where.archived = archived
          if (name) where.name = name
        }

        const order = mapListOrder(
          search?.orderBy,
          search?.orderDirection,
          ['id', 'slug', 'name', 'providerId', 'createdAt', 'updatedAt'],
        )

        const plans = await prisma.plan.findMany({
          where,
          orderBy: order ? { [order.field]: order.direction } : undefined,
          take: limit,
          skip: offset,
          include: planWithPricesArgs.include,
        })

        return plans.map((plan) => mapPlan(plan))
      },

      async findPlanBySlug(slug: string): Promise<Plan | null> {
        const plan = await prisma.plan.findFirst({
          where: { slug },
          include: planWithPricesArgs.include,
        })

        return plan ? mapPlan(plan) : null
      },

      async getPlanByProviderId(providerId: string): Promise<Plan | null> {
        const plan = await prisma.plan.findFirst({
          where: { providerId },
          include: planWithPricesArgs.include,
        })

        return plan ? mapPlan(plan) : null
      },

      async getPlanBySlug(slug: string): Promise<Plan | null> {
        const plan = await prisma.plan.findFirst({
          where: { slug },
          include: planWithPricesArgs.include,
        })

        return plan ? mapPlan(plan) : null
      },

      async updatePrice(
        priceId: string,
        params: Partial<PriceDTO>,
      ): Promise<Price> {
        const data: Prisma.PriceUpdateInput = {}

        if (params.currency !== undefined) data.currency = params.currency
        if (params.amount !== undefined) data.amount = params.amount
        if (params.interval !== undefined) data.interval = params.interval
        if (params.intervalCount !== undefined)
          data.intervalCount = params.intervalCount
        if (params.metadata !== undefined)
          data.metadata = toJsonValue(params.metadata)

        const updatedPrice = await prisma.price.update({
          where: { id: priceId },
          data,
        })

        return mapPrice(updatedPrice)
      },

      async deletePrice(priceId: string): Promise<void> {
        await prisma.price.delete({
          where: { id: priceId },
        })
      },

      // Subscriptions
      async createSubscription(params: SubscriptionDTO): Promise<Subscription> {
        if (!params.providerId) {
          throw new Error('providerId é obrigatório')
        }

        const subscription = await prisma.subscription.create({
          data: {
            providerId: params.providerId,
            customerId: params.customerId,
            priceId: params.priceId,
            quantity: params.quantity ?? undefined,
            trialDays: params.trialDays ?? undefined,
            status: params.status,
            metadata: toJsonValue(params.metadata),
            billingCycleAnchor: params.billingCycleAnchor ?? undefined,
            prorationBehavior: params.prorationBehavior ?? undefined,
          },
        })

        return mapSubscription(subscription)
      },

      async getSubscriptionById(
        subscriptionId: string,
      ): Promise<Subscription | null> {
        const subscription = await prisma.subscription.findFirst({
          where: {
            OR: [{ id: subscriptionId }, { providerId: subscriptionId }],
          },
        })

        return subscription ? mapSubscription(subscription) : null
      },

      async updateSubscription(
        subscriptionId: string,
        params: Partial<SubscriptionDTO>,
      ): Promise<Subscription> {
        const data: Prisma.SubscriptionUpdateInput = {}

        if (params.providerId !== undefined) data.providerId = params.providerId
        if (params.quantity !== undefined) data.quantity = params.quantity
        if (params.trialDays !== undefined) data.trialDays = params.trialDays
        if (params.billingCycleAnchor !== undefined)
          data.billingCycleAnchor = params.billingCycleAnchor
        if (params.prorationBehavior !== undefined)
          data.prorationBehavior = params.prorationBehavior
        if (params.metadata !== undefined)
          data.metadata = toJsonValue(params.metadata)
        if (params.priceId !== undefined)
          data.price = { connect: { id: params.priceId } }
        if (params.status !== undefined) data.status = params.status

        const subscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data,
        })

        return mapSubscription(subscription)
      },

      async cancelSubscription(subscriptionId: string): Promise<void> {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'canceled',
          },
        })
      },

      async listSubscriptions(
        search?: DatabaseAdapterQueryParams<Subscription>,
      ): Promise<Subscription[]> {
        const limit = search?.limit ?? 10
        const offset = search?.offset ?? 0

        const where: Prisma.SubscriptionWhereInput = {}

        if (search?.where) {
          const { id, providerId, customerId, priceId, status } = search.where

          if (id) where.id = id
          if (providerId) where.providerId = providerId
          if (customerId) where.customerId = customerId
          if (priceId) where.priceId = priceId
          if (status) where.status = ensureSubscriptionStatus(status)
        }

        const order = mapListOrder(
          search?.orderBy,
          search?.orderDirection,
          ['id', 'customerId', 'priceId', 'providerId', 'createdAt', 'updatedAt'],
        )

        const subscriptions = await prisma.subscription.findMany({
          where,
          orderBy: order ? { [order.field]: order.direction } : undefined,
          take: limit,
          skip: offset,
        })

        return subscriptions.map((subscription) => mapSubscription(subscription))
      },

      async getCustomerUsage(params: {
        customerId: string
        feature: string
      }): Promise<number> {
        const usage = await getCustomerUsageByRefId(params.customerId)
        const featureUsage = usage.find((item) => item.slug === params.feature)
        return featureUsage?.usage ?? 0
      },
    }
  },
)
