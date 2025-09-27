/**
 * Fornecedor (Supplier) Context Provider
 * Manages the supplier filter state for products
 */

'use client'

import * as React from 'react'
import type { FornecedorId } from '@/modules/produtos/constants/produtos.constants'

interface FornecedorContextType {
  fornecedorId: FornecedorId
  setFornecedorId: (id: FornecedorId) => void
}

const FornecedorContext = React.createContext<
  FornecedorContextType | undefined
>(undefined)

interface FornecedorProviderProps {
  children: React.ReactNode
  initialFornecedor?: FornecedorId
}

/**
 * Provider component for managing fornecedor filter state
 * @param children - React children
 * @param initialFornecedor - Initial fornecedor value (defaults to 'all')
 */
export function FornecedorProvider({
  children,
  initialFornecedor = 'all',
}: FornecedorProviderProps) {
  const [fornecedorId, setFornecedorId] =
    React.useState<FornecedorId>(initialFornecedor)

  const value = React.useMemo(
    () => ({ fornecedorId, setFornecedorId }),
    [fornecedorId],
  )

  return (
    <FornecedorContext.Provider value={value}>
      {children}
    </FornecedorContext.Provider>
  )
}

/**
 * Hook to use the fornecedor context
 * @returns The fornecedor context value
 * @throws Error if used outside of FornecedorProvider
 */
export function useFornecedor() {
  const context = React.useContext(FornecedorContext)

  if (context === undefined) {
    throw new Error('useFornecedor must be used within a FornecedorProvider')
  }

  return context
}
