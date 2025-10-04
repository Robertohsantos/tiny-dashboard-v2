import { describe, it, expect } from 'vitest'

import { generateMockProdutos } from '@/modules/produtos/mocks/produtos-mock-generator'

import { normalizeMarca } from '@/modules/produtos/utils/produtos-transforms.utils'

describe('generateMockProdutos empty selection', () => {
  it('returns empty array when a selection array is empty', () => {
    const produtos = generateMockProdutos(50, {
      deposito: [],
    })

    expect(produtos).toEqual([])
  })


  it('applies filters before truncating the dataset to the requested limit', () => {
    const seed = 20240318
    const baseProdutos = generateMockProdutos(200, undefined, seed)

    const marcaPositions = new Map<string, { firstIndex: number; count: number }>()
    baseProdutos.forEach((produto, index) => {
      const slug = normalizeMarca(produto.marca)
      if (!marcaPositions.has(slug)) {
        marcaPositions.set(slug, { firstIndex: index, count: 1 })
      } else {
        const entry = marcaPositions.get(slug)!
        entry.count += 1
      }
    })

    const candidates = Array.from(marcaPositions.entries())
      .filter(([, info]) => info.firstIndex > 0 && info.count > 0)
      .sort((a, b) => b[1].firstIndex - a[1].firstIndex)

    expect(candidates.length).toBeGreaterThan(0)
    const [targetSlug, info] = candidates[0]

    const limit = info.firstIndex
    const filtered = generateMockProdutos(limit, { marca: targetSlug }, seed)

    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((produto) => normalizeMarca(produto.marca) === targetSlug)).toBe(true)
  })

})
