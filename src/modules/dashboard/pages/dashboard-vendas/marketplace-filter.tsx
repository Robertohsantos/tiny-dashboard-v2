'use client'

import * as React from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  getMarketplaceOptions,
  MARKETPLACES,
  type MarketplaceId,
} from '@/modules/dashboard/constants/marketplace.constants'

interface MarketplaceFilterProps {
  value: MarketplaceId
  onMarketplaceChange: (id: MarketplaceId) => void
}

export function MarketplaceFilter({
  value,
  onMarketplaceChange,
}: MarketplaceFilterProps) {
  // Type guard to validate marketplace ID
  const isValidMarketplace = (id: string): id is MarketplaceId => {
    return id in MARKETPLACES
  }

  const marketplaceOptions = React.useMemo(() => getMarketplaceOptions(), [])
  const multiSelectOptions = React.useMemo(
    () =>
      marketplaceOptions.map((option) => ({
        value: option.value,
        label: option.label,
        color: option.color,
      })),
    [marketplaceOptions],
  )

  const selectedValues = React.useMemo(() => [value], [value])

  const handleMultiSelectChange = (values: string[]) => {
    const nextValue = values[0]
    if (nextValue && isValidMarketplace(nextValue)) {
      onMarketplaceChange(nextValue)
      return
    }

    console.warn(`Invalid marketplace ID: ${nextValue}`)
    onMarketplaceChange('all')
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Marketplace:
      </span>

      <MultiSelect
        value={selectedValues}
        onValueChange={handleMultiSelectChange}
        options={multiSelectOptions}
        label="Marketplace"
        showLabel={false}
        placeholder={marketplaceOptions.find((opt) => opt.value === value)?.label ?? 'Marketplace'}
        searchable={false}
        selectionMode="single"
        showSelectAll={false}
      />
    </div>
  )
}
