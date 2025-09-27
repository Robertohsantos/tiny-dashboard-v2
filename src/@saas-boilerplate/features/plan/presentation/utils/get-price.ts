import type {
  CyclePeriod,
  Price,
} from '@/@saas-boilerplate/types/payment.types'

export function getPrice(prices: Price[], cycle: CyclePeriod = 'month') {
  return prices.find((price) => price.interval === cycle)
}
