/**
 * Debounce Hook
 * Custom hook for debouncing values to optimize performance
 */

import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Hook that debounces a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clear the timer if value changes before the delay has passed
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook that returns a debounced callback function
 * @param callback - The callback function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay],
  ) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Hook that provides both immediate and debounced values
 * Useful for showing immediate UI feedback while debouncing API calls
 * @param initialValue - The initial value
 * @param delay - The delay in milliseconds
 * @returns An object with value, debouncedValue, and setValue
 */
export function useDebouncedState<T>(initialValue: T, delay: number) {
  const [value, setValue] = useState<T>(initialValue)
  const debouncedValue = useDebounce(value, delay)

  return {
    value, // Immediate value for UI
    debouncedValue, // Debounced value for API calls
    setValue, // Setter function
  }
}

/**
 * Hook for debouncing search input
 * Optimized for search scenarios with loading state
 * @param initialValue - Initial search value
 * @param delay - Debounce delay (default 300ms)
 * @returns Object with search utilities
 */
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 300,
) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, delay)
  const previousDebouncedRef = useRef(debouncedSearchTerm)

  // Track when we're debouncing
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsDebouncing(true)
    } else {
      setIsDebouncing(false)
    }
  }, [searchTerm, debouncedSearchTerm])

  // Track if debounced value actually changed
  useEffect(() => {
    previousDebouncedRef.current = debouncedSearchTerm
  }, [debouncedSearchTerm])

  const hasChanged = previousDebouncedRef.current !== debouncedSearchTerm

  return {
    searchTerm, // Immediate value for input
    debouncedSearchTerm, // Debounced value for API
    setSearchTerm, // Setter
    isDebouncing, // Loading state
    hasChanged, // Whether debounced value changed
    clear: () => setSearchTerm(''), // Clear function
  }
}
