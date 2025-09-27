/**
 * Products DataTable Module
 * Exports all components needed for the products data table
 * Provides a clean interface for consuming the table components
 */

'use client'

import * as React from 'react'
import { DataTable } from '@/components/ui/data-table/data-table'
import { useDataTable } from '@/components/ui/data-table/data-table-provider'
import { ProdutosDataTableProvider } from './provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  ChevronDownIcon,
  ColumnsIcon,
  Wrench,
  ArrowLeftRight,
  ShoppingCart,
  BarChart3,
} from 'lucide-react'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import { usePurchaseRequirementModal } from '@/modules/produtos/contexts/purchase-requirement-context'

// Re-export provider for external use
export { ProdutosDataTableProvider } from './provider'
export { columns } from './columns'

interface ProdutosDataTableProps {
  /** Product data to display */
  data: Produto[]
  /** Loading state */
  isLoading?: boolean
  /** Export callback */
  onExport?: (params: { format: 'csv' | 'excel' | 'pdf'; file: File }) => void
}

/**
 * Complete Products DataTable with search, filters, and pagination
 * Uses the modular architecture with reusable components
 * Memoized to prevent unnecessary re-renders
 */
export const ProdutosDataTable = React.memo(function ProdutosDataTable({
  data,
  isLoading = false,
  onExport,
}: ProdutosDataTableProps) {
  return (
    <ProdutosDataTableProvider data={data} onExport={onExport}>
      <div className="flex w-full flex-col gap-4">
        {/* Search and Toolbar */}
        <ProdutosToolbar />

        {/* Table */}
        <div className="rounded-lg border bg-white">
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="h-[568px] overflow-y-auto">
              <DataTable className="w-full" />
            </div>
          )}
        </div>
      </div>
    </ProdutosDataTableProvider>
  )
})

/**
 * Custom toolbar for products table
 * Includes search functionality and column visibility toggle
 */
const ProdutosToolbar = React.memo(function ProdutosToolbar() {
  const { table } = useDataTable<Produto>()
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [isToolsMenuOpen, setIsToolsMenuOpen] = React.useState(false)

  // Get purchase requirement modal controls
  const { open: openPurchaseRequirementModal } = usePurchaseRequirementModal()

  // Apply global filter when it changes
  React.useEffect(() => {
    table.setGlobalFilter(globalFilter)
  }, [globalFilter, table])

  // Memoize the search handler to avoid recreating on each render
  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setGlobalFilter(event.target.value)
    },
    [],
  )

  // Handlers para as ferramentas
  const handleTransferencia = React.useCallback(() => {
    console.log('Abrir Transferência entre Depósitos')
    // TODO: Implementar modal de transferência
  }, [])

  const handleNecessidadeCompra = React.useCallback(() => {
    openPurchaseRequirementModal()
  }, [openPurchaseRequirementModal])

  const handleProdutosSemMovimentacao = React.useCallback(() => {
    console.log('Abrir Produtos sem Movimentação')
    // TODO: Implementar modal de produtos sem movimentação
  }, [])

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={globalFilter}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Dropdown de Ferramentas */}
        <DropdownMenu
          open={isToolsMenuOpen}
          onOpenChange={setIsToolsMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="flex items-center"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Ferramentas
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 z-[100]"
            sideOffset={5}
          >
            <DropdownMenuLabel>Ferramentas de Gestão</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                handleTransferencia()
                setIsToolsMenuOpen(false)
              }}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Transferência entre Depósitos</span>
                <span className="text-xs text-muted-foreground">
                  Mover produtos entre locais
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                handleNecessidadeCompra()
                setIsToolsMenuOpen(false)
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Necessidade de Compra</span>
                <span className="text-xs text-muted-foreground">
                  Análise de reposição de estoque
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                handleProdutosSemMovimentacao()
                setIsToolsMenuOpen(false)
              }}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Produtos sem Movimentação</span>
                <span className="text-xs text-muted-foreground">
                  Identificar produtos parados
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dropdown de Colunas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="flex items-center"
            >
              <ColumnsIcon className="mr-2 h-4 w-4" />
              Colunas
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 z-[100]"
            sideOffset={5}
          >
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== 'undefined' &&
                  column.getCanHide(),
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})
