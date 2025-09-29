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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/modules/ui'
import type {
  PurchaseBatchResult,
  PurchaseRequirementResult,
  PurchaseRequirementConfig,
} from '@/modules/purchase-requirement/types'
import { useToast } from '@/modules/ui/hooks/use-toast'
import { AddProductModal } from './add-product-modal'

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
  /** Organization ID for data fetching */
  organizationId?: string
}

/**
 * Purchase list view rendered inside the purchase requirement modal.
 */
export function PurchaseListView({
  results,
  onClose,
  onBack,
  onConfigChange,
  isLoading = false,
  organizationId,
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

  // Filter states
  const [brandFilter, setBrandFilter] = React.useState<string>('all')
  const [supplierFilter, setSupplierFilter] = React.useState<string>('all')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = React.useState<string>('all')
  const [criticalStockOnly, setCriticalStockOnly] = React.useState(false)
  const [addProductModalOpen, setAddProductModalOpen] = React.useState(false)

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

  // Get unique filter options
  const filterOptions = React.useMemo(() => {
    const brands = [...new Set(results.products.map((p) => p.brand))].filter(
      Boolean,
    )
    const suppliers = [
      ...new Set(results.products.map((p) => p.supplier)),
    ].filter(Boolean)
    const warehouses = [
      ...new Set(results.products.map((p) => p.warehouse)),
    ].filter(Boolean)
    const categories = [
      ...new Set(results.products.map((p) => p.category).filter(Boolean)),
    ]

    return { brands, suppliers, warehouses, categories }
  }, [results.products])

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


  // Filter products based on search term and filters
  const filteredProducts = React.useMemo(() => {
    return results.products.filter((product) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.name.toLowerCase().includes(searchLower) ||
        product.supplier.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower)

      // Brand filter
      const matchesBrand =
        brandFilter === 'all' || product.brand === brandFilter

      // Supplier filter
      const matchesSupplier =
        supplierFilter === 'all' || product.supplier === supplierFilter

      const matchesWarehouse =
        warehouseFilter === 'all' || product.warehouse === warehouseFilter

      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter

      // Critical stock filter
      const matchesCritical =
        !criticalStockOnly || product.currentCoverageDays < 7

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
    results.products,
    searchTerm,
    brandFilter,
    supplierFilter,
    categoryFilter,
    warehouseFilter,
    criticalStockOnly,
  ])

  // Calculate statistics using filtered dataset
  const statistics = React.useMemo(() => {
    if (filteredProducts.length === 0) {
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

    for (const product of filteredProducts) {
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
      totalProducts: filteredProducts.length,
      totalUnits,
      totalValue,
      totalSuppliers: uniqueSuppliers.size,
      selectedValue,
    }
  }, [filteredProducts, quantities, selectedProducts])

  const brandSelectedCount = brandFilter === 'all' ? filterOptions.brands.length : (brandFilter ? 1 : 0)
  const supplierSelectedCount = supplierFilter === 'all' ? filterOptions.suppliers.length : (supplierFilter ? 1 : 0)
  const categorySelectedCount = categoryFilter === 'all' ? filterOptions.categories.length : (categoryFilter ? 1 : 0)
  const warehouseSelectedCount = warehouseFilter === 'all' ? filterOptions.warehouses.length : (warehouseFilter ? 1 : 0)

  const brandTriggerLabel =
    brandFilter === 'all' || !brandFilter
      ? 'Marcas (' + brandSelectedCount + ')'
      : brandFilter + ' (' + brandSelectedCount + ')'

  const supplierTriggerLabel =
    supplierFilter === 'all' || !supplierFilter
      ? 'Fornecedores (' + supplierSelectedCount + ')'
      : supplierFilter + ' (' + supplierSelectedCount + ')'

  const categoryTriggerLabel =
    categoryFilter === 'all' || !categoryFilter
      ? 'Categorias (' + categorySelectedCount + ')'
      : categoryFilter + ' (' + categorySelectedCount + ')'

  const warehouseTriggerLabel =
    warehouseFilter === 'all' || !warehouseFilter
      ? 'Depósitos (' + warehouseSelectedCount + ')'
      : warehouseFilter + ' (' + warehouseSelectedCount + ')'

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setBrandFilter('all')
    setSupplierFilter('all')
    setCategoryFilter('all')
    setWarehouseFilter('all')
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
      setSelectedProducts(new Set(filteredProducts.map((p) => p.sku)))
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
      const csv = convertToCSV(results)
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
      // Add new products to the results
      const updatedProducts = [...results.products, ...newProducts]
      
      // Update results with new products
      results.products = updatedProducts
      results.productsNeedingOrder = updatedProducts.length
      results.totalProducts = updatedProducts.length
      
      // Recalculate total investment
      results.totalInvestment = updatedProducts.reduce(
        (sum, product) => sum + (product.estimatedCost || 0),
        0
      )
      
      // Initialize quantities and selection for new products
      const newQuantities: Record<string, number> = { ...quantities }
      const newSelection = new Set(selectedProducts)
      
      newProducts.forEach((product) => {
        newQuantities[product.sku] = Math.ceil(product.suggestedQuantity)
        newSelection.add(product.sku)
      })
      
      setQuantities(newQuantities)
      setSelectedProducts(newSelection)
    },
    [results, quantities, selectedProducts]
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
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProducts.has(p.sku))

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
                {statistics.totalProducts} de {results.productsNeedingOrder}
                {results.productsNeedingOrder === 1 ? ' produto' : ' produtos'} com
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

      <div className="px-6 py-3 border-b flex-shrink-0 bg-gray-50">
        <div className="flex items-center gap-3">
            {/* Brand Filter */}
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[140px] h-8">
              {brandTriggerLabel}
            </SelectTrigger>
            <SelectContent container={portalContainer}>
              <SelectItem value="all">
                Marcas ({filterOptions.brands.length})
              </SelectItem>
              {filterOptions.brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

            {/* Supplier Filter */}
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[160px] h-8">
              {supplierTriggerLabel}
            </SelectTrigger>
            <SelectContent container={portalContainer}>
              <SelectItem value="all">
                Fornecedores ({filterOptions.suppliers.length})
              </SelectItem>
                {filterOptions.suppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter - placeholder for now */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[155px] h-8">
              {categoryTriggerLabel}
            </SelectTrigger>
            <SelectContent container={portalContainer}>
              <SelectItem value="all">
                Categorias ({filterOptions.categories.length})
              </SelectItem>
              {filterOptions.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Warehouse Filter */}
          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-[145px] h-8">
              {warehouseTriggerLabel}
            </SelectTrigger>
            <SelectContent container={portalContainer}>
              <SelectItem value="all">
                Depósitos ({filterOptions.warehouses.length})
              </SelectItem>
                {filterOptions.warehouses.map((warehouse) => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Delivery Protection Popover */}
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 min-w-[140px]"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
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

            {/* Critical Stock Button */}
            <Button
              size="sm"
              variant={criticalStockOnly ? 'destructive' : 'outline'}
              onClick={() => setCriticalStockOnly(!criticalStockOnly)}
              className="h-8"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              Estoque Crítico
            </Button>

            {/* Clear Filters Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="h-8"
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
            >
              <Package className="h-4 w-4 mr-1.5" />
              Add Produto
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
                  {statistics.totalProducts}
                </div>
                <div className="text-xs text-muted-foreground">
                  de {results.totalProducts}
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
                onClick={() => setSelectedProducts(new Set())}
                disabled={selectedProducts.size === 0}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-2" />
                Desmarcar Todas
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
          existingProducts={results.products}
          onAddProducts={handleAddProducts}
          organizationId={organizationId}
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
function convertToCSV(results: PurchaseBatchResult): string {
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

  const rows = results.products.map((p) => [
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



