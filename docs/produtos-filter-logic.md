# Produtos - Ajustes de Filtros e Modal

## Problemas observados
- Filtro de deposito na pagina de produtos mostrava contagem incorreta (exibia 66 itens quando o seletor indicava 53).
- Modal de necessidade de compra permitia adicionar itens alem dos 150 produtos carregados.
- Modal herdava automaticamente os filtros aplicados na pagina, evitando ajustes independentes.

## Causas raiz
- `generateMockProdutos` aplicava filtros antes de limitar o dataset ao total carregado (150), trazendo itens que nao estavam presentes na lista renderizada.
- `AddProductModal` fazia busca chamando `produtosService.getProdutos` sem filtros, retornando produtos extras da base mock.
- `PurchaseRequirementModal` recebia `initialFilters` diretamente do contexto da pagina, sincronizando estados que deveriam ser separados.

## Solucoes aplicadas
- Ajuste no gerador mock para limitar primeiro ao total solicitado e apenas depois aplicar filtros; adicionada validacao automatizada em `src/modules/produtos/mocks/produtos-mock-generator.test.ts`.
- Modal de adicao agora pesquisa somente na lista de produtos ja carregada (`availableProducts`), impedindo itens fora do escopo atual.
- Modal passou a obter configuracoes do contexto dedicado (`usePurchaseRequirementConfig`), armazenando filtros/parametros de forma independente e persistindo ultima configuracao sem reaproveitar filtros da pagina.
- O modal recebe sempre o dataset completo inicial (independente dos filtros da tabela), permitindo configurar a necessidade de compra sem influência do estado atual da página.

## Comportamento esperado
- Selecionar qualquer deposito reflete exatamente a contagem mostrada no seletor.
- Modal de necessidade de compra nao apresenta produtos adicionais quando todos os itens ja estao listados.
- Filtros do modal iniciam com configuracao salva anteriormente (ou todos selecionados) e nao sao impactados por filtros aplicados na pagina principal.

## Validacao
- `npx vitest run src/modules/produtos/mocks/produtos-mock-generator.test.ts`
