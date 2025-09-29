/**
 * Multi-Select Component with Ctrl+Click Support
 * A dropdown component for multiple selections with keyboard support
 */

'use client'

import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/modules/ui'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export interface MultiSelectOption {
  /** Unique value identifier */
  value: string
  /** Display label */
  label: string
  /** Optional color indicator */
  color?: string
  /** Optional icon component */
  icon?: React.ReactNode
  /** Whether option is disabled */
  disabled?: boolean
}

export interface MultiSelectProps {
  /** Available options */
  options: MultiSelectOption[]
  /** Currently selected values */
  value: string[]
  /** Callback when values change */
  onValueChange: (values: string[]) => void
  /** Placeholder text */
  placeholder?: string
  /** Label for accessibility */
  label?: string
  /** Whether to show the label visually */
  showLabel?: boolean
  /** Max items to show in trigger before collapsing */
  maxDisplayItems?: number
  /** Whether to show search input */
  searchable?: boolean
  /** Additional class names */
  className?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Whether the select is disabled */
  disabled?: boolean
  /** Whether to show available count instead of selected count */
  showAvailableCount?: boolean
}

const sizeClasses = {
  sm: 'w-[171px] h-8 text-xs',
  default: 'w-[220px] h-9 text-sm',
  lg: 'w-[260px] h-10 text-base',
}

/**
 * Multi-select component with Ctrl+Click support
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Selecione...',
  label,
  showLabel = true,
  maxDisplayItems = 3,
  searchable = true,
  className,
  size = 'default',
  disabled = false,
  showAvailableCount = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  // Sanitize values to only include valid options
  const sanitizedValues = React.useMemo(() => {
    const validValues = options.map((opt) => opt.value)
    return value.filter((v) => validValues.includes(v))
  }, [value, options])

  // Use sanitized values for all operations
  const effectiveValue = sanitizedValues

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower),
    )
  }, [options, search])

  // Handle option selection - simplified toggle logic
  const handleSelect = (optionValue: string) => {
    if (effectiveValue.includes(optionValue)) {
      const newValue = effectiveValue.filter((v) => v !== optionValue)
      onValueChange(newValue)
    } else {
      const newValue = [...effectiveValue, optionValue]
      onValueChange(newValue)
    }
  }

  // Handle select all
  const handleSelectAll = () => {
    const enabledOptions = options.filter((opt) => !opt.disabled)
    const allValues = enabledOptions.map((opt) => opt.value)
    onValueChange(allValues)
  }

  // Handle clear all
  const handleClearAll = () => {
    onValueChange([])
  }

  // Get display text for trigger
  const enabledOptions = React.useMemo(
    () => options.filter((opt) => !opt.disabled),
    [options],
  )

  const getDisplayText = () => {
    if (showAvailableCount) {
      const baseLabel = label || placeholder || 'Selecionados'
      const enabledCount = enabledOptions.length
      const selectedCount = effectiveValue.length
      const displayCount = selectedCount > 0 ? selectedCount : enabledCount
      return `${baseLabel} (${displayCount})`
    }

    if (effectiveValue.length === 0) return placeholder

    const selectedOptions = options.filter((opt) =>
      effectiveValue.includes(opt.value),
    )

    if (effectiveValue.length === enabledOptions.length) {
      return 'Todos selecionados'
    }

    if (effectiveValue.length <= maxDisplayItems) {
      return selectedOptions.map((opt) => opt.label).join(', ')
    }

    return `${effectiveValue.length} selecionados`
  }

  // Generate unique ID for accessibility
  const id = React.useId()
  const labelId = `${id}-label`
  const triggerId = `${id}-trigger`

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && showLabel && (
        <label
          id={labelId}
          htmlFor={triggerId}
          className="text-sm font-medium text-muted-foreground whitespace-nowrap"
        >
          {label}:
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label || 'Multi-select'}
            aria-labelledby={label ? labelId : undefined}
            disabled={disabled}
            className={cn(
              'justify-between overflow-hidden',
              sizeClasses[size],
              className,
            )}
          >
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
              {getDisplayText()}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{
            width: 'var(--radix-popover-trigger-width)',
            zIndex: 9999, // Garantir que o popover está acima de tudo
            pointerEvents: 'auto', // Garantir que aceita eventos de mouse
          }}
        >
          <div className="flex flex-col">
            {searchable && (
              <div className="px-2 py-2">
                <input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}

            {/* Select All Option */}
            <label className="flex items-center gap-2 px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b">
              <input
                type="checkbox"
                checked={
                  effectiveValue.length ===
                  options.filter((opt) => !opt.disabled).length
                }
                ref={(input) => {
                  if (input) {
                    const enabledCount = options.filter(
                      (opt) => !opt.disabled,
                    ).length
                    input.indeterminate =
                      effectiveValue.length > 0 &&
                      effectiveValue.length < enabledCount
                  }
                }}
                onChange={(e) => {
                  const enabledOptions = options.filter((opt) => !opt.disabled)
                  const allSelected =
                    effectiveValue.length === enabledOptions.length
                  if (allSelected) {
                    handleClearAll()
                  } else {
                    handleSelectAll()
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Selecionar todos</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {effectiveValue.length}/
                {options.filter((opt) => !opt.disabled).length}
              </span>
            </label>

            <Separator />

            {filteredOptions.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma opção encontrada
              </div>
            )}

            <div className="max-h-[300px] overflow-auto p-1">
              {filteredOptions.map((option) => {
                const isSelected = effectiveValue.includes(option.value)

                return (
                  <label
                    key={option.value}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      option.disabled && 'pointer-events-none opacity-50',
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={option.disabled}
                        onChange={(e) => {
                          if (!option.disabled) {
                            handleSelect(option.value)
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
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
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
