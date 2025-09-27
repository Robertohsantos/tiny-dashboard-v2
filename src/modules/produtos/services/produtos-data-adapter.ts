/**
 * Produtos Data Adapter
 * Provides a unified interface for accessing product data from different sources
 * Implements the Adapter pattern for clean architecture
 */

import { ENV_CONFIG } from '@/modules/core/config/environment'
import { produtosService } from '@/modules/produtos/services/produtos.service'
import { prisma } from '@/modules/core/services/prisma'
import type { Produto, ProdutoFilter } from '@/modules/produtos/types/produtos.types'
import { Prisma } from '@/generated/prisma/client'
import type { Product, StockCoverage } from '@/generated/prisma/client'
import type { PurchaseRequirementFilters } from '@/modules/purchase-requirement/types'

/**
 * Data adapter that abstracts the data source for products
 * Uses mock data in development and Prisma in production
 */
const productWithCoverageArgs = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    stockCoverages: {
      orderBy: { calculatedAt: 'desc' },
      take: 1,
    },
  },
})

export type ProductWithCoverage = Prisma.ProductGetPayload<
  typeof productWithCoverageArgs
> & {
  packSize?: number | null
}

export class ProdutosDataAdapter {
  /**
   * Get filtered products from the appropriate data source
   * @param organizationId - Organization identifier
   * @param filters - Filter criteria for products
   * @returns Array of products in Prisma format
   */
  async getFilteredProducts(
    organizationId: string,
    filters: PurchaseRequirementFilters,
  ): Promise<ProductWithCoverage[]> {
    const hasExplicitEmptyFilter = (
      ['marcas', 'fornecedores', 'depositos', 'categorias', 'skus'] as const
    ).some((key) => filters[key]?.length === 0)

    if (hasExplicitEmptyFilter) {
      return []
    }

    if (ENV_CONFIG.useMockData) {
      // Development mode: use ProdutosService with mock data
      const produtoFilter = this.mapToProdutoFilter(filters)
      const produtos = await produtosService.getProdutos(produtoFilter)
      return this.mapProdutosToProducts(produtos, organizationId)
    } else {
      // Production mode: use Prisma database
      return this.getProductsFromDatabase(organizationId, filters)
    }
  }

  /**
   * Map PurchaseRequirementFilters to ProdutoFilter format
   */
  private mapToProdutoFilter(
    filters: PurchaseRequirementFilters,
  ): ProdutoFilter {
    return {
      marca: filters.marcas,
      fornecedor: filters.fornecedores,
      deposito: filters.depositos,
      categoria: filters.categorias?.[0], // ProdutoFilter expects single categoria
      status: filters.onlyActive === false ? undefined : 'ativo',
    }
  }

  /**
   * Map UI Produto interface to Prisma Product interface
   * Ensures compatibility between mock data and database schema
   */
  private mapProdutosToProducts(
    produtos: Produto[],
    organizationId: string,
  ): ProductWithCoverage[] {
    return produtos.map((produto) =>
      this.mapSingleProdutoToProduct(produto, organizationId),
    )
  }

  /**
   * Map a single Produto to Product with proper field mapping
   */
  private mapSingleProdutoToProduct(
    produto: Produto,
    organizationId: string,
  ): ProductWithCoverage {
    // Map status from Portuguese to English enum
    const statusMap = {
      ativo: 'ACTIVE',
      inativo: 'INACTIVE',
      descontinuado: 'DISCONTINUED',
    } as const

    const baseProduct: ProductWithCoverage = {
      id: produto.id,
      sku: produto.sku,
      name: produto.nome,
      description: produto.descricao ?? null,
      brand: produto.marca,
      category: produto.categoria,
      warehouse: produto.deposito,
      supplier: produto.fornecedor,
      costPrice: new Prisma.Decimal(produto.precoCusto),
      sellPrice: new Prisma.Decimal(produto.precoVenda),
      currentStock: produto.estoqueAtual,
      minimumStock: produto.estoqueMinimo,
      maximumStock: produto.estoqueMinimo * 3,
      leadTimeDays: this.calculateLeadTime(
        produto.categoria,
        produto.fornecedor,
      ),
      status: statusMap[produto.status] || 'ACTIVE',
      organizationId,
      createdAt: produto.ultimaAtualizacao,
      updatedAt: produto.ultimaAtualizacao,
      stockCoverages: [] as StockCoverage[],
      packSize: null,
    }

    return baseProduct
  }

  /**
   * Calculate reasonable lead time based on category and supplier
   */
  private calculateLeadTime(categoria: string, fornecedor: string): number {
    // Category-based lead times (in days)
    const categoryLeadTimes: Record<string, number> = {
      Eletrônicos: 10,
      Roupas: 7,
      Calçados: 7,
      Acessórios: 5,
      Beleza: 5,
      Casa: 8,
      Livros: 3,
      Esporte: 6,
      Brinquedos: 8,
      Alimentos: 3,
    }

    // Supplier-based adjustments
    const supplierAdjustments: Record<string, number> = {
      'Fornecedor A': -1, // Faster supplier
      'Fornecedor B': 0,
      'Fornecedor C': 1, // Slower supplier
      'Fornecedor D': 0,
      'Fornecedor E': 2, // International supplier
    }

    const baseLeadTime = categoryLeadTimes[categoria] || 7
    const adjustment = supplierAdjustments[fornecedor] || 0

    return Math.max(1, baseLeadTime + adjustment) // Minimum 1 day
  }

  /**
   * Calculate reasonable reorder quantity based on product characteristics
   */
  private calculateReorderQuantity(produto: Produto): number {
    // Base reorder quantity is 2x minimum stock
    const baseQuantity = produto.estoqueMinimo * 2

    // Adjust based on value (higher value = smaller quantities)
    const valueAdjustment = produto.precoCusto > 1000 ? 0.5 : 1.0

    // Round to nearest 10 for cleaner quantities
    return Math.max(10, Math.round((baseQuantity * valueAdjustment) / 10) * 10)
  }

  /**
   * Get products directly from database (production mode)
   */
  private async getProductsFromDatabase(
    organizationId: string,
    filters: PurchaseRequirementFilters,
  ): Promise<ProductWithCoverage[]> {
    const where: Prisma.ProductWhereInput = {
      organizationId,
    }

    if (filters.onlyActive !== false) {
      where.status = 'ACTIVE'
    }

    // Apply filters
    if (filters.marcas && filters.marcas.length > 0) {
      where.brand = { in: filters.marcas }
    }
    if (filters.fornecedores && filters.fornecedores.length > 0) {
      where.supplier = { in: filters.fornecedores }
    }
    if (filters.depositos && filters.depositos.length > 0) {
      where.warehouse = { in: filters.depositos }
    }
    if (filters.skus && filters.skus.length > 0) {
      where.sku = { in: filters.skus }
    }
    if (filters.categorias && filters.categorias.length > 0) {
      where.category = { in: filters.categorias }
    }
    const products = await prisma.product.findMany({
      where,
      include: productWithCoverageArgs.include,
    })

    if (!filters.onlyBelowMinimum) {
      return products
    }

    return products.filter((product) => {
      const currentStock = Number(product.currentStock ?? 0)
      const minimumStock = Number(product.minimumStock ?? 0)
      return currentStock <= minimumStock
    })
  }
}

// Export singleton instance for consistent usage
export const produtosDataAdapter = new ProdutosDataAdapter()
