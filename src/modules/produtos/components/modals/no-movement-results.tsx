/**
 * No Movement Results
 * Display results of no movement analysis
 */

'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package,
  TrendingDown,
  DollarSign,
  Clock,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react'
import type { NoMovementResult, ProductMovement } from '@/modules/no-movement/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProductDetailsSheet } from './product-details-sheet'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import { MultiSelect } from '@/components/ui/multi-select'
import { normalizeMarca } from '@/modules/produtos/utils/produtos-transforms.utils'
import { calculateAvailableOptions } from '@/modules/produtos/utils/produtos-filters.utils'

interface NoMovementResultsProps {
  /** Analysis results */
  results: NoMovementResult
  /** Export handler */
  onExport: (format: 'csv' | 'excel') => void
  /** Export loading state */
  isExporting?: boolean
  /** Products available for filtering */
  products: Produto[]
  /** Render prop for filters to be displayed in modal header */
  onFiltersReady?: (filters: React.ReactNode) => void
}

/**
 * Display analysis results in a table with summary cards
 */
export function NoMovementResults({
  results,
  onExport,
  isExporting = false,
  products,
  onFiltersReady,
}: NoMovementResultsProps) {
  // State for product details sheet
  const [selectedProduct, setSelectedProduct] = React.useState<ProductMovement | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const arraysEqual = React.useCallback((a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    return a.every((value, index) => value === b[index])
  }, [])

  // Normalized catalog data
  const marcaMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const produto of products) {
      const slug = normalizeMarca(produto.marca)
      if (!map.has(slug)) {
        map.set(slug, produto.marca)
      }
    }
    return map
  }, [products])

  const allDepositoValues = React.useMemo(() => {
    return Array.from(
      new Set(products.map((produto) => produto.deposito).filter(Boolean))
    )
  }, [products])

  const allFornecedorValues = React.useMemo(() => {
    return Array.from(
      new Set(products.map((produto) => produto.fornecedor).filter(Boolean))
    )
  }, [products])

  const allMarcaSlugs = React.useMemo(() => {
    return Array.from(marcaMap.keys())
  }, [marcaMap])

  const sanitizeInitialSelection = React.useCallback(
    (
      values: string[] | undefined,
      available: string[],
      normalize?: (value: string) => string
    ): string[] => {
      if (!available.length) {
        return []
      }

      if (values === undefined) {
        return available
      }

      const mapper = normalize ?? ((value: string) => value)
      const availableSet = new Set(available)
      return values
        .map((value) => mapper(value))
        .filter((value) => availableSet.has(value))
    },
    []
  )

  const defaultDepositos = React.useMemo(() => {
    return sanitizeInitialSelection(
      results.config?.filters?.depositos,
      allDepositoValues
    )
  }, [results.config?.filters?.depositos, allDepositoValues, sanitizeInitialSelection])

  const defaultFornecedores = React.useMemo(() => {
    return sanitizeInitialSelection(
      results.config?.filters?.fornecedores,
      allFornecedorValues
    )
  }, [results.config?.filters?.fornecedores, allFornecedorValues, sanitizeInitialSelection])

  const defaultMarcas = React.useMemo(() => {
    return sanitizeInitialSelection(
      results.config?.filters?.marcas,
      allMarcaSlugs,
      (value) => normalizeMarca(value)
    )
  }, [results.config?.filters?.marcas, allMarcaSlugs, sanitizeInitialSelection])

  const [selectedDepositos, setSelectedDepositos] = React.useState<string[]>(defaultDepositos)
  const [selectedMarcas, setSelectedMarcas] = React.useState<string[]>(defaultMarcas)
  const [selectedFornecedores, setSelectedFornecedores] = React.useState<string[]>(defaultFornecedores)

  React.useEffect(() => {
    setSelectedDepositos((current) =>
      arraysEqual(current, defaultDepositos) ? current : defaultDepositos
    )
  }, [defaultDepositos, arraysEqual])

  React.useEffect(() => {
    setSelectedMarcas((current) =>
      arraysEqual(current, defaultMarcas) ? current : defaultMarcas
    )
  }, [defaultMarcas, arraysEqual])

  React.useEffect(() => {
    setSelectedFornecedores((current) =>
      arraysEqual(current, defaultFornecedores) ? current : defaultFornecedores
    )
  }, [defaultFornecedores, arraysEqual])

  // Calculate interdependent availability based on active selections
  const availableOptionSets = React.useMemo(() => {
    return calculateAvailableOptions(products, {
      deposito: selectedDepositos,
      marca: selectedMarcas,
      fornecedor: selectedFornecedores,
    })
  }, [products, selectedDepositos, selectedMarcas, selectedFornecedores])

  // Options for filters
  const depositoOptionValues = React.useMemo(() => {
    const source =
      availableOptionSets.depositos.size > 0
        ? Array.from(availableOptionSets.depositos)
        : allDepositoValues
    return source.filter(Boolean)
  }, [availableOptionSets.depositos, allDepositoValues])

  const fornecedorOptionValues = React.useMemo(() => {
    const source =
      availableOptionSets.fornecedores.size > 0
        ? Array.from(availableOptionSets.fornecedores)
        : allFornecedorValues
    return source.filter(Boolean)
  }, [availableOptionSets.fornecedores, allFornecedorValues])

  const marcaOptions = React.useMemo(() => {
    const base =
      availableOptionSets.marcas.size > 0
        ? Array.from(availableOptionSets.marcas)
        : Array.from(marcaMap.values())

    const unique = new Map<string, string>()
    for (const label of base) {
      const slug = normalizeMarca(label)
      if (!unique.has(slug)) {
        unique.set(slug, label)
      }
    }

    return Array.from(unique.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [availableOptionSets.marcas, marcaMap])

  const depositoOptions = React.useMemo(() => {
    return depositoOptionValues.map((value) => ({ value, label: value }))
  }, [depositoOptionValues])

  const fornecedorOptions = React.useMemo(() => {
    return fornecedorOptionValues.map((value) => ({ value, label: value }))
  }, [fornecedorOptionValues])

  const marcaOptionValues = React.useMemo(
    () => marcaOptions.map((option) => option.value),
    [marcaOptions]
  )

  React.useEffect(() => {
    setSelectedDepositos((current) => {
      if (current.length === 0) return current
      const optionSet = new Set(depositoOptionValues)
      const filtered = current.filter((value) => optionSet.has(value))
      return filtered.length === current.length ? current : filtered
    })
  }, [depositoOptionValues])

  React.useEffect(() => {
    setSelectedFornecedores((current) => {
      if (current.length === 0) return current
      const optionSet = new Set(fornecedorOptionValues)
      const filtered = current.filter((value) => optionSet.has(value))
      return filtered.length === current.length ? current : filtered
    })
  }, [fornecedorOptionValues])

  React.useEffect(() => {
    setSelectedMarcas((current) => {
      if (current.length === 0) return current
      const optionSet = new Set(marcaOptionValues)
      const filtered = current.filter((value) => optionSet.has(value))
      return filtered.length === current.length ? current : filtered
    })
  }, [marcaOptionValues])

  // Filter products based on selected filters
  const filteredProducts = React.useMemo(() => {
    return results.products.filter((product) => {
      const matchesDeposito =
        selectedDepositos.length === 0
          ? false
          : selectedDepositos.includes(product.warehouse)

      if (!matchesDeposito) {
        return false
      }

      const productBrandSlug = normalizeMarca(product.brand)
      const matchesMarca =
        selectedMarcas.length === 0
          ? false
          : selectedMarcas.includes(productBrandSlug)

      if (!matchesMarca) {
        return false
      }

      const matchesFornecedor =
        selectedFornecedores.length === 0
          ? false
          : selectedFornecedores.includes(product.supplier)

      if (!matchesFornecedor) {
        return false
      }

      return true
    })
  }, [results.products, selectedDepositos, selectedMarcas, selectedFornecedores])

  // Recalculate summary metrics based on filtered products
  const filteredSummary = React.useMemo(() => {
    const totalProducts = filteredProducts.length
    const productsWithoutMovement = filteredProducts.filter(
      p => p.movementStatus === 'no_movement'
    ).length
    const productsWithLowMovement = filteredProducts.filter(
      p => p.movementStatus === 'low_movement'
    ).length
    const totalCapitalImmobilized = filteredProducts.reduce(
      (sum, p) => sum + p.capitalImmobilized,
      0
    )
    const totalOpportunityCost = filteredProducts.reduce(
      (sum, p) => sum + p.opportunityCost,
      0
    )
    const averageDaysWithoutMovement = totalProducts > 0
      ? filteredProducts.reduce((sum, p) => sum + p.daysWithoutMovement, 0) / totalProducts
      : 0

    return {
      totalProducts,
      productsWithoutMovement,
      productsWithLowMovement,
      totalCapitalImmobilized,
      totalOpportunityCost,
      averageDaysWithoutMovement,
    }
  }, [filteredProducts])

  // Create filters component and pass to parent
  React.useEffect(() => {
    if (onFiltersReady) {
      const filtersComponent = (
        <div className="flex flex-col items-end gap-2 mr-8">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Filter className="h-3 w-3" />
            <span>Filtros de Análise</span>
          </div>
          
          <div className="flex gap-2">
            <MultiSelect
              options={depositoOptions}
              value={selectedDepositos}
              onValueChange={setSelectedDepositos}
              label="Depósitos"
              showLabel={false}
              placeholder="Depósitos"
              showAvailableCount
              size="sm"
              className="w-[170px]"
            />

            <MultiSelect
              options={marcaOptions}
              value={selectedMarcas}
              onValueChange={setSelectedMarcas}
              label="Marcas"
              showLabel={false}
              placeholder="Marcas"
              showAvailableCount
              size="sm"
              className="w-[170px]"
            />

            <MultiSelect
              options={fornecedorOptions}
              value={selectedFornecedores}
              onValueChange={setSelectedFornecedores}
              label="Fornecedores"
              showLabel={false}
              placeholder="Fornecedores"
              showAvailableCount
              size="sm"
              className="w-[170px]"
            />
          </div>
        </div>
      )
      onFiltersReady(filtersComponent)
    }
  }, [
    onFiltersReady,
    depositoOptions,
    selectedDepositos,
    setSelectedDepositos,
    marcaOptions,
    selectedMarcas,
    setSelectedMarcas,
    fornecedorOptions,
    selectedFornecedores,
    setSelectedFornecedores,
  ])

  // Handle product details
  const handleViewDetails = (product: ProductMovement) => {
    setSelectedProduct(product)
    setDetailsOpen(true)
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca'
    return new Date(date).toLocaleDateString('pt-BR')
  }


  const isGroupedView = Boolean(
    results.config?.options?.groupByWarehouse &&
      results.groupedByWarehouse &&
      Object.keys(results.groupedByWarehouse).length > 0
  )

  // Group filtered products if needed
  const groupedWarehouses = React.useMemo(() => {
    if (!isGroupedView) return null
    
    // Group filtered products by warehouse
    const grouped: Record<string, ProductMovement[]> = {}
    for (const product of filteredProducts) {
      const warehouse = product.warehouse || 'Sem Depósito'
      if (!grouped[warehouse]) {
        grouped[warehouse] = []
      }
      grouped[warehouse].push(product)
    }
    
    return Object.entries(grouped).sort((a, b) =>
      a[0].localeCompare(b[0], 'pt-BR')
    )
  }, [isGroupedView, filteredProducts])

  const renderProductRow = (product: ProductMovement) => (
    <TableRow key={product.productId}>
      <TableCell className="font-medium">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="truncate block max-w-[120px]">
              {product.sku}
            </TooltipTrigger>
            <TooltipContent>
              <p>{product.sku}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="block max-w-[200px]">
              <div>
                <div className="font-medium truncate">{product.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {product.brand} • {product.category}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs">{product.brand} • {product.category}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <span className="truncate block max-w-[120px]">
          {product.warehouse}
        </span>
      </TableCell>
      <TableCell className="text-right">{product.currentStock}</TableCell>
      <TableCell className="text-right">
        {formatCurrency(product.stockValue)}
      </TableCell>
      <TableCell className="text-right">
        {formatDate(product.lastSaleDate)}
      </TableCell>
      <TableCell className="text-right">
        {product.daysWithoutMovement}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleViewDetails(product)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )

  const renderedRows: React.ReactElement[] = (() => {
    if (isGroupedView && groupedWarehouses) {
      return groupedWarehouses.flatMap(([warehouse, products]) => {
        const label = warehouse || 'Sem Depósito'
        return [
          <TableRow key={`group-${label}`} className="bg-muted/50">
            <TableCell colSpan={8} className="text-sm font-semibold">
              {label} · {products.length}{' '}
              {products.length === 1 ? 'produto' : 'produtos'}
            </TableCell>
          </TableRow>,
          ...products.map(renderProductRow),
        ]
      })
    }

    return filteredProducts.map(renderProductRow)
  })()

  const hasRows = renderedRows.length > 0

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">
              Produtos Analisados
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{filteredSummary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {filteredSummary.productsWithoutMovement} sem movimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">
              Capital Imobilizado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrency(filteredSummary.totalCapitalImmobilized)}
            </div>
            <p className="text-xs text-muted-foreground">
              em produtos parados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">
              Custo de Oportunidade
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrency(filteredSummary.totalOpportunityCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              perdidos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">
              Tempo Médio Parado
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {Math.round(filteredSummary.averageDaysWithoutMovement)}
            </div>
            <p className="text-xs text-muted-foreground">dias sem venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead className="w-[250px]">Produto</TableHead>
              <TableHead className="w-[120px]">Depósito</TableHead>
              <TableHead className="text-right w-[80px]">Estoque</TableHead>
              <TableHead className="text-right w-[130px]">Valor Parado</TableHead>
              <TableHead className="text-right w-[110px]">Última Venda</TableHead>
              <TableHead className="text-right w-[100px]">Dias Parado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasRows ? (
              renderedRows
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  Nenhum produto encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Export Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport('excel')}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Product Details Sheet */}
      <ProductDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        product={selectedProduct}
        periodDays={results.config?.period?.days}
      />
    </div>
  )
}
