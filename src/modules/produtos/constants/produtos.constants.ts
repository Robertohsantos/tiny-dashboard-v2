import { normalizeMarca } from '@/modules/produtos/utils/produtos-transforms.utils'

/**
 * Product constants and filter options
 * Single source of truth for all product-related constants
 */

// Types for filter IDs
export type DepositoId = 'all' | 'loja-01' | 'loja-02' | 'cd-distribuicao'
export type MarcaId = string
export type FornecedorId =
  | 'all'
  | 'fornecedor-nacional'
  | 'importadora-sul'
  | 'distribuidora-central'
  | 'atacado-express'
export type CategoriaId = string

// Deposito (Warehouse) options
export const DEPOSITOS: Record<
  DepositoId,
  { label: string; value: DepositoId; color?: string }
> = {
  all: { label: 'Todos os depósitos', value: 'all' },
  'loja-01': { label: 'Loja 01', value: 'loja-01', color: '#10B981' },
  'loja-02': { label: 'Loja 02', value: 'loja-02', color: '#3B82F6' },
  'cd-distribuicao': {
    label: 'CD Distribuição',
    value: 'cd-distribuicao',
    color: '#F59E0B',
  },
}

// Fornecedor (Supplier) options
export const FORNECEDORES: Record<
  FornecedorId,
  { label: string; value: FornecedorId; color?: string }
> = {
  all: { label: 'Todos os fornecedores', value: 'all' },
  'fornecedor-nacional': {
    label: 'Fornecedor Nacional',
    value: 'fornecedor-nacional',
    color: '#10B981',
  },
  'importadora-sul': {
    label: 'Importadora Sul',
    value: 'importadora-sul',
    color: '#3B82F6',
  },
  'distribuidora-central': {
    label: 'Distribuidora Central',
    value: 'distribuidora-central',
    color: '#F59E0B',
  },
  'atacado-express': {
    label: 'Atacado Express',
    value: 'atacado-express',
    color: '#EF4444',
  },
}

// Marca (Brand) options - Static list but can be dynamic from data
export const MARCAS_ESTATICAS = [
  'Nike',
  'Adidas',
  'Samsung',
  'Apple',
  'Sony',
  'LG',
  'Dell',
  'HP',
  'Asus',
  'Lenovo',
  'Zara',
  'H&M',
  'Forever 21',
  'Gap',
  "Levi's",
  'Ray-Ban',
  'Oakley',
  'Fossil',
  'Casio',
  'Timex',
  "L'Oréal",
  'Nivea',
  'Dove',
  'Gillette',
  'Pantene',
]

// Categoria (Category) options - Static list but can be dynamic from data
export const CATEGORIAS_ESTATICAS = [
  'Eletrônicos',
  'Roupas',
  'Acessórios',
  'Calçados',
  'Beleza',
  'Casa e Decoração',
  'Esportes',
  'Livros',
  'Brinquedos',
]

// Helper functions to get options for select components
export function getDepositoOptions() {
  return Object.values(DEPOSITOS)
}

export function getFornecedorOptions() {
  return Object.values(FORNECEDORES)
}

/**
 * Get brand options - can be dynamic based on actual product data
 * @param marcas - Optional array of brands from actual data
 */
export function getMarcaOptions(marcas?: string[]) {
  const sourceMarcas = marcas ? [...marcas] : [...MARCAS_ESTATICAS]

  const uniqueMarcas = new Map<string, string>()
  for (const marca of sourceMarcas) {
    const slug = normalizeMarca(marca)
    if (!uniqueMarcas.has(slug)) {
      uniqueMarcas.set(slug, marca)
    }
  }

  const sortedMarcas = Array.from(uniqueMarcas.entries()).sort((a, b) =>
    a[1].localeCompare(b[1]),
  )

  return [
    { label: 'Todas as Marcas', value: 'all' },
    ...sortedMarcas.map(([slug, label]) => ({
      label,
      value: slug,
    })),
  ]
}

/**
 * Get category options - can be dynamic based on actual product data
 * @param categorias - Optional array of categories from actual data
 */
export function getCategoriaOptions(categorias?: string[]) {
  const uniqueCategorias = categorias
    ? Array.from(new Set(categorias)).sort()
    : CATEGORIAS_ESTATICAS.sort()

  return [
    { label: 'Todas as Categorias', value: 'all' },
    ...uniqueCategorias.map((categoria) => ({
      label: categoria,
      value: categoria.toLowerCase().replace(/\s+/g, '-'),
    })),
  ]
}

// Type guards for validation
export function isValidDeposito(id: string): id is DepositoId {
  return id === 'all' || id in DEPOSITOS
}

export function isValidFornecedor(id: string): id is FornecedorId {
  return id === 'all' || id in FORNECEDORES
}

export function isValidMarca(id: string): boolean {
  return (
    id === 'all' ||
    MARCAS_ESTATICAS.some((marca) => normalizeMarca(marca) === id)
  )
}

export function isValidCategoria(id: string): boolean {
  return (
    id === 'all' ||
    CATEGORIAS_ESTATICAS.some(
      (categoria) => categoria.toLowerCase().replace(/\s+/g, '-') === id,
    )
  )
}
