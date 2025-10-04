/**
 * No Movement Modal
 * Main modal for products without movement analysis
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
import { BarChart3, Loader2, AlertCircle, Download } from 'lucide-react'
import { NoMovementForm } from './no-movement-form'
import { NoMovementResults } from './no-movement-results'
import { useNoMovement } from '@/modules/produtos/hooks/use-no-movement'
import type {
  NoMovementConfig,
  NoMovementResult,
} from '@/modules/no-movement/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/modules/ui/hooks/use-toast'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import { useNoMovementConfig } from '@/modules/produtos/contexts/no-movement-context'
import { ENV_CONFIG } from '@/modules/core/config/environment'

interface NoMovementModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
  /** Organization ID for the analysis */
  organizationId?: string
  /** Products available based on current filters */
  products: Produto[]
}

/**
 * Main modal component for no movement analysis
 * Handles the complete workflow from configuration to results display
 */
export function NoMovementModal({
  open,
  onOpenChange,
  organizationId,
  products,
}: NoMovementModalProps) {
  const { toast } = useToast()
  const { config: savedConfig, saveConfig } = useNoMovementConfig()
  const [results, setResults] = React.useState<NoMovementResult | null>(null)
  const [view, setView] = React.useState<'form' | 'results'>('form')
  const [resultsFilters, setResultsFilters] = React.useState<React.ReactNode>(null)
  const effectiveOrganizationId = React.useMemo(
    () => organizationId || (ENV_CONFIG.useMockData ? 'mock-org-123' : undefined),
    [organizationId]
  )
  const hasOrganization = Boolean(effectiveOrganizationId)

  // No movement hook
  const { analyzeProducts, isAnalyzing, exportResults, isExporting } = useNoMovement()

  // Reset state when modal closes or view changes
  React.useEffect(() => {
    if (!open) {
      document.body.style.pointerEvents = ''
      setResults(null)
      setView('form')
      setResultsFilters(null)
    }

    return () => {
      document.body.style.pointerEvents = ''
    }
  }, [open])

  React.useEffect(() => {
    if (view === 'form') {
      setResultsFilters(null)
    }
  }, [view])

  /**
   * Handle form submission
   */
  const handleAnalyze = React.useCallback(
    async (config: Partial<NoMovementConfig>) => {
      if (!effectiveOrganizationId) {
        toast({
          title: 'Sessão inválida',
          description:
            'Não foi possível identificar a organização. Atualize a página e tente novamente.',
          variant: 'destructive',
        })
        return
      }

      const fullConfig: Partial<NoMovementConfig> = {
        ...config,
        organizationId: effectiveOrganizationId,
      }

      // Save configuration for future use
      saveConfig(fullConfig)

      // Analyze products
      analyzeProducts(fullConfig, {
        onSuccess: (data) => {
          setResults(data)
          setView('results')
          toast({
            title: 'Análise concluída',
            description: `${data.summary.productsWithoutMovement} produtos sem movimentação identificados.`,
          })
        },
      })
    },
    [organizationId, analyzeProducts, saveConfig, toast]
  )

  /**
   * Handle export
   */
  const handleExport = React.useCallback(
    (format: 'csv' | 'excel') => {
      if (!results) return

      exportResults({
        products: results.products,
        format,
        summary: results.summary,
      })
    },
    [results, exportResults]
  )

  /**
   * Handle back to form
   */
  const handleBackToForm = React.useCallback(() => {
    setView('form')
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${view === 'results' ? '!max-w-7xl' : '!max-w-3xl'} max-h-[90vh] overflow-hidden flex flex-col`}>
        <DialogHeader>
          <div className="flex items-start justify-between w-full">
            <div className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Produtos sem Movimentação
              </DialogTitle>
              <DialogDescription className="mt-1">
                {view === 'form'
                  ? 'Identifique os produtos sem movimentação para planejar ações de venda'
                  : `${results?.summary.totalProducts || 0} produtos analisados`}
              </DialogDescription>
            </div>
            {view === 'results' && resultsFilters && (
              <div className="ml-8 flex-shrink-0">
                {resultsFilters}
              </div>
            )}
          </div>
        </DialogHeader>

        <DialogMain className="flex-1 overflow-y-auto">
          {!hasOrganization && ENV_CONFIG.useMockData && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Modo de desenvolvimento ativado. Usando dados simulados para teste.
              </AlertDescription>
            </Alert>
          )}

          {view === 'form' ? (
            <NoMovementForm
              onSubmit={handleAnalyze}
              isLoading={isAnalyzing}
              initialConfig={savedConfig}
              products={products}
            />
          ) : (
            <NoMovementResults
              results={results!}
              onExport={handleExport}
              isExporting={isExporting}
              products={products}
              onFiltersReady={setResultsFilters}
            />
          )}
        </DialogMain>

        <DialogFooter>
          {view === 'form' ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="no-movement-form"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analisar
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToForm}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
