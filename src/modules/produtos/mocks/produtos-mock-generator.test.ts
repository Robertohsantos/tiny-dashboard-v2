import { describe, expect, it, beforeEach } from 'vitest'

import {
  generateMockProdutos,
  setMockProdutosSeed,
} from './produtos-mock-generator'

describe('generateMockProdutos filtering', () => {
  beforeEach(() => {
    setMockProdutosSeed(12345)
  })

  it('matches per-deposito counts when filtering by deposito', () => {
    const total = 150
    const base = generateMockProdutos(total)

    const counts = base.reduce<Record<string, number>>((acc, produto) => {
      acc[produto.deposito] = (acc[produto.deposito] || 0) + 1
      return acc
    }, {})

    for (const [deposito, expectedCount] of Object.entries(counts)) {
      const filtered = generateMockProdutos(total, { deposito: [deposito] })

      expect(filtered.length).toBe(expectedCount)
      expect(new Set(filtered.map((produto) => produto.deposito))).toEqual(
        new Set([deposito]),
      )
    }
  })

  it('supports multi-deposito selection without duplicate inflation', () => {
    const total = 150
    const base = generateMockProdutos(total)

    const depositos = Array.from(new Set(base.map((produto) => produto.deposito)))
    const [first, second] = depositos
    const combined = generateMockProdutos(total, {
      deposito: [first, second],
    })

    const expected = base.filter((produto) =>
      produto.deposito === first || produto.deposito === second,
    )

    expect(combined.length).toBe(expected.length)
    expect(new Set(combined.map((produto) => produto.deposito))).toEqual(
      new Set([first, second]),
    )
  })
})
