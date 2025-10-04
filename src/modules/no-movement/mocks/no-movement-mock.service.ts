/**
 * Mock service for "Produtos sem movimentação"
 * Generates deterministic analysis results using the existing product mock dataset
 */

import type {
  NoMovementConfig,
  NoMovementResult,
  ProductMovement,
} from '../types'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import type { ProdutoFilter } from '@/modules/produtos/types/produtos.types'
import { generateMockProdutos } from '@/modules/produtos/mocks/produtos-mock-generator'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MOCK_PRODUCT_COUNT = 150

class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed || 1
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInt(min: number, max: number): number {
    if (max <= min) return min
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  nextFloat(min: number, max: number): number {
    if (max <= min) return min
    return this.next() * (max - min) + min
  }
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) + 1
}

function mapFilters(config: NoMovementConfig): ProdutoFilter | undefined {
  const filter: ProdutoFilter = {}

  if (config.filters.depositos !== undefined) {
    filter.deposito = config.filters.depositos
  }
  if (config.filters.marcas !== undefined) {
    filter.marca = config.filters.marcas
  }
  if (config.filters.fornecedores !== undefined) {
    filter.fornecedor = config.filters.fornecedores
  }
  if (config.filters.categorias?.length) {
    filter.categoria = config.filters.categorias[0]
  }

  return Object.keys(filter).length ? filter : undefined
}

/**
 * Calculate opportunity cost using proportional monthly simple calculation
 * Formula: Capital * Monthly Rate * (Days/30)
 */
function calculateOpportunityCost(
  stockValue: number, 
  daysWithoutMovement: number,
  rateConfig?: {
    type: 'cdi' | 'selic' | 'working_capital' | 'manual'
    value: number
    description?: string
  }
): number {
  // Default to 1% monthly if no config provided
  const config = rateConfig || {
    type: 'manual' as const,
    value: 1,
    description: 'Taxa padrão de 1% ao mês'
  }
  
  // Convert percentage to decimal (value comes as 1 for 1%, needs to be 0.01)
  const monthlyRate = config.value / 100
  
  // Calculate using proportional monthly approach
  const proportionalDays = daysWithoutMovement / 30 // Convert days to month fraction
  return stockValue * monthlyRate * proportionalDays
}

function determineSuggestedAction(
  product: ProductMovement,
): Pick<ProductMovement, 'suggestedAction' | 'actionPriority' | 'actionReason'> {
  if (product.daysWithoutMovement > 180) {
    return {
      suggestedAction: 'return',
      actionPriority: 'critical',
      actionReason: 'Produto sem movimento há mais de 6 meses. Considere devolução ao fornecedor.',
    }
  }

  if (product.daysWithoutMovement > 90 && product.stockValue > 5000) {
    return {
      suggestedAction: 'promote',
      actionPriority: 'high',
      actionReason: 'Alto valor em estoque parado. Recomenda-se promoção agressiva.',
    }
  }

  if (product.daysWithoutMovement > 60) {
    if (product.currentStock > product.minimumStock * 3) {
      return {
        suggestedAction: 'transfer',
        actionPriority: 'medium',
        actionReason: 'Excesso de estoque. Considere transferência para outra loja.',
      }
    }

    return {
      suggestedAction: 'promote',
      actionPriority: 'medium',
      actionReason: 'Produto parado há mais de 2 meses. Considere promoção.',
    }
  }

  if (product.totalUnitsSold > 0 && product.totalUnitsSold <= 5) {
    return {
      suggestedAction: 'monitor',
      actionPriority: 'low',
      actionReason: 'Baixa movimentação. Monitorar tendência nos próximos 30 dias.',
    }
  }

  if (product.currentStock <= product.minimumStock && product.daysWithoutMovement > 30) {
    return {
      suggestedAction: 'discontinue',
      actionPriority: 'medium',
      actionReason: 'Baixo estoque sem demanda. Considere descontinuar o produto.',
    }
  }

  return {
    suggestedAction: 'monitor',
    actionPriority: 'low',
    actionReason: 'Acompanhar evolução da demanda.',
  }
}

function calculateSummary(products: ProductMovement[]): NoMovementResult['summary'] {
  const productsWithoutMovement = products.filter(
    (product) => product.movementStatus === 'no_movement',
  ).length
  const productsWithLowMovement = products.filter(
    (product) => product.movementStatus === 'low_movement',
  ).length
  const totalCapitalImmobilized = products.reduce(
    (sum, product) => sum + product.capitalImmobilized,
    0,
  )
  const totalOpportunityCost = products.reduce(
    (sum, product) => sum + product.opportunityCost,
    0,
  )
  const averageDaysWithoutMovement =
    products.length > 0
      ? products.reduce((sum, product) => sum + product.daysWithoutMovement, 0) /
        products.length
      : 0

  return {
    totalProducts: products.length,
    productsWithoutMovement,
    productsWithLowMovement,
    totalCapitalImmobilized,
    totalOpportunityCost,
    averageDaysWithoutMovement,
  }
}

function groupByWarehouse(
  products: ProductMovement[],
): Record<string, ProductMovement[]> {
  return products.reduce((acc, product) => {
    const warehouse = product.warehouse || 'Sem Depósito'
    if (!acc[warehouse]) {
      acc[warehouse] = []
    }
    acc[warehouse].push(product)
    return acc
  }, {} as Record<string, ProductMovement[]>)
}

function shouldIncludeProduct(
  produto: Produto,
  config: NoMovementConfig,
): boolean {
  if (!config.options.includeZeroStock && produto.estoqueAtual <= 0) {
    return false
  }

  if (!config.options.includeDiscontinued && produto.status === 'descontinuado') {
    return false
  }

  if (config.filters.onlyActive && produto.status !== 'ativo') {
    return false
  }

  if (config.filters.skus?.length && !config.filters.skus.includes(produto.sku)) {
    return false
  }

  return true
}

function buildProductMovement(
  produto: Produto,
  rng: SeededRandom,
  config: NoMovementConfig,
  startDate: Date,
  endDate: Date,
  thresholdDailySales: number,
): ProductMovement | null {
  const marketPressure = produto.coberturaEstoqueDias / Math.max(1, config.period.days)
  const highStock = produto.estoqueAtual > produto.estoqueMinimo * 3
  const inactivityBias = Math.min(0.75, 0.25 + marketPressure * 0.35 + (highStock ? 0.2 : 0))

  const rolled = rng.next()

  let movementStatus: ProductMovement['movementStatus'] = 'normal'
  let totalUnitsSold = 0
  let daysWithoutMovement = config.period.days
  const dailyThreshold = Math.max(0, thresholdDailySales)
  const thresholdTotalUnits = Math.max(
    0,
    Math.round(dailyThreshold * Math.max(1, config.period.days))
  )

  if (rolled < inactivityBias) {
    movementStatus = 'no_movement'
    totalUnitsSold = 0
    daysWithoutMovement = rng.nextInt(
      Math.max(30, Math.floor(config.period.days * 0.6)),
      config.period.days + rng.nextInt(5, 60),
    )
  } else if (config.threshold.considerAsLow && thresholdTotalUnits > 0) {
    totalUnitsSold = rng.nextInt(1, Math.max(1, thresholdTotalUnits))
    movementStatus = totalUnitsSold / Math.max(1, config.period.days) <= dailyThreshold
      ? 'low_movement'
      : 'normal'
    daysWithoutMovement = rng.nextInt(10, Math.max(15, Math.floor(config.period.days * 0.8)))
  } else {
    return null
  }

  if (movementStatus === 'normal') {
    return null
  }

  const stockValue = produto.estoqueAtual * produto.precoCusto

  const lastSaleDate =
    movementStatus === 'no_movement'
      ? null
      : new Date(endDate.getTime() - daysWithoutMovement * MS_PER_DAY)

  const capitalImmobilized = stockValue
  const opportunityCost = calculateOpportunityCost(
    stockValue, 
    daysWithoutMovement,
    config.options?.opportunityCostRate
  )
  const averageDailySales = config.period.days
    ? totalUnitsSold / Math.max(1, config.period.days)
    : totalUnitsSold

  const productMovement: ProductMovement = {
    productId: produto.id,
    sku: produto.sku,
    name: produto.nome,
    brand: produto.marca,
    category: produto.categoria,
    warehouse: produto.deposito,
    supplier: produto.fornecedor,
    currentStock: produto.estoqueAtual,
    minimumStock: produto.estoqueMinimo,
    costPrice: produto.precoCusto,
    sellingPrice: produto.precoVenda,
    stockValue,
    totalUnitsSold,
    totalRevenue: totalUnitsSold * produto.precoVenda,
    averageDailySales,
    lastSaleDate,
    daysWithoutMovement,
    movementStatus,
    capitalImmobilized,
    opportunityCost,
    storageTime: daysWithoutMovement,
    suggestedAction: 'monitor',
    actionPriority: 'low',
    actionReason: 'Acompanhar evolução da demanda.',
  }

  const recommendation = determineSuggestedAction(productMovement)

  return {
    ...productMovement,
    ...recommendation,
  }
}

export async function generateMockNoMovementAnalysis(
  config: NoMovementConfig,
): Promise<NoMovementResult> {
  const start = Date.now()
  const endDate = config.period.endDate ?? new Date()
  const startDate = config.period.startDate ?? new Date(endDate.getTime() - config.period.days * MS_PER_DAY)

  const produtoFilter = mapFilters(config)
  const mockProdutos = generateMockProdutos(MOCK_PRODUCT_COUNT, produtoFilter)

  const thresholdDailySales = Math.max(
    0,
    config.threshold.minUnitsPerDay ??
      (typeof config.threshold.minUnits === 'number' && config.period.days > 0
        ? config.threshold.minUnits / config.period.days
        : 0.1)
  )

  const seedComponents = [
    config.organizationId,
    String(config.period.days),
    config.filters.depositos?.join('|') ?? '',
    config.filters.marcas?.join('|') ?? '',
    config.filters.fornecedores?.join('|') ?? '',
  ].join('-')

  const rng = new SeededRandom(hashString(seedComponents))

  const productMovements: ProductMovement[] = []

  for (const produto of mockProdutos) {
    if (!shouldIncludeProduct(produto, config)) {
      continue
    }

    const movement = buildProductMovement(
      produto,
      rng,
      config,
      startDate,
      endDate,
      thresholdDailySales
    )
    if (movement) {
      productMovements.push(movement)
    }
  }

  productMovements.sort(
    (a, b) => b.daysWithoutMovement - a.daysWithoutMovement,
  )

  const summary = calculateSummary(productMovements)

  const result: NoMovementResult = {
    config,
    analysisDate: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    products: productMovements,
    groupedByWarehouse: config.options.groupByWarehouse
      ? groupByWarehouse(productMovements)
      : undefined,
    metadata: {
      processingTime: Date.now() - start,
      cached: false,
      cacheKey: 'mock-no-movement',
      warnings:
        productMovements.length === 0
          ? ['Nenhum produto corresponde aos filtros simulados.']
          : undefined,
    },
  }

  return result
}

export function generateMockNoMovementFilters() {
  const produtos = generateMockProdutos(MOCK_PRODUCT_COUNT)

  const collect = (predicate: (produto: Produto) => string | null) => {
    const set = new Set<string>()
    for (const produto of produtos) {
      const value = predicate(produto)
      if (value) {
        set.add(value)
      }
    }
    return Array.from(set)
  }

  return {
    depositos: collect((produto) => produto.deposito || null),
    marcas: collect((produto) => produto.marca || null),
    fornecedores: collect((produto) => produto.fornecedor || null),
    categorias: collect((produto) => produto.categoria || null),
  }
}
