import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { ProdutosDataTable } from './index'
import { PurchaseRequirementProvider } from '@/modules/produtos/contexts/purchase-requirement-context'
import type { Produto } from '@/modules/produtos/types/produtos.types'

function renderProdutosDataTable(products: Produto[]) {
  return render(
    <PurchaseRequirementProvider>
      <ProdutosDataTable data={products} />
    </PurchaseRequirementProvider>,
  )
}

function buildProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    id: '1',
    sku: 'SKU-1',
    nome: 'Produto Teste',
    descricao: 'Descrição do produto teste',
    marca: 'Marca 1',
    categoria: 'Categoria 1',
    deposito: 'Deposito 1',
    fornecedor: 'Fornecedor 1',
    precoCusto: 10,
    precoVenda: 20,
    estoqueAtual: 5,
    estoqueMinimo: 2,
    markupPercentual: 100,
    coberturaEstoqueDias: 30,
    status: 'ativo',
    ultimaAtualizacao: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('ProdutosDataTable toolbar dropdowns', () => {
  it('abre o dropdown de Ferramentas ao clicar no botão', async () => {
    const user = userEvent.setup()
    renderProdutosDataTable([buildProduto()])

    await user.click(screen.getByRole('button', { name: /Ferramentas/i }))

    expect(
      await screen.findByText(/Transferência entre Depósitos/i),
    ).toBeVisible()
  })

  it('abre o dropdown de Colunas ao clicar no botão', async () => {
    const user = userEvent.setup()
    renderProdutosDataTable([buildProduto()])

    await user.click(screen.getByRole('button', { name: /Colunas/i }))

    expect(
      await screen.findByRole('menuitemcheckbox', { name: /^sku$/i }),
    ).toBeVisible()
  })
})
