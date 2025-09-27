/**
 * Column definitions for the Products DataTable
 * Uses reusable components for consistent display across the application
 * Follows single responsibility principle - only defines table columns
 */

'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  StockStatusBadge,
  MarkupIndicator,
  StockCoverageBadge,
} from '@/modules/stock-coverage/components/badges'
import { formatCurrency } from '@/modules/core/utils/formatters'
import type { Produto } from '@/modules/produtos/types/produtos.types'

/**
 * Creates a sortable header button
 * Extracted to avoid repetition across column definitions
 */
const SortableHeader = React.memo(function SortableHeader({
  column,
  label,
  align = 'left',
}: {
  column: any
  label: string
  align?: 'left' | 'right'
}) {
  return (
    <Button
      variant="ghost"
      className={`px-0 hover:bg-transparent ${
        align === 'right' ? 'w-full justify-end' : 'text-left'
      }`}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
})

/**
 * Column definitions for the products table
 * Each column uses appropriate formatting and components for its data type
 */
export const columns: ColumnDef<Produto>[] = [
  {
    accessorKey: 'sku',
    header: ({ column }) => <SortableHeader column={column} label="SKU" />,
    cell: ({ row }) => (
      <div className="font-medium text-xs">{row.getValue('sku')}</div>
    ),
  },
  {
    accessorKey: 'descricao',
    // Custom accessor to include both nome and descricao in search
    accessorFn: (row) => `${row.nome} ${row.descricao || ''}`,
    header: ({ column }) => (
      <SortableHeader column={column} label="Descrição do Produto" />
    ),
    cell: ({ row }) => {
      const nome = row.original.nome
      const descricao = row.original.descricao
      return (
        <div className="max-w-[300px]">
          <div className="font-medium text-sm">{nome}</div>
          {descricao && (
            <div className="text-xs text-muted-foreground truncate">
              {descricao}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'marca',
    header: ({ column }) => <SortableHeader column={column} label="Marca" />,
    cell: ({ row }) => <div className="text-sm">{row.getValue('marca')}</div>,
  },
  {
    accessorKey: 'estoqueAtual',
    header: ({ column }) => (
      <SortableHeader column={column} label="Estoque Atual" align="right" />
    ),
    cell: ({ row }) => {
      const estoque = row.getValue('estoqueAtual') as number
      const estoqueMinimo = row.original.estoqueMinimo
      const status = row.original.status

      return (
        <div className="text-right">
          <StockStatusBadge
            currentStock={estoque}
            minimumStock={estoqueMinimo}
            productStatus={status}
          />
        </div>
      )
    },
  },
  {
    accessorKey: 'precoCusto',
    header: ({ column }) => (
      <SortableHeader column={column} label="Preço de Custo" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm">
        {formatCurrency(row.getValue('precoCusto'))}
      </div>
    ),
  },
  {
    accessorKey: 'precoVenda',
    header: ({ column }) => (
      <SortableHeader column={column} label="Preço de Venda" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm font-medium">
        {formatCurrency(row.getValue('precoVenda'))}
      </div>
    ),
  },
  {
    accessorKey: 'markupPercentual',
    header: ({ column }) => (
      <SortableHeader column={column} label="Markup %" align="right" />
    ),
    cell: ({ row }) => {
      const markup = row.getValue('markupPercentual') as number
      return (
        <div className="text-right">
          <MarkupIndicator value={markup} />
        </div>
      )
    },
  },
  {
    accessorKey: 'coberturaEstoqueDias',
    header: ({ column }) => (
      <SortableHeader column={column} label="Cobertura (dias)" align="right" />
    ),
    cell: ({ row }) => {
      const dias = row.getValue('coberturaEstoqueDias') as number
      const estoque = row.original.estoqueAtual

      return (
        <div className="text-right">
          <StockCoverageBadge days={dias} currentStock={estoque} />
        </div>
      )
    },
  },
]
