# Logica de Filtros ao Estilo Excel

Este documento descreve a regra oficial de filtros usada na pagina Produtos e que passa a ser o padrao para toda a aplicacao. A implementacao atual replica o comportamento dos filtros do Excel, garantindo consistencia entre tabelas, modais e fluxos derivados.

## Principios

- AND entre colunas: todas as colunas filtradas operam por intersecao. Um registro so permanece visivel se atender a todos os filtros ativos.
- OR dentro da coluna: multiplos valores selecionados em uma mesma coluna equivalem a uma uniao (valor pertence a selecao), preservando o comportamento "checkbox" do Excel.
- Lista dinamica por coluna: as opcoes exibidas em cada filtro sao calculadas a partir do conjunto S_not_col (linhas que respeitam todos os demais filtros, exceto o da propria coluna). Valores sem resultados deixam de ser exibidos.
- Ordenacao alfabetica (locale pt-BR, sensitivity base): todas as opcoes e contadores apresentados nos dropdowns utilizam `localeCompare` com normalizacao de acentos, incluindo valores dinamicos herdados do backend ou calculados em tempo real.
- Selecoes vazias sao filtros ativos: a ausencia de valores selecionados em uma coluna passa a significar "nenhum item autorizado", produzindo zero resultados. Esse estado ainda e considerado filtro ativo e recebe destaque visual.
- Altura padronizada: as listas de opcoes exibidas pelo `MultiSelect` utilizam `optionsMaxHeight` com valor de **214 px**, garantindo consistencia visual antes do overflow com scroll.
- As listas permitem edicao fluida: o usuario pode marcar/desmarcar varias opcoes em sequencia e apenas apos clicar em **Aplicar** o sistema recalcula e propaga as mudancas. **Cancelar** descarta a edicao em andamento e fecha o filtro.

## Fluxo de calculo

0. Edicao manual: enquanto o popover do filtro esta aberto, as marcacoes sao mantidas em um estado local (`commitMode="manual"`). O usuario pode selecionar varias opcoes sem disparar recalculos imediatos.
1. Calculo das linhas visiveis: filtrar o dataset aplicando todos os predicados ativos (AND entre colunas) apenas quando o usuario confirma a selecao.
2. Opcoes por coluna: para cada filtro k, aplicar todos os filtros exceto k (conjunto S_not_k), projetar o resultado em k e gerar a lista de valores distintos com contagem. Apenas esses valores sao mostrados ao usuario.
3. Sanitizacao: valores que deixam de existir em S_not_col sao removidos da selecao; marcas utilizam normalizeMarca antes da comparacao.
4. Filtro pai: o contexto registra a ordem de ativacao; o primeiro filtro ativo torna-se primaryFilter e recebe apenas destaque visual no MultiSelect. Ao limpar o filtro pai, o proximo filtro ativo assume o destaque.
5. Empty state: qualquer selecao vazia zera o conjunto visivel e esvazia os demais dropdowns, tal como no Excel.

### Botoes de acao

- **Aplicar**: confirma a selecao local e dispara o recalculo do container de metricas, da tabela e das listas dependentes. Executa `onApply` (ou `onValueChange` quando nao fornecido) e fecha o popover.
- **Cancelar**: descarta a selecao local, restaura os valores atualmente aplicados e fecha o popover sem disparar atualizacoes.
- **Multipla selecao fluida**: o usuario pode marcar/desmarcar varias opcoes em sequencia usando o estado local. So apos decidir clicar em **Aplicar** o sistema sincroniza o contexto e recalcula os dados globais.

## Implementacao

| Area | Arquivo | Responsabilidade |
| --- | --- | --- |
| Contexto de filtros | src/modules/produtos/contexts/filter-context.tsx | Guarda o estado (filters), rastreia primaryFilter/activeFiltersOrder, sanitiza entradas e expoe acoes derivadas. |
| Funcoes utilitarias | src/modules/produtos/utils/produtos-filters.utils.ts | Implementa calculateAvailableOptions, calculateOptionCounts, isOptionDisabled e formatOptionLabel seguindo os principios acima. |
| Transformacoes comuns | src/modules/produtos/utils/produtos-transforms.utils.ts | Normalizacao de marca (normalizeMarca), deteccao de filtros ativos (isFilterActive), contagem de filtros (countActiveFilters) e serializacao de parametros. |
| UI dos filtros | src/components/ui/multi-select.tsx | Componente base com suporte a destaque do filtro pai, contadores, modo single, virtualizacao basica, busca embutida e modos de commit (`immediate`/`manual`) com botoes Aplicar/Cancelar. |
| Pagina Produtos | src/modules/produtos/components/page/produtos-filters.tsx | Combina contexto + utilitarios para desenhar os tres filtros principais (Deposito, Marca, Fornecedor). |

## Boas praticas

1. Recalcule sempre a partir do estado global. Ao receber novos dados ou alterar filtros, derive availableOptions novamente em vez de tentar patches incrementais.
2. Evite opcoes artificiais. Nunca force a permanencia de um valor inexistente; o usuario deve limpar o filtro para voltar a ve-lo.
3. Use o MultiSelect padrao para herdar UX, acessibilidade e destaque do filtro pai.
4. Trate selecoes vazias como filtros ativos e mantenha o destaque visual ate que o usuario limpe ou reintroduza valores.
5. Mostre contagens coerentes com S_not_col para que o usuario saiba quantos itens restariam ao escolher cada opcao.

## Testes automatizados

- src/modules/produtos/mocks/__tests__/produtos-mock-generator.test.ts: garante que a filtragem ocorre antes do limite e que selecoes vazias retornam datasets vazios.
- src/modules/produtos/utils/__tests__/produtos-transforms.utils.test.ts: valida isAllSelected, isFilterActive, countActiveFilters e auxiliares com selecoes vazias e totais dinamicos.

Execucao sugerida:
  npx vitest run src/modules/produtos/mocks/__tests__/produtos-mock-generator.test.ts
  npx vitest run src/modules/produtos/utils/__tests__/produtos-transforms.utils.test.ts (requer ambiente com window, ex.: vitest --environment jsdom)

## Proximos passos

- Propagar a logica Excel-style para modulos que usam filtros multiplos.
- Consolidar utilitarios genericos (parse/serialize) em camadas compartilhadas.
- Avaliar memoizacao e caching para datasets grandes ou filtros em cascata.

## Notas de manutencao (2025-10-01)

- **Destaque consistente no modal de Necessidade de Compra:** o filtro considerado base agora recebe o mesmo realce visual dos demais contextos, respeitando a ordem de ativacao.
- **Sincronizacao de filtros no submodal:** as selecoes aplicadas no modal principal sao copiadas para o submodal de lista, preservando contagens, destaque do filtro pai e estados iniciais. Para isso persistimos `filterTotals` (contagem original de depositos/marcas/fornecedores/categorias) e `primaryFilter` no resultado do calculo.
- **Altura fixa de 214 px:** todos os dropdowns ligados a Necessidade de Compra utilizam a mesma altura antes do scroll, mantendo a experiencia uniforme.
- **Estado "0" vs. "Todos" na cascata:** `[]` representa filtro ativo vazio (nenhum item permitido) e derruba imediatamente as demais listas; `todos selecionados` significa o filtro nao limita os demais. O modal secundario herda exatamente a selecao aplicada no modal de Necessidade de Compra, incluindo o estado "todos" (lista completa), e so apos a abertura o usuario pode divergir livremente.

### Notas adicionais (2025-10-05)

1. **Categoria ignorada no modal principal:** `calculateAvailableOptions` nao tratava lista vazia como filtro ativo; ajustamos o form (`purchase-requirement-form.tsx`) e os utilitarios (`produtos-filters.utils.ts`).
2. **Destaque invertido após filtrar fornecedores:** reintroduzimos o rastreio de ordem com `activationOrderRef` no modal principal para manter o filtro pai correto.
3. **Submodal nao refletia filtros locais:** substituimos os selects por `MultiSelect` em modo manual, normalizamos valores e passamos a recalcular opções com `calculateAvailableOptions`.
4. **Contadores exibiam "(total)" com lista vazia:** o gatilho do `MultiSelect` agora mostra `selecionados/total`, distinguindo estado vazio.
5. **Inicializacao inconsistente entre modal e submodal:** listas herdadas chegam normalizadas; quando o modal pai envia `[]` (todos), preenchemos automaticamente com todo o universo para manter a equivalencia inicial.
6. **Erro `Cannot access 'categoriaActive' before initialization`:** reorganizamos os `useMemo` do submodal para declarar totais/flags antes de usa-los.

### Notas complementares (2025-10-07)

1. **Contagens divergentes (ex.: 137 de 150) no fluxo de Necessidade de Compra:** detectamos que o backend estava recebendo as listas de marca/fornecedor/deposito/categoria e recalculando apenas o subconjunto filtrado. O request agora envia apenas os filtros necessarios para o motor (`skus`, buffer, horizontes) e preserva os filtros completos apenas no resultado (`config.filters`). Dessa forma, o calculo sempre considera o universo completo e o submodal aplica as restricoes apenas no cliente.
2. **Botao "Limpar filtros" no submodal:** ao limpar os filtros o estado continuava limitado ao subconjunto anterior. O reset preenche novamente os conjuntos com todo o universo conhecido, respeitando `filterTotals` e reativando o estado "todos os itens" (exibindo novamente 150 de 150 quando aplicavel).
3. **Ordenacao consistente:** todos os MultiSelects do modal principal e do submodal passaram a usar `localeCompare('pt-BR', { sensitivity: 'base' })`. Isso vale para opcoes estaticas (catalogo) e dinamicas (calculadas via `calculateAvailableOptions`), garantindo apresentacao previsivel e alinhada com a diretriz de UX.
4. **Metadados de filtros preservados no resultado:** o servico armazena `filterTotals` e `primaryFilter` dentro de `PurchaseBatchResult.config`. Esses campos sao obrigatorios para reabrir o submodal com o mesmo destaque visual e contadores originais. Implementacoes futuras devem seguir o mesmo padrao ao persistir resultados derivados de filtros em cascata.
