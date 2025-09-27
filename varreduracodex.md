# Varredura Codex - Dashboard Vendas

## Achados Principais

1. **(Crítico) Estrutura do gráfico inconsistente com o contrato de dados**

   - Evidência: src/modules/dashboard/repositories/dashboard-repository.ts:254. O método getChartData retorna objetos com chaves desktop, mobile e comparison, mas o restante da aplicação (tipos ChartDataPoint e ChartAreaInteractive) espera current, previous, twoPeriodsBefore e projection. Isso faz com que o chart receba valores indefinidos e impede qualquer visualização confiável.
   - Impacto: quebra funcional direta do gráfico ("dados ausentes"), impossibilita validações dos hooks e pode mascarar regressões.
   - Ação sugerida: alinhar o repositório ao shape tipado (current/previous/twoPeriodsBefore) e cobrir o contrato com testes (unit + integração React Query).

2. **(Crítico) Hook validado recebe PeriodFilter errado**

   - Evidência: src/modules/dashboard/hooks/data/use-dashboard-data-switch.ts:237. Quando os feature flags habilitam a versão validada, é passado period?.startDate?.toISOString() (string) para useDashboardDataValidated, que espera um objeto com startDate, endDate e marketplaceId. O hook então perde todo o filtro, consulta chaves incorretas e pode gerar requisições inválidas.
   - Impacto: a linha “validada” nunca funciona corretamente, invalidando rollout/desligamento automático de hooks e correndo risco de bugs em produção quando o flag for ligado.
   - Ação sugerida: encaminhar o PeriodFilter completo para a versão validada e garantir tipagem estrita (remover any, adicionar testes dos dois caminhos).

3. **(Alto) Prefetch de períodos nunca é disparado**

   - Evidências:
     • src/modules/dashboard/pages/dashboard-vendas/dashboard-content-v2.tsx:64-69 calcula nextPeriod/previousPeriod, mas chama usePrefetchDashboardData() duas vezes sem parâmetros.
     • src/modules/dashboard/hooks/data/use-dashboard-data-switch.ts:274-292 ignora argumentos e devolve OriginalHooks.usePrefetchDashboardData() também sem parâmetros.
     • src/modules/dashboard/hooks/data/use-dashboard-data.ts:140-172 mostra que, sem adjacentPeriod, o hook retorna antes de chamar usePrefetchQuery.
   - Impacto: o recurso anunciado de “prefetch de períodos adjacentes” simplesmente não acontece, desperdiçando memórias/cálculos e deixando a UI menos responsiva do que o esperado.
   - Ação sugerida: aceitar (currentPeriod, adjacentPeriod) no wrapper, replicar na versão validada e, no componente, invocar separadamente para next e previous. Aproveitar para garantir ordem estável de hooks (evitar retornos precoces quando adjacentPeriod oscila).

4. **(Alto) Wrappers de hooks expõem API incorreta**

   - Evidência: src/modules/dashboard/hooks/data/use-dashboard-data-switch.ts:19-222. Os wrappers useDashboardMetrics/useFinancialMetrics/... aceitam (startDate, endDate, onValidationError) mas invocam os hooks originais com esses parâmetros. Os hooks originais (e validados) esperam PeriodFilter ou objeto de opções, logo esse código causa erros de tipo e comportamento indefinido. O lint não flagra porque a assinatura usa any em alguns pontos.
   - Impacto: qualquer consumidor que importá-los (ou os testes existentes) rodará com filtros quebrados, perdendo marketplace/endDate e ocasionando dados incorretos.
   - Ação sugerida: padronizar assinatura para (periodFilter, options) em ambos os lados, remover any e cobrir com testes.

5. **(Médio) Código morto e sinalização enganosa**

   - FALLBACK_TIMEOUT em use-dashboard-data-switch.ts é declarado e nunca utilizado, sugerindo funcionalidade inacabada.
   - nextPeriod/previousPeriod hoje são cálculos órfãos (ver item 3).
   - Impacto: ruído cognitivo, risco de confiar em comportamentos inexistentes.
   - Ação sugerida: remover dead code ao ajustar o prefetch ou implementar de fato o timeout de fallback.

6. **(Saúde do projeto) Perda de tipos em useDashboardData**
   - Evidência: src/modules/dashboard/hooks/data/use-dashboard-data-switch.ts:215 tipa o parâmetro period como any, anulando os benefícios do esquema estrito (tsconfig.strict = true).
   - Impacto: deixa passar regressões como a do item 2.
   - Ação sugerida: tipar corretamente o parâmetro e propagar interfaces (PeriodFilter).

## Checagens de Lint & Types

- Não executei npm run lint ou npm run typecheck; os problemas acima já explicam possíveis falhas nesses comandos. Recomendo rodá-los após aplicar as correções.

## Plano de Correção Proposto

1. Ajustar DashboardRepository.getChartData para emitir ChartDataPoint válido e adicionar testes que validem o contrato com ChartAreaInteractive (mock de dados reais + snapshot do gráfico).
2. Refatorar use-dashboard-data-switch para:
   - Propagar PeriodFilter completo para hooks validados/originais;
   - Corrigir assinaturas dos wrappers (sem any) e remover FALLBACK_TIMEOUT não utilizado.
3. Reescrever a cadeia de prefetch:
   - usePrefetchDashboardData deve aceitar (current, adjacent) e chamar usePrefetchQuery sempre que adjacent existir;
   - DashboardContentV2 deve invocar uma vez para nextPeriod e outra para previousPeriod;
   - Cobrir com teste simples (mock de usePrefetchQuery comprovando as chamadas).
4. Revisar testes/unitários existentes (lib/hooks/dashboard/**tests**) para alinhá-los às novas assinaturas e garantir cobertura do caminho validado.
5. Após ajustes, rodar npm run lint, npm run typecheck e, se aplicável, testes automatizados (npm run test:run).

> Observação: todas as mudanças acima podem ser feitas sem alterar contratos públicos além do que já está incorreto; documente no changelog se o bundle expõe esses hooks.

## Correções Aplicadas (Codex)

- Atualizei src/modules/dashboard/repositories/dashboard-repository.ts para alinhar a forma dos dados do gráfico aos tipos ChartDataPoint esperados (campos current, previous, twoPeriodsBefore).
- Reescrevi src/modules/dashboard/hooks/data/use-dashboard-data-switch.ts com normalização de período, monitoramento de fallback e assinatura consistente dos hooks, garantindo que os caminhos validados recebam PeriodFilter completo e que o prefetch aceite parâmetros.
- Ajustei src/modules/dashboard/pages/dashboard-vendas/dashboard-content-v2.tsx para pré-carregar corretamente períodos adjacentes com os novos parâmetros do hook de prefetch.
