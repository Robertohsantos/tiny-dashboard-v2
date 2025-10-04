/**
 * Products Filter Status Component
 * Shows the current filter status and product count
 */

'use client'

import * as React from 'react'
import { useProductFilters } from '@/modules/produtos/contexts/filter-context'
import { Badge } from '@/components/ui/badge'
import { FilterType } from '@/modules/produtos/constants/produtos-filters.constants'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Filter, TrendingDown } from 'lucide-react'
import { cn } from '@/modules/ui'
import { Button } from '@/components/ui/button'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import { DEPOSITOS, FORNECEDORES } from '@/modules/produtos/constants/produtos.constants'
import {
  normalizeMarca,
  denormalizeMarca,
} from '@/modules/produtos/utils/produtos-transforms.utils'

interface ProdutosFilterStatusProps {
  /** Total products before filtering */
  totalProducts: number
  /** Filtered products count */
  filteredProducts: number
  /** Whether data is loading */
  isLoading?: boolean
  /** Additional class names */
  className?: string
  /** Whether to show as alert or inline */
  variant?: 'alert' | 'inline'
  /** Products array for additional analysis */
  products?: Produto[]
}

/**
 * Component to display filter status and statistics
 */
export function ProdutosFilterStatus({
  totalProducts,
  filteredProducts,
  isLoading = false,
  className,
  variant = 'inline',
  products = [],
}: ProdutosFilterStatusProps) {
  const {
    hasActiveFilters,
    activeFilterCount,
    filters,
    resetFilters,
    defaultFilters,
    primaryFilter,
  } = useProductFilters()

  const defaultDepositos = defaultFilters.deposito ?? []
  const defaultMarcas = defaultFilters.marca ?? []
  const defaultFornecedores = defaultFilters.fornecedor ?? []

  const isAllSelected = React.useCallback(
    (values: string[], defaults: string[] = []) => {
      return (
        values.length > 0 &&
        defaults.length > 0 &&
        values.length === defaults.length &&
        defaults.every((value) => values.includes(value))
      )
    },
    [],
  )

  const hasSpecificSelection = React.useCallback(
    (values: string[], defaults: string[] = []) => {
      if (values.length === 0) {
        return false
      }
      return !isAllSelected(values, defaults)
    },
    [isAllSelected],
  )

  const filterImpact = React.useMemo(() => {
    if (totalProducts === 0) return 0
    return Math.round(
      ((totalProducts - filteredProducts) / totalProducts) * 100,
    )
  }, [totalProducts, filteredProducts])

  // Get unique values count for active filters
  const uniqueCounts = React.useMemo(() => {
    if (!products.length) return null

    const counts: Record<string, number> = {}

    if (hasSpecificSelection(filters.deposito, defaultDepositos)) {
      counts.deposito = new Set(products.map((p) => p.deposito)).size
    }
    if (hasSpecificSelection(filters.marca, defaultMarcas)) {
      counts.marca = new Set(products.map((p) => normalizeMarca(p.marca))).size
    }
    if (hasSpecificSelection(filters.fornecedor, defaultFornecedores)) {
      counts.fornecedor = new Set(products.map((p) => p.fornecedor)).size
    }

    return Object.keys(counts).length > 0 ? counts : null
  }, [products, filters, defaultDepositos, defaultMarcas, defaultFornecedores])

  const marcaLabelMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const product of products) {
      const slug = normalizeMarca(product.marca)
      if (!map.has(slug)) {
        map.set(slug, product.marca)
      }
    }
    return map
  }, [products])

  const formatSelection = React.useCallback(
    (values: string[], labels: (id: string) => string) => {
      const sanitized = values.filter((value) => value !== 'all')
      if (sanitized.length === 0) {
        return ''
      }

      const formatted = sanitized.map(labels)
      return formatted.join(', ')
    },
    [],
  )

  // Don't show if no filters are active
  if (!hasActiveFilters && variant === 'alert') {
    return null
  }

  // Build status message
  const getStatusMessage = () => {
    if (isLoading) {
      return 'Aplicando filtros...'
    }

    if (!hasActiveFilters) {
      return `Mostrando todos os ${totalProducts} produtos`
    }

    if (filteredProducts === 0) {
      return 'Nenhum produto encontrado com os filtros selecionados'
    }

    if (filteredProducts === totalProducts) {
      return `Mostrando todos os ${totalProducts} produtos (filtros não afetaram o resultado)`
    }

    return `Mostrando ${filteredProducts} de ${totalProducts} produtos`
  }

  const getFilterDescription = () => {
    const parts: string[] = []

    if (primaryFilter) {
      const primaryName =
        primaryFilter === FilterType.DEPOSITO
          ? 'Depósito'
          : primaryFilter === FilterType.MARCA
            ? 'Marca'
            : 'Fornecedor'
      parts.push('Filtro base: ' + primaryName)
    }

    if (hasSpecificSelection(filters.deposito, defaultDepositos)) {
      const description = formatSelection(
        filters.deposito,
        (id) =>
          (DEPOSITOS as Record<string, { label: string }>)[id]?.label ?? id,
      )
      if (description) {
        parts.push(`Depósito: ${description}`)
      }
    }
    if (hasSpecificSelection(filters.marca, defaultMarcas)) {
      const description = formatSelection(
        filters.marca,
        (slug) => marcaLabelMap.get(slug) ?? denormalizeMarca(slug),
      )
      if (description) {
        parts.push(`Marca: ${description}`)
      }
    }
    if (hasSpecificSelection(filters.fornecedor, defaultFornecedores)) {
      const description = formatSelection(
        filters.fornecedor,
        (id) =>
          (FORNECEDORES as Record<string, { label: string }>)[id]?.label ?? id,
      )
      if (description) {
        parts.push(`Fornecedor: ${description}`)
      }
    }

    return parts.join(' • ')
  }

  // Alert variant - more prominent
  if (variant === 'alert' && hasActiveFilters) {
    return (
      <Alert className={cn('border-blue-200 bg-blue-50/50', className)}>
        <Filter className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-blue-900">
              {getStatusMessage()}
            </span>
            {hasActiveFilters && (
              <span className="text-sm text-blue-700">
                {getFilterDescription()}
              </span>
            )}
          </div>
          {hasActiveFilters && filteredProducts === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="ml-4"
            >
              Limpar filtros
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Inline variant - subtle
  return (
    <div
      className={cn(
        'flex items-center gap-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <span
          className={cn(
            hasActiveFilters &&
              filteredProducts < totalProducts &&
              'font-medium text-foreground',
          )}
        >
          {getStatusMessage()}
        </span>
      </div>

      {hasActiveFilters && filterImpact > 0 && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <Badge
            variant={filterImpact > 50 ? 'destructive' : 'secondary'}
            className="h-5 px-2"
          >
            <TrendingDown className="h-3 w-3 mr-1" />
            {filterImpact}% filtrado
          </Badge>
        </>
      )}

      {hasActiveFilters && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <Badge variant="outline" className="h-5 px-2">
            <Filter className="h-3 w-3 mr-1" />
            {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'}
          </Badge>
        </>
      )}

      {uniqueCounts && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-xs">
            {Object.entries(uniqueCounts).map(([key, count]) => (
              <span key={key} className="mr-2">
                {count}{' '}
                {key === 'deposito'
                  ? 'depósitos'
                  : key === 'marca'
                    ? 'marcas'
                    : 'fornecedores'}
              </span>
            ))}
          </span>
        </>
      )}
    </div>
  )
}

/**
 * Compact version for mobile
 */
export function ProdutosFilterStatusCompact(props: ProdutosFilterStatusProps) {
  const { hasActiveFilters, activeFilterCount, resetFilters } =
    useProductFilters()
  const { totalProducts, filteredProducts, isLoading } = props

  if (!hasActiveFilters) return null

  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span>
          {isLoading
            ? 'Filtrando...'
            : `${filteredProducts}/${totalProducts} produtos`}
        </span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={resetFilters}
        className="h-7 px-2 text-xs"
      >
        Limpar
      </Button>
    </div>
  )
}
