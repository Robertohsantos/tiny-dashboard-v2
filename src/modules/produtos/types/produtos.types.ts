/**
 * TypeScript interfaces for produtos (products) data
 * Single source of truth for all product-related types
 */

/**
 * Generic metric data structure with flexible value type
 */
export interface MetricData<T = number> {
  /** Value of the metric (can be number or formatted string) */
  value: T
  /** Currency symbol (optional) */
  currency?: string
  /** Unit of measurement (optional) */
  unit?: string
  /** Absolute value from the previous comparison period (optional) */
  previousValue?: T
  /** Formatted representation of the previous value (optional) */
  previousDisplayValue?: string
  /** Percentage change from previous period */
  change: number
  /** Trend direction */
  trend: 'up' | 'down'
  /** Human-readable description */
  description: string
  /** Additional context or subtext */
  subtext: string
}

/**
 * Specific metric data for display purposes
 */
export interface ProdutoMetricDisplay {
  /** Numeric value for calculations */
  numericValue: number
  /** Formatted value for display */
  displayValue: string
  /** Currency symbol (optional) */
  currency?: string
  /** Unit of measurement (optional) */
  unit?: string
  /** Numeric value from the previous comparison period (optional) */
  previousNumericValue?: number
  /** Formatted representation of the previous value (optional) */
  previousDisplayValue?: string
  /** Percentage change from previous period */
  change: number
  /** Trend direction */
  trend: 'up' | 'down'
  /** Human-readable description */
  description: string
  /** Additional context or subtext */
  subtext: string
}

/**
 * Product inventory metrics for the dashboard
 */
export interface ProdutoMetrics {
  /** Total inventory value at cost price */
  totalEstoque: MetricData<number>
  /** Total inventory value at selling price */
  vendaTotalEstoque: MetricData<number>
  /** Average markup percentage */
  markupMedio: ProdutoMetricDisplay
  /** Products out of stock */
  produtosEmFalta: ProdutoMetricDisplay
  /** Purchase requirement value */
  necessidadeCompra: MetricData<number>
}

/**
 * Individual product data
 */
export interface Produto {
  /** Unique product identifier */
  id: string
  /** Product SKU code */
  sku: string
  /** Product name */
  nome: string
  /** Product description */
  descricao?: string
  /** Product brand */
  marca: string
  /** Product category */
  categoria: string
  /** Warehouse/Store location */
  deposito: string
  /** Supplier */
  fornecedor: string
  /** Cost price */
  precoCusto: number
  /** Selling price */
  precoVenda: number
  /** Current stock quantity */
  estoqueAtual: number
  /** Minimum stock level */
  estoqueMinimo: number
  /** Markup percentage */
  markupPercentual: number
  /** Stock coverage in days */
  coberturaEstoqueDias: number
  /** Product status */
  status: 'ativo' | 'inativo' | 'descontinuado'
  /** Last update date */
  ultimaAtualizacao: Date
}

/**
 * Period filter parameters for product queries
 */
export interface ProdutoFilter {
  /** Product category filter */
  categoria?: string
  /** Warehouse/Store location filter - supports multiple selection */
  deposito?: string | string[]
  /** Product brand filter - supports multiple selection */
  marca?: string | string[]
  /** Supplier filter - supports multiple selection */
  fornecedor?: string | string[]
  /** Stock status filter */
  statusEstoque?: 'em_falta' | 'baixo' | 'normal' | 'excessivo'
  /** Product status filter */
  status?: 'ativo' | 'inativo' | 'descontinuado'
  /** Search term */
  searchTerm?: string
}

/**
 * Complete product dashboard data structure
 */
export interface ProdutoData {
  /** Product metrics */
  metrics: ProdutoMetrics
  /** List of products */
  produtos?: Produto[]
  /** Additional analytics data */
  analytics?: {
    /** Stock distribution by category */
    distribuicaoEstoque: Array<{
      categoria: string
      valor: number
      quantidade: number
    }>
    /** Products needing reorder */
    produtosReposicao: Produto[]
  }
}

/**
 * Product state discriminated union for better type safety
 */
export type ProdutoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error; message: string }
  | { status: 'empty'; message: string }
  | { status: 'success'; data: ProdutoData }

/**
 * Props for product components
 */
export interface ProdutoComponentProps {
  /** Initial data for server-side rendering */
  initialData?: ProdutoData
  /** Whether to show loading state */
  isLoading?: boolean
  /** Error message if any */
  error?: string | null
}
