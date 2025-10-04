/**
 * Mock data generator for produtos (products)
 * Provides realistic test data for development
 * Uses seed-based generation for consistent data across requests
 */

import type {
  ProdutoMetrics,
  Produto,
  ProdutoFilter,
} from '@/modules/produtos/types/produtos.types'

import { normalizeMarca } from '@/modules/produtos/utils/produtos-transforms.utils'
import { MARCAS_ESTATICAS } from '@/modules/produtos/constants/produtos.constants'

const DEFAULT_SEED = 12345
const GLOBAL_SEED_KEY = '__tiny_dashboard_produtos_seed__'
const DEFAULT_DATASET_SIZE = 200
const BASE_DATE_UTC = Date.UTC(2025, 0, 15, 12, 0, 0, 0)
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const percentageFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const MARCA_CANONICAL_MAP = (() => {
  const map = new Map<string, string>()
  for (const marca of MARCAS_ESTATICAS) {
    const slug = normalizeMarca(marca)
    if (!map.has(slug)) {
      map.set(slug, marca)
    }
  }
  return map
})()

const MARCAS_POOL = Array.from(MARCA_CANONICAL_MAP.values())

function canonicalizeMarcaLabel(marca: string): string {
  const canonical = MARCA_CANONICAL_MAP.get(normalizeMarca(marca))
  return canonical ?? marca
}

type SerializedProduto = Omit<Produto, 'ultimaAtualizacao'> & {
  ultimaAtualizacao: string
}

function normalizeSeed(seed?: number): number {
  if (typeof seed !== 'number' || !Number.isFinite(seed)) {
    return DEFAULT_SEED
  }

  const normalized = Math.abs(Math.floor(seed))
  return normalized === 0 ? DEFAULT_SEED : normalized
}

function getRuntimeSeed(): number | undefined {
  const runtime = globalThis as Record<string, unknown>
  const stored = runtime[GLOBAL_SEED_KEY]
  if (typeof stored === 'number' && Number.isFinite(stored)) {
    return stored
  }
  return undefined
}

function persistSeed(seed: number): void {
  const runtime = globalThis as Record<string, unknown>
  runtime[GLOBAL_SEED_KEY] = seed

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(SEED_KEY, seed.toString())
    } catch (error) {
      console.warn(
        '[MockProdutos] Failed to persist seed in sessionStorage:',
        error,
      )
    }
  }
}

function readPersistedSeed(): number | undefined {
  const runtimeSeed = getRuntimeSeed()
  if (runtimeSeed !== undefined) {
    return runtimeSeed
  }

  if (typeof window !== 'undefined') {
    try {
      const storedSeed = window.sessionStorage.getItem(SEED_KEY)
      if (storedSeed) {
        const parsed = Number.parseInt(storedSeed, 10)
        if (!Number.isNaN(parsed)) {
          persistSeed(parsed)
          return parsed
        }
      }
    } catch (error) {
      console.warn(
        '[MockProdutos] Failed to read seed from sessionStorage:',
        error,
      )
    }
  }

  return undefined
}

function resolveSeed(customSeed?: number): { seed: number; useCache: boolean } {
  if (customSeed !== undefined) {
    return { seed: normalizeSeed(customSeed), useCache: false }
  }

  const persisted = readPersistedSeed()
  if (persisted !== undefined) {
    return { seed: normalizeSeed(persisted), useCache: true }
  }

  persistSeed(DEFAULT_SEED)
  return { seed: DEFAULT_SEED, useCache: true }
}

export function setMockProdutosSeed(seed: number): number {
  const normalized = normalizeSeed(seed)
  persistSeed(normalized)
  MockDataCache.getInstance().clearCache()
  return normalized
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

function formatPercentage(value: number): string {
  return `${percentageFormatter.format(value)}%`
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return 0
  }

  const change = ((current - previous) / previous) * 100
  return Number(change.toFixed(1))
}

function determineTrend(current: number, previous: number): 'up' | 'down' {
  return current >= previous ? 'up' : 'down'
}

function buildComparison(
  current: number,
  rng: SeededRandom,
  variation: number = 0.15,
): {
  previous: number
  change: number
  trend: 'up' | 'down'
} {
  const delta = rng.nextFloat(-variation, variation)
  const previous = Math.max(0, Math.round(current * (1 - delta)))
  return {
    previous,
    change: calculateChange(current, previous),
    trend: determineTrend(current, previous),
  }
}

function buildDecimalComparison(
  current: number,
  rng: SeededRandom,
  variation: number = 0.12,
  fractionDigits: number = 2,
): {
  previous: number
  change: number
  trend: 'up' | 'down'
} {
  const delta = rng.nextFloat(-variation, variation)
  const previous = Math.max(
    0,
    Number((current * (1 - delta)).toFixed(fractionDigits)),
  )

  return {
    previous,
    change: calculateChange(current, previous),
    trend: determineTrend(current, previous),
  }
}

function serializeProdutos(produtos: Produto[]): SerializedProduto[] {
  return produtos.map((produto) => ({
    ...produto,
    ultimaAtualizacao: produto.ultimaAtualizacao.toISOString(),
  }))
}

function hydrateSerializedProduto(produto: SerializedProduto): Produto {
  return {
    ...produto,
    ultimaAtualizacao: new Date(produto.ultimaAtualizacao),
  }
}

// Storage key for persisting products during session
const STORAGE_KEY = 'mock_produtos_data'
const SEED_KEY = 'mock_produtos_seed'

/**
 * Simple seedable random number generator
 * Provides deterministic random numbers based on seed
 */
class SeededRandom {
  private seed: number

  constructor(seed: number = DEFAULT_SEED) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)]
  }
}

/**
 * Calculate advanced stock coverage with realistic patterns
 * Simulates the complex calculation for mock data
 */
function calculateAdvancedCoverage(
  currentStock: number,
  category: string,
  rng: SeededRandom,
): number {
  if (currentStock === 0) return 0

  // Category-based demand patterns
  const categoryDemandFactors: Record<
    string,
    { base: number; variance: number }
  > = {
    Eletrônicos: { base: 3, variance: 2 },
    Roupas: { base: 5, variance: 3 },
    Acessórios: { base: 4, variance: 2 },
    Calçados: { base: 3, variance: 1.5 },
    Beleza: { base: 6, variance: 2 },
    'Casa e Decoração': { base: 2, variance: 1 },
    Esportes: { base: 3, variance: 2 },
    Livros: { base: 1.5, variance: 0.8 },
    Brinquedos: { base: 4, variance: 3 },
  }

  const demandPattern = categoryDemandFactors[category] || {
    base: 3,
    variance: 1.5,
  }

  // Simulate demand with trend and seasonality
  const baseDemand = demandPattern.base

  // Add trend component (-20% to +20%)
  const trendFactor = 0.8 + rng.next() * 0.4

  // Add seasonality (day of week effect)
  const seasonalityFactor = 0.9 + rng.next() * 0.2

  // Add random variation
  const randomFactor =
    1 - demandPattern.variance * 0.1 + rng.next() * demandPattern.variance * 0.2

  // Calculate adjusted daily demand
  const adjustedDailyDemand =
    baseDemand * trendFactor * seasonalityFactor * randomFactor

  // Add availability adjustment (simulate stockout impact)
  const availabilityFactor =
    currentStock > 50 ? 1.0 : 0.8 + (currentStock / 50) * 0.2

  // Final calculation with realistic bounds
  const coverageDays = (currentStock / adjustedDailyDemand) * availabilityFactor

  // Apply realistic limits
  return Math.min(365, Math.max(0, Math.floor(coverageDays)))
}

function createBaselineProdutos(count: number, seed: number): Produto[] {
  const rng = new SeededRandom(seed)

  const categorias = [
    'Eletrônicos',
    'Roupas',
    'Acessórios',
    'Calçados',
    'Beleza',
    'Casa e Decoração',
    'Esportes',
    'Livros',
    'Brinquedos',
  ]

  const depositos = ['loja-01', 'loja-02', 'cd-distribuicao']

  const fornecedores = [
    'fornecedor-nacional',
    'importadora-sul',
    'distribuidora-central',
    'atacado-express',
  ]

  const produtos: Produto[] = []

  for (let i = 1; i <= count; i++) {
    const categoria = rng.choice(categorias)
    const marca = canonicalizeMarcaLabel(rng.choice(MARCAS_POOL))
    const deposito = rng.choice(depositos)
    const fornecedor = rng.choice(fornecedores)

    const precoCusto = Number(rng.nextFloat(25, 520).toFixed(2))
    const markup = rng.nextFloat(1.25, 2.05)
    const precoVenda = Number((precoCusto * markup).toFixed(2))
    const markupPercentual = Number(
      (((precoVenda - precoCusto) / precoCusto) * 100).toFixed(2),
    )
    const estoqueAtual = rng.nextInt(0, 110)
    const estoqueMinimo = rng.nextInt(5, 28)

    const coberturaEstoqueDias = calculateAdvancedCoverage(
      estoqueAtual,
      categoria,
      rng,
    )

    let status: 'ativo' | 'inativo' | 'descontinuado' = 'ativo'
    const statusRoll = rng.next()
    if (statusRoll < 0.05) status = 'descontinuado'
    else if (statusRoll < 0.15) status = 'inativo'

    const daysOffset = rng.nextInt(0, 45)
    const minutesOffset = rng.nextInt(0, 12 * 60)
    const ultimaAtualizacao = new Date(
      BASE_DATE_UTC -
        daysOffset * MILLISECONDS_IN_DAY -
        minutesOffset * 60 * 1000,
    )

    produtos.push({
      id: `PROD-${i.toString().padStart(4, '0')}`,
      sku: `SKU-${categoria.substring(0, 3).toUpperCase()}-${i
        .toString()
        .padStart(4, '0')}`,
      nome: `Produto ${categoria} ${i}`,
      descricao: `Descrição detalhada do produto ${i} da categoria ${categoria}`,
      marca,
      categoria,
      deposito,
      fornecedor,
      precoCusto,
      precoVenda,
      estoqueAtual,
      estoqueMinimo,
      markupPercentual,
      coberturaEstoqueDias,
      status,
      ultimaAtualizacao,
    })
  }

  return produtos
}

/**
 * Cache manager for persistent mock data during session
 */
class MockDataCache {
  // eslint-disable-next-line no-use-before-define
  private static instance: MockDataCache | null = null
  private products: Produto[] | null = null
  private seed: number | null = null

  static getInstance(): MockDataCache {
    if (!MockDataCache.instance) {
      MockDataCache.instance = new MockDataCache()
    }
    return MockDataCache.instance
  }

  getProducts(expectedSeed: number): Produto[] | null {
    // Try to get from memory first
    if (this.products && this.seed === expectedSeed) {
      return this.products
    }

    // Try to get from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const storedSeed = window.sessionStorage.getItem(SEED_KEY)
        if (storedSeed) {
          const parsedSeed = Number.parseInt(storedSeed, 10)
          if (!Number.isNaN(parsedSeed) && parsedSeed === expectedSeed) {
            const storedProdutos = window.sessionStorage.getItem(STORAGE_KEY)
            if (storedProdutos) {
              const parsed: SerializedProduto[] = JSON.parse(storedProdutos)
              this.products = parsed.map(hydrateSerializedProduto)
              this.seed = parsedSeed
              return this.products
            }
          }
        }
      } catch (error) {
        console.error(
          'Failed to load produtos cache from sessionStorage:',
          error,
        )
      }
    }

    return null
  }

  setProducts(products: Produto[], seed: number): void {
    this.products = products
    this.seed = seed

    // Persist to sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const serialized = serializeProdutos(products)
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
        window.sessionStorage.setItem(SEED_KEY, seed.toString())
      } catch (e) {
        console.error('Failed to store products:', e)
      }
    }
  }

  clearCache(): void {
    this.products = null
    this.seed = null
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY)
        window.sessionStorage.removeItem(SEED_KEY)
      } catch (error) {
        console.error(
          'Failed to clear produtos cache from sessionStorage:',
          error,
        )
      }
    }
  }
}

export function hydrateMockProdutosCache(
  produtos: Produto[],
  seed?: number,
): void {
  if (!produtos || produtos.length === 0) {
    return
  }

  const targetSeed =
    seed !== undefined ? normalizeSeed(seed) : resolveSeed().seed
  if (seed !== undefined) {
    persistSeed(targetSeed)
  }

  const cache = MockDataCache.getInstance()
  const normalized = produtos.map((produto) => {
    const canonicalMarca = canonicalizeMarcaLabel(produto.marca)
    return canonicalMarca === produto.marca
      ? produto
      : { ...produto, marca: canonicalMarca }
  })

  cache.setProducts(normalized, targetSeed)
}

/**
 * Generate mock product metrics based on filtered products
 * Calculates real metrics from the actual product data
 */
export function generateMockProdutoMetrics(
  filter?: ProdutoFilter,
  produtos?: Produto[],
  customSeed?: number,
): ProdutoMetrics {
  const { seed } = resolveSeed(customSeed)

  const produtosList =
    produtos ?? generateMockProdutos(DEFAULT_DATASET_SIZE, filter, customSeed)

  let totalEstoqueValue = 0
  let vendaTotalEstoqueValue = 0
  let totalCost = 0
  let totalSales = 0
  let produtosEmFalta = 0
  let necessidadeCompra = 0

  for (const produto of produtosList) {
    const estoqueValorCusto = produto.estoqueAtual * produto.precoCusto
    const estoqueValorVenda = produto.estoqueAtual * produto.precoVenda

    totalEstoqueValue += estoqueValorCusto
    vendaTotalEstoqueValue += estoqueValorVenda
    totalCost += estoqueValorCusto
    totalSales += estoqueValorVenda

    if (produto.estoqueAtual === 0) {
      produtosEmFalta += 1
    }

    if (produto.estoqueAtual < produto.estoqueMinimo) {
      necessidadeCompra +=
        (produto.estoqueMinimo - produto.estoqueAtual) * produto.precoCusto
    }
  }

  totalEstoqueValue = Number(totalEstoqueValue.toFixed(2))
  vendaTotalEstoqueValue = Number(vendaTotalEstoqueValue.toFixed(2))
  necessidadeCompra = Number(necessidadeCompra.toFixed(2))

  const markupMedio =
    totalCost > 0 ? ((totalSales - totalCost) / totalCost) * 100 : 0
  const markupMedioValue = Number(markupMedio.toFixed(1))

  const rng = new SeededRandom(seed * 13 + 7)

  const totalEstoqueComparison = buildDecimalComparison(
    totalEstoqueValue,
    rng,
    0.12,
    2,
  )
  const vendaTotalEstoqueComparison = buildDecimalComparison(
    vendaTotalEstoqueValue,
    rng,
    0.14,
    2,
  )
  const markupMedioComparison = buildDecimalComparison(
    markupMedioValue,
    rng,
    0.1,
    1,
  )
  const produtosEmFaltaComparison = buildComparison(produtosEmFalta, rng, 0.45)
  const necessidadeCompraComparison = buildDecimalComparison(
    necessidadeCompra,
    rng,
    0.18,
    2,
  )

  const previousProdutosEmFalta = Math.min(
    produtosList.length,
    Math.max(0, produtosEmFaltaComparison.previous),
  )
  const produtosEmFaltaChange = calculateChange(
    produtosEmFalta,
    previousProdutosEmFalta,
  )
  const produtosEmFaltaTrend = determineTrend(
    produtosEmFalta,
    previousProdutosEmFalta,
  )

  return {
    totalEstoque: {
      value: totalEstoqueValue,
      previousValue: Number(totalEstoqueComparison.previous.toFixed(2)),
      previousDisplayValue: formatCurrency(totalEstoqueComparison.previous),
      currency: 'R$',
      change: totalEstoqueComparison.change,
      trend: totalEstoqueComparison.trend,
      description: 'Variação de estoque ao custo',
      subtext: `Base anterior: ${formatCurrency(
        totalEstoqueComparison.previous,
      )}`,
    },
    vendaTotalEstoque: {
      value: vendaTotalEstoqueValue,
      previousValue: Number(vendaTotalEstoqueComparison.previous.toFixed(2)),
      previousDisplayValue: formatCurrency(
        vendaTotalEstoqueComparison.previous,
      ),
      currency: 'R$',
      change: vendaTotalEstoqueComparison.change,
      trend: vendaTotalEstoqueComparison.trend,
      description: 'Potencial de venda do estoque',
      subtext: `Base anterior: ${formatCurrency(
        vendaTotalEstoqueComparison.previous,
      )}`,
    },
    markupMedio: {
      numericValue: markupMedioValue,
      previousNumericValue: Number(markupMedioComparison.previous.toFixed(1)),
      displayValue: formatPercentage(markupMedioValue),
      previousDisplayValue: formatPercentage(markupMedioComparison.previous),
      change: markupMedioComparison.change,
      trend: markupMedioComparison.trend,
      description: 'Margem média ponderada',
      subtext: `Base anterior: ${formatPercentage(
        markupMedioComparison.previous,
      )}`,
    },
    produtosEmFalta: {
      numericValue: produtosEmFalta,
      previousNumericValue: previousProdutosEmFalta,
      displayValue: `${produtosEmFalta} de ${produtosList.length}`,
      previousDisplayValue: `${previousProdutosEmFalta} de ${produtosList.length}`,
      change: produtosEmFaltaChange,
      trend: produtosEmFaltaTrend,
      description:
        produtosEmFaltaTrend === 'up'
          ? 'Mais produtos em falta que no período anterior'
          : 'Menos produtos em falta que no período anterior',
      subtext: `${produtosEmFalta} produtos sem estoque no momento`,
    },
    necessidadeCompra: {
      value: necessidadeCompra,
      previousValue: Number(necessidadeCompraComparison.previous.toFixed(2)),
      previousDisplayValue: formatCurrency(
        necessidadeCompraComparison.previous,
      ),
      currency: 'R$',
      change: necessidadeCompraComparison.change,
      trend: necessidadeCompraComparison.trend,
      description: 'Investimento necessário para recompor estoque',
      subtext: `Base anterior: ${formatCurrency(
        necessidadeCompraComparison.previous,
      )}`,
    },
  }
}

/**
 * Generate a list of mock products with persistent data
 * Uses seed-based generation for consistent data across requests
 */
export function generateMockProdutos(
  count: number = 50,
  filter?: ProdutoFilter,
  customSeed?: number,
): Produto[] {
  const hasExplicitEmptySelection = [
    filter?.deposito,
    filter?.marca,
    filter?.fornecedor,
  ].some((value) => Array.isArray(value) && value.length === 0)

  if (hasExplicitEmptySelection) {
    return []
  }

  const normalizedCount = Number.isFinite(count)
    ? Math.max(0, Math.floor(count))
    : DEFAULT_DATASET_SIZE

  const { seed, useCache } = resolveSeed(customSeed)

  const cache = MockDataCache.getInstance()
  const datasetSize = Math.max(normalizedCount, DEFAULT_DATASET_SIZE)

  let produtosBase = useCache ? cache.getProducts(seed) : null

  if (!produtosBase || produtosBase.length < datasetSize) {
    produtosBase = createBaselineProdutos(datasetSize, seed)
    if (useCache) {
      cache.setProducts(produtosBase, seed)
    }
  }

  const workingSet = produtosBase.slice(0, datasetSize)
  let filteredProdutos = workingSet.slice()

  if (filter?.categoria) {
    filteredProdutos = filteredProdutos.filter(
      (produto) => produto.categoria === filter.categoria,
    )
  }

  if (filter?.deposito !== undefined) {
    const depositoFilters = Array.isArray(filter.deposito)
      ? filter.deposito
      : [filter.deposito]
    const applicableDepositos = depositoFilters.filter(
      (value) => value !== 'all',
    )

    if (applicableDepositos.length > 0 && !depositoFilters.includes('all')) {
      filteredProdutos = filteredProdutos.filter((produto) =>
        applicableDepositos.includes(produto.deposito),
      )
    }
  }

  if (filter?.marca !== undefined) {
    const marcaFilters = Array.isArray(filter.marca)
      ? filter.marca
      : [filter.marca]
    const applicableMarcas = marcaFilters.filter((value) => value !== 'all')

    if (applicableMarcas.length > 0 && !marcaFilters.includes('all')) {
      filteredProdutos = filteredProdutos.filter((produto) => {
        const normalizedMarca = normalizeMarca(produto.marca)
        return (
          applicableMarcas.includes(normalizedMarca) ||
          applicableMarcas.includes(produto.marca)
        )
      })
    }
  }

  if (filter?.fornecedor !== undefined) {
    const fornecedorFilters = Array.isArray(filter.fornecedor)
      ? filter.fornecedor
      : [filter.fornecedor]
    const applicableFornecedores = fornecedorFilters.filter(
      (value) => value !== 'all',
    )

    if (
      applicableFornecedores.length > 0 &&
      !fornecedorFilters.includes('all')
    ) {
      filteredProdutos = filteredProdutos.filter((produto) =>
        applicableFornecedores.includes(produto.fornecedor),
      )
    }
  }

  if (filter?.status) {
    filteredProdutos = filteredProdutos.filter(
      (produto) => produto.status === filter.status,
    )
  }

  if (filter?.statusEstoque) {
    switch (filter.statusEstoque) {
      case 'em_falta':
        filteredProdutos = filteredProdutos.filter(
          (produto) => produto.estoqueAtual === 0,
        )
        break
      case 'baixo':
        filteredProdutos = filteredProdutos.filter(
          (produto) =>
            produto.estoqueAtual > 0 &&
            produto.estoqueAtual < produto.estoqueMinimo,
        )
        break
      case 'normal':
        filteredProdutos = filteredProdutos.filter(
          (produto) =>
            produto.estoqueAtual >= produto.estoqueMinimo &&
            produto.estoqueAtual < produto.estoqueMinimo * 3,
        )
        break
      case 'excessivo':
        filteredProdutos = filteredProdutos.filter(
          (produto) => produto.estoqueAtual >= produto.estoqueMinimo * 3,
        )
        break
    }
  }

  if (filter?.searchTerm) {
    const searchLower = filter.searchTerm.toLowerCase()
    filteredProdutos = filteredProdutos.filter(
      (produto) =>
        produto.nome.toLowerCase().includes(searchLower) ||
        produto.sku.toLowerCase().includes(searchLower) ||
        produto.categoria.toLowerCase().includes(searchLower),
    )
  }

  if (normalizedCount === 0) {
    return []
  }

  return filteredProdutos.slice(0, normalizedCount).map((produto) => ({
    ...produto,
    ultimaAtualizacao: new Date(produto.ultimaAtualizacao),
  }))
}

/**
 * Generate stock distribution by category
 */
export function generateStockDistribution() {
  const categorias = [
    { categoria: 'Eletrônicos', valor: 85420, quantidade: 245 },
    { categoria: 'Roupas', valor: 52380, quantidade: 892 },
    { categoria: 'Acessórios', valor: 28910, quantidade: 456 },
    { categoria: 'Calçados', valor: 41250, quantidade: 187 },
    { categoria: 'Beleza', valor: 22640, quantidade: 342 },
    { categoria: 'Casa e Decoração', valor: 35780, quantidade: 156 },
    { categoria: 'Esportes', valor: 19370, quantidade: 98 },
  ]

  return categorias
}

/**
 * Generate products needing reorder
 */
export function generateProdutosReposicao(): Produto[] {
  const produtos = generateMockProdutos(100)

  // Filter products that need reordering (below minimum stock)
  return produtos
    .filter((p) => p.estoqueAtual < p.estoqueMinimo && p.status === 'ativo')
    .slice(0, 20) // Return top 20 products needing reorder
}

/**
 * Generate complete product data with all metrics
 */
export function generateCompleteProdutoData(filter?: ProdutoFilter) {
  return {
    metrics: generateMockProdutoMetrics(filter),
    produtos: generateMockProdutos(150, filter), // Generate 150 products to test scrolling
    analytics: {
      distribuicaoEstoque: generateStockDistribution(),
      produtosReposicao: generateProdutosReposicao(),
    },
  }
}
