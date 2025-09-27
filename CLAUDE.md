# Tiny Dashboard -- Guia Operacional do Claude Code

> **Última atualização:** setembro/2025 · **Responsável:** Engenharia Tiny Dashboard
>
> Este arquivo fornece o contexto mínimo e as regras de trabalho que o Claude Code deve seguir sempre que for inicializado no projeto. Consulte-o antes de qualquer modificação.

---

## 1. Visão Geral do Produto

- Aplicação: SaaS multi-tenant com dashboards de vendas, gestão de produtos e recursos administrativos.
- Frontend: Next.js 15.5.3 (App Router, React 18), Tailwind + shadcn/ui.
- Backend: Igniter.js (controllers/procedures/actions), Prisma 6.16.1 com PostgreSQL.
- State/Data: TanStack Query v5, hooks validados com Zod.
- Autenticação: Sessões multi-organização, convites, API Keys.
- Observabilidade: Telemetria custom em `src/modules/core/services/telemetry.ts`, logs centralizados.

### Ambientes e Feature Flags
- Arquivo `.env.local` controla chaves locais (ver README.md).
- Defina `SKIP_REDIS=true` em desenvolvimento se não houver Redis disponível.
- Feature flags em `src/modules/core/utils/feature-flags.ts` controlam hooks validados (ex.: `FEATURE_FLAGS.VALIDATION_*`).

---

## 2. Estrutura de Pastas Essenciais

```
/src
  ├─ @saas-boilerplate/      # Núcleo vendorizado (features, providers, utils)
  ├─ app/                    # App Router (landing, área autenticada, APIs)
  │    ├─ (site)/            # Marketing site: home, blog, help center
  │    ├─ (private)/         # Aplicação autenticada (/app)
  │    ├─ dashboard-vendas/  # Página legacy/SSR de dashboard
  │    ├─ produtos/          # Entrada SSR para produtos
  │    └─ api/               # Rotas RSC e controladores HTTP
  ├─ modules/                # Domínios com serviços, hooks, componentes, docs
  │    ├─ core/              # Infra (telemetry, prisma, providers, utils)
  │    ├─ dashboard/         # Dashboard de vendas (hooks, serviços, UI)
  │    ├─ produtos/          # Filtros, hooks, modais e serviços de produtos
  │    ├─ stock-coverage/    # Cálculos de cobertura e cache
  │    ├─ purchase-requirement/ # Necessidade de compra
  │    ├─ site/              # Componentes e utilidades do marketing site
  │    ├─ ui/                # Barrel do design system (reexporta components/ui)
  │    └─ ...                # Outros domínios (auth, billing, storage, etc.)
  ├─ components/ui/          # Design system base (consumir via `@/modules/ui`)
  ├─ features/               # Funcionalidades custom (lead/, submission/)
  ├─ content/                # Conteúdo MDX, emails, menus, posts
  ├─ docs/                   # Guias e documentação interna
  ├─ mocks/                  # Dados fake compartilhados
  ├─ tests/                  # Suites de teste (unit/e2e)
  └─ generated/              # Prisma Client e derivados
```

### Componentização de Páginas
- Páginas em `app/` continuam focadas em composição e delegam lógica para `src/modules/**`.
- Componentes específicos de domínio moram no módulo correspondente (`src/modules/<domínio>/components`).
- Evite recriar pastas `(components)` dentro de `app/`; prefira importar do módulo.
- Design system compartilhado permanece em `components/ui`, sempre exposto via `@/modules/ui`.

---

## 3. Princípios Invioláveis

1. **Sem pressa e sem suposições** -- leia, entenda e confirme antes de alterar.
2. **SRP (Single Responsibility Principle)** -- arquivos, hooks e componentes devem ter responsabilidade única.
3. **SSOT (Single Source of Truth)** -- dados reais vêm do backend/prisma; tipos derivam de Prisma e Zod.
4. **DRY** -- reutilize lógica via hooks/services; proíba duplicações.
5. **KISS** -- implemente soluções simples e claras; evite over-engineering.
6. **YAGNI** -- não adicione features “para o futuro”.
7. **Componentização disciplinada** --
   - Reaproveite componentes existentes antes de criar novos.
   - Novos componentes residem próximos do contexto de uso.
   - `page.tsx` não deve conter lógica pesada; extraia para hooks/services.
8. **Mocks isolados** -- dados fake em `src/mocks/` ou testes, nunca em componentes de produção.
9. **Produção usa apenas dados reais** -- sem mocks ou fallbacks hardcoded.
10. **Consistência visual** -- respeite layout, tokens e spacing do design system.

### Checklist obrigatório antes de codar
- [ ] Sem pressa e sem suposições.
- [ ] Leia todos os arquivos relevantes (componentes, hooks, services, tipos, docs).
- [ ] Não avance sem entendimento completo do contexto.
- [ ] Reaproveite componentes existentes sempre que possível.
- [ ] Planeje arquitetura, reutilização e manutenção de longo prazo.
- [ ] Produza código limpo, legível e profissional (sem gambiarras).
- [ ] Garanta facilidade de manutenção/evolução.
- [ ] Mantenha mocks isolados e fora do código de produção.
- [ ] Em produção, utilize apenas dados reais obtidos pelos serviços oficiais.
- [ ] Preserve layout, estilos e padrões visuais.
- [ ] Reflita profundamente sobre impactos antes da primeira linha de código.

### Checklist de saída
- [ ] `npx tsc --noEmit` sem erros.
- [ ] `npx eslint .` sem violações.
- [ ] Testes relevantes (`npm run test` ou suites específicas) passando.
- [ ] Revisar diffs: sem arquivos gerados indevidos; alterações em `@saas-boilerplate/*` somente com justificativa.
- [ ] Atualizar documentação (README, MIGRATION-*, CLAUDE.md) se comportamento/padrão mudou.

---

## 4. Fluxos Críticos e Boas Práticas

### Hooks validados
- Hooks com sufixo `-validated` usam Zod + React Query v5.
- O switch em `lib/hooks/*-switch.ts` alterna entre legacy e validated; mantenha parâmetros (`enabled`, `gcTime`, `placeholderData`).

### Serviços essenciais
- `src/services/notification.ts`: use `defineTemplate`; mantenha `NotificationTemplates` em conformidade.
- `src/services/purchase-requirement.service.ts`: opera com `ProductWithCoverage`; não remova dados de cobertura.
- `src/services/redis.ts`: instância única de ioredis; use `SKIP_REDIS=true` localmente se preciso.
- `src/modules/core/monitoring/validation-telemetry.ts`: só chame `recordEvent`/`recordMetric` quando `telemetry` existir.

### Igniter (API)
- Controllers: `src/igniter.router.ts` (server-only).
- Client: `src/igniter.client.ts`; não importe controllers em componentes client.
- Novo endpoint = controller ➝ procedure ➝ serviço/hook.

### Páginas principais
- **Dashboard de Vendas (`app/dashboard-vendas`)**
  - Hooks: `useDashboardData`, `useDashboardDataSwitch`, `useDashboardDataValidated`.
  - Componentes: `MetricCard`, `DashboardContent`, `ChartArea`, etc.
- **Produtos (`app/produtos`)**
  - Hooks: `use-produtos-data-switch`, `use-produtos-data-validated`, `useSaveProduto`.
  - Componentes/serviços residem em `src/modules/produtos/**` (importe via `@/modules/produtos`).
- **Área privada (`app/(private)/app`)**
  - Reutilize componentes do boilerplate; evite customizações diretas.

### Styling
- Tailwind configurado em `tailwind.config.ts`; reaproveite utilitários.
- Tokens globais (cores/spacing) em `globals.css` e `components/ui`.
- Evite CSS inline longo; prefira classes utilitárias ou componentes estilizados.

---

## 5. Ferramentas de Qualidade

| Ferramenta | Configuração | Observações |
|------------|-------------|-------------|
| ESLint (flat) | `eslint.config.mjs` | Regras `@saas-boilerplate/*` devem permanecer ativas. Evite `eslint-disable` sem justificativa. |
| Prettier | `prettier.config.cjs` | Rodar `npm run format` após mudanças extensas. |
| TypeScript | `tsconfig.json`, `tsconfig.eslint.json` | `strict` ativado; utilize `Prisma.validator`, `z.infer` e tipos derivados. |
| Tests | `vitest.config.ts`, `tests/` | Vitest + Testing Library. Execute suites impactadas. |

*Sugestão:* documente upgrades de lint/tsconfig em `MIGRATION-*.md` e atualize este arquivo quando padrões mudarem.

---

## 6. Rotina de Desenvolvimento Recomendada

1. **Planejar** -- revisar MIGRATION-*, README e arquivos alvo.
2. **Explorar** -- ler código existente (componentes, hooks, serviços, testes).
3. **Codar** -- seguir checklists, padrões e princípios acima.
4. **Validar** -- rodar typecheck, lint, testes e validar fluxos na UI.
5. **Documentar** -- atualizar changelog, MIGRATION docs e este arquivo quando necessário.
6. **Entregar** -- PR com descrição clara, cenários testados e impactos conhecidos.

### Por que isso importa?
- Fluxos críticos envolvem financeiro, estoque e notificações -- qualquer alteração sem contexto quebra SSR, validações e multi-tenancy.
- Hooks validados dependem de schemas sincronizados; alterações parciais geram bugs silenciosos.
- O boilerplate SaaS é compartilhado; compatibilidade é mandatória.

---

## 7. Referências Rápidas

- Documentação interna: `docs/`, `MIGRATION-*.md`, `README.md`.
- Configurações chave: `next.config.ts`, `tailwind.config.ts`, `package.json`.
- Scripts úteis: `npm run dev`, `npm run build`, `npm run analyze` (se habilitado), `npm run storybook` (quando disponível).
- Ambiente: mantenha Node conforme `package.json > engines`; use `nvm`/`fnm` se necessário.

---

## 8. Sugestões Futuras para este Arquivo

- Adicionar tabela de erros comuns (lint, typecheck, build) com soluções rápidas.
- Criar roteiro de onboarding (setup inicial, env, seeds).
- Documentar scripts de migração pós-merge (ex.: `npx prisma migrate deploy`).
- Manter status das feature flags e critérios de remoção.
- Registrar política de versionamento/branches e checks obrigatórios de CI/CD.

Atualize o CLAUDE.md sempre que padrões ou dependências críticas mudarem.

---

## 9. Contatos e Escalonamento

- Dúvidas técnicas: revisar README, MIGRATION docs e código relacionado; alinhar com o time Tiny Dashboard quando necessário.
- Bloqueios críticos: registrar no canal interno apropriado e documentar no PR.

Consistência, clareza e manutenção a longo prazo são prioridades. Em caso de dúvida, pare, pesquise e confirme antes de prosseguir.
