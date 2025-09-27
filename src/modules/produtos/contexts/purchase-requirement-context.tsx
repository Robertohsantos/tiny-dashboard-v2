/**
 * Purchase Requirement Context
 * Manages state for purchase requirement modal and calculations
 */

'use client'

import * as React from 'react'
import type {
  PurchaseBatchResult,
  PurchaseRequirementConfig,
} from '@/modules/purchase-requirement/types'

/**
 * Context value interface
 */
interface PurchaseRequirementContextValue {
  /** Whether the modal is open */
  isModalOpen: boolean
  /** Open the modal */
  openModal: () => void
  /** Close the modal */
  closeModal: () => void
  /** Toggle modal state */
  toggleModal: () => void
  /** Current calculation results */
  results: PurchaseBatchResult | null
  /** Set calculation results */
  setResults: (results: PurchaseBatchResult | null) => void
  /** Last used configuration */
  lastConfig: Partial<PurchaseRequirementConfig> | null
  /** Save configuration for reuse */
  setLastConfig: (config: Partial<PurchaseRequirementConfig>) => void
  /** Clear all state */
  clearState: () => void
}

/**
 * Create context
 */
const PurchaseRequirementContext = React.createContext<
  PurchaseRequirementContextValue | undefined
>(undefined)

/**
 * Context provider props
 */
interface PurchaseRequirementProviderProps {
  /** Child components */
  children: React.ReactNode
  /** Initial modal state */
  initialOpen?: boolean
  /** Initial configuration */
  initialConfig?: Partial<PurchaseRequirementConfig>
}

/**
 * Purchase Requirement Context Provider
 * Provides state management for purchase requirement features
 */
export function PurchaseRequirementProvider({
  children,
  initialOpen = false,
  initialConfig,
}: PurchaseRequirementProviderProps) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(initialOpen)

  // Results state
  const [results, setResults] = React.useState<PurchaseBatchResult | null>(null)

  // Configuration state - persist in localStorage
  const [lastConfig, setLastConfigState] =
    React.useState<Partial<PurchaseRequirementConfig> | null>(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('purchase-requirement-config')
        if (stored) {
          try {
            return JSON.parse(stored)
          } catch {
            return initialConfig || null
          }
        }
      }
      return initialConfig || null
    })

  /**
   * Open modal
   */
  const openModal = React.useCallback(() => {
    setIsModalOpen(true)
  }, [])

  /**
   * Close modal
   */
  const closeModal = React.useCallback(() => {
    setIsModalOpen(false)
  }, [])

  /**
   * Toggle modal
   */
  const toggleModal = React.useCallback(() => {
    setIsModalOpen((prev) => !prev)
  }, [])

  /**
   * Set last configuration and persist to localStorage
   */
  const setLastConfig = React.useCallback(
    (config: Partial<PurchaseRequirementConfig>) => {
      setLastConfigState(config)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'purchase-requirement-config',
          JSON.stringify(config),
        )
      }
    },
    [],
  )

  /**
   * Clear all state
   */
  const clearState = React.useCallback(() => {
    setResults(null)
    setLastConfigState(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('purchase-requirement-config')
    }
  }, [])

  /**
   * Context value
   */
  const value = React.useMemo<PurchaseRequirementContextValue>(
    () => ({
      isModalOpen,
      openModal,
      closeModal,
      toggleModal,
      results,
      setResults,
      lastConfig,
      setLastConfig,
      clearState,
    }),
    [
      isModalOpen,
      openModal,
      closeModal,
      toggleModal,
      results,
      lastConfig,
      setLastConfig,
      clearState,
    ],
  )

  return (
    <PurchaseRequirementContext.Provider value={value}>
      {children}
    </PurchaseRequirementContext.Provider>
  )
}

/**
 * Hook to use purchase requirement context
 */
export function usePurchaseRequirementContext() {
  const context = React.useContext(PurchaseRequirementContext)

  if (context === undefined) {
    throw new Error(
      'usePurchaseRequirementContext must be used within a PurchaseRequirementProvider',
    )
  }

  return context
}

/**
 * Hook to get modal state only
 */
export function usePurchaseRequirementModal() {
  const { isModalOpen, openModal, closeModal, toggleModal } =
    usePurchaseRequirementContext()

  return {
    isOpen: isModalOpen,
    open: openModal,
    close: closeModal,
    toggle: toggleModal,
  }
}

/**
 * Hook to get results only
 */
export function usePurchaseRequirementResults() {
  const { results, setResults } = usePurchaseRequirementContext()

  return {
    results,
    setResults,
  }
}

/**
 * Hook to get and set configuration
 */
export function usePurchaseRequirementConfig() {
  const { lastConfig, setLastConfig } = usePurchaseRequirementContext()

  return {
    config: lastConfig,
    saveConfig: setLastConfig,
  }
}
