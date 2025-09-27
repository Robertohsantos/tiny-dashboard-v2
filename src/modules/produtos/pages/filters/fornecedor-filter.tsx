/**
 * Fornecedor (Supplier) Filter Component
 * Select component for filtering products by supplier
 */

'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getFornecedorOptions,
  FORNECEDORES,
  type FornecedorId,
} from '@/modules/produtos/constants/produtos.constants'

interface FornecedorFilterProps {
  value: FornecedorId
  onFornecedorChange: (id: FornecedorId) => void
}

/**
 * Filter component for selecting product supplier
 * @param value - Current fornecedor ID
 * @param onFornecedorChange - Callback when fornecedor changes
 */
export function FornecedorFilter({
  value,
  onFornecedorChange,
}: FornecedorFilterProps) {
  // Type guard to validate fornecedor ID
  const isValidFornecedor = (id: string): id is FornecedorId => {
    return id === 'all' || id in FORNECEDORES
  }

  const handleSelectChange = (newValue: string) => {
    if (isValidFornecedor(newValue)) {
      onFornecedorChange(newValue)
    } else {
      console.warn(`Invalid fornecedor ID: ${newValue}`)
      // Fallback to 'all' if invalid value
      onFornecedorChange('all')
    }
  }

  const fornecedorOptions = getFornecedorOptions()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Fornecedor:
      </span>

      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-200 overflow-hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fornecedorOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
