import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import {
  useProdutosData,
  useProdutoMetrics,
  useProdutosList,
} from '../use-produtos-data'
import type { ProdutoData, ProdutoFilter } from '@/modules/produtos/types/produtos.types'
import {
  validProdutoMetrics,
  validProdutos,
  validStockDistribution,
} from '@/modules/produtos/schemas/__tests__/fixtures/produtos-valid-data'

vi.mock('@/modules/produtos/services/produtos.service', () => {
  const getCompleteProdutoData = vi.fn()
  const getMetrics = vi.fn()
  const getProdutos = vi.fn()
  const getStockDistribution = vi.fn()
  const getProdutosReposicao = vi.fn()

  const produtosService = {
    getCompleteProdutoData,
    getMetrics,
    getProdutos,
    getStockDistribution,
    getProdutosReposicao,
    clearCache: vi.fn(),
  }

  return {
    produtosService,
    getCompleteProdutoData,
    getProdutoMetrics: getMetrics,
    getProdutos,
    getStockDistribution,
    getProdutosReposicao,
  }
})

const createMockProdutoData = (): ProdutoData => ({
  metrics: { ...validProdutoMetrics },
  produtos: validProdutos.map((produto) => ({ ...produto })),
  analytics: {
    distribuicaoEstoque: validStockDistribution.map((item) => ({ ...item })),
    produtosReposicao: validProdutos.map((produto) => ({ ...produto })),
  },
})

describe('use-produtos-data (original hooks)', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient?.clear()
  })

  it('fetches complete product data', async () => {
    const mockData = createMockProdutoData()
    const module = await import('@/modules/produtos/services/produtos.service')
    const getCompleteProdutoDataMock = vi.spyOn(
      module.produtosService,
      'getCompleteProdutoData',
    )

    getCompleteProdutoDataMock.mockResolvedValue(mockData)

    const { result } = renderHook(() => useProdutosData(undefined), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData)

    expect(getCompleteProdutoDataMock).toHaveBeenCalledWith(undefined)
  })

  it('passes filters through to the service', async () => {
    const mockData = createMockProdutoData()
    const filter: ProdutoFilter = {
      deposito: ['loja-01'],
      marca: ['marca-prime'],
      fornecedor: ['fornecedor-nacional'],
    }

    const module = await import('@/modules/produtos/services/produtos.service')
    const getCompleteProdutoDataMock = vi.spyOn(
      module.produtosService,
      'getCompleteProdutoData',
    )

    getCompleteProdutoDataMock.mockResolvedValue(mockData)

    const { result } = renderHook(() => useProdutosData(filter), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(getCompleteProdutoDataMock).toHaveBeenCalledWith(filter)
  })

  it('reuses initial data without triggering a fetch', async () => {
    const initialData = createMockProdutoData()
    const module = await import('@/modules/produtos/services/produtos.service')
    const getCompleteProdutoDataMock = vi.spyOn(
      module.produtosService,
      'getCompleteProdutoData',
    )

    const { result } = renderHook(
      () => useProdutosData(undefined, { initialData }),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(initialData)
      expect(result.current.isSuccess).toBe(true)
    })

    expect(getCompleteProdutoDataMock).not.toHaveBeenCalled()
  })

  it('fetches metrics and product list independently', async () => {
    const module = await import('@/modules/produtos/services/produtos.service')
    const getMetricsMock = vi.spyOn(module.produtosService, 'getMetrics')
    const getProdutosMock = vi.spyOn(module.produtosService, 'getProdutos')

    getMetricsMock.mockResolvedValue({ ...validProdutoMetrics })
    getProdutosMock.mockResolvedValue(
      validProdutos.map((produto) => ({ ...produto })),
    )

    const metricsHook = renderHook(() => useProdutoMetrics(), {
      wrapper: createWrapper(),
    })

    const listHook = renderHook(() => useProdutosList(undefined, 25), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(metricsHook.result.current.isSuccess).toBe(true)
      expect(listHook.result.current.isSuccess).toBe(true)
    })

    expect(getMetricsMock).toHaveBeenCalledWith(undefined)
    expect(getProdutosMock).toHaveBeenCalledWith(undefined, 25)
  })
})
