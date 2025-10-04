/**
 * No Movement Hook
 * React Query v5 hook for products without movement analysis
 */

'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import type {
  NoMovementConfig,
  NoMovementResult,
  NoMovementResponse,
} from '@/modules/no-movement/types'
import { useToast } from '@/modules/ui/hooks/use-toast'
import { ENV_CONFIG } from '@/modules/core/config/environment'

// Import telemetry directly
let telemetry: any = null
if (typeof window === 'undefined') {
  import('@/modules/core/services/telemetry').then(module => {
    telemetry = module.telemetry
  })
}

/**
 * Fetch no movement analysis
 */
async function fetchNoMovementAnalysis(
  config: Partial<NoMovementConfig>
): Promise<NoMovementResult> {
  const response = await fetch('/api/products/no-movement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ config }),
  })

  if (!response.ok) {
    let errorMessage = 'Failed to analyze products'
    try {
      const rawBody = await response.text()
      console.error('[no-movement] Analysis request failed', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: rawBody,
      })

      if (rawBody) {
        try {
          const parsed = JSON.parse(rawBody)
          errorMessage = parsed?.error?.message || parsed?.message || errorMessage
        } catch {
          errorMessage = rawBody.trim()
        }
      }
    } catch (error) {
      console.warn('Failed to inspect error response for no-movement analysis:', error)
    }

    throw new Error(errorMessage)
  }

  const data: NoMovementResponse = await response.json()
  
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to analyze products')
  }

  return data.data
}

/**
 * Fetch filter options
 */
async function fetchFilterOptions(
  organizationId?: string,
): Promise<{
  depositos: string[]
  marcas: string[]
  fornecedores: string[]
  categorias: string[]
}> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ''

  const response = await fetch(`/api/products/no-movement${query}`, {
    method: 'GET',
  })

  if (!response.ok) {
    if (response.status === 401) {
      return {
        depositos: [],
        marcas: [],
        fornecedores: [],
        categorias: [],
      }
    }

    const error = await response.json().catch(() => null)
    throw new Error(error?.error?.message || 'Failed to fetch filter options')
  }

  const data = await response.json()
  return data.data?.filters || {
    depositos: [],
    marcas: [],
    fornecedores: [],
    categorias: [],
  }
}

/**
 * Export no movement analysis
 */
async function exportNoMovementAnalysis(
  products: any[],
  format: 'csv' | 'excel',
  summary?: any
): Promise<Blob> {
  const response = await fetch('/api/products/no-movement/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products, format, summary }),
  })

  if (!response.ok) {
    let errorMessage = 'Failed to export analysis'
    try {
      const rawBody = await response.text()
      console.error('[no-movement] Export request failed', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: rawBody,
      })

      if (rawBody) {
        try {
          const parsed = JSON.parse(rawBody)
          errorMessage = parsed?.error?.message || parsed?.message || errorMessage
        } catch {
          errorMessage = rawBody.trim()
        }
      }
    } catch (error) {
      console.warn('Failed to inspect error response for no-movement export:', error)
    }

    throw new Error(errorMessage)
  }

  return response.blob()
}

/**
 * Hook for no movement analysis
 */
export function useNoMovement() {
  const { toast } = useToast()

  /**
   * Mutation for analyzing products
   */
  const analyzeProducts = useMutation({
    mutationFn: fetchNoMovementAnalysis,
    onSuccess: (data) => {
      telemetry?.recordEvent?.('no_movement_analysis_success', {
        productsCount: data.products.length,
        productsWithoutMovement: data.summary.productsWithoutMovement,
      })
    },
    onError: (error: Error) => {
      console.error('No movement analysis error:', error)
      toast({
        title: 'Erro na análise',
        description: error.message || 'Não foi possível analisar os produtos',
        variant: 'destructive',
      })
      telemetry?.recordEvent?.('no_movement_analysis_error', {
        error: error.message,
      })
    },
  })

  /**
   * Mutation for exporting results
   */
  const exportResults = useMutation({
    mutationFn: ({ 
      products, 
      format, 
      summary 
    }: { 
      products: any[]
      format: 'csv' | 'excel'
      summary?: any 
    }) => exportNoMovementAnalysis(products, format, summary),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const extension = variables.format === 'excel' ? 'xls' : 'csv'
      a.download = `produtos-sem-movimentacao-${new Date().toISOString().split('T')[0]}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação concluída',
        description: `Relatório exportado com sucesso em formato ${variables.format.toUpperCase()}`,
      })

      telemetry?.recordEvent?.('no_movement_export_success', {
        format: variables.format,
        productsCount: variables.products.length,
      })
    },
    onError: (error: Error) => {
      console.error('Export error:', error)
      toast({
        title: 'Erro na exportação',
        description: error.message || 'Não foi possível exportar o relatório',
        variant: 'destructive',
      })
      telemetry?.recordEvent?.('no_movement_export_error', {
        error: error.message,
      })
    },
  })

  return {
    analyzeProducts: analyzeProducts.mutate,
    isAnalyzing: analyzeProducts.isPending,
    analysisError: analyzeProducts.error,
    exportResults: exportResults.mutate,
    isExporting: exportResults.isPending,
    exportError: exportResults.error,
  }
}

/**
 * Hook for filter options
 */
export function useNoMovementFilters(organizationId?: string) {
  const shouldFetch = Boolean(organizationId) || ENV_CONFIG.useMockData

  return useQuery({
    queryKey: ['no-movement-filters', organizationId ?? 'mock'],
    queryFn: () => fetchFilterOptions(organizationId ?? (ENV_CONFIG.useMockData ? 'mock-org-123' : undefined)),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for cached analysis results
 */
export function useNoMovementAnalysis(
  config: Partial<NoMovementConfig> | null,
  enabled = false
) {
  return useQuery({
    queryKey: ['no-movement-analysis', config],
    queryFn: () => fetchNoMovementAnalysis(config!),
    enabled: enabled && !!config,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}
