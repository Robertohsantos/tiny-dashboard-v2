/**
 * Marketplace constants and types
 * Defines available marketplaces and their metadata
 */

export interface Marketplace {
  id: string
  name: string
  icon?: string
  color?: string
  commissionRate: number // Commission rate in percentage
  averageShippingCost: number
}

export const MARKETPLACES: Record<string, Marketplace> = {
  all: {
    id: 'all',
    name: 'Todos',
    commissionRate: 0,
    averageShippingCost: 0,
  },
  mercadolivre: {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    color: '#FFE600',
    commissionRate: 13.5,
    averageShippingCost: 25.9,
  },
  shopee: {
    id: 'shopee',
    name: 'Shopee',
    color: '#EE4D2D',
    commissionRate: 11.2,
    averageShippingCost: 15.5,
  },
  shein: {
    id: 'shein',
    name: 'Shein',
    color: '#000000',
    commissionRate: 15.0,
    averageShippingCost: 19.9,
  },
  magazineluiza: {
    id: 'magazineluiza',
    name: 'Magazine Luiza',
    color: '#0066CC',
    commissionRate: 12.8,
    averageShippingCost: 22.4,
  },
} as const

export type MarketplaceId = keyof typeof MARKETPLACES

function isMarketplaceId(value: string): value is MarketplaceId {
  return Object.prototype.hasOwnProperty.call(MARKETPLACES, value)
}

export function getMarketplaceOptions() {
  return Object.values(MARKETPLACES).map((marketplace) => ({
    value: marketplace.id,
    label: marketplace.name,
    color: marketplace.color,
  }))
}

export function getMarketplaceById(id: string): Marketplace {
  return isMarketplaceId(id) ? MARKETPLACES[id] : MARKETPLACES.all
}

/**
 * Mock data multipliers for each marketplace
 * Used to generate different values for each marketplace in development
 */
export const MARKETPLACE_DATA_MULTIPLIERS = {
  all: {
    sales: 1,
    items: 1,
    orders: 1,
    averageTicket: 1,
  },
  mercadolivre: {
    sales: 0.45, // 45% of total sales
    items: 0.42,
    orders: 0.4,
    averageTicket: 1.12, // Higher average ticket
  },
  shopee: {
    sales: 0.25, // 25% of total sales
    items: 0.3,
    orders: 0.32,
    averageTicket: 0.78, // Lower average ticket
  },
  shein: {
    sales: 0.15, // 15% of total sales
    items: 0.18,
    orders: 0.16,
    averageTicket: 0.93,
  },
  magazineluiza: {
    sales: 0.15, // 15% of total sales
    items: 0.1,
    orders: 0.12,
    averageTicket: 1.25, // Higher average ticket
  },
} as const satisfies Record<
  MarketplaceId,
  {
    sales: number
    items: number
    orders: number
    averageTicket: number
  }
>
