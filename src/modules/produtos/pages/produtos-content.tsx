/**
 * Produtos Content Component with React Query
 * Optimized version using caching and automatic refetching
 * Following the pattern from DashboardContentV2
 */

'use client'

import * as React from 'react'
import { SectionProdutosMetrics } from './section-produtos-metrics'
import { ProdutosDataTable } from './produtos-data-table'
import { LoadingSkeleton } from '@/modules/dashboard/components/loading-skeleton-legacy'
import { DashboardErrorBoundary } from '@/modules/dashboard/components/dashboard-error-boundary'
import { AlertCircle, RefreshCw, Package } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAllProdutoData } from '@/modules/produtos/hooks/data/use-produtos-data-switch'
import type { ProdutoData, ProdutoFilter } from '@/modules/produtos/types/produtos.types'
import { ProdutosFilters } from '../components/page/produtos-filters'
import { hydrateMockProdutosCache } from '@/modules/produtos/mocks/produtos-mock-generator'
import { ProdutosFilterStatus } from '../components/page/produtos-filter-status'
import { useProductFilters } from '@/modules/produtos/contexts/filter-context'
import { useFilterCalculations } from '@/modules/produtos/hooks/use-filter-calculations'
import {
  PurchaseRequirementProvider,
  usePurchaseRequirementModal,
} from '@/modules/produtos/contexts/purchase-requirement-context'
import { PurchaseRequirementModal } from '@/modules/produtos/components/shared/modals/purchase-requirement-modal'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'

interface ProdutosContentProps {
  /** Initial data for SSR */
  initialData?: ProdutoData
}

/**
 * Internal component with purchase requirement context
 */
function ProdutosContentInner({ initialData }: ProdutosContentProps) {
  const { session } = useAuth()
  const organizationId = session.organization?.id
  // Get modal state
  const { isOpen, close } = usePurchaseRequirementModal()
  // Get filter values from unified context
  const { filters, defaultFilters } = useProductFilters()

  React.useEffect(() => {
    if (initialData?.produtos && initialData.produtos.length > 0) {
      hydrateMockProdutosCache(initialData.produtos)
    }
  }, [initialData])

  const filterPayload = React.useMemo<ProdutoFilter | undefined>(() => {
    const selectedDepositos = [...(filters.deposito ?? [])]
    const selectedMarcas = [...(filters.marca ?? [])]
    const selectedFornecedores = [...(filters.fornecedor ?? [])]

    const defaultDepositos = defaultFilters.deposito ?? []
    const defaultMarcas = defaultFilters.marca ?? []
    const defaultFornecedores = defaultFilters.fornecedor ?? []

    const depositoAllSelected =
      defaultDepositos.length > 0
        ? selectedDepositos.length === defaultDepositos.length &&
          defaultDepositos.every((id) => selectedDepositos.includes(id))
        : selectedDepositos.length === 0

    const marcaAllSelected =
      defaultMarcas.length > 0
        ? selectedMarcas.length === defaultMarcas.length &&
          defaultMarcas.every((id) => selectedMarcas.includes(id))
        : selectedMarcas.length === 0

    const fornecedorAllSelected =
      defaultFornecedores.length > 0
        ? selectedFornecedores.length === defaultFornecedores.length &&
          defaultFornecedores.every((id) =>
            selectedFornecedores.includes(id),
          )
        : selectedFornecedores.length === 0

    const allSelected =
      depositoAllSelected && marcaAllSelected && fornecedorAllSelected

    return allSelected
      ? undefined
      : {
          deposito: selectedDepositos,
          marca: selectedMarcas,
          fornecedor: selectedFornecedores,
        }
  }, [filters, defaultFilters])

  const produtosQueryOptions = React.useMemo(() => {
    if (!filterPayload && initialData) {
      return { initialData }
    }

    return undefined
  }, [filterPayload, initialData])

  const query = useAllProdutoData(filterPayload, produtosQueryOptions)
  const { data, isLoading, isError, error, isFetching, refetch } = query as any

  const isLoadingTotal = false

  // Get all products (unfiltered) for calculations
  const allProducts = React.useMemo(() => {
    return initialData?.produtos || []
  }, [initialData])

  // Use centralized hook for filter calculations
  const { availableMarcas, availableOptions, totalProducts, filteredProducts } =
    useFilterCalculations({
      filters,
      allProducts,
      filteredProducts: data?.produtos ?? initialData?.produtos,
      defaultTotal: 150,
    })

  const productsForModal = React.useMemo(() => {
    // Modal operates on the complete dataset, independent of table filters
    if (initialData?.produtos && initialData.produtos.length > 0) {
      return initialData.produtos
    }

    return data?.produtos ?? []
  }, [data?.produtos, initialData?.produtos])

  // Handle refresh - already memoized by React Query
  const handleRefresh = React.useCallback(() => {
    refetch()
  }, [refetch])

  // Show loading state
  if (isLoading && !data) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-foreground" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Produtos
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Carregando dados de produtos...
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  // Show error state with retry option
  if (isError && !data) {
    const errorMessage = error?.message || 'Erro ao carregar dados de produtos'

    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-foreground" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Produtos
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">Ops! Algo deu errado</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Main render with data
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-foreground" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Produtos
                {isFetching && (
                  <span className="ml-2 inline-flex items-center">
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  </span>
                )}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Gerencie seu estoque e acompanhe métricas de produtos
            </p>
          </div>

          {/* Manual refresh button */}
          {!isFetching && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
      </div>

      {/* Show stale error inline if data exists but query failed */}
      {isError && data && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Usando dados em cache. Não foi possível atualizar os dados.
          </AlertDescription>
        </Alert>
      )}

      {data ? (
        <DashboardErrorBoundary>
          {/* Product Metrics Section */}
          <SectionProdutosMetrics metrics={data.metrics} />

          {/* Products Table Section with Filters */}
          <div className="mt-6">
            {/* Filters - Above table, below metrics */}
            <div className="mb-4 pb-4 border-b space-y-3 mt-4">
              <ProdutosFilters
                isLoading={isFetching || isLoadingTotal}
                showIcons={false}
                availableMarcas={availableMarcas}
                availableOptions={availableOptions}
                allProducts={allProducts}
              />

              {/* Filter Status */}
              <ProdutosFilterStatus
                totalProducts={totalProducts}
                filteredProducts={filteredProducts}
                isLoading={isFetching}
                products={data?.produtos}
                variant="alert"
              />
            </div>

            {/* Table header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Lista de Produtos
              </h2>
              <p className="text-sm text-muted-foreground">
                Gerenciamento detalhado do inventário com métricas de
                performance
              </p>
            </div>

            {/* Data Table */}
            <ProdutosDataTable
              data={data.produtos || []}
              isLoading={isFetching}
              totalProducts={totalProducts}
            />
          </div>
        </DashboardErrorBoundary>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum dado disponível para exibição
        </div>
      )}

      {/* Purchase Requirement Modal */}
      <PurchaseRequirementModal
        open={isOpen}
        onOpenChange={close}
        organizationId={organizationId}
        products={productsForModal}
      />
    </div>
  )
}

/**
 * Optimized Products Dashboard Content using React Query
 * Features:
 * - Automatic caching and background refetching
 * - Product metrics display
 * - Smart error recovery
 * - Loading states
 * - Responsive layout
 */
export function ProdutosContent(props: ProdutosContentProps) {
  return (
    <PurchaseRequirementProvider>
      <ProdutosContentInner {...props} />
    </PurchaseRequirementProvider>
  )
}
