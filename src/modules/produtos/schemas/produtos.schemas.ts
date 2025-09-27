/**
 * Zod schemas for produtos (products) data validation
 * Provides runtime type safety and data validation
 */

import { z } from 'zod'

/**
 * Schema for generic metric data with flexible value type
 */
export const MetricDataGenericSchema = z.object({
  value: z.union([z.number(), z.string()]),
  currency: z.string().optional(),
  unit: z.string().optional(),
  previousValue: z.union([z.number(), z.string()]).optional(),
  previousDisplayValue: z.string().optional(),
  change: z.number(),
  trend: z.enum(['up', 'down']),
  description: z.string(),
  subtext: z.string(),
})

/**
 * Schema for specific metric data for display purposes
 */
export const ProdutoMetricDisplaySchema = z.object({
  numericValue: z.number(),
  displayValue: z.string(),
  currency: z.string().optional(),
  unit: z.string().optional(),
  previousNumericValue: z.number().optional(),
  previousDisplayValue: z.string().optional(),
  change: z.number(),
  trend: z.enum(['up', 'down']),
  description: z.string(),
  subtext: z.string(),
})

/**
 * Schema for product inventory metrics
 */
export const ProdutoMetricsSchema = z.object({
  totalEstoque: MetricDataGenericSchema,
  vendaTotalEstoque: MetricDataGenericSchema,
  markupMedio: ProdutoMetricDisplaySchema,
  produtosEmFalta: ProdutoMetricDisplaySchema,
  necessidadeCompra: MetricDataGenericSchema,
})

/**
 * Schema for individual product data
 */
export const ProdutoSchema = z.object({
  id: z.string(),
  sku: z.string(),
  nome: z.string(),
  descricao: z.string().optional(),
  marca: z.string(),
  categoria: z.string(),
  deposito: z.string(),
  fornecedor: z.string(),
  precoCusto: z.number().min(0, 'Cost price must be non-negative'),
  precoVenda: z.number().min(0, 'Selling price must be non-negative'),
  estoqueAtual: z.number().int().min(0, 'Stock must be non-negative'),
  estoqueMinimo: z.number().int().min(0, 'Minimum stock must be non-negative'),
  markupPercentual: z.number(),
  coberturaEstoqueDias: z
    .number()
    .int()
    .min(0, 'Coverage days must be non-negative'),
  status: z.enum(['ativo', 'inativo', 'descontinuado']),
  ultimaAtualizacao: z.date(),
})

/**
 * Schema for product filter parameters
 */
export const ProdutoFilterSchema = z.object({
  categoria: z.string().optional(),
  statusEstoque: z
    .enum(['em_falta', 'baixo', 'normal', 'excessivo'])
    .optional(),
  status: z.enum(['ativo', 'inativo', 'descontinuado']).optional(),
  searchTerm: z.string().optional(),
  deposito: z.union([z.string(), z.array(z.string())]).optional(),
  marca: z.union([z.string(), z.array(z.string())]).optional(),
  fornecedor: z.union([z.string(), z.array(z.string())]).optional(),
})

/**
 * Schema for stock distribution by category
 */
export const StockDistributionSchema = z.object({
  categoria: z.string(),
  valor: z.number(),
  quantidade: z.number(),
})

/**
 * Schema for product analytics data
 */
export const ProdutoAnalyticsSchema = z.object({
  distribuicaoEstoque: z.array(StockDistributionSchema),
  produtosReposicao: z.array(ProdutoSchema),
})

/**
 * Complete product dashboard data schema
 */
export const ProdutoDataSchema = z.object({
  metrics: ProdutoMetricsSchema,
  produtos: z.array(ProdutoSchema).optional(),
  analytics: ProdutoAnalyticsSchema.optional(),
})

// Type inference from schemas
export type ProdutoValidated = z.infer<typeof ProdutoSchema>
export type ProdutoMetricsValidated = z.infer<typeof ProdutoMetricsSchema>
export type ProdutoDataValidated = z.infer<typeof ProdutoDataSchema>
export type ProdutoFilterValidated = z.infer<typeof ProdutoFilterSchema>
export type StockDistributionValidated = z.infer<typeof StockDistributionSchema>

/**
 * Validation functions with error handling
 */

/**
 * Validates product metrics data
 * @param data - Raw data to validate
 * @returns Validated data or throws ZodError
 */
export function validateProdutoMetrics(data: unknown): ProdutoMetricsValidated {
  return ProdutoMetricsSchema.parse(data)
}

/**
 * Safely validates product metrics data
 * @param data - Raw data to validate
 * @returns Result with either validated data or error
 */
export function safeParseProdutoMetrics(data: unknown) {
  return ProdutoMetricsSchema.safeParse(data)
}

/**
 * Validates complete product data
 * @param data - Raw data to validate
 * @returns Validated data or throws ZodError
 */
export function validateProdutoData(data: unknown): ProdutoDataValidated {
  return ProdutoDataSchema.parse(data)
}

/**
 * Safely validates complete product data
 * @param data - Raw data to validate
 * @returns Result with either validated data or error
 */
export function safeParseProdutoData(data: unknown) {
  return ProdutoDataSchema.safeParse(data)
}

/**
 * Validates a single product
 * @param data - Raw data to validate
 * @returns Validated product or throws ZodError
 */
export function validateProduto(data: unknown): ProdutoValidated {
  return ProdutoSchema.parse(data)
}

/**
 * Safely validates a single product
 * @param data - Raw data to validate
 * @returns Result with either validated product or error
 */
export function safeParseProduto(data: unknown) {
  return ProdutoSchema.safeParse(data)
}

/**
 * Validates product filter parameters
 * @param data - Raw filter data to validate
 * @returns Validated filter or throws ZodError
 */
export function validateProdutoFilter(data: unknown): ProdutoFilterValidated {
  return ProdutoFilterSchema.parse(data)
}

/**
 * Safely validates product filter parameters
 * @param data - Raw filter data to validate
 * @returns Result with either validated filter or error
 */
export function safeParseProdutoFilter(data: unknown) {
  return ProdutoFilterSchema.safeParse(data)
}
