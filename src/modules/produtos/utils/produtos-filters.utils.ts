/**
 * Utility functions for calculating dynamic filter options
 * based on active filters and available products
 */

import type { Produto } from '@/modules/produtos/types/produtos.types'
import { FilterType } from '@/modules/produtos/constants/produtos-filters.constants'
import {
  normalizeMarca,
  isFilterActive,
} from '@/modules/produtos/utils/produtos-transforms.utils'

/**
 * Available filter options interface
 */
export interface AvailableFilterOptions {
  depositos: Set<string>
  marcas: Set<string>
  fornecedores: Set<string>
  categorias: Set<string>
}

type FilterSelection = {
  deposito: string[]
  marca: string[]
  fornecedor: string[]
  categoria?: string[]
}

/**
 * Calculate available filter options based on active filters
 * This creates interdependent filters where each filter shows
 * only options that have products matching other active filters
 *
 * @param allProducts - All products without filters
 * @param activeFilters - Currently active filters
 * @returns Available options for each filter type
 */
export function calculateAvailableOptions(
  allProducts: Produto[],
  activeFilters: FilterSelection,
): AvailableFilterOptions {
  const emptyResult: AvailableFilterOptions = {
    depositos: new Set<string>(),
    marcas: new Set<string>(),
    fornecedores: new Set<string>(),
    categorias: new Set<string>(),
  }

  if (!allProducts || allProducts.length === 0) {
    return emptyResult
  }

  const totalMarcas = new Set(
    allProducts.map((product) => normalizeMarca(product.marca)),
  ).size

  const depositoActive = isFilterActive(
    activeFilters.deposito,
    FilterType.DEPOSITO,
  )
  const marcaActive = isFilterActive(
    activeFilters.marca,
    FilterType.MARCA,
    totalMarcas,
  )
  const fornecedorActive = isFilterActive(
    activeFilters.fornecedor,
    FilterType.FORNECEDOR,
  )
  const categoriaSelections = Array.isArray(activeFilters.categoria)
    ? activeFilters.categoria.filter((value) => value && value !== 'all')
    : undefined
  const categoriaActive = Array.isArray(activeFilters.categoria)

  const selectedDepositos = new Set(
    activeFilters.deposito.filter((value) => value && value !== 'all'),
  )
  const selectedMarcas = new Set(
    activeFilters.marca.filter((value) => value && value !== 'all'),
  )
  const selectedFornecedores = new Set(
    activeFilters.fornecedor.filter((value) => value && value !== 'all'),
  )
  const selectedCategorias = new Set(categoriaSelections ?? [])

  const depositos = new Set<string>()
  const marcas = new Set<string>()
  const fornecedores = new Set<string>()
  const categorias = new Set<string>()

  for (const product of allProducts) {
    const marcaSlug = normalizeMarca(product.marca)

    const matchesDeposito =
      !depositoActive || selectedDepositos.has(product.deposito)
    const matchesMarca = !marcaActive || selectedMarcas.has(marcaSlug)
    const matchesFornecedor =
      !fornecedorActive || selectedFornecedores.has(product.fornecedor)
    const matchesCategoria =
      !categoriaActive || selectedCategorias.has(product.categoria)

    if (matchesMarca && matchesFornecedor && matchesCategoria) {
      if (product.deposito) {
        depositos.add(product.deposito)
      }
    }

    if (matchesDeposito && matchesFornecedor && matchesCategoria) {
      if (product.marca) {
        marcas.add(product.marca)
      }
    }

    if (matchesDeposito && matchesMarca && matchesCategoria) {
      if (product.fornecedor) {
        fornecedores.add(product.fornecedor)
      }
    }

    if (matchesDeposito && matchesMarca && matchesFornecedor) {
      if (product.categoria) {
        categorias.add(product.categoria)
      }
    }
  }

  return {
    depositos,
    marcas,
    fornecedores,
    categorias,
  }
}

/**
 * Calculate product count for each filter option
 * Shows how many products will be displayed if that option is selected
 *
 * @param allProducts - All products without filters
 * @param activeFilters - Currently active filters
 * @param filterType - Type of filter to calculate counts for
 * @returns Map of option value to product count
 */
export function calculateOptionCounts(
  allProducts: Produto[],
  activeFilters: FilterSelection,
  filterType: 'deposito' | 'marca' | 'fornecedor',
): Map<string, number> {
  const counts = new Map<string, number>()

  if (!allProducts || allProducts.length === 0) {
    return counts
  }

  const totalMarcas = new Set(
    allProducts.map((product) => normalizeMarca(product.marca)),
  ).size

  const depositoActive = isFilterActive(
    activeFilters.deposito,
    FilterType.DEPOSITO,
  )
  const marcaActive = isFilterActive(
    activeFilters.marca,
    FilterType.MARCA,
    totalMarcas,
  )
  const fornecedorActive = isFilterActive(
    activeFilters.fornecedor,
    FilterType.FORNECEDOR,
  )
  const categoriaSelections = Array.isArray(activeFilters.categoria)
    ? activeFilters.categoria.filter((value) => value && value !== 'all')
    : undefined
  const categoriaActive = Array.isArray(activeFilters.categoria)

  const selectedDepositos = new Set(
    activeFilters.deposito.filter((value) => value !== 'all'),
  )
  const selectedMarcas = new Set(
    activeFilters.marca.filter((value) => value !== 'all'),
  )
  const selectedFornecedores = new Set(
    activeFilters.fornecedor.filter((value) => value !== 'all'),
  )
  const selectedCategorias = new Set(categoriaSelections ?? [])

  for (const product of allProducts) {
    const marcaSlug = normalizeMarca(product.marca)

    if (categoriaActive && product.categoria) {
      if (!selectedCategorias.has(product.categoria)) {
        continue
      }
    }

    if (
      filterType !== 'deposito' &&
      depositoActive &&
      !selectedDepositos.has(product.deposito)
    ) {
      continue
    }

    if (
      filterType !== 'marca' &&
      marcaActive &&
      !selectedMarcas.has(marcaSlug)
    ) {
      continue
    }

    if (
      filterType !== 'fornecedor' &&
      fornecedorActive &&
      !selectedFornecedores.has(product.fornecedor)
    ) {
      continue
    }

    const key = filterType === 'marca' ? marcaSlug : product[filterType]
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return counts
}

/**
 * Check if a filter option should be disabled
 * An option is disabled if selecting it would result in 0 products
 *
 * @param optionValue - The value of the option to check
 * @param filterType - Type of filter
 * @param availableOptions - Available options from calculateAvailableOptions
 * @returns Whether the option should be disabled
 */
export function isOptionDisabled(
  optionValue: string,
  filterType: 'deposito' | 'marca' | 'fornecedor',
  availableOptions: AvailableFilterOptions,
): boolean {
  if (optionValue === 'all') {
    return false // "All" option is never disabled
  }

  const availableSet =
    filterType === 'deposito'
      ? availableOptions.depositos
      : filterType === 'marca'
        ? availableOptions.marcas
        : availableOptions.fornecedores

  // For marca, we need to check the actual marca name, not the slug
  if (filterType === 'marca') {
    // Check if any available marca matches this option when slugified
    for (const marca of availableOptions.marcas) {
      if (normalizeMarca(marca) === optionValue) {
        return false
      }
    }
    return true
  }

  return !availableSet.has(optionValue)
}

/**
 * Format filter option label with count
 *
 * @param label - Original label
 * @param count - Product count for this option
 * @param showCount - Whether to show the count
 * @returns Formatted label
 */
export function formatOptionLabel(
  label: string,
  count?: number,
  showCount: boolean = true,
): string {
  if (!showCount || count === undefined) {
    return label
  }
  return `${label} (${count})`
}
