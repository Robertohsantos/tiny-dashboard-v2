import type { ProdutoFilter } from '@/modules/produtos/types/produtos.types'

const ALL_VALUE = 'all'

export type NormalizedProdutoFilter = Omit<
  ProdutoFilter,
  'deposito' | 'marca' | 'fornecedor'
> & {
  deposito?: string[]
  marca?: string[]
  fornecedor?: string[]
}

function normalizeMultiValue(value?: string | string[]): string[] | undefined {
  if (value === undefined) {
    return undefined
  }

  const arrayValue = Array.isArray(value) ? value : [value]
  const filtered = arrayValue
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  if (filtered.length === 0) {
    return []
  }

  if (filtered.some((item) => item === ALL_VALUE)) {
    return undefined
  }

  const unique = Array.from(new Set(filtered))
  unique.sort((a, b) => a.localeCompare(b))
  return unique
}

export function normalizeProdutoFilter(
  filter?: ProdutoFilter,
): NormalizedProdutoFilter | undefined {
  if (!filter) {
    return undefined
  }

  const normalized: NormalizedProdutoFilter = {}

  if (
    typeof filter.categoria === 'string' &&
    filter.categoria.trim().length > 0
  ) {
    normalized.categoria = filter.categoria.trim()
  }

  if (typeof filter.statusEstoque === 'string') {
    normalized.statusEstoque = filter.statusEstoque
  }

  if (typeof filter.status === 'string') {
    normalized.status = filter.status
  }

  if (typeof filter.searchTerm === 'string') {
    const trimmedSearch = filter.searchTerm.trim()
    if (trimmedSearch.length > 0) {
      normalized.searchTerm = trimmedSearch
    }
  }

  const deposito = normalizeMultiValue(filter.deposito)
  if (deposito !== undefined) {
    normalized.deposito = deposito
  }

  const marca = normalizeMultiValue(filter.marca)
  if (marca !== undefined) {
    normalized.marca = marca
  }

  const fornecedor = normalizeMultiValue(filter.fornecedor)
  if (fornecedor !== undefined) {
    normalized.fornecedor = fornecedor
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

export const produtosQueryKeys = {
  all: ['produtos'] as const,
  metrics: (filter?: NormalizedProdutoFilter) =>
    ['produtos', 'metrics', filter ?? null] as const,
  list: (filter?: NormalizedProdutoFilter, limit?: number) =>
    ['produtos', 'list', filter ?? null, limit ?? null] as const,
  complete: (filter?: NormalizedProdutoFilter) =>
    ['produtos', 'complete', filter ?? null] as const,
  stockDistribution: () => ['produtos', 'stock-distribution'] as const,
  reorderProducts: () => ['produtos', 'reorder'] as const,
  reposicao: () => ['produtos', 'reorder'] as const,
  detail: (id: string) => ['produtos', 'detail', id] as const,
}
