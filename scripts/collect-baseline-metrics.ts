#!/usr/bin/env tsx

/**
 * Baseline Metrics Collection Script
 * Collects current performance metrics before migration
 */

import { performance } from 'perf_hooks'
import chalk from 'chalk'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

interface BaselineMetrics {
  timestamp: string
  performance: {
    avgResponseTime: number
    p50ResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
  }
  errors: {
    totalErrors: number
    errorRate: number
    commonErrors: string[]
  }
  bundle: {
    size: number
    validationOverhead: number
  }
  coverage: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
}

async function measureResponseTime(
  url: string,
  iterations: number = 10,
): Promise<number[]> {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    try {
      await fetch(url)
      const end = performance.now()
      times.push(end - start)
    } catch (error) {
      console.error(chalk.red(`Failed to fetch ${url}:`, error))
    }
  }

  return times
}

function calculatePercentile(times: number[], percentile: number): number {
  const sorted = [...times].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[index] || 0
}

async function collectBaselineMetrics(): Promise<BaselineMetrics> {
  console.log(chalk.blue('📊 Collecting Baseline Metrics...\n'))

  // Measure response times for key endpoints
  const dashboardTimes = await measureResponseTime(
    'http://localhost:3000/dashboard-vendas',
    10,
  )
  const produtosTimes = await measureResponseTime(
    'http://localhost:3000/produtos',
    10,
  )

  const allTimes = [...dashboardTimes, ...produtosTimes]

  const metrics: BaselineMetrics = {
    timestamp: new Date().toISOString(),
    performance: {
      avgResponseTime: allTimes.reduce((a, b) => a + b, 0) / allTimes.length,
      p50ResponseTime: calculatePercentile(allTimes, 50),
      p95ResponseTime: calculatePercentile(allTimes, 95),
      p99ResponseTime: calculatePercentile(allTimes, 99),
    },
    errors: {
      totalErrors: 0, // Will be populated from logs/monitoring
      errorRate: 0,
      commonErrors: [],
    },
    bundle: {
      size: 0, // Will be populated from build output
      validationOverhead: 0, // Will be calculated after migration
    },
    coverage: {
      lines: 0, // Will be populated from test coverage
      functions: 0,
      branches: 0,
      statements: 0,
    },
  }

  return metrics
}

function displayMetrics(metrics: BaselineMetrics) {
  console.log(chalk.green('\n✅ Baseline Metrics Collected\n'))

  console.log(chalk.blue('📈 Performance Metrics:'))
  console.log(
    `  Average Response Time: ${metrics.performance.avgResponseTime.toFixed(2)}ms`,
  )
  console.log(
    `  P50 Response Time: ${metrics.performance.p50ResponseTime.toFixed(2)}ms`,
  )
  console.log(
    `  P95 Response Time: ${metrics.performance.p95ResponseTime.toFixed(2)}ms`,
  )
  console.log(
    `  P99 Response Time: ${metrics.performance.p99ResponseTime.toFixed(2)}ms`,
  )

  console.log(chalk.blue('\n📊 Current State:'))
  console.log(`  Error Rate: ${(metrics.errors.errorRate * 100).toFixed(2)}%`)
  console.log(`  Total Errors: ${metrics.errors.totalErrors}`)

  console.log(chalk.yellow('\n📝 Notes:'))
  console.log(
    '  - These metrics represent the current state WITHOUT validation',
  )
  console.log('  - Use these as baseline for comparison after migration')
  console.log('  - Target: < 5% performance degradation')
  console.log('  - Target: < 1% error rate increase')
}

async function saveMetrics(metrics: BaselineMetrics) {
  const filePath = join(process.cwd(), 'baseline-metrics.json')
  await fs.writeFile(filePath, JSON.stringify(metrics, null, 2))

  console.log(chalk.green(`\n💾 Metrics saved to: ${filePath}`))
}

// Main execution
async function main() {
  try {
    const metrics = await collectBaselineMetrics()
    displayMetrics(metrics)
    await saveMetrics(metrics)

    console.log(chalk.green('\n🎯 Next Steps:'))
    console.log('  1. Run tests with coverage: npm run test:coverage')
    console.log('  2. Enable validation in development')
    console.log('  3. Compare metrics after migration')
    console.log('  4. Monitor for performance degradation')
  } catch (error) {
    console.error(chalk.red('❌ Error collecting metrics:'), error)
    process.exit(1)
  }
}

main()
