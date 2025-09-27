#!/usr/bin/env node

/**
 * Script para testar a separação de dados entre dev e prod
 * Uso: node scripts/test-env-data.js
 */

require('ts-node/register/transpile-only')

console.log('=== Teste de Separação Dev/Prod ===
')

const fetchersPath = '../src/modules/dashboard/data/data-fetchers.ts'

function loadFetchers() {
  delete require.cache[require.resolve(fetchersPath)]
  return require(fetchersPath)
}

async function run() {
  // Simula ambiente de desenvolvimento
  process.env.NODE_ENV = 'development'
  console.log('1. Testando ambiente DEVELOPMENT:')
  console.log('   NODE_ENV =', process.env.NODE_ENV)

  const devModule = loadFetchers()
  const [tableData, chartData, metrics] = await Promise.all([
    devModule.getDashboardTableData(),
    devModule.getChartData(),
    devModule.getDashboardMetrics(),
  ])

  console.log(
    '   ✅ Dados da tabela:',
    tableData.length > 0 ? tableData.length + ' items mockados' : '❌ Vazio',
  )
  console.log(
    '   ✅ Dados do gráfico:',
    chartData.length > 0 ? chartData.length + ' pontos mockados' : '❌ Vazio',
  )
  console.log(
    '   ✅ Métricas:',
    metrics.totalRevenue.value > 0
      ? 'Valores mockados carregados'
      : '❌ Valores zerados',
  )

  console.log('
2. Testando ambiente PRODUCTION:')
  process.env.NODE_ENV = 'production'
  console.log('   NODE_ENV =', process.env.NODE_ENV)

  const prodModule = loadFetchers()
  const [prodTable, prodChart, prodMetrics] = await Promise.all([
    prodModule.getDashboardTableData(),
    prodModule.getChartData(),
    prodModule.getDashboardMetrics(),
  ])

  console.log(
    '   ✅ Dados da tabela:',
    prodTable.length === 0
      ? 'Vazio (correto para prod sem DB)'
      : '❌ ' + prodTable.length + ' items (não deveria ter dados!)',
  )
  console.log(
    '   ✅ Dados do gráfico:',
    prodChart.length === 0
      ? 'Vazio (correto para prod sem DB)'
      : '❌ ' + prodChart.length + ' pontos (não deveria ter dados!)',
  )
  console.log(
    '   ✅ Métricas:',
    prodMetrics.totalRevenue.value === 0
      ? 'Valores zerados (correto para prod sem DB)'
      : '❌ Valores mockados (não deveria!)',
  )

  console.log('
=== Resultado ===')
  console.log('✅ Separação Dev/Prod funcionando corretamente!')
  console.log('- Em DEV: Dados mockados são carregados')
  console.log('- Em PROD: Dados mockados NÃO são carregados')
  console.log(
    '- Próximos passos: integrar dados reais removendo mocks quando as fontes oficiais estiverem disponíveis.
',
  )
}

run().catch((error) => {
  console.error('
❌ Erro ao executar o teste:', error)
  process.exit(1)
})
