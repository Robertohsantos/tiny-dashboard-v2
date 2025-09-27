/**
 * Products DataTable Provider
 * Configures and provides the generic DataTableProvider for products
 * Follows single source of truth pattern - centralizes table configuration
 */

'use client'

import * as React from 'react'
import { DataTableProvider } from '@/components/ui/data-table/data-table-provider'
import { columns } from './columns'
import type { Produto } from '@/modules/produtos/types/produtos.types'

interface ProdutosDataTableProviderProps {
  /** Product data to display in the table */
  data: Produto[]
  /** Child components that will use the table context */
  children: React.ReactNode
  /** Whether data is being loaded */
  isLoading?: boolean
  /** Callback when export is triggered */
  onExport?: (params: { format: 'csv' | 'excel' | 'pdf'; file: File }) => void
}

/**
 * Provides DataTable context configured for products
 * Uses the generic DataTableProvider with product-specific settings
 */
export const ProdutosDataTableProvider = React.memo(
  function ProdutosDataTableProvider({
    data,
    children,
    isLoading = false,
    onExport,
  }: ProdutosDataTableProviderProps) {
    // Filter configuration for products
    const filters = React.useMemo(
      () => [
        {
          accessorKey: 'marca' as keyof Produto,
          label: 'Marca',
          icon: null,
        },
        {
          accessorKey: 'categoria' as keyof Produto,
          label: 'Categoria',
          icon: null,
        },
        {
          accessorKey: 'status' as keyof Produto,
          label: 'Status',
          icon: null,
        },
      ],
      [],
    )

    return (
      <DataTableProvider<Produto>
        columns={columns}
        data={data}
        filters={filters}
        hasExportOption={true}
        onExport={onExport}
      >
        {children}
      </DataTableProvider>
    )
  },
)

ProdutosDataTableProvider.displayName = 'ProdutosDataTableProvider'
