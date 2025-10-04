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
import { Separator } from '@/components/ui/separator'

const MULTI_SELECT_ROW_HEIGHT = 40
const MULTI_SELECT_MAX_VISIBLE_OPTIONS = 7

export type MultiSelectCommitMode = 'immediate' | 'manual'

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
  /** Callback when values change imediatamente */
  onValueChange?: (values: string[]) => void
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
  /** Optional page size usado para calcular altura maxima automaticamente */
  pageSize?: number
  /** Altura maxima absoluta em px para o container de opcoes */
  optionsMaxHeight?: number
  /** Selection mode */
  selectionMode?: 'multiple' | 'single'
  /** Whether to present the Select All action */
  showSelectAll?: boolean
  /** Optional container element for the popover portal */
  portalContainer?: HTMLElement | null
  /** Emphasize the trigger as a highlighted (primary) filter */
  highlighted?: boolean
  /** Custom class applied to the trigger button when highlighted */
  highlightClassName?: string
  /** Badge text shown beside the label when highlighted */
  highlightBadgeText?: string
  /** Commit mode: immediate (padrao) reaplica a cada clique; manual exige acao do usuario */
  commitMode?: MultiSelectCommitMode
  /** Callback chamada quando o usuario confirma a selecao manualmente */
  onApply?: (values: string[]) => void
  /** Callback chamada ao cancelar uma selecao em progresso */
  onCancel?: () => void
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
  onValueChange = () => {},
  placeholder = 'Selecione...',
  label,
  showLabel = true,
  maxDisplayItems = 3,
  searchable = true,
  className,
  size = 'default',
  disabled = false,
  showAvailableCount = false,
  pageSize = MULTI_SELECT_MAX_VISIBLE_OPTIONS,
  optionsMaxHeight,
  selectionMode = 'multiple',
  showSelectAll = true,
  portalContainer,
  highlighted = false,
  highlightClassName,
  highlightBadgeText,
  commitMode = 'immediate',
  onApply,
  onCancel,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const isManualCommit = commitMode === 'manual'
  const [draftValue, setDraftValue] = React.useState<string[]>(value)

  React.useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  // Sanitize values to only include valid options
  const sanitizedValues = React.useMemo(() => {
    const validValues = options.map((opt) => opt.value)
    return value.filter((v) => validValues.includes(v))
  }, [value, options])

  // Use sanitized values for all operations
  const effectiveValue = sanitizedValues

  React.useEffect(() => {
    if (isManualCommit) {
      if (open) {
        setDraftValue(effectiveValue)
      } else {
        setDraftValue(effectiveValue)
      }
    }
  }, [isManualCommit, open, effectiveValue])

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower),
    )
  }, [options, search])

  const currentValue = isManualCommit ? draftValue : effectiveValue

  const effectivePageSize = React.useMemo(() => {
    if (!pageSize || pageSize <= 0) {
      return MULTI_SELECT_MAX_VISIBLE_OPTIONS
    }

    const normalized = Math.floor(pageSize)
    return Math.max(1, Math.min(MULTI_SELECT_MAX_VISIBLE_OPTIONS, normalized))
  }, [pageSize])

  const resolvedOptionsMaxHeight = React.useMemo(() => {
    if (typeof optionsMaxHeight === 'number' && optionsMaxHeight > 0) {
      return optionsMaxHeight
    }

    if (!effectivePageSize) {
      return MULTI_SELECT_MAX_VISIBLE_OPTIONS * MULTI_SELECT_ROW_HEIGHT
    }

    return Math.max(
      MULTI_SELECT_ROW_HEIGHT,
      effectivePageSize * MULTI_SELECT_ROW_HEIGHT,
    )
  }, [optionsMaxHeight, effectivePageSize])

  // Handle option selection - simplified toggle logic
  const handleSelect = (optionValue: string) => {
    if (selectionMode === 'single') {
      if (isManualCommit) {
        setDraftValue(optionValue ? [optionValue] : [])
      } else {
        onValueChange(optionValue ? [optionValue] : [])
      }
      return
    }

    if (isManualCommit) {
      if (currentValue.includes(optionValue)) {
        setDraftValue(currentValue.filter((v) => v !== optionValue))
      } else {
        setDraftValue([...currentValue, optionValue])
      }
      return
    }

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
    if (selectionMode === 'single') {
      const firstEnabled = options.find((opt) => !opt.disabled)
      if (isManualCommit) {
        setDraftValue(firstEnabled ? [firstEnabled.value] : [])
      } else {
        onValueChange(firstEnabled ? [firstEnabled.value] : [])
      }
      return
    }

    const enabledOptions = options.filter((opt) => !opt.disabled)
    const allValues = enabledOptions.map((opt) => opt.value)
    if (isManualCommit) {
      setDraftValue(allValues)
    } else {
      onValueChange(allValues)
    }
  }

  // Handle clear all
  const handleClearAll = () => {
    if (isManualCommit) {
      setDraftValue([])
    } else {
      onValueChange([])
    }
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

      if (selectionMode === 'single') {
        if (selectedCount === 0) {
          return `${baseLabel} (Todos)`
        }
        const firstOption = options.find((opt) => opt.value === effectiveValue[0])
        return firstOption?.label || `${baseLabel}`
      }

      if (enabledCount === 0) {
        return `${baseLabel} (0)`
      }

      if (selectedCount === 0) {
        return `${baseLabel} (0)`
      }

      if (selectedCount >= enabledCount) {
        return `${baseLabel} (${enabledCount})`
      }

      return `${baseLabel} (${selectedCount})`
    }

    if (effectiveValue.length === 0) return placeholder

    const selectedOptions = options.filter((opt) =>
      effectiveValue.includes(opt.value),
    )

    if (selectionMode === 'single') {
      const single = selectedOptions[0]
      return single?.label || placeholder
    }

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
    <div
      data-highlighted={highlighted ? '' : undefined}
      className={cn('flex items-center gap-2', className)}
    >
      {label && showLabel && (
        <label
          id={labelId}
          htmlFor={triggerId}
          className={cn(
            'text-sm font-medium text-muted-foreground whitespace-nowrap flex items-center gap-2',
            highlighted && 'text-primary',
          )}
        >
          <span>{label}:</span>
          {highlighted && highlightBadgeText && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {highlightBadgeText}
            </span>
          )}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={
              label
                ? highlighted && highlightBadgeText
                  ? label + ' (' + highlightBadgeText + ')'
                  : label
                : highlighted && highlightBadgeText
                  ? highlightBadgeText
                  : 'Multi-select'
            }
            aria-labelledby={label ? labelId : undefined}
            disabled={disabled}
            className={cn(
              'justify-between overflow-hidden',
              sizeClasses[size],
              className,
              highlighted
                && (
                  highlightClassName
                    ?? 'border-primary text-primary bg-primary/10 shadow-[0_0_0_1px_rgba(37,99,235,0.35)]'
                ),
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
          container={portalContainer}
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

            {selectionMode === 'multiple' && showSelectAll && (
              <>
                <label className="flex items-center gap-2 px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b">
                  <input
                    type="checkbox"
                    checked={
                      currentValue.length ===
                      options.filter((opt) => !opt.disabled).length &&
                      currentValue.length > 0
                    }
                    ref={(input) => {
                      if (input) {
                        const enabledCount = options.filter(
                          (opt) => !opt.disabled,
                        ).length
                        const selectedCount = currentValue.length
                        input.indeterminate =
                          selectedCount > 0 && selectedCount < enabledCount
                      }
                    }}
                    onChange={() => {
                      const enabledOptions = options.filter((opt) => !opt.disabled)
                      const allSelected =
                        currentValue.length === enabledOptions.length &&
                        currentValue.length > 0
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
                    {currentValue.length}/
                    {options.filter((opt) => !opt.disabled).length}
                  </span>
                </label>

                <Separator />
              </>
            )}

            {filteredOptions.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma opção encontrada
              </div>
            )}

            {filteredOptions.length > 0 && (
              <div
                className="p-1 pr-1 overflow-y-auto scrollbar-vertical"
                style={{
                  maxHeight: resolvedOptionsMaxHeight,
                  scrollbarGutter: 'stable',
                }}
                onWheel={(event) => event.stopPropagation()}
              >
                <div className="space-y-1">
                  {filteredOptions.map((option) => {
                    const isSelected = currentValue.includes(option.value)

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
                            onChange={() => {
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
            )}
            {isManualCommit && (
              <div className="flex items-center justify-end gap-2 border-t px-3 py-2 bg-muted/40">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraftValue(effectiveValue)
                    onCancel?.()
                    setOpen(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const target = onApply ?? onValueChange
                    target?.(draftValue)
                    setOpen(false)
                  }}
                >
                  Aplicar
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
