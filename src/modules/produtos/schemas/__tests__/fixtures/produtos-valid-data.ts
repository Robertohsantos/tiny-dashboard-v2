/**
 * Valid test fixtures for produtos schemas
 * These represent correct data structures that should pass validation
 */

import type {
  MetricData,
  ProdutoMetricDisplay,
  ProdutoMetrics,
  Produto,
  ProdutoFilter,
  ProdutoData,
} from '@/modules/produtos/types/produtos.types'

/**
 * Valid metric data with number value
 */
export const validMetricDataNumber: MetricData<number> = {
  value: 150000,
  currency: 'BRL',
  previousValue: 132500,
  previousDisplayValue: 'R$ 132.500,00',
  change: 12.5,
  trend: 'up',
  description: 'Total inventory value',
  subtext: 'At cost price',
}

/**
 * Valid metric data with string value
 */
export const validMetricDataString: MetricData<string> = {
  value: 'R$ 150.000,00',
  currency: 'BRL',
  previousValue: 'R$ 145.000,00',
  previousDisplayValue: 'R$ 145.000,00',
  change: -5.2,
  trend: 'down',
  description: 'Formatted value',
  subtext: 'Display format',
}

/**
 * Valid produto metric display
 */
export const validProdutoMetricDisplay: ProdutoMetricDisplay = {
  numericValue: 25.5,
  displayValue: '25.5%',
  unit: '%',
  previousNumericValue: 23.2,
  previousDisplayValue: '23.2%',
  change: 3.2,
  trend: 'up',
  description: 'Average markup',
  subtext: 'Across all products',
}

/**
 * Valid produto metrics
 */
export const validProdutoMetrics: ProdutoMetrics = {
  totalEstoque: {
    value: 500000,
    currency: 'BRL',
    previousValue: 460000,
    previousDisplayValue: 'R$ 460.000,00',
    change: 8.5,
    trend: 'up',
    description: 'Total inventory at cost',
    subtext: 'All warehouses',
  },
  vendaTotalEstoque: {
    value: 750000,
    currency: 'BRL',
    previousValue: 680000,
    previousDisplayValue: 'R$ 680.000,00',
    change: 10.2,
    trend: 'up',
    description: 'Total inventory at selling price',
    subtext: 'Potential revenue',
  },
  markupMedio: {
    numericValue: 50,
    displayValue: '50%',
    unit: '%',
    previousNumericValue: 48,
    previousDisplayValue: '48%',
    change: 2.5,
    trend: 'up',
    description: 'Average markup percentage',
    subtext: 'Healthy margin',
  },
  produtosEmFalta: {
    numericValue: 12,
    displayValue: '12',
    unit: 'items',
    previousNumericValue: 18,
    previousDisplayValue: '18',
    change: -25,
    trend: 'down',
    description: 'Out of stock products',
    subtext: 'Improvement from last week',
  },
  necessidadeCompra: {
    value: 45000,
    currency: 'BRL',
    previousValue: 38000,
    previousDisplayValue: 'R$ 38.000,00',
    change: 15.3,
    trend: 'up',
    description: 'Purchase requirement',
    subtext: 'To meet minimum stock',
  },
}

/**
 * Valid individual products
 */
export const validProdutos: Produto[] = [
  {
    id: 'prod-001',
    sku: 'SKU-001',
    nome: 'Product 1',
    descricao: 'Description of product 1',
    marca: 'Marca Prime',
    categoria: 'Electronics',
    deposito: 'loja-01',
    fornecedor: 'fornecedor-nacional',
    precoCusto: 100.0,
    precoVenda: 150.0,
    estoqueAtual: 50,
    estoqueMinimo: 10,
    markupPercentual: 50,
    coberturaEstoqueDias: 32,
    status: 'ativo',
    ultimaAtualizacao: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: 'prod-002',
    sku: 'SKU-002',
    nome: 'Product 2',
    // descricao is optional
    marca: 'Marca Beta',
    categoria: 'Accessories',
    deposito: 'loja-02',
    fornecedor: 'distribuidora-central',
    precoCusto: 50.0,
    precoVenda: 80.0,
    estoqueAtual: 0,
    estoqueMinimo: 5,
    markupPercentual: 60,
    coberturaEstoqueDias: 0,
    status: 'inativo',
    ultimaAtualizacao: new Date('2024-01-02T10:00:00Z'),
  },
  {
    id: 'prod-003',
    sku: 'SKU-003',
    nome: 'Product 3',
    descricao: 'Discontinued product',
    marca: 'Marca Legacy',
    categoria: 'Legacy',
    deposito: 'cd-distribuicao',
    fornecedor: 'importadora-sul',
    precoCusto: 200.0,
    precoVenda: 300.0,
    estoqueAtual: 2,
    estoqueMinimo: 0,
    markupPercentual: 50,
    coberturaEstoqueDias: 5,
    status: 'descontinuado',
    ultimaAtualizacao: new Date('2024-01-03T10:00:00Z'),
  },
]

/**
 * Valid product filters
 */
export const validProdutoFilters: ProdutoFilter[] = [
  {
    categoria: 'Electronics',
    deposito: ['loja-01', 'loja-02'],
    marca: ['marca-prime', 'marca-beta'],
    fornecedor: 'fornecedor-nacional',
    statusEstoque: 'normal',
    status: 'ativo',
    searchTerm: 'laptop',
  },
  {
    statusEstoque: 'em_falta',
    // Other fields are optional
  },
  {
    searchTerm: 'search query',
    // Only search term
  },
  {}, // All fields are optional
]

/**
 * Valid stock distribution
 */
export const validStockDistribution = [
  {
    categoria: 'Electronics',
    valor: 250000,
    quantidade: 150,
  },
  {
    categoria: 'Accessories',
    valor: 100000,
    quantidade: 500,
  },
  {
    categoria: 'Clothing',
    valor: 150000,
    quantidade: 300,
  },
]

/**
 * Valid complete produto data
 */
export const validCompleteProdutoData: ProdutoData = {
  metrics: validProdutoMetrics,
  produtos: validProdutos,
  analytics: {
    distribuicaoEstoque: validStockDistribution,
    produtosReposicao: [validProdutos[1]], // Product with 0 stock
  },
}

/**
 * Minimal valid produto data
 */
export const minimalValidProdutoData: ProdutoData = {
  metrics: {
    totalEstoque: {
      value: 0,
      change: 0,
      trend: 'up',
      description: '',
      subtext: '',
    },
    vendaTotalEstoque: {
      value: 0,
      change: 0,
      trend: 'down',
      description: '',
      subtext: '',
    },
    markupMedio: {
      numericValue: 0,
      displayValue: '0%',
      change: 0,
      trend: 'up',
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
      change: 0,
      trend: 'up',
      description: '',
      subtext: '',
    },
  },
  // produtos and analytics are optional
}

/**
 * Valid produto data with only metrics
 */
export const validProdutoDataMetricsOnly: ProdutoData = {
  metrics: validProdutoMetrics,
}

/**
 * Edge cases - zero and boundary values
 */
export const validEdgeCaseProduto: Produto = {
  id: '',
  sku: '',
  nome: '',
  marca: 'Marca Edge',
  categoria: '',
  deposito: 'loja-01',
  fornecedor: 'fornecedor-nacional',
  precoCusto: 0,
  precoVenda: 0,
  estoqueAtual: 0,
  estoqueMinimo: 0,
  markupPercentual: 0,
  coberturaEstoqueDias: 0,
  status: 'ativo',
  ultimaAtualizacao: new Date(),
}
