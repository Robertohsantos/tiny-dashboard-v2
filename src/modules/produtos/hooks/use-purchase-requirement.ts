/**
 * React Query hook for Purchase Requirement calculations
 * Manages API calls and state for purchase requirement features
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  PurchaseRequirementConfig,
  PurchaseBatchResult,
  PurchaseRequirementResult,
  PurchaseSimulation,
} from '@/modules/purchase-requirement/types'

/**
 * Query keys for React Query
 */
const queryKeys = {
  all: ['purchase-requirement'] as const,
  batch: (organizationId: string, config: Partial<PurchaseRequirementConfig>) =>
    [...queryKeys.all, 'batch', organizationId, config] as const,
  single: (productId: string, config: Partial<PurchaseRequirementConfig>) =>
    [...queryKeys.all, 'single', productId, config] as const,
  risk: (organizationId: string, threshold: number) =>
    [...queryKeys.all, 'risk', organizationId, threshold] as const,
  simulation: (organizationId: string, simulation: PurchaseSimulation) =>
    [...queryKeys.all, 'simulation', organizationId, simulation] as const,
}

/**
 * API client functions
 */
const api = {
  /**
   * Calculate batch purchase requirements
   */
  calculateBatch: async (
    params: {
      organizationId: string
    } & Partial<PurchaseRequirementConfig>,
  ): Promise<PurchaseBatchResult> => {
    const response = await fetch('/api/products/purchase-requirement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        error.error || 'Failed to calculate purchase requirements',
      )
    }

    const result = await response.json()
    return result.data
  },

  /**
   * Calculate single product requirement
   */
  calculateSingle: async (
    productId: string,
    config: Partial<PurchaseRequirementConfig>,
  ): Promise<PurchaseRequirementResult> => {
    const params = new URLSearchParams({
      productId,
      coverageDays: String(config.coverageDays || 30),
      method: config.method || 'RAPID',
      leadTimeStrategy: config.leadTimeStrategy || 'P50',
      includeStockReserve: String(config.includeStockReserve !== false),
      respectPackSize: String(config.respectPackSize !== false),
    })

    const response = await fetch(`/api/products/purchase-requirement?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to calculate purchase requirement')
    }

    const result = await response.json()
    return result.data
  },

  /**
   * Get products at risk
   */
  getRiskProducts: async (
    organizationId: string,
    threshold: number = 0.5,
  ): Promise<PurchaseRequirementResult[]> => {
    const params = new URLSearchParams({
      organizationId,
      threshold: String(threshold),
    })

    const response = await fetch(
      `/api/products/purchase-requirement/risk?${params}`,
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get risk products')
    }

    const result = await response.json()
    return result.data
  },

  /**
   * Simulate scenarios
   */
  simulateScenarios: async (params: {
    organizationId: string
    scenarios: PurchaseSimulation['scenarios']
    compareResults?: boolean
  }): Promise<any> => {
    const response = await fetch(
      '/api/products/purchase-requirement/simulate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to simulate scenarios')
    }

    const result = await response.json()
    return result.data
  },

  /**
   * Validate supplier constraints
   */
  validateSupplier: async (
    supplier: string,
    orders: Array<{ sku: string; quantity: number }>,
  ): Promise<{
    valid: boolean
    totalValue: number
    meetsMinimum: boolean
    minimumRequired?: number
    issues: string[]
  }> => {
    const response = await fetch(
      '/api/products/purchase-requirement/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier, orders }),
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to validate supplier constraints')
    }

    const result = await response.json()
    return result.data
  },
}

/**
 * Hook for calculating purchase requirements (batch)
 */
export function usePurchaseRequirement() {
  const queryClient = useQueryClient()

  const calculateMutation = useMutation({
    mutationFn: api.calculateBatch,
    onSuccess: (data, variables) => {
      // Cache the result
      queryClient.setQueryData(
        queryKeys.batch(variables.organizationId, variables),
        data,
      )
    },
  })

  return {
    calculateRequirement: calculateMutation.mutateAsync,
    isCalculating: calculateMutation.isPending,
    error: calculateMutation.error?.message || null,
    reset: calculateMutation.reset,
  }
}

/**
 * Hook for getting cached purchase requirement results
 */
export function usePurchaseRequirementResults(
  organizationId: string,
  config: Partial<PurchaseRequirementConfig>,
  enabled: boolean = false,
) {
  return useQuery({
    queryKey: queryKeys.batch(organizationId, config),
    queryFn: () => api.calculateBatch({ organizationId, ...config }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for calculating single product requirement
 */
export function useSingleProductRequirement(
  productId: string | null,
  config: Partial<PurchaseRequirementConfig>,
  enabled: boolean = false,
) {
  return useQuery({
    queryKey: productId ? queryKeys.single(productId, config) : ['idle'],
    queryFn: () => (productId ? api.calculateSingle(productId, config) : null),
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook for getting products at risk of stockout
 */
export function useRiskProducts(
  organizationId: string,
  threshold: number = 0.5,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: queryKeys.risk(organizationId, threshold),
    queryFn: () => api.getRiskProducts(organizationId, threshold),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook for simulating purchase scenarios
 */
export function usePurchaseSimulation() {
  const queryClient = useQueryClient()

  const simulationMutation = useMutation({
    mutationFn: api.simulateScenarios,
    onSuccess: (data, variables) => {
      // Cache simulation results
      queryClient.setQueryData(
        queryKeys.simulation(variables.organizationId, {
          scenarios: variables.scenarios,
          compareResults: variables.compareResults || false,
        }),
        data,
      )
    },
  })

  return {
    simulate: simulationMutation.mutateAsync,
    isSimulating: simulationMutation.isPending,
    simulationResults: simulationMutation.data,
    simulationError: simulationMutation.error?.message || null,
    resetSimulation: simulationMutation.reset,
  }
}

/**
 * Hook for validating supplier constraints
 */
export function useSupplierValidation() {
  const validateMutation = useMutation({
    mutationFn: ({
      supplier,
      orders,
    }: {
      supplier: string
      orders: Array<{ sku: string; quantity: number }>
    }) => api.validateSupplier(supplier, orders),
  })

  return {
    validate: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
    validationResult: validateMutation.data,
    validationError: validateMutation.error?.message || null,
    resetValidation: validateMutation.reset,
  }
}

/**
 * Hook to prefetch purchase requirements
 */
export function usePrefetchPurchaseRequirements(organizationId: string) {
  const queryClient = useQueryClient()

  const prefetch = async (config: Partial<PurchaseRequirementConfig>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.batch(organizationId, config),
      queryFn: () => api.calculateBatch({ organizationId, ...config }),
      staleTime: 5 * 60 * 1000,
    })
  }

  return { prefetch }
}

/**
 * Hook to invalidate purchase requirement cache
 */
export function useInvalidatePurchaseRequirements() {
  const queryClient = useQueryClient()

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.all })
  }

  const invalidateBatch = (organizationId?: string) => {
    if (organizationId) {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.all, 'batch', organizationId],
      })
    } else {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.all, 'batch'],
      })
    }
  }

  const invalidateRisk = (organizationId?: string) => {
    if (organizationId) {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.all, 'risk', organizationId],
      })
    } else {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.all, 'risk'],
      })
    }
  }

  return {
    invalidateAll,
    invalidateBatch,
    invalidateRisk,
  }
}
