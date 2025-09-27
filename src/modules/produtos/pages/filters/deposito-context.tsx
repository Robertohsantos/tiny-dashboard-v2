/**
 * Deposito (Warehouse) Context Provider
 * Manages the warehouse filter state for products
 */

'use client'

import * as React from 'react'
import type { DepositoId } from '@/modules/produtos/constants/produtos.constants'

interface DepositoContextType {
  depositoId: DepositoId
  setDepositoId: (id: DepositoId) => void
}

const DepositoContext = React.createContext<DepositoContextType | undefined>(
  undefined,
)

interface DepositoProviderProps {
  children: React.ReactNode
  initialDeposito?: DepositoId
}

/**
 * Provider component for managing deposito filter state
 * @param children - React children
 * @param initialDeposito - Initial deposito value (defaults to 'all')
 */
export function DepositoProvider({
  children,
  initialDeposito = 'all',
}: DepositoProviderProps) {
  const [depositoId, setDepositoId] =
    React.useState<DepositoId>(initialDeposito)

  const value = React.useMemo(
    () => ({ depositoId, setDepositoId }),
    [depositoId],
  )

  return (
    <DepositoContext.Provider value={value}>
      {children}
    </DepositoContext.Provider>
  )
}

/**
 * Hook to use the deposito context
 * @returns The deposito context value
 * @throws Error if used outside of DepositoProvider
 */
export function useDeposito() {
  const context = React.useContext(DepositoContext)

  if (context === undefined) {
    throw new Error('useDeposito must be used within a DepositoProvider')
  }

  return context
}
