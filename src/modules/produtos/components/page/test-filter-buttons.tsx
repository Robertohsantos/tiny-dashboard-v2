/**
 * Componente de teste simples para debug dos filtros
 * Remove a complexidade do MultiSelect para isolar o problema
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useProductFilters } from '@/modules/produtos/contexts/filter-context'

export function TestFilterButtons() {
  const { filters, setDeposito, setMarca, setFornecedor, resetFilters } =
    useProductFilters()

  // Função para testar limpeza de um filtro específico
  const handleClearDeposito = () => {
    console.log('[DEBUG TEST] Limpando depósitos')
    setDeposito([])
  }

  const handleClearMarca = () => {
    console.log('[DEBUG TEST] Limpando marcas')
    setMarca([])
  }

  const handleClearFornecedor = () => {
    console.log('[DEBUG TEST] Limpando fornecedores')
    setFornecedor([])
  }

  const handleClearAll = () => {
    console.log('[DEBUG TEST] Limpando TODOS os filtros')
    setDeposito([])
    setMarca([])
    setFornecedor([])
  }

  return (
    <div className="border-2 border-red-500 p-4 rounded bg-yellow-50">
      <h3 className="font-bold text-red-600 mb-2">
        🔧 DEBUG: Botões de Teste de Filtro
      </h3>

      <div className="mb-2 text-xs">
        <p>Depósitos selecionados: {filters.deposito.length}</p>
        <p>Marcas selecionadas: {filters.marca.length}</p>
        <p>Fornecedores selecionados: {filters.fornecedor.length}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleClearDeposito} variant="destructive" size="sm">
          Limpar Depósitos
        </Button>

        <Button onClick={handleClearMarca} variant="destructive" size="sm">
          Limpar Marcas
        </Button>

        <Button onClick={handleClearFornecedor} variant="destructive" size="sm">
          Limpar Fornecedores
        </Button>

        <Button onClick={handleClearAll} variant="destructive" size="sm">
          Limpar TODOS
        </Button>

        <Button
          onClick={() => {
            console.log(
              '[DEBUG TEST] Testando set específico - Depósito: ["deposito-principal"]',
            )
            // Use an allowed DepositoId value to satisfy types
            setDeposito(['loja-01'])
          }}
          variant="outline"
          size="sm"
        >
          Setar 1 Depósito
        </Button>
      </div>
    </div>
  )
}
