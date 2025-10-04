/**
 * Unified Products Filter Context
 * Manages all filter states for the products dashboard in a single context
 */

'use client'

import * as React from 'react'
import {
  getDepositoOptions,
  getFornecedorOptions,
  type DepositoId,
  type MarcaId,
  type FornecedorId,
} from '@/modules/produtos/constants/produtos.constants'
import {
  FilterType,
  DEFAULT_FILTER_CONFIG,
} from '@/modules/produtos/constants/produtos-filters.constants'
import {
  isFilterActive,
  countActiveFilters,
  normalizeMarca,
} from '@/modules/produtos/utils/produtos-transforms.utils'

/**
 * Filter state interface - now supports multiple selections
 */
export interface ProductFilters {
  deposito: DepositoId[]
  marca: MarcaId[]
  fornecedor: FornecedorId[]
}

/**
 * Filter actions for the reducer
 */
type FilterAction =
  | { type: 'SET_DEPOSITO'; payload: DepositoId[] }
  | { type: 'SET_MARCA'; payload: MarcaId[] }
  | { type: 'SET_FORNECEDOR'; payload: FornecedorId[] }
  | { type: 'TOGGLE_DEPOSITO'; payload: DepositoId }
  | { type: 'TOGGLE_MARCA'; payload: MarcaId }
  | { type: 'TOGGLE_FORNECEDOR'; payload: FornecedorId }
  | { type: 'SET_FILTERS'; payload: Partial<ProductFilters> }
  | { type: 'RESET_FILTERS'; payload?: ProductFilters }

/**
 * Estado padrão de filtros (nenhum filtro aplicado)
 */
const DEFAULT_FILTER_STATE = (): ProductFilters => ({
  deposito: [],
  marca: [],
  fornecedor: [],
})

/**
 * Filter reducer to manage state changes
 */
function filterReducer(
  state: ProductFilters,
  action: FilterAction,
): ProductFilters {
  switch (action.type) {
    case 'SET_DEPOSITO':
      return { ...state, deposito: action.payload }
    case 'SET_MARCA':
      return { ...state, marca: action.payload }
    case 'SET_FORNECEDOR':
      return { ...state, fornecedor: action.payload }
    case 'TOGGLE_DEPOSITO': {
      const current = state.deposito
      const value = action.payload
      if (current.includes(value)) {
        return { ...state, deposito: current.filter((v) => v !== value) }
      } else {
        return { ...state, deposito: [...current, value] }
      }
    }
    case 'TOGGLE_MARCA': {
      const current = state.marca
      const value = action.payload
      if (current.includes(value)) {
        return { ...state, marca: current.filter((v) => v !== value) }
      } else {
        return { ...state, marca: [...current, value] }
      }
    }
    case 'TOGGLE_FORNECEDOR': {
      const current = state.fornecedor
      const value = action.payload
      if (current.includes(value)) {
        return { ...state, fornecedor: current.filter((v) => v !== value) }
      } else {
        return { ...state, fornecedor: [...current, value] }
      }
    }
    case 'SET_FILTERS':
      return { ...state, ...action.payload }
    case 'RESET_FILTERS':
      if (action.payload) {
        return {
          deposito: [...action.payload.deposito],
          marca: [...action.payload.marca],
          fornecedor: [...action.payload.fornecedor],
        }
      }
      return DEFAULT_FILTER_STATE()
    default:
      return state
  }
}

/**
 * Context value interface
 */
interface ProductFiltersContextValue {
  /** Current filter values */
  filters: ProductFilters
  /** Set deposito filter (replace all) */
  setDeposito: (ids: DepositoId[]) => void
  /** Set marca filter (replace all) */
  setMarca: (ids: MarcaId[]) => void
  /** Set fornecedor filter (replace all) */
  setFornecedor: (ids: FornecedorId[]) => void
  /** Toggle single deposito item */
  toggleDeposito: (id: DepositoId) => void
  /** Toggle single marca item */
  toggleMarca: (id: MarcaId) => void
  /** Toggle single fornecedor item */
  toggleFornecedor: (id: FornecedorId) => void
  /** Set multiple filters at once */
  setFilters: (filters: Partial<ProductFilters>) => void
  /** Reset all filters to default */
  resetFilters: () => void
  /** Check if any filters are active */
  hasActiveFilters: boolean
  /** Get active filter count */
  activeFilterCount: number
  /** First filter applied (Excel style filtro pai) */
  primaryFilter: FilterType | null
  /** Ordered list of active filters based on activation sequence */
  activeFiltersOrder: FilterType[]
  /** Available marcas for filtering */
  availableMarcas: MarcaId[]
  /** Default filter values */
  defaultFilters: ProductFilters
}

/**
 * Create the context
 */
const ProductFiltersContext = React.createContext<
  ProductFiltersContextValue | undefined
>(undefined)

/**
 * Provider props interface
 */
interface ProductFiltersProviderProps {
  children: React.ReactNode
  /** Initial filter values */
  initialFilters?: Partial<ProductFilters>
  /** All available marcas (for filter logic) */
  availableMarcas?: MarcaId[]
  /** Callback when filters change */
  onFiltersChange?: (filters: ProductFilters) => void
  /** Debounce delay in ms (0 = no debounce) */
  debounceDelay?: number
}

/**
 * Provider component for product filters
 */
export function ProductFiltersProvider({
  children,
  initialFilters,
  availableMarcas = [],
  onFiltersChange,
  debounceDelay = 0,
}: ProductFiltersProviderProps) {
  const selectAllDepositos = React.useMemo<DepositoId[]>(() => {
    if (!DEFAULT_FILTER_CONFIG.SELECT_ALL_BY_DEFAULT) {
      return []
    }

    return getDepositoOptions()
      .map((option) => option.value)
      .filter((value): value is DepositoId => value !== 'all')
  }, [])

  const selectAllFornecedores = React.useMemo<FornecedorId[]>(() => {
    if (!DEFAULT_FILTER_CONFIG.SELECT_ALL_BY_DEFAULT) {
      return []
    }

    return getFornecedorOptions()
      .map((option) => option.value)
      .filter((value): value is FornecedorId => value !== 'all')
  }, [])

  const selectAllMarcas = React.useMemo<MarcaId[]>(() => {
    if (
      !DEFAULT_FILTER_CONFIG.SELECT_ALL_BY_DEFAULT ||
      availableMarcas.length === 0
    ) {
      return []
    }

    const uniqueMarcas = Array.from(new Set(availableMarcas))
    return uniqueMarcas.map((marca) => normalizeMarca(marca) as MarcaId)
  }, [availableMarcas])

  const initialState = React.useMemo<ProductFilters>(() => {
    const sanitizeDeposito = (values?: DepositoId[]) => {
      if (!values || values.length === 0) {
        return undefined
      }

      const uniqueValues = Array.from(
        new Set(values.filter((value) => value !== 'all')),
      ) as DepositoId[]

      if (uniqueValues.length === 0) {
        return undefined
      }

      if (selectAllDepositos.length === 0) {
        return uniqueValues
      }

      const allowed = new Set(selectAllDepositos)
      return uniqueValues.filter((value) => allowed.has(value))
    }

    const sanitizeFornecedor = (values?: FornecedorId[]) => {
      if (!values || values.length === 0) {
        return undefined
      }

      const uniqueValues = Array.from(
        new Set(values.filter((value) => value !== 'all')),
      ) as FornecedorId[]

      if (uniqueValues.length === 0) {
        return undefined
      }

      if (selectAllFornecedores.length === 0) {
        return uniqueValues
      }

      const allowed = new Set(selectAllFornecedores)
      return uniqueValues.filter((value) => allowed.has(value))
    }

    const sanitizeMarca = (values?: MarcaId[]) => {
      if (!values || values.length === 0) {
        return undefined
      }

      const normalizedValues = values
        .filter((value) => value !== 'all')
        .map((value) => normalizeMarca(value))

      const uniqueValues = Array.from(new Set(normalizedValues)) as MarcaId[]

      if (uniqueValues.length === 0) {
        return undefined
      }

      if (selectAllMarcas.length === 0) {
        return uniqueValues
      }

      const allowed = new Set(selectAllMarcas)
      return uniqueValues.filter((value) => allowed.has(value))
    }

    return {
      deposito:
        sanitizeDeposito(initialFilters?.deposito) ??
        (DEFAULT_FILTER_CONFIG.SELECT_ALL_BY_DEFAULT
          ? [...selectAllDepositos]
          : []),
      marca:
        sanitizeMarca(initialFilters?.marca) ??
        (DEFAULT_FILTER_CONFIG.SELECT_ALL_BY_DEFAULT
          ? [...selectAllMarcas]
          : []),
      fornecedor:
        sanitizeFornecedor(initialFilters?.fornecedor) ??
        (DEFAULT_FILTER_CONFIG.SELECT_ALL_BY_DEFAULT
          ? [...selectAllFornecedores]
          : []),
    }
  }, [
    initialFilters,
    selectAllDepositos,
    selectAllFornecedores,
    selectAllMarcas,
  ])

  const initialStateRef = React.useRef<ProductFilters>(initialState)
  React.useEffect(() => {
    initialStateRef.current = initialState
  }, [initialState])

  const [state, dispatch] = React.useReducer(filterReducer, initialState)

  const activationOrderRef = React.useRef<Record<FilterType, number>>({
    [FilterType.DEPOSITO]: 0,
    [FilterType.MARCA]: 0,
    [FilterType.FORNECEDOR]: 0,
  })
  const activationCounterRef = React.useRef(0)
  const [primaryFilter, setPrimaryFilter] = React.useState<FilterType | null>(null)
  const [activeFiltersOrder, setActiveFiltersOrder] = React.useState<FilterType[]>([])

  // Debounce timer ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Validate and clean marca selections when availableMarcas changes
  React.useEffect(() => {
    if (availableMarcas.length > 0 && state.marca.length > 0) {
      // Convert availableMarcas to slugs for comparison
      const validMarcaSlugs = availableMarcas.map((marca) =>
        normalizeMarca(marca),
      )

      // Filter out invalid marca selections
      const validMarcaSelections = state.marca.filter((marca) =>
        validMarcaSlugs.includes(marca),
      )

      // Update state if there are invalid selections
      if (validMarcaSelections.length !== state.marca.length) {
        dispatch({ type: 'SET_MARCA', payload: validMarcaSelections })
      }
    }
  }, [availableMarcas, state.marca])

  React.useEffect(() => {
    const currentOrder = activationOrderRef.current
    const activeStates: Array<{ type: FilterType; active: boolean }> = [
      {
        type: FilterType.DEPOSITO,
        active: isFilterActive(state.deposito, FilterType.DEPOSITO),
      },
      {
        type: FilterType.MARCA,
        active: isFilterActive(
          state.marca,
          FilterType.MARCA,
          availableMarcas.length,
        ),
      },
      {
        type: FilterType.FORNECEDOR,
        active: isFilterActive(state.fornecedor, FilterType.FORNECEDOR),
      },
    ]

    let updated = false

    for (const { type, active } of activeStates) {
      const current = currentOrder[type] ?? 0
      if (active) {
        if (current === 0) {
          activationCounterRef.current += 1
          currentOrder[type] = activationCounterRef.current
          updated = true
        }
      } else if (current !== 0) {
        currentOrder[type] = 0
        updated = true
      }
    }

    const sorted = Object.entries(currentOrder)
      .filter(([, order]) => typeof order === 'number' && Number(order) > 0)
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map(([key]) => key as FilterType)

    const orderChanged = (
      sorted.length !== activeFiltersOrder.length ||
      sorted.some((type, index) => activeFiltersOrder[index] !== type)
    )

    if (updated || orderChanged) {
      if (orderChanged) {
        setActiveFiltersOrder(sorted)
      }

      const nextPrimary = sorted[0] ?? null
      if (nextPrimary !== primaryFilter) {
        setPrimaryFilter(nextPrimary)
      } else if (!nextPrimary && primaryFilter) {
        setPrimaryFilter(null)
      }
    } else if (!sorted.length && primaryFilter) {
      setPrimaryFilter(null)
    }
  }, [
    state.deposito,
    state.marca,
    state.fornecedor,
    availableMarcas.length,
    activeFiltersOrder,
    primaryFilter,
  ])

  // Handle filter changes with optional debounce
  React.useEffect(() => {
    if (!onFiltersChange) return

    if (debounceDelay > 0) {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        onFiltersChange(state)
      }, debounceDelay)

      // Cleanup
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
          debounceTimerRef.current = null
        }
      }
    } else {
      // No debounce, call immediately
      onFiltersChange(state)
    }
  }, [state, onFiltersChange, debounceDelay])

  // Calculate derived state using centralized helpers
  const hasActiveFilters = React.useMemo(() => {
    // Check if any filter is actively filtering (not showing all)
    return (
      isFilterActive(state.deposito, FilterType.DEPOSITO) ||
      isFilterActive(state.marca, FilterType.MARCA, availableMarcas.length) ||
      isFilterActive(state.fornecedor, FilterType.FORNECEDOR)
    )
  }, [state, availableMarcas])

  const activeFilterCount = React.useMemo(() => {
    // Use centralized helper to count active filters
    return countActiveFilters(state, availableMarcas.length)
  }, [state, availableMarcas])

  // Create memoized action handlers
  const setDeposito = React.useCallback((ids: DepositoId[]) => {
    dispatch({ type: 'SET_DEPOSITO', payload: ids })
  }, [])

  const setMarca = React.useCallback((ids: MarcaId[]) => {
    dispatch({ type: 'SET_MARCA', payload: ids })
  }, [])

  const setFornecedor = React.useCallback((ids: FornecedorId[]) => {
    dispatch({ type: 'SET_FORNECEDOR', payload: ids })
  }, [])

  const toggleDeposito = React.useCallback((id: DepositoId) => {
    dispatch({ type: 'TOGGLE_DEPOSITO', payload: id })
  }, [])

  const toggleMarca = React.useCallback((id: MarcaId) => {
    dispatch({ type: 'TOGGLE_MARCA', payload: id })
  }, [])

  const toggleFornecedor = React.useCallback((id: FornecedorId) => {
    dispatch({ type: 'TOGGLE_FORNECEDOR', payload: id })
  }, [])

  const setFilters = React.useCallback((filters: Partial<ProductFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }, [])

  const resetFilters = React.useCallback(() => {
    activationOrderRef.current = {
      [FilterType.DEPOSITO]: 0,
      [FilterType.MARCA]: 0,
      [FilterType.FORNECEDOR]: 0,
    }
    activationCounterRef.current = 0
    setActiveFiltersOrder([])
    setPrimaryFilter(null)
    dispatch({ type: 'RESET_FILTERS', payload: initialStateRef.current })
  }, [])

  // Create context value
  const value = React.useMemo<ProductFiltersContextValue>(
    () => ({
      filters: state,
      setDeposito,
      setMarca,
      setFornecedor,
      toggleDeposito,
      toggleMarca,
      toggleFornecedor,
      setFilters,
      resetFilters,
      hasActiveFilters,
      activeFilterCount,
      primaryFilter,
      activeFiltersOrder,
      availableMarcas,
      defaultFilters: initialStateRef.current,
    }),
    [
      state,
      setDeposito,
      setMarca,
      setFornecedor,
      toggleDeposito,
      toggleMarca,
      toggleFornecedor,
      setFilters,
      resetFilters,
      hasActiveFilters,
      activeFilterCount,
      primaryFilter,
      activeFiltersOrder,
      availableMarcas,
      initialStateRef.current,
    ],
  )

  return (
    <ProductFiltersContext.Provider value={value}>
      {children}
    </ProductFiltersContext.Provider>
  )
}

/**
 * Hook to use product filters
 * @returns The filter context value
 * @throws Error if used outside of ProductFiltersProvider
 */
export function useProductFilters() {
  const context = React.useContext(ProductFiltersContext)

  if (context === undefined) {
    throw new Error(
      'useProductFilters must be used within a ProductFiltersProvider',
    )
  }

  return context
}

/**
 * Hook to get only the filter values (for simpler access)
 */
export function useFilterValues() {
  const { filters } = useProductFilters()
  return filters
}

/**
 * Hook to get filter actions only (for components that only need to set filters)
 */
export function useFilterActions() {
  const {
    setDeposito,
    setMarca,
    setFornecedor,
    toggleDeposito,
    toggleMarca,
    toggleFornecedor,
    setFilters,
    resetFilters,
  } = useProductFilters()
  return {
    setDeposito,
    setMarca,
    setFornecedor,
    toggleDeposito,
    toggleMarca,
    toggleFornecedor,
    setFilters,
    resetFilters,
  }
}
