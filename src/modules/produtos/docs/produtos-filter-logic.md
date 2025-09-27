# Guia Definitivo da Lógica dos Filtros de Produtos

## 1. Propósito

Este documento registra o funcionamento atual da experiência de filtros na página `/produtos`, os incidentes que já ocorreram e como foram solucionados. Ele deve ser usado como fonte de verdade sempre que houver regressões, ajustes de UX ou integrações com novos dados.

## 2. Arquitetura Resumida

| Camada              | Arquivo                                                                             | Responsabilidade                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Contexto de estado  | `src/modules/produtos/contexts/filter-context.tsx`                                  | Guarda o estado dos filtros, expose actions, conta filtros ativos e mantém o snapshot default. |
| UI dos filtros      | `src/modules/produtos/components/page/produtos-filters.tsx`                         | Renderiza os multi-selects, sanitiza valores e aplica disponibilidade dinâmica.                |
| Cálculos auxiliares | `src/modules/produtos/hooks/use-filter-calculations.ts`                             | Calcula opções habilitadas, totais exibidos e contadores.                                      |
| Hooks de dados      | `src/modules/produtos/hooks/data/use-produtos-data-switch.ts` e derivados                    | Normalizam payloads de filtro e disparam React Query.                                          |
| Serviço / mocks     | `src/modules/produtos/services/produtos.service.ts` + `src/modules/produtos/mocks/produtos-mock-generator.ts` | Respondem a filtros (real ou fake) e retornam métricas, produtos e analytics.                  |
| Página              | `src/modules/produtos/pages/produtos-content.tsx`                                   | Constrói o payload, hidrata caches, injeta filtros e renderiza o resultado final.              |

## 3. Histórico de Bugs e Correções

| Data       | Sintoma                                                                                              | Causa raiz                                                                                                              | Correção                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 23/09/2025 | Filtros ignorados logo após o carregamento inicial; métricas/tabela permaneciam completas por ~60s.  | `produtos-content.tsx` sempre repassava `initialData` para o hook, mesmo com payload filtrado, mantendo o cache do SSR. | Reestruturação do `filterPayload` e injeção de `initialData` apenas quando todos os filtros estão no estado default.                   |
| 23/09/2025 | Marcas com acentuação (ex.: L'Oréal) retornavam subconjuntos diferentes após alternar filtros.       | Slugs de marca não eram canonizados em todo o stack (constants, mocks e UI).                                            | Uso de `normalizeMarca` em `getMarcaOptions`, mocks e sanitização de UI; remoção de duplicidades.                                      |
| 24/09/2025 | Botão "Limpar filtros" retornava totais diferentes do estado inicial.                                | Mock generator utilizava seed aleatório no cliente, gerando datasets distintos do SSR; cache não era hidratada.         | Seed fixo (`DEFAULT_SEED`) em todos os ambientes + `hydrateMockProdutosCache` chamado no primeiro render.                              |
| 24/09/2025 | Combinações de filtros não respeitavam interdependência (opções indisponíveis continuavam visíveis). | `calculateAvailableOptions` e sanitização de multi-select não limitavam valores ao contexto atual.                      | Multi-select passou a filtrar opções a partir de `availableOptions`, e valores selecionados são sanitizados antes de disparar payload. |
| 25/09/2025 | Reativar manualmente filtros não devolvia o total inicial (diferença de ~R$ 5 mil após "selecionar todos"). | Multi-select removia escolhas que ficavam temporariamente indisponíveis quando outro filtro era alterado; o contexto perdia parte da seleção. | Opções selecionadas permanecem na lista (mesmo com contagem 0) e o merge preserva seleções ocultas no estado, garantindo idempotência nos payloads. |

## 4. Estado Atual Esperado

### 4.1 Estado inicial

- Todos os filtros (`deposito`, `marca`, `fornecedor`) começam com todas as opções selecionadas.
- O payload enviado para os hooks é `undefined`, garantindo que o dataset completo (seed 12345) seja usado.

### 4.2 Seleção individual

- Marcar/desmarcar opções atualiza o contexto imediatamente e os hooks disparam com o array sanitizado.
- Opções que ficam indisponíveis permanecem visíveis enquanto estiverem selecionadas (contagem 0) e voltam a ser válidas automaticamente quando o contexto permite.

### 4.3 "Selecionar todos"

- Sempre opera sobre as opções habilitadas naquele momento (respeitando interdependências).
- Ao selecionar tudo, o array correspondente fica vazio, sinalizando "todos" ao serviço.

### 4.4 "Limpar filtros"

- Restaura o snapshot `initialStateRef` do contexto (todas as opções selecionadas).
- Reidrata o dataset mock baseado em `initialData` e seed fixo, retornando às métricas originais (R$ 2.119.508,35 com o dataset atual).

## 5. Fluxo de Dados

1. **Contexto** (`filter-context`): guarda arrays sem `'all'` e expõe `resetFilters`.
2. **UI** (`produtos-filters.tsx`): alinha opções com `availableOptions`, sanitiza arrays e chama actions.
3. **Hook de dados**: chama `normalizeProdutoFilter` (remove arrays vazios ou `'all'`).
4. **Serviço / mock**:
   - Se algum filtro chegar com array vazio explícito, retorna métricas vazias.
   - Caso contrário, aplica interseção de filtros sobre o dataset canonical.
5. **Página** (`produtos-content.tsx`): após montar, chama `hydrateMockProdutosCache` para garantir que o mock compartilhe o mesmo dataset do SSR.

## 6. Debug e Troubleshooting

Use esta ordem quando encontrar comportamentos estranhos:

1. **Conferir valores no contexto**: `useProductFilters` deve conter arrays sem `'all'` e apenas IDs válidos.
2. **Verificar `filterPayload`**: se estiver `undefined`, os filtros estão no estado default.
3. **Garantir seed fixa**: `sessionStorage.mock_produtos_seed` deve ser `12345` após a hidratação inicial.
4. **Inspecionar opções disponíveis**: `calculateAvailableOptions` deve refletir exatamente o resultado filtrado.
5. **Logs do serviço**: `hasEmptySelection(filter)` retorna true somente se algum array chegar realmente vazio (resultado esperado: métricas zeradas).
6. **React Query Devtools** (opcional): observe a key das queries (`produtos`, `complete`, payload normalizado).

## 7. Procedimento de Manutenção

Sempre que alterar filtros, siga este checklist:

- Atualizar `produtos.context.tsx` se introduzir novos tipos de filtro.
- Ajustar `calculateAvailableOptions` e `produtos-filters.tsx` para refletir interdependências.
- Sincronizar mocks e serviços reais em relação a novos campos.
- Validar manualmente:
  - Desmarcar todos os depósitos -> métricas vazias.
  - Selecionar 1 loja + 1 fornecedor + 1 marca -> tabela e métricas consistentes.
- "Selecionar todos" seguido de "Limpar filtros" -> retorna ao valor inicial.
- Alternar qualquer filtro e depois restaurá-lo manualmente -> métricas retornam ao valor original (seleções temporariamente indisponíveis são preservadas).
- Rodar lint/tests e atualizar esta documentação caso haja mudanças estruturais.

## 8. FAQ Rápido

- **Por que arrays vazios representam "todos"?** Economiza payload e simplifica verificações de "filtro ativo".
- **É seguro persistir filtros no URL?** Sim, reutilize `parseFilterParams` / `serializeFilterParams` de `produtos-transforms.utils.ts`.
- **Como adicionar um novo filtro dependente?** Use `calculateAvailableOptions` como referência; todo filtro precisa calcular interdependência e sanitização própria na UI.

## 9. Histórico de Manutenções

- 23/09/2025 - Correção do uso de `initialData` e sanitização dos filtros de marca.
- 24/09/2025 - Seed determinístico, hidratação de cache e revisão completa da UI dos filtros.
- 24/09/2025 - Este documento foi revisado para refletir a versão estabilizada.
- 25/09/2025 - Ajuste na lógica de merge dos multi-selects para preservar seleções ao alternar filtros interdependentes.

---

Mantenha este arquivo alinhado a qualquer alteração nos filtros. Ele é a referência principal para diagnósticos e manutenção preventiva da página de produtos.
