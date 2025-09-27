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

  const handleSelectChange = (newValue: string) => {
    if (isValidMarketplace(newValue)) {
      onMarketplaceChange(newValue)
    } else {
      console.warn(`Invalid marketplace ID: ${newValue}`)
      // Optionally fallback to 'all' if invalid value
      onMarketplaceChange('all')
    }
  }

  const marketplaceOptions = getMarketplaceOptions()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Marketplace:
      </span>

      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {marketplaceOptions.map((option) => (
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
