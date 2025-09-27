/**
 * Hook for managing default coverage days setting
 * Persists user preference in localStorage
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'default-coverage-days'
const DEFAULT_VALUE = 30
const MIN_DAYS = 1
const MAX_DAYS = 365

/**
 * Custom hook to manage default coverage days
 * @returns {object} Object containing defaultDays value and setDefaultDays function
 */
export function useDefaultCoverageDays() {
  const [defaultDays, setDefaultDaysState] = useState<number>(DEFAULT_VALUE)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedValue = parseInt(stored, 10)
        // Validate the stored value
        if (
          !isNaN(parsedValue) &&
          parsedValue >= MIN_DAYS &&
          parsedValue <= MAX_DAYS
        ) {
          setDefaultDaysState(parsedValue)
        }
      }
    } catch (error) {
      console.error(
        'Error loading default coverage days from localStorage:',
        error,
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update and persist default days value
   * @param {number} days - Number of days to set as default
   */
  const setDefaultDays = useCallback((days: number) => {
    // Validate input
    const validatedDays = Math.max(MIN_DAYS, Math.min(MAX_DAYS, days))

    setDefaultDaysState(validatedDays)

    try {
      localStorage.setItem(STORAGE_KEY, String(validatedDays))
    } catch (error) {
      console.error(
        'Error saving default coverage days to localStorage:',
        error,
      )
    }
  }, [])

  /**
   * Reset to default value
   */
  const resetToDefault = useCallback(() => {
    setDefaultDays(DEFAULT_VALUE)
  }, [setDefaultDays])

  return {
    defaultDays,
    setDefaultDays,
    resetToDefault,
    isLoading,
    MIN_DAYS,
    MAX_DAYS,
    DEFAULT_VALUE,
  }
}
