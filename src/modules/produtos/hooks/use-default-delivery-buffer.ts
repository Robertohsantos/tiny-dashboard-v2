/**
 * Hook for managing default delivery buffer settings
 * Persists user preference in localStorage
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'default-delivery-buffer'
const DEFAULT_ENABLED = false
const DEFAULT_DAYS = 0
const MIN_DAYS = 0
const MAX_DAYS = 90

interface DeliveryBufferDefaults {
  enabled: boolean
  days: number
}

/**
 * Custom hook to manage default delivery buffer settings
 * @returns Object containing delivery buffer settings and update function
 */
export function useDefaultDeliveryBuffer() {
  const [defaults, setDefaultsState] = useState<DeliveryBufferDefaults>({
    enabled: DEFAULT_ENABLED,
    days: DEFAULT_DAYS,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as DeliveryBufferDefaults
        
        // Validate the stored values
        if (
          typeof parsed.enabled === 'boolean' &&
          typeof parsed.days === 'number' &&
          parsed.days >= MIN_DAYS &&
          parsed.days <= MAX_DAYS
        ) {
          setDefaultsState(parsed)
        }
      }
    } catch (error) {
      console.error(
        'Error loading default delivery buffer from localStorage:',
        error,
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update and persist delivery buffer defaults
   * @param enabled - Whether delivery buffer should be enabled by default
   * @param days - Number of buffer days
   */
  const setDefaults = useCallback((enabled: boolean, days: number) => {
    // Validate input
    const validatedDays = Math.max(MIN_DAYS, Math.min(MAX_DAYS, days))
    
    const newDefaults: DeliveryBufferDefaults = {
      enabled,
      days: validatedDays,
    }

    setDefaultsState(newDefaults)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDefaults))
    } catch (error) {
      console.error(
        'Error saving default delivery buffer to localStorage:',
        error,
      )
    }
  }, [])

  /**
   * Reset to default values
   */
  const resetToDefault = useCallback(() => {
    setDefaults(DEFAULT_ENABLED, DEFAULT_DAYS)
  }, [setDefaults])

  return {
    defaultDeliveryEnabled: defaults.enabled,
    defaultDeliveryDays: defaults.days,
    setDeliveryDefaults: setDefaults,
    resetDeliveryDefaults: resetToDefault,
    isLoading,
    MIN_DAYS,
    MAX_DAYS,
  }
}