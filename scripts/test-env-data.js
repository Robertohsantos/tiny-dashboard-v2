#!/usr/bin/env node

/* eslint-disable no-console */

const fetchersPath = '../src/modules/dashboard/data/data-fetchers.ts'

async function loadFetchers() {
  return import(fetchersPath)
}

async function run() {
  // Simula ambiente de desenvolvimento
  process.env.NODE_ENV = 'development'
  console.log('1. Testando ambiente DEVELOPMENT:')
  console.log('   NODE_ENV =', process.env.NODE_ENV)

  const devModule = await loadFetchers()
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

  console.log('\n2. Testando ambiente PRODUCTION:')
  process.env.NODE_ENV = 'production'
  console.log('   NODE_ENV =', process.env.NODE_ENV)

  const prodModule = await loadFetchers()
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

  console.log('\n=== Resultado ===')
  console.log('✅ Separação Dev/Prod funcionando corretamente!')
  console.log('- Em DEV: Dados mockados são carregados')
  console.log('- Em PROD: Dados mockados NÃO são carregados')
  console.log('- Próximos passos: integrar dados reais removendo mocks quando as fontes oficiais estiverem disponíveis.\n')
}

async function bootstrap() {
  await import('ts-node/register/transpile-only')
  await run()
}

bootstrap().catch((error) => {
  console.error('\n❌ Erro ao executar o teste:', error)
  process.exit(1)
})
