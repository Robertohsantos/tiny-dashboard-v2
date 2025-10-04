/**
 * Generic Filter Select Component
 * A reusable select component for filtering with accessibility and performance optimizations
 */

'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/modules/ui'

export interface FilterOption {
  /** Unique value identifier */
  value: string
  /** Display label */
  label: string
  /** Optional color indicator */
  color?: string
  /** Optional icon component */
  icon?: React.ReactNode
  /** Optional count/badge */
  count?: number
  /** Whether option is disabled */
  disabled?: boolean
}

export interface FilterSelectProps {
  /** Current selected value */
  value: string
  /** Callback when value changes */
  onValueChange: (value: string) => void
  /** Available options */
  options: FilterOption[]
  /** Label text for accessibility */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether to show the label visually */
  showLabel?: boolean
  /** Additional class names */
  className?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Whether the select is disabled */
  disabled?: boolean
  /** Whether to show loading state */
  isLoading?: boolean
  /** Accessible label for screen readers */
  ariaLabel?: string
  /** Optional icon to show in trigger */
  triggerIcon?: React.ReactNode
  /** Max height for dropdown content */
  maxHeight?: string
  /** Whether to show option counts */
  showCounts?: boolean
}

const sizeClasses = {
  sm: 'w-[140px] h-8 text-xs',
  default: 'w-[180px] h-9 text-sm',
  lg: 'w-[220px] h-10 text-base',
}

/**
 * Generic filter select component with enhanced features
 * @param props - FilterSelectProps
 */
export function FilterSelect({
  value,
  onValueChange,
  options,
  label,
  placeholder = 'Select...',
  showLabel = true,
  className,
  size = 'default',
  disabled = false,
  isLoading = false,
  ariaLabel,
  triggerIcon,
  maxHeight = '280px',
  showCounts = false,
}: FilterSelectProps) {
  // Memoize the selected option for performance
  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  )

  // Generate unique ID for accessibility
  const id = React.useId()
  const labelId = `${id}-label`
  const selectId = `${id}-select`

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && showLabel && (
        <label
          id={labelId}
          htmlFor={selectId}
          className="text-sm font-medium text-muted-foreground whitespace-nowrap"
        >
          {label}:
        </label>
      )}

      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          id={selectId}
          className={cn(
            'bg-white border-gray-200 transition-colors',
            sizeClasses[size],
            isLoading && 'opacity-60 cursor-wait',
            className,
          )}
          aria-label={ariaLabel || label}
          aria-labelledby={label ? labelId : undefined}
          aria-busy={isLoading}
          aria-disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {triggerIcon && (
              <span className="flex-shrink-0">{triggerIcon}</span>
            )}
            {selectedOption?.icon && (
              <span className="flex-shrink-0">{selectedOption.icon}</span>
            )}
            {selectedOption?.color && (
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedOption.color }}
                aria-hidden="true"
              />
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <SelectValue placeholder={placeholder}>
                <span className="block truncate">{selectedOption?.label}</span>
              </SelectValue>
            </div>
            {showCounts && selectedOption?.count !== undefined && (
              <Badge
                variant="secondary"
                className="flex-shrink-0 h-5 px-1 text-xs"
              >
                {selectedOption.count}
              </Badge>
            )}
          </div>
        </SelectTrigger>

        <SelectContent
          className={cn('overflow-y-auto scrollbar-vertical')}
          style={{ maxHeight }}
        >
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  {option.icon && (
                    <span className="flex-shrink-0">{option.icon}</span>
                  )}
                  {option.color && (
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex-1">{option.label}</span>
                  {showCounts && option.count !== undefined && (
                    <Badge
                      variant="outline"
                      className="ml-auto h-5 px-1 text-xs"
                    >
                      {option.count}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Multiple filter select for selecting multiple values
 */
export interface MultiFilterSelectProps
  extends Omit<FilterSelectProps, 'value' | 'onValueChange'> {
  /** Current selected values */
  value: string[]
  /** Callback when values change */
  onValueChange: (values: string[]) => void
  /** Maximum number of selections allowed */
  maxSelections?: number
}

/**
 * Component for selecting multiple filter values
 * Note: This would require a different UI component like a combobox or checkbox list
 * This is a placeholder for future implementation
 */
export function MultiFilterSelect(props: MultiFilterSelectProps) {
  // TODO: Implement multi-select functionality
  // Consider using Combobox from shadcn/ui or custom checkbox list
  return null
}
