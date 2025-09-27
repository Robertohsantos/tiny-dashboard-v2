/**
 * Clear Filters Button Component
 * Dedicated button for clearing all active filters
 * Follows Single Responsibility Principle
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/modules/ui'

interface ClearFiltersButtonProps {
  /** Callback when filters should be cleared */
  onClear: () => void
  /** Whether the button is visible */
  visible?: boolean
  /** Button text */
  text?: string
  /** Whether to show the X icon */
  showIcon?: boolean
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Button variant */
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  /** Additional CSS classes */
  className?: string
  /** Whether the button is disabled */
  disabled?: boolean
  /** Loading state */
  isLoading?: boolean
}

/**
 * Memoized clear filters button component
 * Optimized to prevent unnecessary re-renders
 */
export const ClearFiltersButton = React.memo(function ClearFiltersButton({
  onClear,
  visible = true,
  text = 'Limpar',
  showIcon = true,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
  isLoading = false,
}: ClearFiltersButtonProps) {
  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onClear()
    },
    [onClear],
  )

  if (!visible) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'h-9 px-3 text-muted-foreground hover:text-foreground',
        className,
      )}
      aria-label="Limpar todos os filtros"
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {showIcon && <X className="h-4 w-4 mr-1" aria-hidden="true" />}
          {text}
        </>
      )}
    </Button>
  )
})

ClearFiltersButton.displayName = 'ClearFiltersButton'
