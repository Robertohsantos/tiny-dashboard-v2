// Constants
export * from './constants/produtos.constants'
export * from './constants/produtos-filters.constants'

// Contexts  
export * from './contexts/filter-context'
export {
  PurchaseRequirementProvider,
  usePurchaseRequirementContext,
  usePurchaseRequirementModal,
  usePurchaseRequirementConfig
} from './contexts/purchase-requirement-context'

// Hooks - Main data hooks (use-produtos-data as source of truth)
export {
  type ProdutoDataQueryOptions,
  useProdutosData,
  useProdutoMetrics,
  useProdutosList,
  useStockDistribution,
  useReorderProducts,
  usePrefetchProdutosData,
  useInvalidateProdutosData,
  useCachedProdutosData
} from './hooks/data/use-produtos-data'

// Hooks - Switch (delegates to either legacy or validated)
export {
  useAllProdutoData,
  useSaveProduto
} from './hooks/data/use-produtos-data-switch'

// Hooks - Validated versions
export {
  type ProdutosQueryOptions,
  useProdutoMetricsValidated,
  useProdutosListValidated,
  useStockDistributionValidated,
  useProdutosReposicaoValidated,
  useProdutoDataValidated,
  useProdutoByIdValidated,
  useAllProdutoDataValidated,
  useSaveProdutoValidated,
  validatedProdutosHooks
} from './hooks/data/use-produtos-data-validated'

// Query helpers
export * from './hooks/data/query-helpers'

// Other hooks
export * from './hooks/use-filter-calculations'
export * from './hooks/use-default-coverage-days'
export {
  usePurchaseRequirement,
  usePurchaseRequirementResults,
  useSingleProductRequirement,
  useRiskProducts,
  usePurchaseSimulation,
  useSupplierValidation,
  usePrefetchPurchaseRequirements,
  useInvalidatePurchaseRequirements
} from './hooks/use-purchase-requirement'

// Services & Utils
export * from './mocks/produtos-mock-generator'
export * from './services/produtos-data-adapter'
export * from './services/produtos.service'
export * from './services/produtos.service.validated'
export * from './types/produtos.types'
export * from './utils/produtos-filters.utils'
export * from './utils/produtos-transforms.utils'
export * from './types/produtos-filters.types'
