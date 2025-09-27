/**
 * Modal for configuring default coverage days
 * Allows user to set a default value for coverage days calculation
 */

'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'

interface DefaultCoverageDaysModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
  /** Current default value */
  currentDefault: number
  /** Callback when value is saved */
  onSave: (days: number) => void
  /** Minimum allowed days */
  minDays?: number
  /** Maximum allowed days */
  maxDays?: number
}

/**
 * Modal component for setting default coverage days
 * Provides a simple form with validation for setting the default value
 */
export function DefaultCoverageDaysModal({
  open,
  onOpenChange,
  currentDefault,
  onSave,
  minDays = 1,
  maxDays = 365,
}: DefaultCoverageDaysModalProps) {
  const [value, setValue] = useState<string>(String(currentDefault))
  const [error, setError] = useState<string>('')

  // Reset value when modal opens
  React.useEffect(() => {
    if (open) {
      setValue(String(currentDefault))
      setError('')
    }
  }, [open, currentDefault])

  /**
   * Validate input value
   */
  const validateValue = (input: string): boolean => {
    const num = parseInt(input, 10)

    if (isNaN(num)) {
      setError('Digite um número válido')
      return false
    }

    if (num < minDays) {
      setError(`O valor mínimo é ${minDays} dia${minDays > 1 ? 's' : ''}`)
      return false
    }

    if (num > maxDays) {
      setError(`O valor máximo é ${maxDays} dias`)
      return false
    }

    setError('')
    return true
  }

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  /**
   * Handle save
   */
  const handleSave = () => {
    if (validateValue(value)) {
      onSave(parseInt(value, 10))
      onOpenChange(false)
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setValue(String(currentDefault))
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] p-4">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Definir Dias Padrão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="default-days" className="text-sm font-medium">
              Dias de Cobertura Padrão
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="default-days"
                type="number"
                value={value}
                onChange={handleChange}
                min={minDays}
                max={maxDays}
                className="w-32 h-9 text-sm"
                placeholder="30"
              />
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-sm text-muted-foreground">
              Este valor será usado como padrão sempre que o modal de
              necessidade de compra for aberto.
            </p>
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Atual:</span> {currentDefault} dias
            </p>
          </div>
        </div>

        <DialogFooter className="pt-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="h-8 text-sm"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!value || !!error}
            className="h-8 text-sm"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
