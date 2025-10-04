/**
 * Purchase List View Component
 * Rendered inside the purchase requirement modal when results are available.
 */

'use client'

import * as React from 'react'
import { DialogDescription, DialogFooter, DialogMain, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowLeft,
  FileDown,
  FileText,
  Search,
  X,
  ShoppingBag,
  AlertTriangle,
  Loader2,
  Clock,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/modules/ui'
import {
  normalizeMarca,
  isFilterActive,
} from '@/modules/produtos/utils/produtos-transforms.utils'
import { calculateAvailableOptions } from '@/modules/produtos/utils/produtos-filters.utils'
import { FilterType } from '@/modules/produtos/constants/produtos-filters.constants'
import {
  getDepositoOptions,
  getFornecedorOptions,
} from '@/modules/produtos/constants/produtos.constants'
import type {
  PurchaseBatchResult,
  PurchaseRequirementResult,
  PurchaseRequirementConfig,
} from '@/modules/purchase-requirement/types'
import { useToast } from '@/modules/ui/hooks/use-toast'
import { AddProductModal } from './add-product-modal'
import type { Produto } from '@/modules/produtos/types/produtos.types'

interface PurchaseListViewProps {
  /** Calculation results to display */
  results: PurchaseBatchResult
  /** Callback when the user wants to close the flow */
  onClose: () => void
  /** Callback to go back to configuration */
  onBack?: () => void
  /** Trigger recalculation with updated configuration */
  onConfigChange?: (config: Partial<PurchaseRequirementConfig>) => void | Promise<void>
  /** Whether a recalculation is in progress */
  isLoading?: boolean
  /** Catalog products available for manual additions */
  catalogProducts?: Produto[]
  /** Filtros aplicados no modal principal */
  initialFilters?: PurchaseRequirementConfig['filters']
  /** Totais de opcoes registrados no modal principal */
  filterTotals?: PurchaseRequirementConfig['filterTotals']
  /** Filtro base definido no modal principal */
  primaryFilter?: PurchaseRequirementConfig['primaryFilter']
}

/**
 * Purchase list view rendered inside the purchase requirement modal.
 */
const areArraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, index) => value === sortedB[index])
}

const normalizePlainFilter = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const mapValuesToNormalizedSet = (
  values: string[] | undefined,
  normalizer: (value: string) => string,
) => {
  if (!Array.isArray(values) || values.length === 0) {
    return []
  }

  const set = new Set<string>()
  values.forEach((value) => {
    if (!value) return
    const normalized = normalizer(value)
    if (normalized) {
      set.add(normalized)
    }
  })
  return Array.from(set)
}

const buildLabelMap = (
  entries: Array<{ value?: string | null; label?: string | null }>,
  normalizer: (value: string) => string,
) => {
  const map = new Map<string, string>()

  const register = (value?: string | null, label?: string | null) => {
    const rawValue = value?.trim()
    const baseLabel = (label ?? value)?.trim()

    if (!rawValue && !baseLabel) {
      return
    }

    const finalLabel = baseLabel || rawValue || ''
    if (!finalLabel) {
      return
    }

    const keys = new Set<string>()
    if (rawValue) keys.add(rawValue)
    if (baseLabel) keys.add(baseLabel)
    const normalizedFromValue = rawValue ? normalizer(rawValue) : ''
    const normalizedFromLabel = baseLabel ? normalizer(baseLabel) : ''
    if (normalizedFromValue) keys.add(normalizedFromValue)
    if (normalizedFromLabel) keys.add(normalizedFromLabel)

    keys.forEach((key) => {
      if (!map.has(key)) {
        map.set(key, finalLabel)
      }
    })
  }

  entries.forEach(({ value: entryValue, label: entryLabel }) => {
    register(entryValue, entryLabel)
  })

  return map
}

const getDisplayLabel = (
  map: Map<string, string>,
  value: string,
  normalizer: (v: string) => string,
): string => {
  const direct = map.get(value)
  if (direct) {
    return direct
  }

  const normalized = normalizer(value)
  return map.get(normalized) ?? value
}

export function PurchaseListView({
  results,
  onClose,
  onBack,
  onConfigChange,
  isLoading = false,
  catalogProducts = [],
  initialFilters,
  filterTotals,
  primaryFilter: primaryFilterProp,
}: PurchaseListViewProps) {
  const { toast } = useToast()
  const portalContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(
    null,
  )
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedProducts, setSelectedProducts] = React.useState<Set<string>>(
    new Set(),
  )
  const [quantities, setQuantities] = React.useState<Record<string, number>>({})

  const originalTotalsRef = React.useRef({
    totalProducts:
      catalogProducts?.length ?? results.totalProducts ?? results.products.length,
    productsNeedingOrder: results.productsNeedingOrder ?? results.products.length,
  })
  const [manualProducts, setManualProducts] = React.useState<
    PurchaseRequirementResult[]
  >([])

  const combinedProducts = React.useMemo(
    () => [...results.products, ...manualProducts],
    [results.products, manualProducts],
  )

  const selectedCount = React.useMemo(() => selectedProducts.size, [selectedProducts])

  React.useEffect(() => {
    originalTotalsRef.current = {
      totalProducts:
        catalogProducts?.length ?? results.totalProducts ?? results.products.length,
      productsNeedingOrder:
        results.productsNeedingOrder ?? results.products.length,
    }
    setManualProducts([])
  }, [results.timestamp, catalogProducts?.length, results.totalProducts, results.productsNeedingOrder, results.products.length])

  const totalCatalogProducts = React.useMemo(() => {
    return catalogProducts?.length ?? originalTotalsRef.current.totalProducts
  }, [catalogProducts])

  const overallProductsNeedingOrder = React.useMemo(() => {
    if (totalCatalogProducts === 0) {
      return 0
    }
    return Math.min(selectedCount, totalCatalogProducts)
  }, [selectedCount, totalCatalogProducts])

  const availableManualProducts = React.useMemo(() => {
    if (!catalogProducts || catalogProducts.length === 0) {
      return []
    }

    const existingSkuSet = new Set(
      combinedProducts.map((product) => product.sku.trim().toUpperCase()),
    )

    return catalogProducts.filter((product) => {
      const normalizedSku = product.sku.trim().toUpperCase()
      return !existingSkuSet.has(normalizedSku)
    })
  }, [catalogProducts, combinedProducts])

  const remainingProductsCount = React.useMemo(
    () => availableManualProducts.length,
    [availableManualProducts],
  )

  const baseCoverageDays = results.config.coverageDays ?? 0
  const configBufferEnabled = results.config.includeDeliveryBuffer ?? false
  const configBufferDays = results.config.deliveryBufferDays ?? 0
  const effectiveCoverageDays =
    baseCoverageDays + (configBufferEnabled ? configBufferDays : 0)

  const coverageLabel = (configBufferEnabled && configBufferDays > 0)
    ? `${effectiveCoverageDays} dias (base ${baseCoverageDays} + entrega ${configBufferDays})`
    : `${baseCoverageDays} dias`

  const [bufferEnabled, setBufferEnabled] = React.useState(configBufferEnabled)
  const [bufferDaysInput, setBufferDaysInput] = React.useState(
    configBufferEnabled ? String(configBufferDays) : ''
  )
  const [bufferError, setBufferError] = React.useState<string | null>(null)


  const initialConfigFilters = React.useMemo(
    () => initialFilters ?? results.config.filters ?? {},
    [initialFilters, results.config.filters],
  )
  // Get unique filter options
  const filterableProducts = React.useMemo<
    Array<Pick<Produto, 'deposito' | 'marca' | 'fornecedor' | 'categoria'>>
  >(() => {
    const items: Array<Pick<Produto, 'deposito' | 'marca' | 'fornecedor' | 'categoria'>> = []

    combinedProducts.forEach((product) => {
      items.push({
        deposito: product.warehouse ?? '',
        marca: product.brand ?? '',
        fornecedor: product.supplier ?? '',
        categoria: product.category ?? '',
      })
    })

    if (catalogProducts.length > 0) {
      catalogProducts.forEach((product) => {
        items.push({
          deposito: product.deposito ?? '',
          marca: product.marca ?? '',
          fornecedor: product.fornecedor ?? '',
          categoria: product.categoria ?? '',
        })
      })
    }

    return items
  }, [catalogProducts, combinedProducts])


  const brandLabelMap = React.useMemo(
    () =>
      buildLabelMap(
        [
          ...filterableProducts.map((item) => ({ value: item.marca, label: item.marca })),
          ...(initialConfigFilters.marcas ?? []).map((value) => ({ value, label: value })),
        ],
        normalizeMarca,
      ),
    [filterableProducts, initialConfigFilters.marcas],
  )

  const supplierLabelMap = React.useMemo(
    () =>
      buildLabelMap(
        [
          ...getFornecedorOptions()
            .filter((opt) => opt.value !== 'all')
            .map((opt) => ({ value: opt.value, label: opt.label })),
          ...filterableProducts.map((item) => ({
            value: item.fornecedor,
            label: item.fornecedor,
          })),
          ...(initialConfigFilters.fornecedores ?? []).map((value) => ({
            value,
            label: value,
          })),
        ],
        normalizePlainFilter,
      ),
    [filterableProducts, initialConfigFilters.fornecedores],
  )

  const categoryLabelMap = React.useMemo(
    () =>
      buildLabelMap(
        [
          ...filterableProducts.map((item) => ({ value: item.categoria, label: item.categoria })),
          ...(initialConfigFilters.categorias ?? []).map((value) => ({ value, label: value })),
        ],
        normalizePlainFilter,
      ),
    [filterableProducts, initialConfigFilters.categorias],
  )

  const warehouseLabelMap = React.useMemo(
    () =>
      buildLabelMap(
        [
          ...getDepositoOptions()
            .filter((opt) => opt.value !== 'all')
            .map((opt) => ({ value: opt.value, label: opt.label })),
          ...filterableProducts.map((item) => ({ value: item.deposito, label: item.deposito })),
          ...(initialConfigFilters.depositos ?? []).map((value) => ({ value, label: value })),
        ],
        normalizePlainFilter,
      ),
    [filterableProducts, initialConfigFilters.depositos],
  )

  const allBrandSlugs = React.useMemo(() => {
    const set = new Set<string>()
    filterableProducts.forEach((item) => {
      const slug = normalizeMarca(item.marca)
      if (slug) {
        set.add(slug)
      }
    })
    return Array.from(set)
  }, [filterableProducts])

  const allSupplierSlugs = React.useMemo(() => {
    const set = new Set<string>()
    filterableProducts.forEach((item) => {
      const normalized = normalizePlainFilter(item.fornecedor ?? '')
      if (normalized) {
        set.add(normalized)
      }
    })
    return Array.from(set)
  }, [filterableProducts])

  const allCategorySlugs = React.useMemo(() => {
    const set = new Set<string>()
    filterableProducts.forEach((item) => {
      const normalized = normalizePlainFilter(item.categoria ?? '')
      if (normalized) {
        set.add(normalized)
      }
    })
    return Array.from(set)
  }, [filterableProducts])

  const allWarehouseSlugs = React.useMemo(() => {
    const set = new Set<string>()
    filterableProducts.forEach((item) => {
      const normalized = normalizePlainFilter(item.deposito ?? '')
      if (normalized) {
        set.add(normalized)
      }
    })
    return Array.from(set)
  }, [filterableProducts])

  const deriveInitialSelection = React.useCallback(
    (
      values: string[] | undefined,
      normalizer: (value: string) => string,
      fallback: string[],
    ) => {
      const normalized = mapValuesToNormalizedSet(values, normalizer)
      if (normalized.length > 0) {
        return normalized
      }
      return [...fallback]
    },
    [],
  )

  const initialBrandSelection = React.useMemo(
    () =>
      deriveInitialSelection(
        initialConfigFilters.marcas,
        normalizeMarca,
        allBrandSlugs,
      ),
    [
      initialConfigFilters.marcas,
      deriveInitialSelection,
      allBrandSlugs,
    ],
  )

  const initialSupplierSelection = React.useMemo(
    () =>
      deriveInitialSelection(
        initialConfigFilters.fornecedores,
        normalizePlainFilter,
        allSupplierSlugs,
      ),
    [
      initialConfigFilters.fornecedores,
      deriveInitialSelection,
      allSupplierSlugs,
    ],
  )

  const initialCategorySelection = React.useMemo(
    () =>
      deriveInitialSelection(
        initialConfigFilters.categorias,
        normalizePlainFilter,
        allCategorySlugs,
      ),
    [
      initialConfigFilters.categorias,
      deriveInitialSelection,
      allCategorySlugs,
    ],
  )

  const initialWarehouseSelection = React.useMemo(
    () =>
      deriveInitialSelection(
        initialConfigFilters.depositos,
        normalizePlainFilter,
        allWarehouseSlugs,
      ),
    [
      initialConfigFilters.depositos,
      deriveInitialSelection,
      allWarehouseSlugs,
    ],
  )

  const [brandFilter, setBrandFilter] = React.useState<string[]>(
    () => initialBrandSelection,
  )
  const [supplierFilter, setSupplierFilter] = React.useState<string[]>(
    () => initialSupplierSelection,
  )
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>(
    () => initialCategorySelection,
  )
  const [warehouseFilter, setWarehouseFilter] = React.useState<string[]>(
    () => initialWarehouseSelection,
  )
  const [criticalStockOnly, setCriticalStockOnly] = React.useState(false)
  const [addProductModalOpen, setAddProductModalOpen] = React.useState(false)

  const ignoreSelectChange = React.useCallback((_values: string[]) => {}, [])

  const categoryFilterLabels = React.useMemo(() => {
    if (categoryFilter.length === 0) {
      return []
    }
    const labels: string[] = []
    const seen = new Set<string>()
    categoryFilter.forEach((value) => {
      const label = getDisplayLabel(
        categoryLabelMap,
        value,
        normalizePlainFilter,
      )
      const finalLabel = label || value
      if (!seen.has(finalLabel)) {
        seen.add(finalLabel)
        labels.push(finalLabel)
      }
    })
    return labels
  }, [categoryFilter, categoryLabelMap])


  // Initialize quantities when results change
  React.useEffect(() => {
    const initialQuantities: Record<string, number> = {}
    results.products.forEach((product) => {
      initialQuantities[product.sku] = Math.ceil(product.suggestedQuantity)
    })
    setQuantities(initialQuantities)
    setSelectedProducts(new Set(results.products.map((product) => product.sku)))
  }, [results])

  React.useEffect(() => {
    const enabled = results.config.includeDeliveryBuffer ?? false
    const bufferDays = results.config.deliveryBufferDays ?? 0
    setBufferEnabled(enabled)
    setBufferDaysInput(enabled ? String(bufferDays) : '')
    setBufferError(null)
  }, [results.config.includeDeliveryBuffer, results.config.deliveryBufferDays])

  React.useLayoutEffect(() => {
    if (portalContainerRef.current) {
      setPortalContainer(portalContainerRef.current)
    }
  }, [])

  const brandUniverseCount = React.useMemo(() => {
    const set = new Set<string>()
    filterableProducts.forEach((item) => {
      const slug = normalizeMarca(item.marca)
      if (slug) {
        set.add(slug)
      }
    })
    return set.size
  }, [filterableProducts])

  const supplierUniverseCount = React.useMemo(() => {
    const set = new Set<string>()
    filterableProducts.forEach((item) => {
      const normalized = normalizePlainFilter(item.fornecedor ?? '')
      if (normalized) {
        set.add(normalized)
      }
    })
    return set.size
  }, [filterableProducts])

  const categoryUniverseCount = React.useMemo(() => {
    const set = new Set<string>()
    filterableProducts.forEach((item) => {
      const normalized = normalizePlainFilter(item.categoria ?? '')
      if (normalized) {
        set.add(normalized)
      }
    })
    return set.size
  }, [filterableProducts])

  const warehouseUniverseCount = React.useMemo(() => {
    const set = new Set<string>()
    filterableProducts.forEach((item) => {
      const normalized = normalizePlainFilter(item.deposito ?? '')
      if (normalized) {
        set.add(normalized)
      }
    })
    return set.size
  }, [filterableProducts])

  const effectiveFilterTotals = filterTotals ?? results.config.filterTotals

  const marcaTotal = effectiveFilterTotals?.marcas
    ?? Math.max(brandUniverseCount, initialConfigFilters.marcas?.length ?? 0)
  const fornecedorTotal = effectiveFilterTotals?.fornecedores
    ?? Math.max(supplierUniverseCount, initialConfigFilters.fornecedores?.length ?? 0)
  const categoriaTotal = effectiveFilterTotals?.categorias
    ?? Math.max(categoryUniverseCount, initialConfigFilters.categorias?.length ?? 0)
  const depositoTotal = effectiveFilterTotals?.depositos
    ?? Math.max(warehouseUniverseCount, initialConfigFilters.depositos?.length ?? 0)

  const marcaActive = React.useMemo(
    () => isFilterActive(brandFilter, FilterType.MARCA, marcaTotal),
    [brandFilter, marcaTotal],
  )

  const fornecedorActive = React.useMemo(
    () => isFilterActive(supplierFilter, FilterType.FORNECEDOR, fornecedorTotal),
    [supplierFilter, fornecedorTotal],
  )

  const depositoActive = React.useMemo(
    () => isFilterActive(warehouseFilter, FilterType.DEPOSITO, depositoTotal),
    [warehouseFilter, depositoTotal],
  )

  const categoriaActive = React.useMemo(() => {
    if (categoriaTotal === 0) return false
    if (categoryFilter.length === 0) return true
    return categoryFilter.length !== categoriaTotal
  }, [categoryFilter, categoriaTotal])

  const availableOptionSets = React.useMemo(() => {
    return calculateAvailableOptions(filterableProducts as Produto[], {
      deposito: warehouseFilter,
      marca: brandFilter,
      fornecedor: supplierFilter,
      categoria:
        categoriaActive
          ? categoryFilter.length === 0
            ? []
            : categoryFilterLabels
          : undefined,
    })
  }, [
    filterableProducts,
    brandFilter,
    warehouseFilter,
    supplierFilter,
    categoryFilter,
    categoryFilterLabels,
    categoriaActive,
  ])

  const warehouseOptions = React.useMemo(() => {
    const set = new Set<string>()
    availableOptionSets.depositos.forEach((value) => {
      if (value) {
        const slug = normalizePlainFilter(value)
        if (slug) set.add(slug)
      }
    })
    warehouseFilter.forEach((value) => {
      if (value) {
        const slug = normalizePlainFilter(value)
        if (slug) set.add(slug)
      }
    })

    return Array.from(set)
      .map((slug) => ({
        value: slug,
        label: getDisplayLabel(warehouseLabelMap, slug, normalizePlainFilter),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
      )
  }, [availableOptionSets.depositos, warehouseFilter, warehouseLabelMap])

  const supplierOptions = React.useMemo(() => {
    const set = new Set<string>()
    availableOptionSets.fornecedores.forEach((value) => {
      if (value) {
        const slug = normalizePlainFilter(value)
        if (slug) set.add(slug)
      }
    })
    supplierFilter.forEach((value) => {
      if (value) {
        const slug = normalizePlainFilter(value)
        if (slug) set.add(slug)
      }
    })

    return Array.from(set)
      .map((slug) => ({
        value: slug,
        label: getDisplayLabel(supplierLabelMap, slug, normalizePlainFilter),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
      )
  }, [availableOptionSets.fornecedores, supplierFilter, supplierLabelMap])

  const categoryOptions = React.useMemo(() => {
    const set = new Set<string>()
    availableOptionSets.categorias.forEach((value) => {
      if (value) {
        const slug = normalizePlainFilter(value)
        if (slug) set.add(slug)
      }
    })
    categoryFilter.forEach((value) => {
      if (value) {
        const slug = normalizePlainFilter(value)
        if (slug) set.add(slug)
      }
    })

    return Array.from(set)
      .map((slug) => ({
        value: slug,
        label: getDisplayLabel(categoryLabelMap, slug, normalizePlainFilter),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
      )
  }, [availableOptionSets.categorias, categoryFilter, categoryLabelMap])

  const brandOptions = React.useMemo(() => {
    const set = new Set<string>()
    availableOptionSets.marcas.forEach((label) => {
      const slug = normalizeMarca(label)
      if (slug) {
        set.add(slug)
      }
    })

    brandFilter.forEach((slug) => {
      if (slug) {
        set.add(slug)
      }
    })

    return Array.from(set)
      .map((slug) => ({
        value: slug,
        label: getDisplayLabel(brandLabelMap, slug, normalizeMarca),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
      )
  }, [availableOptionSets.marcas, brandFilter, brandLabelMap])

  const primaryFilter = React.useMemo(() => {
    const states: Array<{ type: 'marca' | 'fornecedor' | 'categoria' | 'deposito'; active: boolean }> = [
      { type: 'deposito', active: depositoActive },
      { type: 'marca', active: marcaActive },
      { type: 'fornecedor', active: fornecedorActive },
      { type: 'categoria', active: categoriaActive },
    ]

    const persisted = primaryFilterProp ?? results.config.primaryFilter
    if (persisted) {
      const persistedActive = states.find((state) => state.type === persisted)
      if (persistedActive?.active) {
        return persisted
      }
    }

    const firstActive = states.find((state) => state.active)
    return firstActive?.type ?? null
  }, [
    primaryFilterProp,
    results.config.primaryFilter,
    marcaActive,
    fornecedorActive,
    categoriaActive,
    depositoActive,
  ])

  const marcaIsPrimary = primaryFilter === 'marca'
  const fornecedorIsPrimary = primaryFilter === 'fornecedor'
  const categoriaIsPrimary = primaryFilter === 'categoria'
  const depositoIsPrimary = primaryFilter === 'deposito'

  React.useEffect(() => {
    const filters = results.config.filters ?? {}

    const nextBrands = deriveInitialSelection(
      filters.marcas,
      normalizeMarca,
      allBrandSlugs,
    )
    const nextSuppliers = deriveInitialSelection(
      filters.fornecedores,
      normalizePlainFilter,
      allSupplierSlugs,
    )
    const nextCategories = deriveInitialSelection(
      filters.categorias,
      normalizePlainFilter,
      allCategorySlugs,
    )
    const nextWarehouses = deriveInitialSelection(
      filters.depositos,
      normalizePlainFilter,
      allWarehouseSlugs,
    )

    setBrandFilter((prev) =>
      areArraysEqual(prev, nextBrands) ? prev : nextBrands,
    )
    setSupplierFilter((prev) =>
      areArraysEqual(prev, nextSuppliers) ? prev : nextSuppliers,
    )
    setCategoryFilter((prev) =>
      areArraysEqual(prev, nextCategories) ? prev : nextCategories,
    )
    setWarehouseFilter((prev) =>
      areArraysEqual(prev, nextWarehouses) ? prev : nextWarehouses,
    )
  }, [
    JSON.stringify(results.config.filters?.marcas ?? []),
    JSON.stringify(results.config.filters?.fornecedores ?? []),
    JSON.stringify(results.config.filters?.categorias ?? []),
    JSON.stringify(results.config.filters?.depositos ?? []),
    deriveInitialSelection,
    allBrandSlugs,
    allSupplierSlugs,
    allCategorySlugs,
    allWarehouseSlugs,
  ])

  // Sanitize selected filters when the available options change
  React.useEffect(() => {
    const brandSet = new Set(brandOptions.map((option) => option.value))
    setBrandFilter((prev) => {
      if (prev.length === 0) return prev
      const sanitized = prev.filter((value) => brandSet.has(value))
      return sanitized.length === prev.length ? prev : sanitized
    })

    const supplierSet = new Set(supplierOptions.map((option) => option.value))
    setSupplierFilter((prev) => {
      if (prev.length === 0) return prev
      const sanitized = prev.filter((value) => supplierSet.has(value))
      return sanitized.length === prev.length ? prev : sanitized
    })

    const categorySet = new Set(categoryOptions.map((option) => option.value))
    setCategoryFilter((prev) => {
      if (prev.length === 0) return prev
      const sanitized = prev.filter((value) => categorySet.has(value))
      return sanitized.length === prev.length ? prev : sanitized
    })

    const warehouseSet = new Set(warehouseOptions.map((option) => option.value))
    setWarehouseFilter((prev) => {
      if (prev.length === 0) return prev
      const sanitized = prev.filter((value) => warehouseSet.has(value))
      return sanitized.length === prev.length ? prev : sanitized
    })
  }, [brandOptions, supplierOptions, categoryOptions, warehouseOptions])

  const parseDeliveryBufferDays = React.useCallback((value: string): number | null => {
    if (!value.trim()) return 0
    const normalized = value.replace(',', '.')
    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) {
      return null
    }
    return parsed < 0 ? 0 : parsed
  }, [])

  // Debounce timer ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  // Input ref for focus control
  const bufferInputRef = React.useRef<HTMLInputElement>(null)

  const handleBufferToggle = (checked: boolean) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setBufferEnabled(checked)
    setBufferError(null)
    if (!checked) {
      setBufferDaysInput('')
      // Apply immediately when disabling
      applyBufferChanges(false, 0)
    } else {
      const nextInputValue = bufferDaysInput || (configBufferDays ? String(configBufferDays) : '0')
      setBufferDaysInput(nextInputValue)

      const parsed = parseDeliveryBufferDays(nextInputValue)
      if (parsed !== null) {
        applyBufferChanges(true, parsed)
      }
    }
  }

  const handleBufferDaysChange = (value: string) => {
    // Allow only numeric input
    const numericValue = value.replace(/[^0-9]/g, '')
    setBufferDaysInput(numericValue)
    setBufferError(null)
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Set new timer for auto-apply
    debounceTimerRef.current = setTimeout(() => {
      const parsed = parseDeliveryBufferDays(numericValue)
      if (parsed !== null) {
        applyBufferChanges(true, parsed)
      }
    }, 500)
  }

  const applyBufferChanges = async (enabled: boolean, days: number) => {
    if (!onConfigChange) return
    
    try {
      await Promise.resolve(
        onConfigChange({
          includeDeliveryBuffer: enabled,
          deliveryBufferDays: enabled ? days : 0,
        }),
      )
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível recalcular',
        description:
          error instanceof Error ? error.message : 'Tente novamente em instantes.',
      })
    }
  }

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])


  const brandFilterSet = React.useMemo(() => {
    const set = new Set<string>()
    brandFilter.forEach((value) => {
      if (value) {
        set.add(normalizeMarca(value))
      }
    })
    return set
  }, [brandFilter])

  const supplierFilterSet = React.useMemo(() => {
    const set = new Set<string>()
    supplierFilter.forEach((value) => {
      const normalized = normalizePlainFilter(value)
      if (normalized) {
        set.add(normalized)
      }
    })
    return set
  }, [supplierFilter])

  const categoryFilterSet = React.useMemo(() => {
    const set = new Set<string>()
    categoryFilter.forEach((value) => {
      const normalized = normalizePlainFilter(value)
      if (normalized) {
        set.add(normalized)
      }
    })
    return set
  }, [categoryFilter])

  const warehouseFilterSet = React.useMemo(() => {
    const set = new Set<string>()
    warehouseFilter.forEach((value) => {
      const normalized = normalizePlainFilter(value)
      if (normalized) {
        set.add(normalized)
      }
    })
    return set
  }, [warehouseFilter])

  // Filter products based on search term and filters
  const filteredProducts = React.useMemo(() => {
    return combinedProducts.filter((product) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.name.toLowerCase().includes(searchLower) ||
        product.supplier.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower)

      // Brand filter
      const productBrand = product.brand || ''
      const productSupplier = product.supplier || ''
      const productWarehouse = product.warehouse || ''
      const productCategory = product.category || ''

      const productBrandSlug = normalizeMarca(productBrand)
      const productSupplierSlug = normalizePlainFilter(productSupplier)
      const productWarehouseSlug = normalizePlainFilter(productWarehouse)
      const productCategorySlug = normalizePlainFilter(productCategory)

      const matchesBrand =
        !marcaActive || brandFilterSet.has(productBrandSlug)

      const matchesSupplier =
        !fornecedorActive || supplierFilterSet.has(productSupplierSlug)

      const matchesWarehouse =
        !depositoActive || warehouseFilterSet.has(productWarehouseSlug)

      const matchesCategory =
        !categoriaActive || categoryFilterSet.has(productCategorySlug)

      // Critical stock filter
      const matchesCritical =
        true

      return (
        matchesSearch &&
        matchesBrand &&
        matchesSupplier &&
        matchesWarehouse &&
        matchesCategory &&
        matchesCritical
      )
    })
  }, [
    combinedProducts,
    searchTerm,
    marcaActive,
    fornecedorActive,
    categoriaActive,
    depositoActive,
    brandFilterSet,
    supplierFilterSet,
    categoryFilterSet,
    warehouseFilterSet,
  ])

  // Calculate statistics using filtered dataset
  const statistics = React.useMemo(() => {
    const selectedFilteredProducts = filteredProducts.filter((product) =>
      selectedProducts.has(product.sku),
    )

    if (selectedFilteredProducts.length === 0) {
      return {
        totalProducts: 0,
        totalUnits: 0,
        totalValue: 0,
        totalSuppliers: 0,
        selectedValue: 0,
      }
    }

    const uniqueSuppliers = new Set<string>()
    let totalUnits = 0
    let totalValue = 0
    let selectedValue = 0

    for (const product of selectedFilteredProducts) {
      uniqueSuppliers.add(product.supplier)

      const suggested = Math.max(1, Math.ceil(product.suggestedQuantity || 0))
      const quantity = quantities[product.sku] ?? suggested
      totalUnits += quantity

      const unitCost = suggested > 0 && product.estimatedCost
        ? product.estimatedCost / suggested
        : 0
      const investment = unitCost * quantity
      totalValue += investment

      if (selectedProducts.has(product.sku)) {
        selectedValue += investment
      }
    }

    return {
      totalProducts: selectedFilteredProducts.length,
      totalUnits,
      totalValue,
      totalSuppliers: uniqueSuppliers.size,
      selectedValue,
    }
  }, [filteredProducts, quantities, selectedProducts])

  const formatTriggerLabel = (
    prefix: string,
    selectedValues: string[],
    totalOptions: number,
  ) => {
    if (totalOptions === 0) {
      return `${prefix} (0)`
    }
    const selectedCount = selectedValues.length

    if (selectedCount === 0) {
      return `${prefix} (0)`
    }

    if (selectedCount >= totalOptions) {
      return `${prefix} (${totalOptions})`
    }

    return `${prefix} (${selectedCount})`
  }

  const brandTriggerLabel = formatTriggerLabel(
    'Marcas',
    brandFilter,
    marcaTotal,
  )
  const supplierTriggerLabel = formatTriggerLabel(
    'Fornecedores',
    supplierFilter,
    fornecedorTotal,
  )
  const categoryTriggerLabel = formatTriggerLabel(
    'Categorias',
    categoryFilter,
    categoriaTotal,
  )
  const warehouseTriggerLabel = formatTriggerLabel(
    'Depósitos',
    warehouseFilter,
    depositoTotal,
  )

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setBrandFilter([...allBrandSlugs])
    setSupplierFilter([...allSupplierSlugs])
    setCategoryFilter([...allCategorySlugs])
    setWarehouseFilter([...allWarehouseSlugs])
    setCriticalStockOnly(false)
    setSearchTerm('')
  }

  /**
   * Handle product selection
   */
  const handleProductSelect = (sku: string, checked: boolean) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(sku)
      } else {
        newSet.delete(sku)
      }
      return newSet
    })
  }

  /**
   * Handle select all
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(
        new Set(combinedProducts.map((product) => product.sku)),
      )
    } else {
      setSelectedProducts(new Set())
    }
  }

  /**
   * Handle quantity change
   */
  const handleQuantityChange = (sku: string, value: string) => {
    const num = parseInt(value) || 0
    setQuantities((prev) => ({
      ...prev,
      [sku]: num,
    }))
  }

  /**
   * Export purchase list
   */
  const handleExport = (format: 'excel' | 'pdf' = 'excel') => {
    if (format === 'excel') {
      const csv = convertToCSV(results, combinedProducts)
      downloadFile(
        csv,
        `necessidade-compra-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv',
      )
      toast({
        title: 'Exportação concluída',
        description: 'Arquivo CSV gerado com sucesso',
      })
    } else {
      toast({
        title: 'Exportação PDF',
        description: 'Funcionalidade em desenvolvimento',
      })
    }
  }

  /**
   * Handle adding products manually
   */
  const handleAddProducts = React.useCallback(
    (newProducts: PurchaseRequirementResult[]) => {
      setManualProducts((prevManual) => {
        const existingManual = new Set(prevManual.map((product) => product.sku))
        const deduped = newProducts.filter(
          (product) => !existingManual.has(product.sku),
        )

        if (deduped.length === 0) {
          return prevManual
        }

        setQuantities((prev) => {
          const updated = { ...prev }
          deduped.forEach((product) => {
            updated[product.sku] = Math.ceil(product.suggestedQuantity)
          })
          return updated
        })

        setSelectedProducts((prev) => {
          const updated = new Set(prev)
          deduped.forEach((product) => {
            updated.add(product.sku)
          })
          return updated
        })

        return [...prevManual, ...deduped]
      })
    },
    [],
  )

  /**
   * Generate purchase order
   */
  const handleGenerateOrder = () => {
    const selectedCount = selectedProducts.size
    if (selectedCount === 0) {
      toast({
        title: 'Nenhum produto selecionado',
        description: 'Selecione pelo menos um produto para gerar a ordem',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Ordem de Compra',
      description: `${selectedCount} produtos selecionados para ordem de compra`,
    })
  }

  const allSelected =
    combinedProducts.length > 0 &&
    combinedProducts.every((p) => selectedProducts.has(p.sku))

  return (
    <div ref={portalContainerRef} className="flex h-full flex-col">
      <div className="px-6 py-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-lg font-semibold">
                Necessidade de Compra
              </DialogTitle>
              <DialogDescription id="purchase-list-description">
                {overallProductsNeedingOrder.toLocaleString('pt-BR')} de {totalCatalogProducts.toLocaleString('pt-BR')}
                {overallProductsNeedingOrder === 1 ? ' produto' : ' produtos'} com
                necessidade de compra para {results.config.coverageDays} dias de
                cobertura.
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              className="h-8"
            >
              <FileDown className="h-4 w-4 mr-1.5" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              className="h-8"
            >
              <FileText className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-3.5 border-b flex-shrink-0 bg-gray-50">
        <div className="flex flex-nowrap items-center gap-3">
          <div className="flex flex-nowrap items-center gap-3 flex-1">
            <MultiSelect
              value={brandFilter}
              onValueChange={ignoreSelectChange}
              commitMode="manual"
              onApply={(values) =>
                setBrandFilter(mapValuesToNormalizedSet(values, normalizeMarca))
              }
              options={brandOptions}
              label="Marcas"
              placeholder={brandTriggerLabel}
              showLabel={false}
              showAvailableCount
              searchable
              portalContainer={portalContainer}
              optionsMaxHeight={214}
              highlighted={marcaIsPrimary}
              size="sm"
              className="flex-shrink-0 !w-[175px] [&>button]:text-[13px] [&>button]:h-9"
            />

            <MultiSelect
              value={supplierFilter}
              onValueChange={ignoreSelectChange}
              commitMode="manual"
              onApply={(values) =>
                setSupplierFilter(
                  mapValuesToNormalizedSet(values, normalizePlainFilter),
                )
              }
              options={supplierOptions}
              label="Fornecedores"
              placeholder={supplierTriggerLabel}
              showLabel={false}
              showAvailableCount
              searchable
              portalContainer={portalContainer}
              optionsMaxHeight={214}
              highlighted={fornecedorIsPrimary}
              size="sm"
              className="flex-shrink-0 !w-[175px] [&>button]:text-[13px] [&>button]:h-9"
            />

            <MultiSelect
              value={categoryFilter}
              onValueChange={ignoreSelectChange}
              commitMode="manual"
              onApply={(values) =>
                setCategoryFilter(
                  mapValuesToNormalizedSet(values, normalizePlainFilter),
                )
              }
              options={categoryOptions}
              label="Categorias"
              placeholder={categoryTriggerLabel}
              showLabel={false}
              showAvailableCount
              searchable
              portalContainer={portalContainer}
              optionsMaxHeight={214}
              highlighted={categoriaIsPrimary}
              size="sm"
              className="flex-shrink-0 !w-[175px] [&>button]:text-[13px] [&>button]:h-9"
            />

            <MultiSelect
              value={warehouseFilter}
              onValueChange={ignoreSelectChange}
              commitMode="manual"
              onApply={(values) =>
                setWarehouseFilter(
                  mapValuesToNormalizedSet(values, normalizePlainFilter),
                )
              }
              options={warehouseOptions}
              label="Depósitos"
              placeholder={warehouseTriggerLabel}
              showLabel={false}
              showAvailableCount
              searchable
              portalContainer={portalContainer}
              optionsMaxHeight={214}
              highlighted={depositoIsPrimary}
              size="sm"
              className="flex-shrink-0 !w-[175px] [&>button]:text-[13px] [&>button]:h-9"
            />

            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 min-w-[145px] whitespace-nowrap flex-shrink-0 text-[13px]"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {bufferEnabled ? `+${bufferDaysInput || 0} dias entrega` : 'Prazo Entrega'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72"
                align="start"
                sideOffset={5}
                container={portalContainer ?? undefined}
                onOpenAutoFocus={(e) => {
                  e.preventDefault()
                  if (bufferEnabled) {
                    setTimeout(() => {
                      bufferInputRef.current?.focus()
                      bufferInputRef.current?.select()
                    }, 100)
                  }
                }}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('input')) {
                    e.preventDefault()
                  }
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Prazo de Entrega</label>
                    <Switch
                      checked={bufferEnabled}
                      onCheckedChange={(checked) => {
                        handleBufferToggle(checked)
                        if (checked) {
                          setTimeout(() => {
                            bufferInputRef.current?.focus()
                            bufferInputRef.current?.select()
                          }, 100)
                        }
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  {bufferEnabled && (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={bufferInputRef}
                          type="number"
                          value={bufferDaysInput}
                          onChange={(e) => handleBufferDaysChange(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-20 h-7 text-sm"
                          inputMode="numeric"
                          placeholder="0"
                          min={0}
                          max={90}
                          disabled={isLoading}
                        />
                        <span className="text-sm text-muted-foreground">dias extras</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cobertura total: {baseCoverageDays + (parseInt(bufferDaysInput) || 0)} dias
                        {isLoading && ' (atualizando...)'}
                      </p>
                    </>
                  )}
                  {bufferError && (
                    <p className="text-xs text-red-600">{bufferError}</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleClearFilters}
            className="h-9 whitespace-nowrap flex-shrink-0 px-5 text-[13px] font-medium"
          >
            Limpar filtros
          </Button>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="px-6 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Add Product Button */}
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setAddProductModalOpen(true)}
            disabled={remainingProductsCount === 0}
          >
            <Package className="h-4 w-4 mr-1.5" />
            {remainingProductsCount > 0
              ? `Add Produto (${remainingProductsCount})`
              : 'Todos adicionados'}
          </Button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por SKU, nome, marca ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="px-6 py-4 bg-white border-b flex-shrink-0">
          <div className="flex items-center justify-around">
              {/* Products */}
              <div className="text-center">
                <div className="flex items-center gap-2 text-muted-foreground justify-center">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm">Produtos</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {overallProductsNeedingOrder.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">
                  de {totalCatalogProducts.toLocaleString('pt-BR')} produtos no catálogo
                </div>
              </div>

              {/* Units */}
              <div className="text-center">
                <div className="flex items-center gap-2 text-muted-foreground justify-center">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Unidades</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {statistics.totalUnits.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">
                  total a comprar
                </div>
              </div>

              {/* Value */}
              <div className="text-center">
                <div className="flex items-center gap-2 text-muted-foreground justify-center">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Valor Estimado</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  R${' '}
                  {statistics.totalValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-green-600">
                  selecionados: R${' '}
                  {statistics.selectedValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              {/* Suppliers */}
              <div className="text-center">
                <div className="flex items-center gap-2 text-muted-foreground justify-center">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Fornecedores</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {statistics.totalSuppliers}
                </div>
                <div className="text-xs text-muted-foreground">diferentes</div>
              </div>
            </div>
        </div>
      )}

      {/* Products List */}
      <DialogMain className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-gray-50/30">
          <div className="space-y-3">
            {/* Product Rows */}
            {filteredProducts.map((product) => (
              <ProductRow
                key={product.sku}
                product={product}
                selected={selectedProducts.has(product.sku)}
                quantity={quantities[product.sku] || 0}
                onSelectChange={(checked) =>
                  handleProductSelect(product.sku, checked)
                }
                onQuantityChange={(value) =>
                  handleQuantityChange(product.sku, value)
                }
              />
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum produto encontrado
              </div>
            )}
        </div>
      </DialogMain>

      {/* Footer */}
      <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() =>
                  allSelected
                    ? setSelectedProducts(new Set())
                    : setSelectedProducts(
                        new Set(combinedProducts.map((product) => product.sku)),
                      )
                }
                disabled={combinedProducts.length === 0}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-2" />
                {allSelected ? 'Desmarcar Todas' : 'Marcar Todas'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedProducts.size} produtos selecionados
              </span>
            </div>
            <div className="flex gap-2">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  Voltar
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateOrder}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={selectedProducts.size === 0}
              >
                Gerar Ordem de Compra ({selectedProducts.size})
              </Button>
            </div>
        </div>
      </DialogFooter>
      
      {/* Add Product Modal */}
      <AddProductModal
        open={addProductModalOpen}
        onOpenChange={setAddProductModalOpen}
        existingProducts={combinedProducts}
        onAddProducts={handleAddProducts}
        availableProducts={availableManualProducts}
      />
    </div>
  )
}


/**
 * Product row component - Redesigned with vertical layout
 */
function ProductRow({
  product,
  selected,
  quantity,
  onSelectChange,
  onQuantityChange,
}: {
  product: PurchaseRequirementResult
  selected: boolean
  quantity: number
  onSelectChange: (checked: boolean) => void
  onQuantityChange: (value: string) => void
}) {
  const inStock = product.currentStock > 0
  const coverage = product.currentCoverageDays.toFixed(0)
  const dailySales = product.dailyDemand.toFixed(1)
  const orderQuantity = product.openOrderQuantity || 0

  return (
    <div
      className={cn(
        'px-5 py-4 rounded-lg border transition-all duration-200',
        'bg-indigo-50/20 hover:bg-indigo-50/30',
        selected && 'bg-indigo-100/30 border-indigo-300 shadow-sm',
      )}
    >
      {/* Line 1: Checkbox + Product Info */}
      <div className="flex items-center gap-3 mb-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelectChange}
          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-4 w-4 text-gray-500" />
            <div>
              <span className="font-medium text-gray-900">{product.name}</span>
              <span className="text-gray-500 mx-2">|</span>
              <span className="text-sm text-gray-600">SKU: {product.sku}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-medium">
            {product.supplier}
          </Badge>
        </div>
      </div>

      {/* Line 2: Stock Metrics */}
      <div className="flex items-center gap-8 text-sm mb-2 pl-7">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Estoque Atual:</span>
          <span
            className={cn(
              'font-semibold',
              inStock ? 'text-gray-900' : 'text-red-600',
            )}
          >
            {product.currentStock}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">Cobertura:</span>
          <span
            className={cn(
              'font-semibold',
              parseInt(coverage) < 7
                ? 'text-red-600'
                : parseInt(coverage) < 14
                  ? 'text-orange-600'
                  : 'text-gray-900',
            )}
          >
            {coverage} dias
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">Em Ordens:</span>
          <span className="font-semibold text-gray-900">{orderQuantity}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">Venda/dia:</span>
          <span className="font-semibold text-gray-900">{dailySales}</span>
        </div>
      </div>

      {/* Line 3: Spacer */}
      <div className="h-3"></div>

      {/* Line 4: Purchase Requirements */}
      <div className="flex items-center justify-between pl-7">
        <div className="flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Necessidade Bruta:</span>
            <span className="font-bold text-gray-900 text-base">
              {Math.ceil(product.grossRequirement ?? product.requiredQuantity ?? 0)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Necessidade Líquida:</span>
            <span className="font-bold text-gray-900 text-base">
              {Math.ceil(product.netRequirement ?? product.suggestedQuantity ?? 0)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">
              Sugestão: {Math.ceil(product.netRequirement ?? product.suggestedQuantity ?? 0)} un
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">Comprar:</span>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              className="w-20 h-8 text-center font-semibold"
              min="0"
            />
            <span className="text-gray-500">un</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 mb-0.5">Valor estimado</div>
          <div className="text-lg font-bold text-green-600">
            R${' '}
            {(
              (product.estimatedCost || 0) *
              (quantity / Math.ceil(product.suggestedQuantity))
            ).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Convert results to CSV
 */
function convertToCSV(
  results: PurchaseBatchResult,
  products: PurchaseRequirementResult[],
): string {
  const headers = [
    'SKU',
    'Nome',
    'Marca',
    'Fornecedor',
    'Depósito',
    'Estoque Atual',
    'Cobertura Atual (dias)',
    'Quantidade Sugerida',
    'Custo Estimado',
    'Risco',
    'Alertas',
  ]

  const rows = products.map((p) => [
    p.sku,
    p.name,
    p.brand,
    p.supplier,
    p.warehouse,
    p.currentStock.toString(),
    p.currentCoverageDays.toFixed(1),
    Math.ceil(p.suggestedQuantity).toString(),
    (p.estimatedCost || 0).toFixed(2),
    p.stockoutRisk,
    p.alerts.map((a) => a.message).join('; '),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Download file utility
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
