/**
 * Custom hook for centralized filter calculations
 * Eliminates code duplication and provides single source of truth for filter logic
 */

'use client'

import * as React from 'react'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import type { ProductFilters } from '@/modules/produtos/contexts/filter-context'
import {
  calculateAvailableOptions,
  type AvailableFilterOptions,
} from '@/modules/produtos/utils/produtos-filters.utils'
import {
  normalizeMarca,
  isFilterActive,
  countActiveFilters,
} from '@/modules/produtos/utils/produtos-transforms.utils'
import { FilterType } from '@/modules/produtos/constants/produtos-filters.constants'

/**
 * Filter calculation results
 */
interface FilterCalculationResults {
  /** Available marcas extracted from products */
  availableMarcas: string[]
  /** Available filter options based on active filters */
  availableOptions: AvailableFilterOptions
  /** Whether any filters are actively filtering */
  hasActiveFilters: boolean
  /** Number of active filters */
  activeFilterCount: number
  /** Total products count without filters */
  totalProducts: number
  /** Filtered products count */
  filteredProducts: number
}

/**
 * Hook parameters
 */
interface UseFilterCalculationsParams {
  /** Current filter state */
  filters: ProductFilters
  /** All products without filters */
  allProducts?: Produto[]
  /** Filtered products */
  filteredProducts?: Produto[]
  /** Default total if no data available */
  defaultTotal?: number
}

/**
 * Custom hook for centralized filter calculations
 * @param params - Hook parameters
 * @returns Calculated filter results
 */
export function useFilterCalculations({
  filters,
  allProducts = [],
  filteredProducts = [],
  defaultTotal = 150,
}: UseFilterCalculationsParams): FilterCalculationResults {
  // Extract available marcas from all products
  const availableMarcas = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) return []

    const marcaMap = new Map<string, string>()
    for (const produto of allProducts) {
      const slug = normalizeMarca(produto.marca)
      if (!marcaMap.has(slug)) {
        marcaMap.set(slug, produto.marca)
      }
    }

    return Array.from(marcaMap.values()).sort((a, b) => a.localeCompare(b))
  }, [allProducts])

  const totalDepositos = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return 0
    }
    return new Set(allProducts.map((produto) => produto.deposito)).size
  }, [allProducts])

  const totalFornecedores = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return 0
    }
    return new Set(allProducts.map((produto) => produto.fornecedor)).size
  }, [allProducts])

  // Calculate available options based on active filters
  const availableOptions = React.useMemo(() => {
    return calculateAvailableOptions(allProducts, filters)
  }, [allProducts, filters])

  // Check if any filters are active
  const hasActiveFilters = React.useMemo(() => {
    return (
      isFilterActive(filters.deposito, FilterType.DEPOSITO, totalDepositos) ||
      isFilterActive(filters.marca, FilterType.MARCA, availableMarcas.length) ||
      isFilterActive(
        filters.fornecedor,
        FilterType.FORNECEDOR,
        totalFornecedores,
      )
    )
  }, [
    filters.deposito,
    filters.marca,
    filters.fornecedor,
    totalDepositos,
    totalFornecedores,
    availableMarcas,
  ])

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0

    if (isFilterActive(filters.deposito, FilterType.DEPOSITO, totalDepositos)) {
      count++
    }

    if (
      isFilterActive(filters.marca, FilterType.MARCA, availableMarcas.length)
    ) {
      count++
    }

    if (
      isFilterActive(
        filters.fornecedor,
        FilterType.FORNECEDOR,
        totalFornecedores,
      )
    ) {
      count++
    }

    return count
  }, [
    filters.deposito,
    filters.marca,
    filters.fornecedor,
    totalDepositos,
    totalFornecedores,
    availableMarcas,
  ])

  // Calculate total products
  const totalProducts = React.useMemo(() => {
    return allProducts?.length || defaultTotal
  }, [allProducts, defaultTotal])

  // Calculate filtered products count
  const filteredProductsCount = React.useMemo(() => {
    return filteredProducts?.length || 0
  }, [filteredProducts])

  return {
    availableMarcas,
    availableOptions,
    hasActiveFilters,
    activeFilterCount,
    totalProducts,
    filteredProducts: filteredProductsCount,
  }
}

/**
 * Hook for getting filter display information
 */
interface FilterDisplayInfo {
  /** Human-readable filter summary */
  summary: string
  /** Badge text for active filters */
  badgeText: string
  /** Percentage of products shown */
  filterPercentage: number
}

/**
 * Get display information for current filters
 * @param filters - Current filter state
 * @param totalProducts - Total number of products
 * @param filteredProducts - Number of filtered products
 * @returns Display information
 */
export function useFilterDisplay(
  filters: ProductFilters,
  totalProducts: number,
  filteredProducts: number,
): FilterDisplayInfo {
  const summary = React.useMemo(() => {
    const parts: string[] = []

    const depositoSelection = filters.deposito.filter(
      (value) => value !== 'all',
    )
    if (depositoSelection.length > 0 && depositoSelection.length < 3) {
      parts.push(
        `${depositoSelection.length} depósito${depositoSelection.length > 1 ? 's' : ''}`,
      )
    }

    const marcaSelection = filters.marca.filter((value) => value !== 'all')
    if (marcaSelection.length > 0) {
      parts.push(
        `${marcaSelection.length} marca${marcaSelection.length > 1 ? 's' : ''}`,
      )
    }

    const fornecedorSelection = filters.fornecedor.filter(
      (value) => value !== 'all',
    )
    if (fornecedorSelection.length > 0 && fornecedorSelection.length < 4) {
      parts.push(
        `${fornecedorSelection.length} fornecedor${fornecedorSelection.length > 1 ? 'es' : ''}`,
      )
    }
    if (parts.length === 0) {
      return 'Todos os produtos'
    }

    return `Filtrado por: ${parts.join(', ')}`
  }, [filters])

  const badgeText = React.useMemo(() => {
    const count = countActiveFilters(filters, 0) // We don't need exact marca count for badge
    if (count === 0) return ''
    return `${count} filtro${count > 1 ? 's' : ''}`
  }, [filters])

  const filterPercentage = React.useMemo(() => {
    if (totalProducts === 0) return 0
    return Math.round((filteredProducts / totalProducts) * 100)
  }, [totalProducts, filteredProducts])

  return {
    summary,
    badgeText,
    filterPercentage,
  }
}
