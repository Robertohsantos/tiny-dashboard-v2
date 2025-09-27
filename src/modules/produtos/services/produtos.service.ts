/**
 * Produtos Service
 * Handles all data fetching logic for the products dashboard
 * Single source of truth for product data access
 */

import { ENV_CONFIG } from '@/modules/core/config/environment'
import type {
  ProdutoMetrics,
  Produto,
  ProdutoFilter,
  ProdutoData,
} from '@/modules/produtos/types/produtos.types'

/**
 * Service class for managing product data
 * Provides methods for fetching metrics, products, and analytics
 */
class ProdutosService {
  private readonly useMockData: boolean

  constructor() {
    this.useMockData = ENV_CONFIG.useMockData
  }

  private hasEmptySelection(filter?: ProdutoFilter): boolean {
    if (!filter) {
      return false
    }

    const selections: Array<string | string[] | undefined> = [
      filter.deposito,
      filter.marca,
      filter.fornecedor,
    ]

    return selections.some(
      (value) => Array.isArray(value) && value.length === 0,
    )
  }

  /**
   * Get product metrics
   * @param filter - Optional filter parameters
   * @returns Promise with product metrics
   */
  async getMetrics(filter?: ProdutoFilter): Promise<ProdutoMetrics> {
    try {
      if (this.hasEmptySelection(filter)) {
        return this.getDefaultMetrics()
      }

      if (this.useMockData) {
        const { generateMockProdutoMetrics } = await import(
          '@/modules/produtos/mocks/produtos-mock-generator'
        )
        await this.simulateDelay()
        return generateMockProdutoMetrics(filter)
      }

      console.warn(
        '[ProdutosService] getMetrics: real data fetching not implemented. Returning defaults.',
      )
      return this.getDefaultMetrics()
    } catch (error) {
      console.warn('Error fetching product metrics:', error)
      return this.getDefaultMetrics()
    }
  }

  /**
   * Get list of products
   * @param filter - Optional filter parameters
   * @param limit - Maximum number of products to return
   * @returns Promise with array of products
   */
  async getProdutos(
    filter?: ProdutoFilter,
    limit: number = 150,
  ): Promise<Produto[]> {
    try {
      if (this.hasEmptySelection(filter)) {
        return []
      }

      if (this.useMockData) {
        // Dynamically import mock generator only in development
        const { generateMockProdutos } = await import(
          '@/modules/produtos/mocks/produtos-mock-generator'
        )
        await this.simulateDelay()
        return generateMockProdutos(limit, filter)
      }

      console.warn(
        '[ProdutosService] getProdutos: real data fetching not implemented. Returning empty list.',
      )
      return []
    } catch (error) {
      console.warn('Error fetching products:', error)
      return []
    }
  }

  /**
   * Get stock distribution by category
   * @returns Promise with stock distribution data
   */
  async getStockDistribution() {
    try {
      // Stock distribution depends on filtered products; empty selection means empty analytics
      // We do not check filter here because method signature lacks filter, but we keep behavior aligned
      if (this.useMockData) {
        // Dynamically import mock generator only in development
        const { generateStockDistribution } = await import(
          '@/modules/produtos/mocks/produtos-mock-generator'
        )
        await this.simulateDelay()
        return generateStockDistribution()
      }

      console.warn(
        '[ProdutosService] getStockDistribution: real data fetching not implemented. Returning empty distribution.',
      )
      return []
    } catch (error) {
      console.warn('Error fetching stock distribution:', error)
      return []
    }
  }

  /**
   * Get products that need reordering
   * @returns Promise with array of products needing reorder
   */
  async getProdutosReposicao(): Promise<Produto[]> {
    try {
      // Products for reposição follow same dataset; empty selection yields empty list (handled upstream)
      if (this.useMockData) {
        // Dynamically import mock generator only in development
        const { generateProdutosReposicao } = await import(
          '@/modules/produtos/mocks/produtos-mock-generator'
        )
        await this.simulateDelay()
        return generateProdutosReposicao()
      }

      console.warn(
        '[ProdutosService] getProdutosReposicao: real data fetching not implemented. Returning empty list.',
      )
      return []
    } catch (error) {
      console.warn('Error fetching reorder products:', error)
      return []
    }
  }

  /**
   * Get complete product dashboard data
   * @param filter - Optional filter parameters
   * @returns Promise with complete product data
   */
  async getCompleteProdutoData(filter?: ProdutoFilter): Promise<ProdutoData> {
    try {
      if (this.hasEmptySelection(filter)) {
        return {
          metrics: this.getDefaultMetrics(),
          produtos: [],
          analytics: {
            distribuicaoEstoque: [],
            produtosReposicao: [],
          },
        }
      }

      if (this.useMockData) {
        // Dynamically import mock generator only in development
        const mockModule = await import('@/modules/produtos/mocks/produtos-mock-generator')
        await this.simulateDelay()

        // Apply filters to get filtered products
        const filteredProdutos = mockModule.generateMockProdutos(150, filter)

        // Calculate metrics based on filtered products
        const metrics = mockModule.generateMockProdutoMetrics(
          filter,
          filteredProdutos,
        )

        // Get analytics data
        const distribuicaoEstoque = mockModule.generateStockDistribution()
        const produtosReposicao = mockModule.generateProdutosReposicao()

        return {
          metrics,
          produtos: filteredProdutos,
          analytics: {
            distribuicaoEstoque,
            produtosReposicao,
          },
        }
      }

      const [metrics, produtos, distribuicaoEstoque, produtosReposicao] =
        await Promise.all([
          this.getMetrics(filter),
          this.getProdutos(filter),
          this.getStockDistribution(),
          this.getProdutosReposicao(),
        ])

      return {
        metrics,
        produtos,
        analytics: {
          distribuicaoEstoque,
          produtosReposicao,
        },
      }
    } catch (error) {
      console.warn('Error fetching complete product data:', error)
      return {
        metrics: this.getDefaultMetrics(),
        produtos: [],
        analytics: {
          distribuicaoEstoque: [],
          produtosReposicao: [],
        },
      }
    }
  }

  private getDefaultMetrics(): ProdutoMetrics {
    return {
      totalEstoque: {
        value: 0,
        currency: 'R$',
        change: 0,
        trend: 'down',
        description: 'Sem dados disponíveis',
        subtext: 'Produção ainda não configurada',
      },
      vendaTotalEstoque: {
        value: 0,
        currency: 'R$',
        change: 0,
        trend: 'down',
        description: 'Sem dados disponíveis',
        subtext: 'Produção ainda não configurada',
      },
      markupMedio: {
        numericValue: 0,
        displayValue: '0%',
        change: 0,
        trend: 'down',
        description: 'Sem dados disponíveis',
        subtext: 'Produção ainda não configurada',
      },
      produtosEmFalta: {
        numericValue: 0,
        displayValue: '0',
        change: 0,
        trend: 'down',
        description: 'Sem dados disponíveis',
        subtext: 'Produção ainda não configurada',
      },
      necessidadeCompra: {
        value: 0,
        currency: 'R$',
        change: 0,
        trend: 'down',
        description: 'Sem dados disponíveis',
        subtext: 'Produção ainda não configurada',
      },
    }
  }

  /**
   * Simulate network delay for mock data
   * @param min - Minimum delay in ms
   * @param max - Maximum delay in ms
   */
  private async simulateDelay(
    min: number = 100,
    max: number = 300,
  ): Promise<void> {
    const delay = Math.random() * (max - min) + min
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  /**
   * Clear any cached data (if implemented)
   */
  clearCache(): void {
    // TODO: Implement cache clearing if caching is added
    console.log('Cache cleared')
  }
}

// Export singleton instance
export const produtosService = new ProdutosService()

// Export convenience functions for backward compatibility
export async function getProdutoMetrics(filter?: ProdutoFilter) {
  return produtosService.getMetrics(filter)
}

export async function getProdutos(filter?: ProdutoFilter, limit?: number) {
  return produtosService.getProdutos(filter, limit)
}

export async function getStockDistribution() {
  return produtosService.getStockDistribution()
}

export async function getProdutosReposicao() {
  return produtosService.getProdutosReposicao()
}

export async function getCompleteProdutoData(filter?: ProdutoFilter) {
  return produtosService.getCompleteProdutoData(filter)
}
