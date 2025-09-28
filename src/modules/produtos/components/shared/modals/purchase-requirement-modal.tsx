/**
 * Purchase Requirement Modal
 * Main modal for calculating purchase requirements/necessity
 */

'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogMain,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Loader2, AlertCircle } from 'lucide-react'
import { PurchaseRequirementForm } from './purchase-requirement-form'
import { usePurchaseRequirement } from '@/modules/produtos/hooks/use-purchase-requirement'
import type {
  PurchaseRequirementConfig,
  PurchaseBatchResult,
} from '@/modules/purchase-requirement/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/modules/ui/hooks/use-toast'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import { PurchaseListView } from './purchase-list-view'
import { ENV_CONFIG } from '@/modules/core/config/environment'
import { cn } from '@/modules/ui'

interface PurchaseRequirementModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
  /** Organization ID for the calculation */
  organizationId?: string
  /** Initial filters from the products page */
  initialFilters?: {
    deposito?: string[]
    marca?: string[]
    fornecedor?: string[]
  }
  /** Products available based on current filters */
  products: Produto[]
}

/**
 * Main modal component for purchase requirement calculations
 * Handles the complete workflow from configuration to results display
 */
export function PurchaseRequirementModal({
  open,
  onOpenChange,
  organizationId,
  initialFilters,
  products,
}: PurchaseRequirementModalProps) {
  const { toast } = useToast()
  const [results, setResults] = React.useState<PurchaseBatchResult | null>(null)
  const [view, setView] = React.useState<'form' | 'list'>('form')
  const [activeConfig, setActiveConfig] = React.useState<Partial<PurchaseRequirementConfig> | null>(null)
  const hasOrganization = Boolean(organizationId)

  // Purchase requirement hook
  const { calculateRequirement, isCalculating, error } =
    usePurchaseRequirement()

  // Reset state when modal closes and reopens
  React.useEffect(() => {
    if (!open) {
      document.body.style.pointerEvents = ''
      setResults(null)
      setView('form')
      setActiveConfig(null)
    }

    return () => {
      document.body.style.pointerEvents = ''
    }
  }, [open])

  /**
   * Handle form submission
   */
  const handleCalculate = React.useCallback(
    async (config: Partial<PurchaseRequirementConfig>) => {
      const effectiveOrganizationId =
        organizationId || (ENV_CONFIG.useMockData ? 'mock-org-123' : null)

      if (!effectiveOrganizationId) {
        console.error(
          'Attempted to calculate purchase requirements without organizationId',
        )
        toast({
          title: 'Sessão inválida',
          description:
            'Não foi possível identificar a organização. Atualize a página e tente novamente.',
          variant: 'destructive',
        })
        return
      }

      try {
        const convertedInitialFilters = {
          depositos: initialFilters?.deposito?.filter(Boolean),
          marcas: initialFilters?.marca?.filter(Boolean),
          fornecedores: initialFilters?.fornecedor?.filter(Boolean),
        }

        const mergedFilters = {
          ...convertedInitialFilters,
          ...config.filters,
        }

        const productSkus = products
          .map((product) => product.sku)
          .filter((sku): sku is string => Boolean(sku))

        if (!mergedFilters.skus?.length && productSkus.length) {
          mergedFilters.skus = productSkus
        }

        const sanitizedFilters = Object.fromEntries(
          Object.entries(mergedFilters).filter(([, value]) =>
            value !== undefined && value !== null,
          ),
        ) as PurchaseRequirementConfig['filters']

        const includeDeliveryBuffer =
          config.includeDeliveryBuffer ??
          activeConfig?.includeDeliveryBuffer ??
          false

        const rawDeliveryBufferDays =
          typeof config.deliveryBufferDays === 'number'
            ? config.deliveryBufferDays
            : activeConfig?.deliveryBufferDays ?? 0

        const normalizedDeliveryBufferDays = includeDeliveryBuffer
          ? Math.max(0, rawDeliveryBufferDays)
          : 0

        const requestConfig: Partial<PurchaseRequirementConfig> = {
          ...config,
          includeDeliveryBuffer,
          deliveryBufferDays: normalizedDeliveryBufferDays,
          filters: sanitizedFilters,
        }

        const result = await calculateRequirement({
          organizationId: effectiveOrganizationId,
          ...requestConfig,
        })

        if (result) {
          setActiveConfig(requestConfig)
          setResults(result)
          setView('list')

          toast({
            title: 'Cálculo concluído',
            description: `Analisados ${result.totalProducts} produtos, ${result.productsNeedingOrder} precisam de reposição`,
          })
        }
      } catch (err) {
        console.error('Error calculating requirements:', err)
        toast({
          title: 'Erro no cálculo',
          description: 'Não foi possível calcular a necessidade de compra',
          variant: 'destructive',
        })
      }
    },
    [
      organizationId,
      initialFilters,
      products,
      calculateRequirement,
      toast,
      activeConfig,
    ],
  )

  const handleConfigUpdate = React.useCallback(
    async (updates: Partial<PurchaseRequirementConfig>) => {
      const baseConfig = activeConfig ?? {}
      const mergedFilters = {
        ...(baseConfig.filters ?? {}),
        ...(updates.filters ?? {}),
      }

      const nextConfig: Partial<PurchaseRequirementConfig> = {
        ...baseConfig,
        ...updates,
        filters: mergedFilters,
      }

      await handleCalculate(nextConfig)
    },
    [activeConfig, handleCalculate],
  )

  /**
   * Handle close
   */
  const handleClose = React.useCallback(() => {
    console.log('[PurchaseRequirementModal] handleClose', {
      open,
      view,
      hasResults: Boolean(results),
    })
    onOpenChange(false)
  }, [onOpenChange, open, view, results])

  const handleDialogOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleClose()
      }
    },
    [handleClose],
  )

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col',
          view === 'list'
            ? 'h-[90vh] max-h-[90vh] sm:max-w-6xl p-0 gap-0 overflow-hidden'
            : 'max-h-[90vh] sm:max-w-2xl p-9 gap-6 overflow-y-auto'
        )}
        aria-describedby={
          view === 'form'
            ? 'purchase-requirement-description'
            : 'purchase-list-description'
        }
      >
        {view === 'form' ? (
          <>
            <DialogHeader>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Necessidade de Compra
                </DialogTitle>
                <DialogDescription id="purchase-requirement-description">
                  Calcule a necessidade de compra baseado na cobertura de
                  estoque atual e gere recomendações automáticas.
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogMain className="flex-1 min-h-0 overflow-auto">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {!hasOrganization && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Não foi possível carregar os dados da organização.
                    Recarregue a página ou selecione uma organização válida
                    para calcular.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                <PurchaseRequirementForm
                  onSubmit={handleCalculate}
                  isLoading={isCalculating}
                  initialFilters={initialFilters}
                  products={products}
                />
              </div>
            </DialogMain>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const form = document.getElementById(
                    'purchase-requirement-form',
                  ) as HTMLFormElement
                  form?.requestSubmit()
                }}
                disabled={isCalculating || !hasOrganization}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Calcular Necessidade
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          results && (
            <PurchaseListView
              results={results}
              onClose={handleClose}
              onBack={() => setView('form')}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  )
}




