/**
 * Invalid test fixtures for produtos schemas
 * These represent incorrect data structures that should fail validation
 */

/**
 * Invalid produto metrics - various validation failures
 */
export const invalidProdutoMetrics = [
  {
    // Missing required fields
    totalEstoque: { value: 1000 },
    // Missing other required metrics
  },
  {
    // Wrong structure for markupMedio (should have numericValue and displayValue)
    totalEstoque: {
      value: 1000,
      change: 5,
      trend: 'up',
      description: '',
      subtext: '',
    },
    vendaTotalEstoque: {
      value: 2000,
      change: 5,
      trend: 'up',
      description: '',
      subtext: '',
    },
    markupMedio: {
      value: 50, // Wrong! Should have numericValue and displayValue
      change: 5,
      trend: 'up',
      description: '',
      subtext: '',
    },
    produtosEmFalta: {
      numericValue: 5,
      displayValue: '5',
      change: 0,
      trend: 'down',
      description: '',
      subtext: '',
    },
    necessidadeCompra: {
      value: 5000,
      change: 0,
      trend: 'up',
      description: '',
      subtext: '',
    },
  },
]

/**
 * Invalid individual produtos
 */
export const invalidProdutos = [
  {
    // Missing required fields
    id: 'prod-001',
    nome: 'Product',
    // Missing: sku, categoria, precoCusto, precoVenda, etc.
  },
  {
    // Invalid status value
    id: 'prod-002',
    sku: 'SKU-002',
    nome: 'Product 2',
    categoria: 'Test',
    marca: 'Marca X',
    deposito: 'loja-01',
    fornecedor: 'fornecedor-nacional',
    precoCusto: 100,
    precoVenda: 150,
    estoqueAtual: 10,
    estoqueMinimo: 5,
    markupPercentual: 25,
    coberturaEstoqueDias: 12,
    status: 'pending', // Invalid! Should be 'ativo', 'inativo', or 'descontinuado'
    ultimaAtualizacao: new Date(),
  },
  {
    // Negative prices (should be non-negative)
    id: 'prod-003',
    sku: 'SKU-003',
    nome: 'Product 3',
    categoria: 'Test',
    marca: 'Marca X',
    deposito: 'loja-01',
    fornecedor: 'fornecedor-nacional',
    precoCusto: -100, // Invalid! Must be non-negative
    precoVenda: -150, // Invalid! Must be non-negative
    estoqueAtual: 10,
    estoqueMinimo: 5,
    markupPercentual: 25,
    coberturaEstoqueDias: 20,
    status: 'ativo',
    ultimaAtualizacao: new Date(),
  },
  {
    // Negative stock (should be non-negative)
    id: 'prod-004',
    sku: 'SKU-004',
    nome: 'Product 4',
    categoria: 'Test',
    marca: 'Marca X',
    deposito: 'loja-01',
    fornecedor: 'fornecedor-nacional',
    precoCusto: 100,
    precoVenda: 150,
    estoqueAtual: -10, // Invalid! Must be non-negative
    estoqueMinimo: -5, // Invalid! Must be non-negative
    markupPercentual: 25,
    coberturaEstoqueDias: 15,
    status: 'ativo',
    ultimaAtualizacao: new Date(),
  },
  {
    // Non-integer stock values
    id: 'prod-005',
    sku: 'SKU-005',
    nome: 'Product 5',
    categoria: 'Test',
    marca: 'Marca X',
    deposito: 'loja-01',
    fornecedor: 'fornecedor-nacional',
    precoCusto: 100,
    precoVenda: 150,
    estoqueAtual: 10.5, // Invalid! Must be integer
    estoqueMinimo: 5.7, // Invalid! Must be integer
    markupPercentual: 25,
    coberturaEstoqueDias: 18,
    status: 'ativo',
    ultimaAtualizacao: new Date(),
  },
  {
    // Wrong data types
    id: 123, // Should be string
    sku: null,
    nome: undefined,
    categoria: true,
    marca: 42,
    deposito: null,
    fornecedor: [],
    precoCusto: '100', // Should be number
    precoVenda: '150', // Should be number
    estoqueAtual: '10', // Should be number
    estoqueMinimo: '5', // Should be number
    markupPercentual: '25',
    coberturaEstoqueDias: '12',
    status: 'ativo',
    ultimaAtualizacao: '2024-01-01', // Should be Date
  },
]

/**
 * Invalid product filters
 */
export const invalidProdutoFilters = [
  {
    // Invalid statusEstoque value
    statusEstoque: 'out-of-stock', // Should be 'em_falta', 'baixo', 'normal', or 'excessivo'
  },
  {
    // Invalid status value
    status: 'active', // Should be 'ativo', 'inativo', or 'descontinuado'
  },
  {
    // Wrong data types
    categoria: 123, // Should be string
    statusEstoque: true, // Should be enum value
    status: null, // Should be enum value
    searchTerm: [], // Should be string
  },
]

/**
 * Invalid stock distribution
 */
export const invalidStockDistribution = [
  {
    // Missing required fields
    categoria: 'Electronics',
    // Missing: valor, quantidade
  },
  {
    // Wrong data types
    categoria: 123, // Should be string
    valor: '250000', // Should be number
    quantidade: '150', // Should be number
  },
  // Note: Negative values might be valid for stock adjustments, so not including them as invalid
]

/**
 * Invalid produto metric display
 */
export const invalidProdutoMetricDisplay = [
  {
    // Missing displayValue
    numericValue: 50,
    // Missing: displayValue and other required fields
  },
  {
    // Wrong data types
    numericValue: '50', // Should be number
    displayValue: 50, // Should be string
    change: '10', // Should be number
    trend: 'increasing', // Should be 'up' or 'down'
    description: null,
    subtext: undefined,
  },
]

/**
 * Invalid complete produto data
 */
export const invalidCompleteProdutoData = [
  {
    // Missing required 'metrics' field
    produtos: [],
    analytics: {},
  },
  {
    // Wrong type for metrics
    metrics: 'invalid',
    produtos: [],
  },
  {
    // Wrong structure entirely
    data: {
      nested: {
        wrongly: true,
      },
    },
  },
  {
    // Null values where objects expected
    metrics: null,
    produtos: null,
    analytics: null,
  },
]

/**
 * Edge cases that should fail validation
 */
export const edgeCaseInvalidProdutoData = [
  // Empty object (missing required metrics)
  {},
  // Null
  null,
  // Undefined
  undefined,
  // Array instead of object
  [],
  // String
  'invalid produto data',
  // Number
  42,
  // Boolean
  false,
  // Invalid Date objects in produtos
  {
    metrics: {}, // Invalid metrics structure
    produtos: [
      {
        id: 'test',
        sku: 'test',
        nome: 'test',
        categoria: 'test',
        precoCusto: 100,
        precoVenda: 150,
        estoqueAtual: 10,
        estoqueMinimo: 5,
        status: 'ativo',
        ultimaAtualizacao: 'not-a-date', // Invalid date
      },
    ],
  },
]
