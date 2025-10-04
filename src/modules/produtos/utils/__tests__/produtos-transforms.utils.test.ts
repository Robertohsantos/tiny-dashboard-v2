/**
 * Unit tests for product transformation utilities
 * @jest-environment node
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeMarca,
  denormalizeMarca,
  isAllSelected,
  isFilterActive,
  countActiveFilters,
  formatFilterLabel,
  getSelectionSummary,
  areFiltersEqual,
} from '../produtos-transforms.utils'
import { FilterType } from '@/modules/produtos/constants/produtos-filters.constants'

describe('produtos-transforms.utils', () => {
  describe('normalizeMarca', () => {
    it('should normalize brand names to URL-safe slugs', () => {
      expect(normalizeMarca("L'Oréal")).toBe('loreal')
      expect(normalizeMarca('Forever 21')).toBe('forever-21')
      expect(normalizeMarca('Ray-Ban')).toBe('ray-ban')
      expect(normalizeMarca('H&M')).toBe('hm')
      expect(normalizeMarca('  Nike  ')).toBe('nike')
      expect(normalizeMarca('ADIDAS')).toBe('adidas')
    })

    it('should handle empty strings', () => {
      expect(normalizeMarca('')).toBe('')
      expect(normalizeMarca('   ')).toBe('')
    })

    it('should handle special characters and accents', () => {
      expect(normalizeMarca('São Paulo')).toBe('sao-paulo')
      expect(normalizeMarca('Café & Co.')).toBe('cafe-co')
      expect(normalizeMarca('50% Off!')).toBe('50-off')
    })
  })

  describe('denormalizeMarca', () => {
    const availableMarcas = ["L'Oréal", 'Forever 21', 'Nike', 'Adidas']

    it('should find exact matches in available marcas', () => {
      expect(denormalizeMarca('loreal', availableMarcas)).toBe("L'Oréal")
      expect(denormalizeMarca('forever-21', availableMarcas)).toBe('Forever 21')
      expect(denormalizeMarca('nike', availableMarcas)).toBe('Nike')
    })

    it('should format slug when no match found', () => {
      expect(denormalizeMarca('unknown-brand', availableMarcas)).toBe(
        'Unknown Brand',
      )
      expect(denormalizeMarca('test-slug', [])).toBe('Test Slug')
    })

    it('should handle special cases', () => {
      expect(denormalizeMarca('all', availableMarcas)).toBe('all')
      expect(denormalizeMarca('', availableMarcas)).toBe('')
    })
  })

  describe('isAllSelected', () => {
    it('should correctly identify when all depositos are selected', () => {
      expect(isAllSelected([], FilterType.DEPOSITO)).toBe(true)
      expect(
        isAllSelected(
          ['loja-01', 'loja-02', 'cd-distribuicao'],
          FilterType.DEPOSITO,
        ),
      ).toBe(true)
      expect(isAllSelected(['loja-01', 'loja-02'], FilterType.DEPOSITO)).toBe(
        false,
      )
    })

    it('should correctly identify when all fornecedores are selected', () => {
      expect(isAllSelected([], FilterType.FORNECEDOR)).toBe(true)
      expect(
        isAllSelected(
          [
            'fornecedor-nacional',
            'importadora-sul',
            'distribuidora-central',
            'atacado-express',
          ],
          FilterType.FORNECEDOR,
        ),
      ).toBe(true)
      expect(
        isAllSelected(['fornecedor-nacional'], FilterType.FORNECEDOR),
      ).toBe(false)
    })

    it('should correctly identify when all marcas are selected', () => {
      expect(isAllSelected([], FilterType.MARCA, 10)).toBe(true)
      expect(isAllSelected(['marca1', 'marca2'], FilterType.MARCA, 2)).toBe(
        true,
      )
      expect(isAllSelected(['marca1'], FilterType.MARCA, 2)).toBe(false)
      expect(isAllSelected([], FilterType.MARCA)).toBe(true) // Without total, empty means all
    })
  })

  describe('isFilterActive', () => {
    it('should identify active filters correctly', () => {
      expect(isFilterActive(['loja-01'], FilterType.DEPOSITO)).toBe(true)
      expect(isFilterActive([], FilterType.DEPOSITO)).toBe(false)
      expect(
        isFilterActive(
          ['loja-01', 'loja-02', 'cd-distribuicao'],
          FilterType.DEPOSITO,
        ),
      ).toBe(false)
    })
  })

  describe('countActiveFilters', () => {
    it('should count active filters correctly', () => {
      const filtersOnlySome = {
        deposito: ['loja-01'],
        marca: ['nike'],
        fornecedor: [],
      }
      expect(countActiveFilters(filtersOnlySome, 5)).toBe(2) // deposito and marca are active

      const filtersNoneSelected = {
        deposito: [],
        marca: [],
        fornecedor: [],
      }
      expect(countActiveFilters(filtersNoneSelected, 5)).toBe(3) // zero selections keep filters active

      const filtersAllSelected = {
        deposito: ['loja-01', 'loja-02', 'cd-distribuicao'],
        marca: ['nike', 'adidas', 'puma', 'reebok', 'fila'],
        fornecedor: [
          'fornecedor-nacional',
          'importadora-sul',
          'distribuidora-central',
          'atacado-express',
        ],
      }
      expect(countActiveFilters(filtersAllSelected, 5)).toBe(0) // matching totals disables activity
    })
  })

  describe('formatFilterLabel', () => {
    it('should format labels with count', () => {
      expect(formatFilterLabel('Nike', 10, true)).toBe('Nike (10)')
      expect(formatFilterLabel('Adidas', 5, false)).toBe('Adidas')
      expect(formatFilterLabel('Puma', undefined, true)).toBe('Puma')
    })
  })

  describe('getSelectionSummary', () => {
    it('should generate correct selection summaries', () => {
      expect(getSelectionSummary(0, 10, 'Depósito')).toBe('Todos os depósitos')
      expect(getSelectionSummary(10, 10, 'Marca')).toBe('Todos os marcas')
      expect(getSelectionSummary(1, 10, 'Fornecedor')).toBe('1 fornecedor')
      expect(getSelectionSummary(3, 10, 'Produto')).toBe('3 produtos')
    })
  })

  describe('areFiltersEqual', () => {
    it('should correctly compare filter states', () => {
      const filter1 = {
        deposito: ['loja-01', 'loja-02'],
        marca: ['nike', 'adidas'],
        fornecedor: [],
      }

      const filter2 = {
        deposito: ['loja-02', 'loja-01'],
        marca: ['adidas', 'nike'],
        fornecedor: [],
      }

      const filter3 = {
        deposito: ['loja-01'],
        marca: ['nike', 'adidas'],
        fornecedor: [],
      }

      expect(areFiltersEqual(filter1, filter2)).toBe(true) // Same values, different order
      expect(areFiltersEqual(filter1, filter3)).toBe(false) // Different deposito
    })
  })
})
