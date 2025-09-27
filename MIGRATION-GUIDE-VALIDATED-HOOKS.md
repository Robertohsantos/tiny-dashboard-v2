# 📚 Guia de Migração: Hooks Validados com Zod

## ✅ Sprint 2 Concluído - Integração dos Hooks com Validação Zod

Este guia mostra como migrar dos hooks antigos para os novos hooks validados que garantem type safety em runtime.

## 🎯 O que foi implementado

### Novos Arquivos Criados

1. **Hooks Validados do Dashboard**

   - `/src/modules/dashboard/hooks/data/use-dashboard-data-validated.ts`
   - Todos os hooks do dashboard agora com validação Zod

2. **Hooks Validados de Produtos**

   - `/src/modules/produtos/hooks/data/use-produtos-data-validated.ts`
   - Hooks de produtos com validação e error handling

3. **Testes de Integração**
   - `/src/modules/dashboard/hooks/__tests__/use-validated-hooks.integration.test.tsx`
   - Cobertura completa dos cenários de validação

## 🔄 Como Migrar

### Exemplo 1: Dashboard Metrics

**Antes (sem validação):**

```tsx
import { useDashboardMetrics } from '@/modules/dashboard/hooks/data/use-dashboard-data'

function DashboardMetricsCard() {
  const { data, isLoading, error } = useDashboardMetrics()

  if (error) {
    console.error(error)
    return <div>Erro ao carregar métricas</div>
  }

  // ⚠️ Sem garantia de tipo em runtime
  return <div>{data?.totalVendas}</div>
}
```

**Depois (com validação):**

```tsx
import { useDashboardMetricsValidated } from '@/modules/dashboard/hooks/data/use-dashboard-data-validated'

function DashboardMetricsCard() {
  const { data, isLoading, error } = useDashboardMetricsValidated()

  // ✅ Erros de validação são tratados automaticamente
  // ✅ Toast de erro é mostrado automaticamente
  // ✅ Tipos garantidos em runtime

  if (error) {
    // ValidationError já foi logado e toast mostrado
    return <div>Erro ao carregar métricas</div>
  }

  // ✅ data é totalmente tipado e validado
  return <div>{data?.totalVendas}</div>
}
```

### Exemplo 2: Produtos com Error Handling Customizado

**Antes:**

```tsx
import { useProdutosData } from '@/modules/produtos/hooks/data/use-produtos-data'

function ProdutosList() {
  const { data, isLoading } = useProdutosData()

  // ⚠️ Sem validação, dados podem estar malformados
  return (
    <ul>
      {data?.produtos.map((produto) => (
        <li key={produto.id}>{produto.nome}</li>
      ))}
    </ul>
  )
}
```

**Depois:**

```tsx
import { useProdutoDataValidated } from '@/modules/produtos/hooks/data/use-produtos-data-validated'

function ProdutosList() {
  const { data, isLoading, validationErrors } = useProdutoDataValidated(
    undefined,
    {
      // Opcional: handler customizado para erros de validação
      onValidationError: (errors) => {
        // Log para sistema de monitoramento
        sendToMonitoring(errors)
      },
      // Opcional: dados de fallback para melhor UX
      fallbackData: {
        produtos: [],
        metrics: defaultMetrics,
      },
    },
  )

  // ✅ Dados validados ou fallback
  return (
    <ul>
      {data?.produtos.map((produto) => (
        <li key={produto.id}>{produto.nome}</li>
      ))}
    </ul>
  )
}
```

### Exemplo 3: Múltiplos Dados em Paralelo

**Antes:**

```tsx
import { useDashboardData } from '@/modules/dashboard/hooks/data/use-dashboard-data'

function DashboardPage() {
  const { data, isLoading, errors } = useDashboardData()

  // ⚠️ Sem garantia de validação
  if (errors.length > 0) {
    return <div>Erro ao carregar dashboard</div>
  }

  return (
    <>
      <MetricsSection data={data?.metrics} />
      <ChartSection data={data?.chartData} />
    </>
  )
}
```

**Depois:**

```tsx
import { useDashboardDataValidated } from '@/modules/dashboard/hooks/data/use-dashboard-data-validated'

function DashboardPage() {
  const { data, isLoading, validationErrors, queries } =
    useDashboardDataValidated(undefined, {
      onValidationError: (errors) => {
        // Apenas erros críticos
        if (errors.length > 2) {
          redirectToErrorPage()
        }
      },
      fallbackData: lastKnownGoodData, // Cache local
    })

  // ✅ Dados validados com fallback inteligente
  return (
    <>
      {validationErrors.length > 0 && (
        <Alert>Alguns dados podem estar desatualizados</Alert>
      )}
      <MetricsSection data={data?.metrics} />
      <ChartSection data={data?.chartData} />
    </>
  )
}
```

## 🎨 Recursos dos Novos Hooks

### 1. **Validação Automática**

- Todos os dados são validados com Zod antes de serem retornados
- Erros de validação são capturados e tratados

### 2. **Toast Notifications**

- Erros de validação mostram toasts automáticos
- Mensagens diferentes para dev/prod

### 3. **Retry Strategy Inteligente**

- Não faz retry em erros de validação
- Faz até 3 retries em erros de rede

### 4. **Fallback Data**

- Suporte para dados de fallback em caso de erro
- Útil para manter UX durante problemas

### 5. **Validation Error Callbacks**

- Handlers customizados para erros de validação
- Integração fácil com sistemas de monitoramento

### 6. **Batch Validation**

- Arrays são validados item por item
- Items inválidos são filtrados com warning

## 📊 Comparação de Recursos

| Recurso             | Hooks Antigos | Hooks Validados |
| ------------------- | ------------- | --------------- |
| Type Safety Runtime | ❌            | ✅              |
| Validação Zod       | ❌            | ✅              |
| Toast Automático    | ❌            | ✅              |
| Retry Inteligente   | Básico        | ✅ Avançado     |
| Fallback Data       | ❌            | ✅              |
| Error Callbacks     | Básico        | ✅ Avançado     |
| Batch Validation    | ❌            | ✅              |
| Dev/Prod Messages   | ❌            | ✅              |

## 🚀 Como Usar em Novos Componentes

### Import Simples

```tsx
// Em vez de múltiplos imports
import {
  useDashboardMetricsValidated,
  useFinancialMetricsValidated,
  useChartDataValidated,
} from '@/modules/dashboard/hooks/data/use-dashboard-data-validated'

// Use o objeto de hooks
import { validatedDashboardHooks } from '@/modules/dashboard/hooks/data/use-dashboard-data-validated'

function Component() {
  const metrics = validatedDashboardHooks.useMetrics()
  const financial = validatedDashboardHooks.useFinancialMetrics()
  const chart = validatedDashboardHooks.useChartData()
}
```

### Invalidação de Cache

```tsx
import { useInvalidateProdutos } from '@/modules/produtos/hooks/data/use-produtos-data-validated'

function ProdutoForm() {
  const invalidate = useInvalidateProdutos()

  const handleSave = async () => {
    await saveProduct()
    // Invalida queries específicas
    invalidate.invalidateList()
    invalidate.invalidateMetrics()
  }
}
```

## 🧪 Como Testar

### Setup de Teste

```tsx
import { renderHook } from '@testing-library/react'
import { createValidatedHooksWrapper } from '@/modules/dashboard/hooks/__tests__/use-validated-hooks.integration.test'

describe('MyComponent', () => {
  it('should handle validated data', async () => {
    const wrapper = createValidatedHooksWrapper()

    const { result } = renderHook(() => useDashboardMetricsValidated(), {
      wrapper,
    })

    // Teste seu componente
  })
})
```

## 📈 Benefícios da Migração

1. **🛡️ Segurança**: Dados sempre validados em runtime
2. **🐛 Menos Bugs**: Erros de tipo capturados imediatamente
3. **📊 Melhor UX**: Toasts automáticos e fallbacks
4. **🔍 Debug Fácil**: Logs estruturados de validação
5. **♻️ Código Limpo**: Menos boilerplate de error handling
6. **🚀 Performance**: Retry inteligente e cache otimizado

## 🎯 Próximos Passos

### Para Migração Completa:

1. **Fase 1**: Migre componentes críticos primeiro
   - Dashboard principal
   - Páginas de produtos
2. **Fase 2**: Migre componentes secundários
   - Relatórios
   - Configurações
3. **Fase 3**: Remova hooks antigos
   - Após todos componentes migrados
   - Mantenha apenas hooks validados

### Checklist de Migração:

- [ ] Substituir imports dos hooks antigos
- [ ] Adicionar error handling se necessário
- [ ] Configurar fallback data onde faz sentido
- [ ] Testar cenários de erro
- [ ] Verificar toasts em dev/prod
- [ ] Atualizar testes unitários

## 🔗 Arquivos Relacionados

- Hooks Dashboard: `/src/modules/dashboard/hooks/data/use-dashboard-data-validated.ts`
- Hooks Produtos: `/src/modules/produtos/hooks/data/use-produtos-data-validated.ts`
- Serviços Validados: `/src/modules/**/services/*.validated.ts`
- Schemas Zod: `/src/modules/**/schemas/*.schemas.ts`
- Utils Validação: `/src/modules/core/utils/validation.ts`
- Testes: `/src/modules/dashboard/hooks/__tests__/`

## 💡 Dicas

1. **Comece pequeno**: Migre um componente por vez
2. **Use fallbacks**: Melhora UX durante erros
3. **Monitore**: Use callbacks para logging
4. **Teste**: Valide cenários de erro
5. **Gradual**: Mantenha ambos hooks durante migração

## 🔧 Troubleshooting

### Problemas Comuns e Soluções

#### 1. Erro: "Redis connection failed"

**Sintomas**: Validação falha, telemetria não funciona

```bash
# Solução
docker-compose up -d redis
# Ou se Redis já estiver rodando
docker-compose restart redis
```

#### 2. Erro: "Invalid schema validation"

**Sintomas**: Console errors, dados não carregam

```typescript
// Verifique se o schema está correto
// Use o modo debug para ver detalhes
NEXT_PUBLIC_VALIDATION_DEBUG=true npm run dev
```

#### 3. Performance degradada

**Sintomas**: Páginas lentas após ativar validação

```bash
# Reduza o percentage temporariamente
echo "NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE=10" >> .env.local
# Otimize schemas removendo validações desnecessárias
```

#### 4. Hooks não alternam entre versões

**Sintomas**: Sempre usa mesma versão do hook

```bash
# Verifique a configuração
cat .env.local | grep VALIDATION
# Limpe cache do Next.js
rm -rf .next
npm run dev
```

#### 5. Testes de integração falhando

**Sintomas**: npm run validation:test:integration falha

```bash
# Corrija o comando no package.json
# De: --testPathPattern (incorreto)
# Para: caminho direto do arquivo
"validation:test:integration": "vitest run src/modules/dashboard/hooks/__tests__/use-validated-hooks.integration.test.tsx"
```

#### 6. Monitor de validação não abre

**Sintomas**: /admin/validation-monitor não carrega

```bash
# Verifique se o servidor está rodando
npm run dev
# Acesse manualmente
open http://localhost:3000/admin/validation-monitor
```

#### 7. Dados não aparecem após migração

**Sintomas**: Componentes em branco

```typescript
// Adicione fallback data
const { data = fallbackData } = useValidatedHook()
// Ou verifique imports
import { useDashboardData } from '@/modules/dashboard/hooks/data/use-dashboard-data-switch'
```

#### 8. Auto-rollback ativando sem necessidade

**Sintomas**: Sistema volta para hooks antigos

```bash
# Ajuste o threshold
echo "NEXT_PUBLIC_AUTO_ROLLBACK_THRESHOLD=0.05" >> .env.local
# Ou desative temporariamente
echo "NEXT_PUBLIC_AUTO_ROLLBACK_ENABLED=false" >> .env.local
```

### Debug Avançado

#### Ativar logs completos

```bash
# .env.local
NEXT_PUBLIC_VALIDATION_DEBUG=true
NEXT_PUBLIC_VALIDATION_MONITORING=true
LOG_LEVEL=debug
```

#### Verificar saúde do sistema

```bash
# Run health check
tsx scripts/health-check-validation.ts

# Check Redis
docker exec -it $(docker ps -qf "name=redis") redis-cli ping

# Check telemetry
curl http://localhost:3000/api/monitoring/validation | jq
```

#### Limpar cache e reiniciar

```bash
# Limpar tudo
rm -rf .next node_modules/.cache
docker-compose restart redis
npm run dev
```

### Quando Fazer Rollback

Faça rollback se:

- ❌ Error rate > 2%
- ❌ Performance degradação > 10%
- ❌ Múltiplos componentes falhando
- ❌ Dados críticos não carregando

Veja [ROLLBACK-PROCEDURES.md](./ROLLBACK-PROCEDURES.md) para instruções completas.

### Suporte

- 📚 Documentação: [/docs/validation-hooks.md](./docs/validation-hooks.md)
- 🔧 Scripts: [/scripts/](./scripts/)
- 🚨 Rollback: [ROLLBACK-PROCEDURES.md](./ROLLBACK-PROCEDURES.md)
- 💬 Time: #dev-validation no Slack

---

**Sprint 2 Completo! ✅**

Todos os hooks agora têm versões validadas com Zod, garantindo type safety em runtime e melhor experiência para o usuário com tratamento automático de erros.
