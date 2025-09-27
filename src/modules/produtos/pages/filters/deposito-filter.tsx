/**
 * Deposito (Warehouse) Filter Component
 * Select component for filtering products by warehouse/store location
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
  getDepositoOptions,
  DEPOSITOS,
  type DepositoId,
} from '@/modules/produtos/constants/produtos.constants'

interface DepositoFilterProps {
  value: DepositoId
  onDepositoChange: (id: DepositoId) => void
}

/**
 * Filter component for selecting warehouse/store location
 * @param value - Current deposito ID
 * @param onDepositoChange - Callback when deposito changes
 */
export function DepositoFilter({
  value,
  onDepositoChange,
}: DepositoFilterProps) {
  // Type guard to validate deposito ID
  const isValidDeposito = (id: string): id is DepositoId => {
    return id === 'all' || id in DEPOSITOS
  }

  const handleSelectChange = (newValue: string) => {
    if (isValidDeposito(newValue)) {
      onDepositoChange(newValue)
    } else {
      console.warn(`Invalid deposito ID: ${newValue}`)
      // Fallback to 'all' if invalid value
      onDepositoChange('all')
    }
  }

  const depositoOptions = getDepositoOptions()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Depósito:
      </span>

      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {depositoOptions.map((option) => (
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
