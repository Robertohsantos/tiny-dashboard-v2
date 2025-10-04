/**
 * No Movement Context
 * Manages state for products without movement modal and analysis
 */

'use client'

import * as React from 'react'
import type {
  NoMovementConfig,
  NoMovementResult,
} from '@/modules/no-movement/types'

/**
 * Context value interface
 */
interface NoMovementContextValue {
  /** Whether the modal is open */
  isModalOpen: boolean
  /** Open the modal */
  openModal: () => void
  /** Close the modal */
  closeModal: () => void
  /** Toggle modal state */
  toggleModal: () => void
  /** Current analysis results */
  results: NoMovementResult | null
  /** Set analysis results */
  setResults: (results: NoMovementResult | null) => void
  /** Last used configuration */
  lastConfig: Partial<NoMovementConfig> | null
  /** Save configuration for reuse */
  setLastConfig: (config: Partial<NoMovementConfig>) => void
  /** Clear all state */
  clearState: () => void
}

/**
 * Create context
 */
const NoMovementContext = React.createContext<
  NoMovementContextValue | undefined
>(undefined)

/**
 * Context provider props
 */
interface NoMovementProviderProps {
  /** Child components */
  children: React.ReactNode
  /** Initial modal state */
  initialOpen?: boolean
  /** Initial configuration */
  initialConfig?: Partial<NoMovementConfig>
}

/**
 * No Movement Context Provider
 * Provides state management for no movement analysis features
 */
export function NoMovementProvider({
  children,
  initialOpen = false,
  initialConfig,
}: NoMovementProviderProps) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(initialOpen)

  // Results state
  const [results, setResults] = React.useState<NoMovementResult | null>(null)

  // Configuration state - persist in localStorage
  const [lastConfig, setLastConfigState] =
    React.useState<Partial<NoMovementConfig> | null>(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('no-movement-config')
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
    (config: Partial<NoMovementConfig>) => {
      setLastConfigState(config)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'no-movement-config',
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
      localStorage.removeItem('no-movement-config')
    }
  }, [])

  /**
   * Context value
   */
  const value = React.useMemo<NoMovementContextValue>(
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
    <NoMovementContext.Provider value={value}>
      {children}
    </NoMovementContext.Provider>
  )
}

/**
 * Hook to use no movement context
 */
export function useNoMovementContext() {
  const context = React.useContext(NoMovementContext)

  if (context === undefined) {
    throw new Error(
      'useNoMovementContext must be used within a NoMovementProvider',
    )
  }

  return context
}

/**
 * Hook to get modal state only
 */
export function useNoMovementModal() {
  const { isModalOpen, openModal, closeModal, toggleModal } =
    useNoMovementContext()

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
export function useNoMovementResults() {
  const { results, setResults } = useNoMovementContext()

  return {
    results,
    setResults,
  }
}

/**
 * Hook to get and set configuration
 */
export function useNoMovementConfig() {
  const { lastConfig, setLastConfig } = useNoMovementContext()

  return {
    config: lastConfig,
    saveConfig: setLastConfig,
  }
}