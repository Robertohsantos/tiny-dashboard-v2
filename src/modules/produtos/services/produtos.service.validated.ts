/**
 * Produtos Service with Zod Validation
 * Enhanced version of produtos.service.ts with runtime type safety
 * This demonstrates how to integrate Zod validation into existing services
 */

import { produtosService } from './produtos.service'
import {
  ProdutoMetricsSchema,
  ProdutoSchema,
  ProdutoDataSchema,
  StockDistributionSchema,
  type ProdutoMetricsValidated,
  type ProdutoValidated,
  type ProdutoDataValidated,
} from '@/modules/produtos/schemas/produtos.schemas'
import {
  createValidatedFetcher,
  validateApiResponse,
  batchValidate,
} from '@/modules/core/utils/validation'
import type { ProdutoFilter } from '@/modules/produtos/types/produtos.types'
import { z } from 'zod'

/**
 * Enhanced produtos service with validation
 * All methods return validated data ensuring runtime type safety
 */
class ValidatedProdutosService {
  /**
   * Get validated product metrics
   * @param filter - Optional filter parameters
   * @returns Validated product metrics
   */
  async getMetrics(filter?: ProdutoFilter): Promise<ProdutoMetricsValidated> {
    const data = await produtosService.getMetrics(filter)
    return validateApiResponse(
      ProdutoMetricsSchema,
      data,
      'Product metrics validation failed',
    )
  }

  /**
   * Get validated products list
   * @param filter - Optional filter parameters
   * @param limit - Maximum number of products
   * @returns Validated products array
   */
  async getProdutos(
    filter?: ProdutoFilter,
    limit?: number,
  ): Promise<ProdutoValidated[]> {
    const data = await produtosService.getProdutos(filter, limit)

    // Validate each product individually for better error reporting
    const validation = batchValidate(ProdutoSchema, data)

    if (validation.invalid.length > 0) {
      console.warn(
        `Product validation: ${validation.invalid.length} invalid products skipped`,
        {
          invalidProducts: validation.invalid,
        },
      )
    }

    return validation.valid
  }

  /**
   * Get validated stock distribution
   * @returns Validated stock distribution data
   */
  async getStockDistribution() {
    const data = await produtosService.getStockDistribution()

    // Validate each distribution item
    const validation = batchValidate(StockDistributionSchema, data)

    if (validation.invalid.length > 0) {
      console.warn(
        `Stock distribution validation: ${validation.invalid.length} invalid items skipped`,
        {
          invalidItems: validation.invalid,
        },
      )
    }

    return validation.valid
  }

  /**
   * Get validated products needing reorder
   * @returns Validated products that need reordering
   */
  async getProdutosReposicao(): Promise<ProdutoValidated[]> {
    const data = await produtosService.getProdutosReposicao()

    // Validate each product
    const validation = batchValidate(ProdutoSchema, data)

    if (validation.invalid.length > 0) {
      console.warn(
        `Reorder products validation: ${validation.invalid.length} invalid products skipped`,
        {
          invalidProducts: validation.invalid,
        },
      )
    }

    return validation.valid
  }

  /**
   * Get complete product data with validation
   * @param filter - Optional filter parameters
   * @returns Complete validated product data
   */
  async getCompleteProdutoData(
    filter?: ProdutoFilter,
  ): Promise<ProdutoDataValidated> {
    const data = await produtosService.getCompleteProdutoData(filter)

    // Handle date conversion for products
    if (data.produtos) {
      data.produtos = data.produtos.map((produto) => ({
        ...produto,
        ultimaAtualizacao: new Date(produto.ultimaAtualizacao),
      }))
    }

    if (data.analytics?.produtosReposicao) {
      data.analytics.produtosReposicao = data.analytics.produtosReposicao.map(
        (produto) => ({
          ...produto,
          ultimaAtualizacao: new Date(produto.ultimaAtualizacao),
        }),
      )
    }

    return validateApiResponse(
      ProdutoDataSchema,
      data,
      'Complete product data validation failed',
    )
  }

  /**
   * Get a single validated product by ID
   * @param id - Product ID
   * @returns Validated product or null if not found
   */
  async getProdutoById(id: string): Promise<ProdutoValidated | null> {
    try {
      // This assumes the service has a method to get a single product
      // If not, we can filter from the list
      const produtos = await this.getProdutos()
      const produto = produtos.find((p) => p.id === id)

      if (!produto) {
        return null
      }

      return validateApiResponse(
        ProdutoSchema,
        produto,
        `Product ${id} validation failed`,
      )
    } catch (error) {
      console.error(`Failed to get product ${id}:`, error)
      return null
    }
  }

  /**
   * Creates validated fetcher functions for React Query hooks
   * These can be used directly in React Query configurations
   */
  createValidatedFetchers() {
    return {
      metrics: createValidatedFetcher(
        (filter?: ProdutoFilter) => produtosService.getMetrics(filter),
        ProdutoMetricsSchema,
      ),
      produtos: createValidatedFetcher(
        (filter?: ProdutoFilter, limit?: number) =>
          produtosService.getProdutos(filter, limit),
        z.array(ProdutoSchema),
      ),
      stockDistribution: createValidatedFetcher(
        () => produtosService.getStockDistribution(),
        z.array(StockDistributionSchema),
      ),
      produtosReposicao: createValidatedFetcher(
        () => produtosService.getProdutosReposicao(),
        z.array(ProdutoSchema),
      ),
      completeProdutoData: createValidatedFetcher(
        (filter?: ProdutoFilter) =>
          produtosService.getCompleteProdutoData(filter),
        ProdutoDataSchema,
      ),
    }
  }

  /**
   * Validate product data before saving
   * @param produto - Product data to validate
   * @returns Validated product or throws ValidationError
   */
  validateBeforeSave(produto: unknown): ProdutoValidated {
    return validateApiResponse(
      ProdutoSchema,
      produto,
      'Product validation before save failed',
    )
  }

  /**
   * Validate partial product data for updates
   * @param partialProduto - Partial product data
   * @returns Validated partial product
   */
  validatePartialUpdate(partialProduto: unknown): Partial<ProdutoValidated> {
    const partialSchema = ProdutoSchema.partial()
    return validateApiResponse(
      partialSchema,
      partialProduto,
      'Partial product validation failed',
    )
  }
}

// Export singleton instance
export const validatedProdutosService = new ValidatedProdutosService()

// Export validated fetchers for direct use in React Query
export const produtosFetchers =
  validatedProdutosService.createValidatedFetchers()

/**
 * Example usage in React Query hook:
 *
 * import { produtosFetchers } from '@/modules/produtos/services/produtos.service.validated'
 *
 * export function useProdutosData(filter?: ProdutoFilter) {
 *   return useQuery({
 *     queryKey: ['produtos', 'complete', filter],
 *     queryFn: () => produtosFetchers.completeProdutoData(filter),
 *     // Data is guaranteed to be validated
 *   })
 * }
 */
