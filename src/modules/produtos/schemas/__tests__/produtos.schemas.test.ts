/**
 * Tests for produtos Zod schemas
 * Comprehensive validation testing for all product-related schemas
 */

import { describe, it, expect } from 'vitest'
import {
  MetricDataGenericSchema,
  ProdutoMetricDisplaySchema,
  ProdutoMetricsSchema,
  ProdutoSchema,
  ProdutoFilterSchema,
  StockDistributionSchema,
  ProdutoAnalyticsSchema,
  ProdutoDataSchema,
  validateProdutoMetrics,
  safeParseProdutoMetrics,
  validateProdutoData,
  safeParseProdutoData,
  validateProduto,
  safeParseProduto,
  validateProdutoFilter,
  safeParseProdutoFilter,
} from '../produtos.schemas'

import {
  validMetricDataNumber,
  validMetricDataString,
  validProdutoMetricDisplay,
  validProdutoMetrics,
  validProdutos,
  validProdutoFilters,
  validStockDistribution,
  validCompleteProdutoData,
  minimalValidProdutoData,
  validProdutoDataMetricsOnly,
  validEdgeCaseProduto,
} from './fixtures/produtos-valid-data'

import {
  invalidProdutoMetrics,
  invalidProdutos,
  invalidProdutoFilters,
  invalidStockDistribution,
  invalidProdutoMetricDisplay,
  invalidCompleteProdutoData,
  edgeCaseInvalidProdutoData,
} from './fixtures/produtos-invalid-data'

import { testOptionalFields } from '@/modules/core/testing/schema-testing-utils'

describe('Produtos Schemas', () => {
  describe('MetricDataGenericSchema', () => {
    it('should accept number values', () => {
      const result = MetricDataGenericSchema.safeParse(validMetricDataNumber)
      expect(result.success).toBe(true)
    })

    it('should accept string values', () => {
      const result = MetricDataGenericSchema.safeParse(validMetricDataString)
      expect(result.success).toBe(true)
    })

    it('should enforce trend enum', () => {
      const invalidTrend = {
        value: 1000,
        change: 10,
        trend: 'sideways', // Invalid
        description: 'Test',
        subtext: 'Test',
      }
      const result = MetricDataGenericSchema.safeParse(invalidTrend)
      expect(result.success).toBe(false)
    })

    testOptionalFields(
      MetricDataGenericSchema,
      {
        value: 1000,
        currency: 'BRL',
        unit: 'items',
        change: 10,
        trend: 'up',
        description: 'Test',
        subtext: 'Test',
      },
      ['currency', 'unit'],
    )
  })

  describe('ProdutoMetricDisplaySchema', () => {
    it('should validate correct metric display data', () => {
      const result = ProdutoMetricDisplaySchema.safeParse(
        validProdutoMetricDisplay,
      )
      expect(result.success).toBe(true)
    })

    it('should require both numericValue and displayValue', () => {
      const incomplete = {
        numericValue: 50,
        // Missing displayValue and other fields
      }
      const result = ProdutoMetricDisplaySchema.safeParse(incomplete)
      expect(result.success).toBe(false)
    })

    it('should reject invalid metric display data', () => {
      invalidProdutoMetricDisplay.forEach((invalid) => {
        const result = ProdutoMetricDisplaySchema.safeParse(invalid)
        expect(result.success).toBe(false)
      })
    })

    testOptionalFields(
      ProdutoMetricDisplaySchema,
      {
        numericValue: 50,
        displayValue: '50%',
        currency: 'BRL',
        unit: '%',
        change: 10,
        trend: 'up',
        description: 'Test',
        subtext: 'Test',
      },
      ['currency', 'unit'],
    )
  })

  describe('ProdutoSchema', () => {
    it('should validate correct product data', () => {
      validProdutos.forEach((produto) => {
        const result = ProdutoSchema.safeParse(produto)
        expect(result.success).toBe(true)
      })
    })

    it('should validate edge case product', () => {
      const result = ProdutoSchema.safeParse(validEdgeCaseProduto)
      expect(result.success).toBe(true)
    })

    it('should reject products with negative prices', () => {
      const negativePrices = {
        ...validProdutos[0],
        precoCusto: -100,
        precoVenda: -150,
      }
      const result = ProdutoSchema.safeParse(negativePrices)
      expect(result.success).toBe(false)
      if (!result.success) {
        const priceErrors = result.error.errors.filter((err) =>
          err.message.includes('non-negative'),
        )
        expect(priceErrors.length).toBeGreaterThan(0)
      }
    })

    it('should reject products with negative stock', () => {
      const negativeStock = {
        ...validProdutos[0],
        estoqueAtual: -10,
        estoqueMinimo: -5,
      }
      const result = ProdutoSchema.safeParse(negativeStock)
      expect(result.success).toBe(false)
    })

    it('should reject non-integer stock values', () => {
      const decimalStock = {
        ...validProdutos[0],
        estoqueAtual: 10.5,
        estoqueMinimo: 5.7,
      }
      const result = ProdutoSchema.safeParse(decimalStock)
      expect(result.success).toBe(false)
    })

    it('should enforce status enum values', () => {
      const invalidStatus = {
        ...validProdutos[0],
        status: 'pending',
      }
      const result = ProdutoSchema.safeParse(invalidStatus)
      expect(result.success).toBe(false)
    })

    it('should require Date object for ultimaAtualizacao', () => {
      const stringDate = {
        ...validProdutos[0],
        ultimaAtualizacao: '2024-01-01',
      }
      const result = ProdutoSchema.safeParse(stringDate)
      expect(result.success).toBe(false)
    })

    testOptionalFields(
      ProdutoSchema,
      {
        ...validProdutos[0],
        descricao: 'Optional description',
      },
      ['descricao'],
    )
  })

  describe('ProdutoFilterSchema', () => {
    it('should validate correct filter data', () => {
      validProdutoFilters.forEach((filter) => {
        const result = ProdutoFilterSchema.safeParse(filter)
        expect(result.success).toBe(true)
      })
    })

    it('should accept empty filter object', () => {
      const result = ProdutoFilterSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject invalid statusEstoque values', () => {
      const invalid = {
        statusEstoque: 'out-of-stock',
      }
      const result = ProdutoFilterSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status values', () => {
      const invalid = {
        status: 'active',
      }
      const result = ProdutoFilterSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    testOptionalFields(
      ProdutoFilterSchema,
      {
        categoria: 'Test',
        statusEstoque: 'normal',
        status: 'ativo',
        searchTerm: 'search',
      },
      ['categoria', 'statusEstoque', 'status', 'searchTerm'],
    )
  })

  describe('StockDistributionSchema', () => {
    it('should validate correct stock distribution', () => {
      validStockDistribution.forEach((item) => {
        const result = StockDistributionSchema.safeParse(item)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid stock distribution', () => {
      invalidStockDistribution.forEach((invalid) => {
        const result = StockDistributionSchema.safeParse(invalid)
        expect(result.success).toBe(false)
      })
    })

    it('should require all fields', () => {
      const incomplete = {
        categoria: 'Test',
        // Missing valor and quantidade
      }
      const result = StockDistributionSchema.safeParse(incomplete)
      expect(result.success).toBe(false)
    })
  })

  describe('ProdutoMetricsSchema', () => {
    it('should validate complete product metrics', () => {
      const result = ProdutoMetricsSchema.safeParse(validProdutoMetrics)
      expect(result.success).toBe(true)
    })

    it('should reject incomplete metrics', () => {
      invalidProdutoMetrics.forEach((invalid) => {
        const result = ProdutoMetricsSchema.safeParse(invalid)
        expect(result.success).toBe(false)
      })
    })

    it('should validate markupMedio with correct structure', () => {
      const invalidMarkup = {
        ...validProdutoMetrics,
        markupMedio: {
          value: 50, // Wrong! Should have numericValue and displayValue
          change: 5,
          trend: 'up',
          description: '',
          subtext: '',
        },
      }
      const result = ProdutoMetricsSchema.safeParse(invalidMarkup)
      expect(result.success).toBe(false)
    })

    it('should validate produtosEmFalta with correct structure', () => {
      const invalidProdutosEmFalta = {
        ...validProdutoMetrics,
        produtosEmFalta: {
          value: 12, // Wrong! Should have numericValue and displayValue
          change: -25,
          trend: 'down',
          description: '',
          subtext: '',
        },
      }
      const result = ProdutoMetricsSchema.safeParse(invalidProdutosEmFalta)
      expect(result.success).toBe(false)
    })
  })

  describe('ProdutoDataSchema', () => {
    it('should validate complete product data', () => {
      const result = ProdutoDataSchema.safeParse(validCompleteProdutoData)
      expect(result.success).toBe(true)
    })

    it('should validate minimal valid data', () => {
      const result = ProdutoDataSchema.safeParse(minimalValidProdutoData)
      expect(result.success).toBe(true)
    })

    it('should validate data with only metrics', () => {
      const result = ProdutoDataSchema.safeParse(validProdutoDataMetricsOnly)
      expect(result.success).toBe(true)
    })

    it('should reject invalid complete data', () => {
      invalidCompleteProdutoData.forEach((invalid) => {
        const result = ProdutoDataSchema.safeParse(invalid)
        expect(result.success).toBe(false)
      })
    })

    it('should validate nested product arrays', () => {
      const dataWithInvalidProduct = {
        metrics: validProdutoMetrics,
        produtos: [
          ...validProdutos,
          { invalid: 'product' }, // Invalid product
        ],
      }
      const result = ProdutoDataSchema.safeParse(dataWithInvalidProduct)
      expect(result.success).toBe(false)
    })

    testOptionalFields(
      ProdutoDataSchema,
      {
        metrics: validProdutoMetrics,
        produtos: validProdutos,
        analytics: {
          distribuicaoEstoque: validStockDistribution,
          produtosReposicao: validProdutos,
        },
      },
      ['produtos', 'analytics'],
    )
  })

  describe('Validation Functions', () => {
    describe('validateProdutoMetrics', () => {
      it('should return validated data for valid input', () => {
        const validated = validateProdutoMetrics(validProdutoMetrics)
        expect(validated).toEqual(validProdutoMetrics)
      })

      it('should throw for invalid input', () => {
        expect(() => {
          validateProdutoMetrics({ invalid: 'data' })
        }).toThrow()
      })
    })

    describe('safeParseProdutoMetrics', () => {
      it('should return success for valid input', () => {
        const result = safeParseProdutoMetrics(validProdutoMetrics)
        expect(result.success).toBe(true)
      })

      it('should return error for invalid input', () => {
        const result = safeParseProdutoMetrics(null)
        expect(result.success).toBe(false)
      })
    })

    describe('validateProduto', () => {
      it('should validate single product', () => {
        const validated = validateProduto(validProdutos[0])
        expect(validated).toEqual(validProdutos[0])
      })

      it('should throw for invalid product', () => {
        expect(() => {
          validateProduto(invalidProdutos[0])
        }).toThrow()
      })
    })

    describe('validateProdutoFilter', () => {
      it('should validate filter', () => {
        const validated = validateProdutoFilter(validProdutoFilters[0])
        expect(validated).toEqual(validProdutoFilters[0])
      })

      it('should validate empty filter', () => {
        const validated = validateProdutoFilter({})
        expect(validated).toEqual({})
      })
    })
  })

  describe('Edge Cases', () => {
    it('should reject null', () => {
      const result = ProdutoDataSchema.safeParse(null)
      expect(result.success).toBe(false)
    })

    it('should reject undefined', () => {
      const result = ProdutoDataSchema.safeParse(undefined)
      expect(result.success).toBe(false)
    })

    it('should reject primitive types', () => {
      edgeCaseInvalidProdutoData.forEach((edgeCase) => {
        const result = ProdutoDataSchema.safeParse(edgeCase)
        expect(result.success).toBe(false)
      })
    })

    it('should handle zero values correctly', () => {
      const zeroProduct = {
        ...validProdutos[0],
        precoCusto: 0,
        precoVenda: 0,
        estoqueAtual: 0,
        estoqueMinimo: 0,
      }
      const result = ProdutoSchema.safeParse(zeroProduct)
      expect(result.success).toBe(true)
    })

    it('should handle empty strings', () => {
      const emptyStrings = {
        ...validProdutos[0],
        id: '',
        sku: '',
        nome: '',
        categoria: '',
      }
      const result = ProdutoSchema.safeParse(emptyStrings)
      expect(result.success).toBe(true)
    })

    it('should handle large numbers', () => {
      const largeNumbers = {
        ...validProdutos[0],
        precoCusto: Number.MAX_SAFE_INTEGER,
        precoVenda: Number.MAX_SAFE_INTEGER,
        estoqueAtual: Number.MAX_SAFE_INTEGER,
        estoqueMinimo: Number.MAX_SAFE_INTEGER,
      }
      const result = ProdutoSchema.safeParse(largeNumbers)
      expect(result.success).toBe(true)
    })
  })
})
