/**
 * Filter-specific constants for the products module
 * Single source of truth for all filter-related magic values and configurations
 */

/**
 * Total counts for each filter type
 * Used to determine if "all" items are selected
 */
export const FILTER_TOTALS = {
  DEPOSITOS: 3,
  FORNECEDORES: 4,
  // Marcas are dynamic, so we don't have a fixed total
} as const

/**
 * Filter types enum for type safety
 */
export enum FilterType {
  DEPOSITO = 'deposito',
  MARCA = 'marca',
  FORNECEDOR = 'fornecedor',
}

/**
 * Default filter state configurations
 */
export const DEFAULT_FILTER_CONFIG = {
  /** Whether to show all items by default */
  SELECT_ALL_BY_DEFAULT: true,
  /** Debounce delay for filter changes in milliseconds */
  DEBOUNCE_DELAY: 300,
  /** Maximum number of items to display in multi-select before showing count */
  MAX_DISPLAY_ITEMS: 2,
  /** Whether to show item counts in filter options */
  SHOW_COUNTS: true,
  /** Whether to enable search in multi-select */
  SEARCHABLE: {
    [FilterType.DEPOSITO]: false,
    [FilterType.MARCA]: true,
    [FilterType.FORNECEDOR]: false,
  },
} as const

/**
 * Filter display configurations
 */
export const FILTER_DISPLAY = {
  /** Labels for filter types */
  LABELS: {
    [FilterType.DEPOSITO]: 'Depósito',
    [FilterType.MARCA]: 'Marca',
    [FilterType.FORNECEDOR]: 'Fornecedor',
  },
  /** Placeholders for filter selects */
  PLACEHOLDERS: {
    [FilterType.DEPOSITO]: 'Selecione o depósito',
    [FilterType.MARCA]: 'Selecione a marca',
    [FilterType.FORNECEDOR]: 'Selecione o fornecedor',
  },
} as const

/**
 * Validation rules for filters
 */
export const FILTER_VALIDATION = {
  /** Minimum selections required (0 means no minimum) */
  MIN_SELECTIONS: {
    [FilterType.DEPOSITO]: 0,
    [FilterType.MARCA]: 0,
    [FilterType.FORNECEDOR]: 0,
  },
  /** Maximum selections allowed (null means no limit) */
  MAX_SELECTIONS: {
    [FilterType.DEPOSITO]: null,
    [FilterType.MARCA]: null,
    [FilterType.FORNECEDOR]: null,
  },
} as const

/**
 * Performance optimization configurations
 */
export const FILTER_PERFORMANCE = {
  /** Whether to memoize filter calculations */
  MEMOIZE_CALCULATIONS: true,
  /** Cache duration for filter results in milliseconds */
  CACHE_DURATION: 5000,
  /** Maximum items to process without virtualization */
  VIRTUALIZATION_THRESHOLD: 100,
} as const

/**
 * Type guards for filter validation
 */
export const isValidFilterType = (type: string): type is FilterType => {
  return Object.values(FilterType).includes(type as FilterType)
}

/**
 * Helper to check if all items are selected for a filter type
 */
export const isAllItemsSelected = (
  selectedCount: number,
  filterType: FilterType.DEPOSITO | FilterType.FORNECEDOR,
): boolean => {
  const total =
    filterType === FilterType.DEPOSITO
      ? FILTER_TOTALS.DEPOSITOS
      : FILTER_TOTALS.FORNECEDORES
  return selectedCount === 0 || selectedCount === total
}

/**
 * Helper to check if filter is partially selected
 */
export const isPartiallySelected = (
  selectedCount: number,
  totalCount: number,
): boolean => {
  return selectedCount > 0 && selectedCount < totalCount
}

/**
 * Get filter configuration by type
 */
export const getFilterConfig = (type: FilterType) => ({
  label: FILTER_DISPLAY.LABELS[type],
  placeholder: FILTER_DISPLAY.PLACEHOLDERS[type],
  searchable: DEFAULT_FILTER_CONFIG.SEARCHABLE[type],
  minSelections: FILTER_VALIDATION.MIN_SELECTIONS[type],
  maxSelections: FILTER_VALIDATION.MAX_SELECTIONS[type],
})

/**
 * Type for filter state tracking
 */
export interface FilterMetrics {
  totalAvailable: number
  totalSelected: number
  isAllSelected: boolean
  isPartiallySelected: boolean
  selectionPercentage: number
}

/**
 * Calculate filter metrics for analytics
 */
export const calculateFilterMetrics = (
  selected: number,
  total: number,
): FilterMetrics => ({
  totalAvailable: total,
  totalSelected: selected,
  isAllSelected: selected === total || selected === 0,
  isPartiallySelected: selected > 0 && selected < total,
  selectionPercentage: total > 0 ? (selected / total) * 100 : 0,
})
