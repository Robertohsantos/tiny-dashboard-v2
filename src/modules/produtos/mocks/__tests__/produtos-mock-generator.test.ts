import { describe, it, expect } from 'vitest'

import { generateMockProdutos } from '@/modules/produtos/mocks/produtos-mock-generator'

describe('generateMockProdutos empty selection', () => {
  it('returns empty array when a selection array is empty', () => {
    const produtos = generateMockProdutos(50, {
      deposito: [],
    })

    expect(produtos).toEqual([])
  })
})
