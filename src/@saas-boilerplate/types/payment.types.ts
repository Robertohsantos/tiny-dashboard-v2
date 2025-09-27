/**
 * Tipos compartilhados para integração de pagamentos.
 * Mantidos independentes para evitar bundling de tipos sensíveis em ambientes client-side.
 */

export interface PlanFeature {
  id: string
  planId: string
  name: string
  description?: string
  value: string | number | boolean
  type: 'boolean' | 'limit' | 'number' | 'string'
  metadata?: Record<string, unknown>
}

export interface Price {
  id: string
  planId: string
  amount: number
  currency: 'BRL' | 'USD' | 'EUR' | string
  interval: 'month' | 'year' | 'one_time'
  intervalCount: number
  type: 'recurring' | 'one_time'
  metadata?: Record<string, unknown>
  active?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Plan {
  id: string
  slug: string
  name: string
  description?: string
  features: PlanFeature[]
  prices: Price[]
  metadata?: Record<string, unknown>
  archived?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'

export interface Subscription {
  id: string
  organizationId: string
  planId: string
  priceId: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
  trialStart?: Date
  trialEnd?: Date
  metadata?: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

export type BillingInterval = 'month' | 'year'

export type CyclePeriod = 'month' | 'year'

export interface Customer {
  id: string
  organizationId: string
  name: string
  email: string
  metadata?: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

export interface Usage {
  slug: string
  name: string
  limit?: number
  used?: number
  remaining?: number
  resetAt?: Date | null
}
