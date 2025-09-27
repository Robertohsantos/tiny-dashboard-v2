# Arquitetura por Módulos

## Objetivo

Organizar o código por domínio para facilitar manutenção, leitura e evolução incremental. Cada módulo reúne serviços, repositórios, hooks, tipos, mocks e documentação relacionados a um contexto específico.

## Estrutura Básica

```
src/modules/<dominio>/
  index.ts                # barrel export oficial do módulo
  services/               # serviços e integrações do domínio
  repositories/           # acesso a dados específico do domínio
  hooks/                  # hooks de React/React Query
  types/                  # tipos compartilhados do domínio
  mocks/                  # geradores de dados fake (opcional)
  docs/                   # documentação interna (opcional)
```

## Domínios Atuais

- `dashboard`
- `produtos`
- `stock-coverage`
- `purchase-requirement`
- `notification`
- `core` (serviços compartilhados: logger, mail, prisma, redis, jobs, telemetry etc.)
- `auth` (gestão de autenticação BetterAuth e tipos derivados)
- `billing` (integração de pagamento e planos de assinatura)
- `storage` (providers de arquivos e credenciais compartilhadas)
- `organization` (fluxos compartilhados de gerenciamento de organizações e diálogos)
- `invitation` (componentes de convite para onboarding e gestão de membros)
- `ui` (biblioteca compartilhada de UI: componentes, hooks e utilitários como `cn`)
- `content` (componentes MDX e infraestrutura de documentação/blog)
- `site` (componentes e utilitários do marketing site e páginas públicas)

## Convenções

- **Exports:** consuma as APIs públicas via `index.ts` do módulo. As pastas `src/services/`, `src/hooks/`, `src/utils/` e `src/components/*` legadas foram desmontadas; use sempre `@/modules/<dominio>` para expor APIs.
- **Imports internos:** prefira caminhos absolutos (`@/modules/<dominio>/…`). Evite caminhos relativos profundos para manter os limites de cada módulo claros.
- **Reaproveitamento:** serviços cross-cutting (ex.: `logger`, `telemetry`, `prisma`, `redis`, `mail`) permanecem em `src/modules/core` e devem ser acessados via barrel.
- **Testes:** mantenha os testes próximos ao código (`services/__tests__`, `hooks/__tests__`, etc.) dentro do próprio módulo.
- **UI compartilhada:** os componentes base ainda residem em `src/components/ui`, mas todo consumo deve passar por `@/modules/ui` (que também expõe hooks utilitários e o helper `cn`).

- **Estrutura legada:** os diretórios `src/lib/`, `src/services/`, `src/hooks/` e `src/utils/` foram desmontados; utilize módulos dedicados para novos utilitários ou componentes compartilhados.

## Próximos Passos

- Monitorar novos consumidores para garantir uso consistente de `@/modules/<dominio>`; evite reintroduzir _facades_ de compatibilidade.
- Aplicar este padrão a futuros domínios antes de adicionar arquivos diretamente fora de `src/modules` (ex.: evite recriar `src/services`).
