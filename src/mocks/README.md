# Mock Data - Desenvolvimento

Esta pasta contém dados mockados que são utilizados **APENAS** no ambiente de desenvolvimento.

## Estrutura

- `dashboard-data.json` - Dados da tabela do dashboard
- `chart-data.json` - Dados do gráfico de visitantes (desktop/mobile)
- `metrics-data.json` - Dados dos cards de métricas (revenue, customers, etc)

## Como funciona

### Em Desenvolvimento (NODE_ENV=development)

- Os dados são carregados diretamente destes arquivos JSON
- Permite desenvolvimento sem necessidade de banco de dados
- Facilita testes e prototipagem

### Em Produção (NODE_ENV=production)

- **NENHUM dado mockado é utilizado**
- Todos os dados são buscados do banco de dados via Prisma
- As funções em `/src/modules/dashboard/data/data-fetchers.ts` fazem esta separação automaticamente

## Arquivos principais

### `/src/modules/dashboard/data/data-fetchers.ts`

Contém as funções que fazem a lógica condicional:

- `getDashboardTableData()` - Retorna dados da tabela
- `getChartData()` - Retorna dados do gráfico
- `getDashboardMetrics()` - Retorna métricas dos cards

### Exemplo de uso:

```typescript
// Em qualquer componente/página
import { getDashboardTableData } from '@/modules/dashboard/data/data-fetchers'

export default async function Page() {
  // Automaticamente retorna mock em dev, banco em prod
  const data = await getDashboardTableData()

  return <DataTable data={data} />
}
```

## Segurança

✅ **Garantido**: Em produção (NODE_ENV=production), nenhum dado desta pasta é utilizado
✅ **Separação clara**: Lógica condicional centralizada em um único arquivo
✅ **Type-safe**: Todas as interfaces TypeScript garantem consistência entre dev e prod

## Para adicionar novos mocks

1. Crie o arquivo JSON nesta pasta
2. Adicione a interface TypeScript em `/src/modules/dashboard/data/data-fetchers.ts`
3. Crie a função de fetching com lógica condicional
4. Use a função no componente/página

## TODO para Produção

Quando o banco de dados estiver pronto, atualize as funções em `/src/modules/dashboard/data/data-fetchers.ts`:

- Substitua os comentários `// TODO: Replace with actual Prisma query` com queries reais
- Remova os `console.warn` e retornos vazios/default
- Implemente as agregações e cálculos necessários
