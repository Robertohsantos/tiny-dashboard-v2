import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import {
  useProdutoMetricsValidated,
  useProdutosListValidated,
} from '../use-produtos-data-validated'
import {
  validProdutoMetrics,
  validProdutos,
} from '@/modules/produtos/schemas/__tests__/fixtures/produtos-valid-data'
import { ValidationError } from '@/modules/core/utils/validation'

const telemetryMock = vi.hoisted(() => ({
  validationTelemetry: {
    trackValidationSuccess: vi.fn(),
    trackValidationError: vi.fn(),
    trackFallbackUsage: vi.fn(),
  },
}))

const toastMock = vi.hoisted(() => ({
  toast: {
    error: vi.fn(),
  },
}))

const produtosFetchersMock = vi.hoisted(() => ({
  produtosFetchers: {
    metrics: vi.fn(),
    produtos: vi.fn(),
    stockDistribution: vi.fn(),
    produtosReposicao: vi.fn(),
    completeProdutoData: vi.fn(),
  },
}))

vi.mock('@/modules/core/monitoring/validation-telemetry', () => telemetryMock)

vi.mock('sonner', () => toastMock)

vi.mock('@/modules/produtos/services/produtos.service.validated', () => produtosFetchersMock)

describe('use-produtos-data-validated hooks', () => {
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

  it('returns validated metrics and tracks success telemetry', async () => {
    const module = produtosFetchersMock
    module.produtosFetchers.metrics.mockResolvedValue({
      ...validProdutoMetrics,
    })

    const { result } = renderHook(() => useProdutoMetricsValidated(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(validProdutoMetrics)
    expect(module.produtosFetchers.metrics).toHaveBeenCalledTimes(1)

    expect(
      telemetryMock.validationTelemetry.trackValidationSuccess,
    ).toHaveBeenCalledWith(
      'produtos-metrics-hook',
      expect.any(Number),
      expect.any(Number),
    )
  })

  it('handles validation errors gracefully', async () => {
    const module = produtosFetchersMock
    const validationError = new ValidationError('Invalid data', [], {})
    module.produtosFetchers.metrics.mockRejectedValue(validationError)

    const { result } = renderHook(() => useProdutoMetricsValidated(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeInstanceOf(ValidationError)
  })

  it('fetches validated product list', async () => {
    const module = produtosFetchersMock
    module.produtosFetchers.produtos.mockResolvedValue(
      validProdutos.map((produto) => ({ ...produto })),
    )

    const { result } = renderHook(
      () => useProdutosListValidated(undefined, 10),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(validProdutos.length)
    expect(module.produtosFetchers.produtos).toHaveBeenCalledWith(undefined, 10)
  })
})
