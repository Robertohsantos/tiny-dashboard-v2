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
import { PurchaseListModal } from './purchase-list-modal'
import { ENV_CONFIG } from '@/modules/core/config/environment'

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
  const [showPurchaseList, setShowPurchaseList] = React.useState(false)
  const hasOrganization = Boolean(organizationId)

  // Purchase requirement hook
  const { calculateRequirement, isCalculating, error } =
    usePurchaseRequirement()

  // Reset state when modal closes and reopens
  React.useEffect(() => {
    if (open && !showPurchaseList) {
      // Only reset results if we're not coming back from purchase list
      setResults(null)
    }
  }, [open, showPurchaseList])

  /**
   * Handle form submission
   */
  const handleCalculate = async (
    config: Partial<PurchaseRequirementConfig>,
  ) => {
    // Use fallback organizationId in development mode with mock data
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
      // Convert initial filters from singular to plural format
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

      const result = await calculateRequirement({
        organizationId: effectiveOrganizationId,
        ...config,
        filters: sanitizedFilters,
      })

      if (result) {
        setResults(result)

        // Show success message
        toast({
          title: 'Cálculo concluído',
          description: `Analisados ${result.totalProducts} produtos, ${result.productsNeedingOrder} precisam de reposição`,
        })

        // Open purchase list modal
        setShowPurchaseList(true)
        // Close the config modal
        onOpenChange(false)
      }
    } catch (err) {
      console.error('Error calculating requirements:', err)
      toast({
        title: 'Erro no cálculo',
        description: 'Não foi possível calcular a necessidade de compra',
        variant: 'destructive',
      })
    }
  }

  /**
   * Handle close
   */
  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Necessidade de Compra
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Calcule a necessidade de compra baseada na cobertura de estoque
              </p>
            </div>
          </DialogHeader>

          <DialogMain className="flex-1 min-h-0 overflow-auto">
            {/* Error Alert */}
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
                  Não foi possível carregar os dados da organização. Recarregue
                  a página ou selecione uma organização válida para calcular.
                </AlertDescription>
              </Alert>
            )}

            {/* Form Content */}
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
        </DialogContent>
      </Dialog>

      {/* Purchase List Modal */}
      <PurchaseListModal
        open={showPurchaseList}
        onOpenChange={setShowPurchaseList}
        results={results}
        onBack={() => {
          setShowPurchaseList(false)
          onOpenChange(true)
        }}
      />
    </>
  )
}
