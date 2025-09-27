/**
 * Marca (Brand) Filter Component
 * Select component for filtering products by brand
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
  getMarcaOptions,
  type MarcaId,
} from '@/modules/produtos/constants/produtos.constants'

interface MarcaFilterProps {
  value: MarcaId
  onMarcaChange: (id: MarcaId) => void
  /** Optional list of brands from actual product data */
  availableMarcas?: string[]
}

/**
 * Filter component for selecting product brand
 * @param value - Current marca ID
 * @param onMarcaChange - Callback when marca changes
 * @param availableMarcas - Optional dynamic list of brands
 */
export function MarcaFilter({
  value,
  onMarcaChange,
  availableMarcas,
}: MarcaFilterProps) {
  const handleSelectChange = (newValue: string) => {
    onMarcaChange(newValue)
  }

  // Get marca options - can be dynamic based on available data
  const marcaOptions = React.useMemo(
    () => getMarcaOptions(availableMarcas),
    [availableMarcas],
  )

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Marca:</span>

      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {marcaOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
