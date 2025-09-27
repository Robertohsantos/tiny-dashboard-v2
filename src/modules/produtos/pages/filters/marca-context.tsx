/**
 * Marca (Brand) Context Provider
 * Manages the brand filter state for products
 */

'use client'

import * as React from 'react'
import type { MarcaId } from '@/modules/produtos/constants/produtos.constants'

interface MarcaContextType {
  marcaId: MarcaId
  setMarcaId: (id: MarcaId) => void
}

const MarcaContext = React.createContext<MarcaContextType | undefined>(
  undefined,
)

interface MarcaProviderProps {
  children: React.ReactNode
  initialMarca?: MarcaId
}

/**
 * Provider component for managing marca filter state
 * @param children - React children
 * @param initialMarca - Initial marca value (defaults to 'all')
 */
export function MarcaProvider({
  children,
  initialMarca = 'all',
}: MarcaProviderProps) {
  const [marcaId, setMarcaId] = React.useState<MarcaId>(initialMarca)

  const value = React.useMemo(() => ({ marcaId, setMarcaId }), [marcaId])

  return <MarcaContext.Provider value={value}>{children}</MarcaContext.Provider>
}

/**
 * Hook to use the marca context
 * @returns The marca context value
 * @throws Error if used outside of MarcaProvider
 */
export function useMarca() {
  const context = React.useContext(MarcaContext)

  if (context === undefined) {
    throw new Error('useMarca must be used within a MarcaProvider')
  }

  return context
}
