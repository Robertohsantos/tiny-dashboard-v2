# Varredura Codex - Produtos

## Achados Principais

1. **(Critico) Servico de produtos retorna erro em producao**
   - Evidencia: `src/modules/produtos/services/produtos.service.ts` (linhas 47, 71, 92, 117). Fora do modo mock (`ENV_CONFIG.useMockData === false`) os metodos `getMetrics`, `getProdutos`, `getStockDistribution` e `getProdutosReposicao` lancam erros (`Real data fetching not yet implemented`) em vez de respostas controladas, derrubando a pagina em producao.
   - Acao sugerida: implementar consultas reais ou retornar estruturas vazias/logar a falha ate que a integracao esteja pronta.

2. **(Critico) Wrapper validado de hooks usa assinaturas incompativeis**
   - Evidencia: `src/modules/produtos/hooks/data/use-produtos-data-switch.ts`. Os wrappers (`useProdutoMetrics`, `useProdutosList`, `useAllProdutoData`, etc.) seguem repassando `filter` como primeiro argumento para hooks validados que esperam um objeto de opcoes. Quando o feature flag de validacao ativa os hooks novos, ocorre excecao ou fallback involuntario.
   - Acao sugerida: alinhar com o padrao adotado em dashboard (`filter` normalizado + objeto de opcoes) e remover fallbacks manuais.

3. **(Alto) Semantica dos filtros diverge entre SSR, contexto e mocks**
   - Evidencias: `src/modules/produtos/pages/produtos-content.tsx` injeta `initialData`; `produtos-filters.tsx` ainda trata array vazio como 'aplicar filtro vazio' enquanto os mocks em `produtos-mock-generator.ts` devolvem lista vazia para array vazio. Resultado: ao limpar filtros, a lista pode sumir e SSR x CSR divergem.
   - Acao sugerida: padronizar [] como 'mostrar tudo' e usar sinalizacao explicita (`['all']`) para 'todos selecionados'. Ajustar mocks/utilitarios para essa semantica.

4. **(Alto) Modal de necessidade de compra usa organizationId ficticio**
   - Evidencia: `src/modules/produtos/pages/produtos-content.tsx:230` fixa `organizationId = 'default-org-id'`, quebrando acoes reais e testes de integracao.
   - Acao sugerida: obter o ID real via contexto de autenticacao ou receber via props, documentando fallback.

5. **(Medio) useAllProdutoData duplica requisicoes e ignora SSR**
   - Evidencia: `produtos-content.tsx` chama `useAllProdutoData(filter)` e `useAllProdutoData(None)` (via fallback), duplicando fetch e ignorando `initialData`. O wrapper ainda recria manualmente um objeto `combinedData`, perdendo controle de `isFetching`.
   - Acao sugerida: separar responsabilidades (metrics/list/analytics) ou reaproveitar prefetch + caches SSR, evitando chamadas duplicadas.

6. **(Medio) Mock generator usa sessionStorage e seeds diferentes**
   - Evidencia: `src/modules/produtos/mocks/produtos-mock-generator.ts` utiliza seed fixa 12345 no SSR mas depende de `sessionStorage` no browser, gerando divergencia entre requests e instabilidades em testes.
   - Acao sugerida: adotar gerador deterministico com seed unica por request e evitar acesso a `sessionStorage` fora do ambiente browser.

7. **(Medio) Falta alinhamento com servicos de estoque reais**
   - Evidencias: `use-filter-calculations.ts`, `generateMockProdutoMetrics` e `section-produtos-metrics.tsx` aplicam heuristicas fixas (`defaultTotal = 150`). Quando conectarmos dados reais, os percentuais podem ficar incorretos.
   - Acao sugerida: reutilizar calculos expostos por `stock-coverage` e `purchase-requirement` para garantir consistencia.

8. **(Baixo) Ausencia de testes unitarios**
   - Nao ha testes cobrindo `use-produtos-data` e `use-produtos-data-switch`; regression no contrato passa sem alerta.
   - Acao sugerida: adicionar suites inspiradas no dashboard (mock services e validar caminhos original/validado).

## Plano de Correcao Proposto

1. Atualizar `produtos.service.ts` para respostas controladas em producao ou implementar as integracoes reais imediatamente.
2. Refatorar `use-produtos-data-switch.ts` para seguir o contrato padrao (filtro + opcoes) sem fallbacks manuais.
3. Harmonizar semantica dos filtros entre contexto, mocks e hooks reutilizando `initialData` como fonte unica.
4. Fornecer `organizationId` real ao `PurchaseRequirementModal` (contexto de auth ou prop).
5. Revisar mocks (`produtos-mock-generator`, `mock-data.service`) e testes (`vitest`) para refletir o novo formato de dados.
6. Adicionar testes unitarios garantindo cobertura do fluxo original e do fluxo validado nos hooks de produtos.
