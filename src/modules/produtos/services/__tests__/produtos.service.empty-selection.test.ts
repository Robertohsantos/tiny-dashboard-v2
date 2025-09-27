import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/modules/core/config/environment', () => ({
  ENV_CONFIG: {
    useMockData: true,
    isDevelopment: true,
    isProduction: false,
    isDebugEnabled: false,
    isChartDebugEnabled: false,
    defaultOrganizationId: '',
  },
}))

const generateMockProdutoMetrics = vi.fn()
const generateMockProdutos = vi.fn()
const generateStockDistribution = vi.fn()
const generateProdutosReposicao = vi.fn()

vi.mock('@/modules/produtos/mocks/produtos-mock-generator', () => ({
  generateMockProdutoMetrics,
  generateMockProdutos,
  generateStockDistribution,
  generateProdutosReposicao,
}))

describe('ProdutosService empty selection behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty dataset when any selection array is empty', async () => {
    const { produtosService } = await import('@/modules/produtos/services/produtos.service')

    const result = await produtosService.getCompleteProdutoData({
      deposito: [],
    })

    expect(result.produtos).toEqual([])
    expect(result.analytics?.distribuicaoEstoque).toEqual([])
    expect(result.analytics?.produtosReposicao).toEqual([])
    expect(result.metrics.totalEstoque.value).toBe(0)
    expect(result.metrics.vendaTotalEstoque.value).toBe(0)
    expect(result.metrics.produtosEmFalta.numericValue).toBe(0)
    expect(generateMockProdutos).not.toHaveBeenCalled()
    expect(generateMockProdutoMetrics).not.toHaveBeenCalled()
  })

  it('delegates to mock generators when selections are provided', async () => {
    const { produtosService } = await import('@/modules/produtos/services/produtos.service')

    generateMockProdutos.mockReturnValue([])
    generateMockProdutoMetrics.mockReturnValue({
      totalEstoque: {
        value: 10,
        currency: 'R$',
        change: 0,
        trend: 'up',
        description: '',
        subtext: '',
      },
      vendaTotalEstoque: {
        value: 10,
        currency: 'R$',
        change: 0,
        trend: 'up',
        description: '',
        subtext: '',
      },
      markupMedio: {
        numericValue: 0,
        displayValue: '0%',
        change: 0,
        trend: 'down',
        description: '',
        subtext: '',
      },
      produtosEmFalta: {
        numericValue: 0,
        displayValue: '0',
        change: 0,
        trend: 'down',
        description: '',
        subtext: '',
      },
      necessidadeCompra: {
        value: 0,
        currency: 'R$',
        change: 0,
        trend: 'down',
        description: '',
        subtext: '',
      },
    })
    generateStockDistribution.mockReturnValue([])
    generateProdutosReposicao.mockReturnValue([])

    await produtosService.getCompleteProdutoData({
      deposito: ['loja-01'],
    })

    expect(generateMockProdutos).toHaveBeenCalled()
    expect(generateMockProdutoMetrics).toHaveBeenCalled()
  })
})
