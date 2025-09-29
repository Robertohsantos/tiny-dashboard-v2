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
import { Checkbox } from '@/components/ui/checkbox'
import { Settings, Package, Sparkles } from 'lucide-react'

interface DefaultCoverageDaysModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
  /** Current default coverage days */
  currentDefault: number
  /** Callback when values are saved */
  onSave: (days: number, deliveryEnabled: boolean, deliveryDays: number) => void
  /** Current delivery buffer settings */
  currentDeliveryEnabled?: boolean
  currentDeliveryDays?: number
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
  currentDeliveryEnabled = false,
  currentDeliveryDays = 0,
  minDays = 1,
  maxDays = 365,
}: DefaultCoverageDaysModalProps) {
  const [value, setValue] = useState<string>(String(currentDefault))
  const [error, setError] = useState<string>('')
  const [deliveryEnabled, setDeliveryEnabled] = useState(currentDeliveryEnabled)
  const [deliveryDays, setDeliveryDays] = useState<string>(String(currentDeliveryDays))
  const [deliveryError, setDeliveryError] = useState<string>('')

  // Reset values when modal opens
  React.useEffect(() => {
    if (open) {
      setValue(String(currentDefault))
      setError('')
      setDeliveryEnabled(currentDeliveryEnabled)
      setDeliveryDays(String(currentDeliveryDays))
      setDeliveryError('')
    }
  }, [open, currentDefault, currentDeliveryEnabled, currentDeliveryDays])

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
   * Validate delivery days value
   */
  const validateDeliveryDays = (input: string): boolean => {
    if (!deliveryEnabled) return true // Skip validation if disabled
    
    const num = parseInt(input, 10)

    if (isNaN(num)) {
      setDeliveryError('Digite um número válido')
      return false
    }

    if (num < 0) {
      setDeliveryError('O valor mínimo é 0 dias')
      return false
    }

    if (num > 90) {
      setDeliveryError('O valor máximo é 90 dias')
      return false
    }

    setDeliveryError('')
    return true
  }

  /**
   * Handle delivery days change
   */
  const handleDeliveryDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDeliveryDays(newValue)

    // Clear error when user starts typing
    if (deliveryError) {
      setDeliveryError('')
    }
  }

  /**
   * Handle save
   */
  const handleSave = () => {
    const isCoverageValid = validateValue(value)
    const isDeliveryValid = validateDeliveryDays(deliveryDays)
    
    if (isCoverageValid && isDeliveryValid) {
      onSave(
        parseInt(value, 10),
        deliveryEnabled,
        deliveryEnabled ? parseInt(deliveryDays, 10) : 0
      )
      onOpenChange(false)
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setValue(String(currentDefault))
    setError('')
    setDeliveryEnabled(currentDeliveryEnabled)
    setDeliveryDays(String(currentDeliveryDays))
    setDeliveryError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-4">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Configurações Padrão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Coverage Days Section */}
          <div className="space-y-2">
            <Label htmlFor="default-days" className="text-sm font-medium">
              Dias de Cobertura
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
            <p className="text-xs text-muted-foreground">
              Valor padrão de dias usado no cálculo da cobertura de estoque.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Delivery Buffer Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delivery-buffer"
                checked={deliveryEnabled}
                onCheckedChange={(checked) => setDeliveryEnabled(checked as boolean)}
              />
              <label
                htmlFor="delivery-buffer"
                className="text-sm font-medium cursor-pointer select-none"
              >
                Incluir Prazo de Entrega
              </label>
            </div>
            
            {/* Campo de entrada */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="delivery-days"
                  type="number"
                  value={deliveryDays}
                  onChange={handleDeliveryDaysChange}
                  onKeyDown={(e) => {
                    if (!deliveryEnabled) return
                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      const current = parseInt(deliveryDays) || 0
                      const newValue = Math.min(current + 1, 90)
                      setDeliveryDays(String(newValue))
                      setDeliveryError('')
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      const current = parseInt(deliveryDays) || 0
                      const newValue = Math.max(current - 1, 0)
                      setDeliveryDays(String(newValue))
                      setDeliveryError('')
                    }
                  }}
                  min={0}
                  max={90}
                  className="w-32 h-9 text-sm"
                  placeholder="0"
                  disabled={!deliveryEnabled}
                />
                <span className="text-sm text-muted-foreground">dias extras</span>
              </div>
              {deliveryError && <p className="text-xs text-destructive">{deliveryError}</p>}
              <p className="text-xs text-muted-foreground">
                Valor padrão de dias considerado como prazo de entrega dos fornecedores.
              </p>
            </div>
          </div>

          {/* Saved Values Display */}
          <div className="rounded-md bg-muted/50 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Valores Salvos</span>
            </div>
            <div className="ml-5 space-y-1">
              <p className="text-xs text-muted-foreground">
                Cobertura: <span className="font-medium">{currentDefault} dias</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Prazo de entrega: <span className="font-medium">{
                  currentDeliveryEnabled 
                    ? `+${currentDeliveryDays} dias` 
                    : 'Desabilitado'
                }</span>
              </p>
            </div>
          </div>

          {/* Preview Changes */}
          {(parseInt(value, 10) !== currentDefault || deliveryEnabled !== currentDeliveryEnabled || (deliveryEnabled && parseInt(deliveryDays, 10) !== currentDeliveryDays)) && (
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Preview das Alterações</span>
              </div>
              <div className="ml-5 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Nova cobertura: <span className="font-medium text-foreground">{parseInt(value) || 0} dias</span>
                  {parseInt(value) !== currentDefault && (
                    <span className={`ml-1 text-xs font-medium ${
                      parseInt(value) > currentDefault ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      ({parseInt(value) > currentDefault ? '+' : ''}{parseInt(value) - currentDefault})
                    </span>
                  )}
                </p>
                {deliveryEnabled && (
                  <p className="text-xs text-muted-foreground">
                    Prazo de entrega: <span className="font-medium text-foreground">+{parseInt(deliveryDays) || 0} dias</span>
                    {(deliveryEnabled !== currentDeliveryEnabled || parseInt(deliveryDays) !== currentDeliveryDays) && (
                      <span className="ml-1 text-xs font-medium text-green-600">
                        {!currentDeliveryEnabled ? '(novo)' : `(${parseInt(deliveryDays) > currentDeliveryDays ? '+' : ''}${parseInt(deliveryDays) - currentDeliveryDays})`}
                      </span>
                    )}
                  </p>
                )}
                <div className="pt-1 mt-1 border-t border-primary/10">
                  <p className="text-xs font-medium text-primary">
                    Cobertura total: {(parseInt(value) || 0) + (deliveryEnabled ? (parseInt(deliveryDays) || 0) : 0)} dias
                  </p>
                </div>
              </div>
            </div>
          )}
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
            disabled={!value || !!error || !!deliveryError}
            className="h-8 text-sm"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
