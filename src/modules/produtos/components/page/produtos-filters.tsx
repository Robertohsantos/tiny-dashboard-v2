/**

 * Products Filters Component

 * Unified filter component using the generic FilterSelect and consolidated context

 */

'use client'

import * as React from 'react'

import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/ui/multi-select'

import { useProductFilters } from '@/modules/produtos/contexts/filter-context'

import { FilterCounter } from '@/modules/produtos/components/shared/filter-counter'

import { ClearFiltersButton } from '@/modules/produtos/components/shared/clear-filters-button'

import {
  getDepositoOptions,
  getFornecedorOptions,
  getMarcaOptions,
  type DepositoId,
  type MarcaId,
  type FornecedorId,
} from '@/modules/produtos/constants/produtos.constants'

import { cn } from '@/modules/ui'

import { Skeleton } from '@/components/ui/skeleton'

import type { AvailableFilterOptions } from '@/modules/produtos/utils/produtos-filters.utils'

import { calculateOptionCounts } from '@/modules/produtos/utils/produtos-filters.utils'

import { normalizeMarca } from '@/modules/produtos/utils/produtos-transforms.utils'

import type { Produto } from '@/modules/produtos/types/produtos.types'

interface ProdutosFiltersProps {
  /** Whether filters are loading */

  isLoading?: boolean

  /** Optional dynamic brands from actual product data */

  availableMarcas?: string[]

  /** Additional class names */

  className?: string

  /** Whether to show filter count badges */

  showCounts?: boolean

  /** Whether to show filter icons */

  showIcons?: boolean

  /** Orientation for mobile responsiveness */

  orientation?: 'horizontal' | 'vertical'

  /** Available filter options based on active filters */

  availableOptions?: AvailableFilterOptions

  /** All products for calculating counts */

  allProducts?: Produto[]
}

/**

 * Unified products filter component with improved UX and performance

 * Memoized to prevent unnecessary re-renders

 */

export const ProdutosFilters = React.memo(function ProdutosFilters({
  isLoading = false,

  availableMarcas,

  className,

  showCounts = true,

  showIcons = true,

  orientation = 'horizontal',

  availableOptions,

  allProducts = [],
}: ProdutosFiltersProps) {
  const {
    filters,

    setDeposito,

    setMarca,

    setFornecedor,

    resetFilters,

    hasActiveFilters,

    activeFilterCount,
  } = useProductFilters()

  // Calculate product counts for each option

  const depositoCounts = React.useMemo(
    () => calculateOptionCounts(allProducts, filters, 'deposito'),

    [allProducts, filters],
  )

  const marcaCounts = React.useMemo(
    () => calculateOptionCounts(allProducts, filters, 'marca'),

    [allProducts, filters],
  )

  const fornecedorCounts = React.useMemo(
    () => calculateOptionCounts(allProducts, filters, 'fornecedor'),

    [allProducts, filters],
  )

  // Prepare filtered option lists based on current availability
  const availableDepositoValues = React.useMemo(() => {
    if (!availableOptions) {
      return undefined
    }

    return new Set(availableOptions.depositos)
  }, [availableOptions])

  const availableMarcaValues = React.useMemo(() => {
    if (!availableOptions) {
      return undefined
    }

    return new Set(
      Array.from(availableOptions.marcas).map((marca) => normalizeMarca(marca)),
    )
  }, [availableOptions])

  const availableFornecedorValues = React.useMemo(() => {
    if (!availableOptions) {
      return undefined
    }

    return new Set(availableOptions.fornecedores)
  }, [availableOptions])

  // Convert options to MultiSelectOption format with dynamic availability
  const depositoOptions: MultiSelectOption[] = React.useMemo(
    () =>
      getDepositoOptions()
        .filter((opt) => opt.value !== 'all')
        .filter((opt) => {
          if (!availableDepositoValues) {
            return true
          }

          return (
            availableDepositoValues.has(opt.value) ||
            filters.deposito.includes(opt.value)
          )
        })
        .map((opt) => ({
          value: opt.value,
          label: showCounts
            ? `${opt.label} (${depositoCounts.get(opt.value) ?? 0})`
            : opt.label,
          color: opt.color,
        })),
    [
      availableDepositoValues,
      depositoCounts,
      filters.deposito,
      showCounts,
    ],
  )

  const fornecedorOptions: MultiSelectOption[] = React.useMemo(
    () =>
      getFornecedorOptions()
        .filter((opt) => opt.value !== 'all')
        .filter((opt) => {
          if (!availableFornecedorValues) {
            return true
          }

          return (
            availableFornecedorValues.has(opt.value) ||
            filters.fornecedor.includes(opt.value)
          )
        })
        .map((opt) => ({
          value: opt.value,
          label: showCounts
            ? `${opt.label} (${fornecedorCounts.get(opt.value) ?? 0})`
            : opt.label,
          color: opt.color,
        })),
    [
      availableFornecedorValues,
      filters.fornecedor,
      fornecedorCounts,
      showCounts,
    ],
  )

  const marcaOptions: MultiSelectOption[] = React.useMemo(
    () =>
      getMarcaOptions(availableMarcas)
        .filter((opt) => opt.value !== 'all')
        .filter((opt) => {
          if (!availableMarcaValues) {
            return true
          }

          return (
            availableMarcaValues.has(opt.value) ||
            filters.marca.includes(opt.value)
          )
        })
        .map((opt) => ({
          value: opt.value,
          label: showCounts
            ? `${opt.label} (${marcaCounts.get(opt.value) ?? 0})`
            : opt.label,
        })),
    [
      availableMarcas,
      availableMarcaValues,
      filters.marca,
      marcaCounts,
      showCounts,
    ],
  )

  const mergeWithHiddenSelections = React.useCallback(
    (visibleValues: string[], hiddenValues: string[]) => {
      if (visibleValues.length === 0 || hiddenValues.length === 0) {
        return visibleValues
      }

      const merged = [...visibleValues]

      for (const value of hiddenValues) {
        if (!merged.includes(value)) {
          merged.push(value)
        }
      }

      return merged
    },
    [],
  )

  const hiddenDepositoSelections = React.useMemo(() => {
    const optionValueSet = new Set(depositoOptions.map((opt) => opt.value))

    return filters.deposito.filter((value) => !optionValueSet.has(value))
  }, [depositoOptions, filters.deposito])

  const hiddenMarcaSelections = React.useMemo(() => {
    const optionValueSet = new Set(marcaOptions.map((opt) => opt.value))

    return filters.marca.filter((value) => !optionValueSet.has(value))
  }, [filters.marca, marcaOptions])

  const hiddenFornecedorSelections = React.useMemo(() => {
    const optionValueSet = new Set(fornecedorOptions.map((opt) => opt.value))

    return filters.fornecedor.filter((value) => !optionValueSet.has(value))
  }, [filters.fornecedor, fornecedorOptions])

  const sanitizedDepositoValues = React.useMemo(() => {
    const validValues = depositoOptions.map((opt) => opt.value)
    return filters.deposito.filter((value) => validValues.includes(value))
  }, [filters.deposito, depositoOptions])

  const sanitizedFornecedorValues = React.useMemo(() => {
    const validValues = fornecedorOptions.map((opt) => opt.value)
    return filters.fornecedor.filter((value) => validValues.includes(value))
  }, [filters.fornecedor, fornecedorOptions])

  // Sanitize marca values to only include valid options
  const sanitizedMarcaValues = React.useMemo(() => {
    const validValues = marcaOptions.map((opt) => opt.value)
    return filters.marca.filter((value) => validValues.includes(value))
  }, [filters.marca, marcaOptions])

  // Loading skeleton

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center gap-4 flex-wrap',

          orientation === 'vertical' && 'flex-col items-stretch',

          className,
        )}
      >
        <Skeleton className="h-9 w-[180px]" />

        <Skeleton className="h-9 w-[180px]" />

        <Skeleton className="h-9 w-[180px]" />

        <Skeleton className="h-9 w-[100px]" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 flex-wrap',

        orientation === 'vertical' && 'flex-col items-stretch',

        className,
      )}
    >
      {/* Deposito Filter */}

      <MultiSelect
        value={sanitizedDepositoValues}
        onValueChange={(values) =>
          setDeposito(
            mergeWithHiddenSelections(
              values,
              hiddenDepositoSelections,
            ) as DepositoId[],
          )
        }
        options={depositoOptions}
        label="Depósito"
        placeholder="Todos os depósitos"
        searchable={false}
        showAvailableCount={true}
      />

      {/* Marca Filter */}

      <MultiSelect
        value={sanitizedMarcaValues}
        onValueChange={(values) =>
          setMarca(
            mergeWithHiddenSelections(values, hiddenMarcaSelections) as MarcaId[],
          )
        }
        options={marcaOptions}
        label="Marca"
        placeholder="Todas as marcas"
        searchable={true}
        maxDisplayItems={2}
        showAvailableCount={true}
      />

      {/* Fornecedor Filter */}

      <MultiSelect
        value={sanitizedFornecedorValues}
        onValueChange={(values) =>
          setFornecedor(
            mergeWithHiddenSelections(
              values,
              hiddenFornecedorSelections,
            ) as FornecedorId[],
          )
        }
        options={fornecedorOptions}
        label="Fornecedor"
        placeholder="Todos os fornecedores"
        searchable={false}
        showAvailableCount={true}
      />

      {/* Clear Filters Section */}

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          {showCounts && <FilterCounter count={activeFilterCount} />}

          <ClearFiltersButton
            onClear={resetFilters}
            visible={hasActiveFilters}
          />
        </div>
      )}
    </div>
  )
})

ProdutosFilters.displayName = 'ProdutosFilters'

/**

 * Compact version for mobile or limited space

 */

export function ProdutosFiltersCompact(props: ProdutosFiltersProps) {
  return (
    <ProdutosFilters
      {...props}
      orientation="vertical"
      showIcons={false}
      className={cn('space-y-2', props.className)}
    />
  )
}
