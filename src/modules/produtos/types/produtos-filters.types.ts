/**
 * Enhanced type definitions for product filters
 * Provides strict typing and validation for filter operations
 */

import type {
  DepositoId,
  MarcaId,
  FornecedorId,
} from '@/modules/produtos/constants/produtos.constants'

/**
 * Generic filter value type
 * Ensures type safety across different filter types
 */
export type FilterValue<T extends string = string> = T | T[]

/**
 * Filter state with strict typing
 */
export interface StrictProductFilters {
  readonly deposito: ReadonlyArray<DepositoId>
  readonly marca: ReadonlyArray<MarcaId>
  readonly fornecedor: ReadonlyArray<FornecedorId>
}

/**
 * Mutable version for internal state management
 */
export interface MutableProductFilters {
  deposito: DepositoId[]
  marca: MarcaId[]
  fornecedor: FornecedorId[]
}

/**
 * Filter change event with metadata
 */
export interface FilterChangeEvent<T extends keyof StrictProductFilters> {
  type: T
  previousValue: StrictProductFilters[T]
  newValue: StrictProductFilters[T]
  timestamp: number
  source: 'user' | 'system' | 'url'
}

/**
 * Filter validation result
 */
export interface FilterValidationResult {
  isValid: boolean
  errors?: {
    field: keyof StrictProductFilters
    message: string
    value: unknown
  }[]
}

/**
 * Filter persistence format for localStorage/sessionStorage
 */
export interface PersistedFilters {
  version: string
  timestamp: number
  filters: StrictProductFilters
  metadata?: {
    userId?: string
    sessionId?: string
  }
}

/**
 * Filter preset configuration
 */
export interface FilterPreset {
  id: string
  name: string
  description?: string
  filters: StrictProductFilters
  isDefault?: boolean
  createdAt: number
  updatedAt: number
}

/**
 * Filter analytics data
 */
export interface FilterAnalytics {
  /** Most used filter combinations */
  popularCombinations: Array<{
    filters: StrictProductFilters
    usageCount: number
    lastUsed: number
  }>
  /** Filter usage frequency */
  filterUsage: {
    [K in keyof StrictProductFilters]: number
  }
  /** Average time to apply filters */
  averageInteractionTime: number
  /** Number of filter resets */
  resetCount: number
}

/**
 * Type guards for filter validation
 */
export const FilterTypeGuards = {
  isDepositoId: (value: unknown): value is DepositoId => {
    return (
      typeof value === 'string' &&
      ['all', 'loja-01', 'loja-02', 'cd-distribuicao'].includes(value)
    )
  },

  isMarcaId: (value: unknown): value is MarcaId => {
    return typeof value === 'string' && value.length > 0
  },

  isFornecedorId: (value: unknown): value is FornecedorId => {
    return (
      typeof value === 'string' &&
      [
        'all',
        'fornecedor-nacional',
        'importadora-sul',
        'distribuidora-central',
        'atacado-express',
      ].includes(value)
    )
  },

  isValidFilters: (value: unknown): value is StrictProductFilters => {
    if (!isRecord(value)) return false

    return (
      isFilterArray(value.deposito, FilterTypeGuards.isDepositoId) &&
      isFilterArray(value.marca, FilterTypeGuards.isMarcaId) &&
      isFilterArray(value.fornecedor, FilterTypeGuards.isFornecedorId)
    )
  },
}

/**
 * Filter validation utilities
 */
export class FilterValidator {
  /**
   * Validate filter state
   */
  static validate(filters: unknown): FilterValidationResult {
    const errors: FilterValidationResult['errors'] = []

    if (!isRecord(filters)) {
      return {
        isValid: false,
        errors: [
          {
            field: 'deposito',
            message: 'Invalid filters object',
            value: filters,
          },
        ],
      }
    }

    // Validate deposito
    if (!Array.isArray(filters.deposito)) {
      errors.push({
        field: 'deposito',
        message: 'Deposito must be an array',
        value: filters.deposito,
      })
    } else if (!filters.deposito.every(FilterTypeGuards.isDepositoId)) {
      errors.push({
        field: 'deposito',
        message: 'Invalid deposito values',
        value: filters.deposito,
      })
    }

    // Validate marca
    if (!Array.isArray(filters.marca)) {
      errors.push({
        field: 'marca',
        message: 'Marca must be an array',
        value: filters.marca,
      })
    } else if (!filters.marca.every(FilterTypeGuards.isMarcaId)) {
      errors.push({
        field: 'marca',
        message: 'Invalid marca values',
        value: filters.marca,
      })
    }

    // Validate fornecedor
    if (!Array.isArray(filters.fornecedor)) {
      errors.push({
        field: 'fornecedor',
        message: 'Fornecedor must be an array',
        value: filters.fornecedor,
      })
    } else if (!filters.fornecedor.every(FilterTypeGuards.isFornecedorId)) {
      errors.push({
        field: 'fornecedor',
        message: 'Invalid fornecedor values',
        value: filters.fornecedor,
      })
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Sanitize filter values
   */
  static sanitize(
    filters: Partial<MutableProductFilters>,
  ): StrictProductFilters {
    return {
      deposito: (filters.deposito || []).filter(FilterTypeGuards.isDepositoId),
      marca: (filters.marca || []).filter(FilterTypeGuards.isMarcaId),
      fornecedor: (filters.fornecedor || []).filter(
        FilterTypeGuards.isFornecedorId,
      ),
    }
  }

  /**
   * Merge filter states
   */
  static merge(
    base: StrictProductFilters,
    updates: Partial<MutableProductFilters>,
  ): StrictProductFilters {
    return {
      deposito:
        updates.deposito !== undefined ? updates.deposito : base.deposito,
      marca: updates.marca !== undefined ? updates.marca : base.marca,
      fornecedor:
        updates.fornecedor !== undefined ? updates.fornecedor : base.fornecedor,
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFilterArray<T extends string>(
  value: unknown,
  predicate: (candidate: unknown) => candidate is T,
): value is T[] {
  return Array.isArray(value) && value.every(predicate)
}
