/**
 * Transformation utilities for product filters
 * Centralizes all data transformation logic
 */

import {
  FILTER_TOTALS,
  FilterType,
} from '@/modules/produtos/constants/produtos-filters.constants'

/**
 * Normalize a brand name to a URL-safe slug
 * @param marca - The brand name to normalize
 * @returns URL-safe slug version of the brand name
 * @example
 * normalizeMarca("L'Oréal") // returns "l-oreal"
 * normalizeMarca("Forever 21") // returns "forever-21"
 */
export function normalizeMarca(marca: string): string {
  if (!marca) return ''

  return marca
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

/**
 * Denormalize a slug back to a display-friendly brand name
 * @param slug - The slug to denormalize
 * @param availableMarcas - List of available brand names for matching
 * @returns Original brand name or formatted version of slug
 */
export function denormalizeMarca(
  slug: string,
  availableMarcas?: string[],
): string {
  if (!slug || slug === 'all') return slug

  // Try to find exact match in available marcas
  if (availableMarcas) {
    const match = availableMarcas.find(
      (marca) => normalizeMarca(marca) === slug,
    )
    if (match) return match
  }

  // Otherwise, format the slug for display
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if all items are selected for a specific filter type
 * @param selectedItems - Array of selected item IDs
 * @param filterType - Type of filter to check
 * @param totalItems - Total number of available items (for dynamic filters like marca)
 * @returns True if all items are selected or none are selected (which means "all")
 */
export function isAllSelected(
  selectedItems: string[],
  filterType: FilterType,
  totalItems?: number,
): boolean {
  if (selectedItems.includes('all')) {
    return true
  }

  const count = selectedItems.length

  switch (filterType) {
    case FilterType.DEPOSITO:
      return (
        count === 0 ||
        (FILTER_TOTALS.DEPOSITOS > 0 && count === FILTER_TOTALS.DEPOSITOS)
      )

    case FilterType.FORNECEDOR:
      return (
        count === 0 ||
        (FILTER_TOTALS.FORNECEDORES > 0 && count === FILTER_TOTALS.FORNECEDORES)
      )

    case FilterType.MARCA:
      if (typeof totalItems !== 'number' || totalItems === 0) {
        return count === 0
      }
      return count === 0 || count === totalItems

    default:
      return false
  }
}

/**
 * Check if a filter has active selections (not showing all)
 * @param selectedItems - Array of selected item IDs
 * @param filterType - Type of filter to check
 * @param totalItems - Total number of available items (for dynamic filters)
 * @returns True if the filter is actively filtering results
 */
export function isFilterActive(
  selectedItems: string[],
  filterType: FilterType,
  totalItems?: number,
): boolean {
  return !isAllSelected(selectedItems, filterType, totalItems)
}

/**
 * Count active filters
 * @param filters - Filter state object
 * @param totalMarcas - Total number of available marcas
 * @returns Number of active filters
 */
export function countActiveFilters(
  filters: { deposito: string[]; marca: string[]; fornecedor: string[] },
  totalMarcas: number,
): number {
  let count = 0

  if (isFilterActive(filters.deposito, FilterType.DEPOSITO)) count++
  if (isFilterActive(filters.marca, FilterType.MARCA, totalMarcas)) count++
  if (isFilterActive(filters.fornecedor, FilterType.FORNECEDOR)) count++

  return count
}

/**
 * Format a filter value for display
 * @param value - The filter value
 * @param count - Optional count to append
 * @param showCount - Whether to show the count
 * @returns Formatted display string
 */
export function formatFilterLabel(
  value: string,
  count?: number,
  showCount = true,
): string {
  if (!showCount || count === undefined) {
    return value
  }
  return `${value} (${count})`
}

/**
 * Get selection summary for a filter
 * @param selectedCount - Number of selected items
 * @param totalCount - Total available items
 * @param filterName - Name of the filter for display
 * @returns Human-readable selection summary
 */
export function getSelectionSummary(
  selectedCount: number,
  totalCount: number,
  filterName: string,
): string {
  if (selectedCount === 0 || selectedCount === totalCount) {
    return `Todos os ${filterName.toLowerCase()}s`
  }

  if (selectedCount === 1) {
    return `1 ${filterName.toLowerCase()}`
  }

  return `${selectedCount} ${filterName.toLowerCase()}s`
}

/**
 * Parse filter parameters from URL query string
 * @param searchParams - URL search parameters
 * @returns Parsed filter state
 */
export function parseFilterParams(searchParams: URLSearchParams): {
  deposito: string[]
  marca: string[]
  fornecedor: string[]
} {
  return {
    deposito: searchParams.getAll('deposito'),
    marca: searchParams.getAll('marca'),
    fornecedor: searchParams.getAll('fornecedor'),
  }
}

/**
 * Serialize filter state to URL query string
 * @param filters - Filter state object
 * @returns URLSearchParams object
 */
export function serializeFilterParams(filters: {
  deposito: string[]
  marca: string[]
  fornecedor: string[]
}): URLSearchParams {
  const params = new URLSearchParams()

  filters.deposito.forEach((d) => params.append('deposito', d))
  filters.marca.forEach((m) => params.append('marca', m))
  filters.fornecedor.forEach((f) => params.append('fornecedor', f))

  return params
}

/**
 * Compare two filter states for equality
 * @param a - First filter state
 * @param b - Second filter state
 * @returns True if filter states are equal
 */
export function areFiltersEqual(
  a: { deposito: string[]; marca: string[]; fornecedor: string[] },
  b: { deposito: string[]; marca: string[]; fornecedor: string[] },
): boolean {
  const sortAndCompare = (arr1: string[], arr2: string[]) => {
    if (arr1.length !== arr2.length) return false
    const sorted1 = [...arr1].sort()
    const sorted2 = [...arr2].sort()
    return sorted1.every((val, idx) => val === sorted2[idx])
  }

  return (
    sortAndCompare(a.deposito, b.deposito) &&
    sortAndCompare(a.marca, b.marca) &&
    sortAndCompare(a.fornecedor, b.fornecedor)
  )
}
