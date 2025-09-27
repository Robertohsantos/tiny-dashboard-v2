'use client'

import * as React from 'react'
import { type MarketplaceId } from '@/modules/dashboard/constants/marketplace.constants'

interface MarketplaceContextType {
  marketplaceId: MarketplaceId
  setMarketplaceId: (id: MarketplaceId) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const MarketplaceContext = React.createContext<
  MarketplaceContextType | undefined
>(undefined)

export function useMarketplace() {
  const context = React.useContext(MarketplaceContext)
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider')
  }
  return context
}

interface MarketplaceProviderProps {
  children: React.ReactNode
  initialMarketplace?: MarketplaceId
}

export function MarketplaceProvider({
  children,
  initialMarketplace = 'all',
}: MarketplaceProviderProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [marketplaceId, setMarketplaceId] =
    React.useState<MarketplaceId>(initialMarketplace)

  const value = React.useMemo(
    () => ({
      marketplaceId,
      setMarketplaceId,
      isLoading,
      setIsLoading,
    }),
    [marketplaceId, isLoading],
  )

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  )
}
