#!/usr/bin/env tsx
/**
 * Stress Test Script for Validated Hooks Migration
 * Tests performance and stability under load
 */

import fetch from 'node-fetch'

const DASHBOARD_URL = 'http://localhost:3000/dashboard-vendas'
const API_URL = 'http://localhost:3000/api/v1'
const CONCURRENT_REQUESTS = 10
const TOTAL_REQUESTS = 100
const REQUEST_INTERVAL = 100 // ms

interface TestResult {
  requestId: number
  duration: number
  status: number
  error?: string
}

async function makeRequest(requestId: number): Promise<TestResult> {
  const start = Date.now()

  try {
    const response = await fetch(DASHBOARD_URL, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'StressTest/1.0',
      },
    })

    const duration = Date.now() - start
    return {
      requestId,
      duration,
      status: response.status,
    }
  } catch (error: unknown) {
    const duration = Date.now() - start
    return {
      requestId,
      duration,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function runStressTest() {
  console.log('🚀 Starting Stress Test')
  console.log(`📊 Configuration:`)
  console.log(`   - URL: ${DASHBOARD_URL}`)
  console.log(`   - Concurrent Requests: ${CONCURRENT_REQUESTS}`)
  console.log(`   - Total Requests: ${TOTAL_REQUESTS}`)
  console.log(`   - Request Interval: ${REQUEST_INTERVAL}ms\n`)

  const results: TestResult[] = []
  const startTime = Date.now()

  // Execute requests in batches
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = []

    for (let j = 0; j < CONCURRENT_REQUESTS && i + j < TOTAL_REQUESTS; j++) {
      batch.push(makeRequest(i + j))
    }

    const batchResults = await Promise.all(batch)
    results.push(...batchResults)

    // Progress indicator
    const progress = Math.round((results.length / TOTAL_REQUESTS) * 100)
    process.stdout.write(
      `\rProgress: ${progress}% (${results.length}/${TOTAL_REQUESTS})`,
    )

    // Small delay between batches
    if (i + CONCURRENT_REQUESTS < TOTAL_REQUESTS) {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL))
    }
  }

  const totalDuration = Date.now() - startTime
  console.log('\n')

  // Calculate statistics
  const successfulRequests = results.filter((r) => r.status === 200)
  const failedRequests = results.filter((r) => r.status !== 200)
  const durations = successfulRequests
    .map((r) => r.duration)
    .sort((a, b) => a - b)

  const hasSuccessful = durations.length > 0
  const avgDuration = hasSuccessful
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0
  const percentile = (p: number) =>
    hasSuccessful
      ? durations[Math.max(0, Math.floor((durations.length - 1) * p))]
      : 0
  const p50 = percentile(0.5)
  const p95 = percentile(0.95)
  const p99 = percentile(0.99)
  const minDuration = hasSuccessful ? Math.min(...durations) : 0
  const maxDuration = hasSuccessful ? Math.max(...durations) : 0

  // Display results
  console.log('✅ Stress Test Complete!\n')
  console.log('📊 Results:')
  console.log(`   Total Time: ${(totalDuration / 1000).toFixed(2)}s`)
  console.log(
    `   Requests/sec: ${(TOTAL_REQUESTS / (totalDuration / 1000)).toFixed(2)}`,
  )
  console.log(
    `   Success Rate: ${((successfulRequests.length / TOTAL_REQUESTS) * 100).toFixed(2)}%`,
  )
  console.log(`   Failed: ${failedRequests.length}`)
  console.log('')
  console.log('⏱️  Response Times:')
  console.log(`   Average: ${avgDuration.toFixed(2)}ms`)
  console.log(`   P50: ${p50}ms`)
  console.log(`   P95: ${p95}ms`)
  console.log(`   P99: ${p99}ms`)
  console.log(`   Min: ${minDuration}ms`)
  console.log(`   Max: ${maxDuration}ms`)

  if (failedRequests.length > 0) {
    console.log('\n⚠️  Failed Requests:')
    failedRequests.slice(0, 5).forEach((r) => {
      console.log(
        `   - Request #${r.requestId}: ${r.error || `Status ${r.status}`}`,
      )
    })
    if (failedRequests.length > 5) {
      console.log(`   ... and ${failedRequests.length - 5} more`)
    }
  }

  // Performance assessment
  console.log('\n🎯 Performance Assessment:')
  if (
    avgDuration < 500 &&
    p95 < 1000 &&
    successfulRequests.length === TOTAL_REQUESTS
  ) {
    console.log('   ✅ EXCELLENT - All metrics within target')
  } else if (
    avgDuration < 1000 &&
    p95 < 2000 &&
    successfulRequests.length >= TOTAL_REQUESTS * 0.98
  ) {
    console.log('   ✅ GOOD - Acceptable performance')
  } else if (successfulRequests.length >= TOTAL_REQUESTS * 0.95) {
    console.log('   ⚠️  WARNING - Performance degradation detected')
  } else {
    console.log('   ❌ CRITICAL - High error rate or poor performance')
  }

  return {
    success: successfulRequests.length === TOTAL_REQUESTS,
    avgDuration,
    p95,
    errorRate: (failedRequests.length / TOTAL_REQUESTS) * 100,
  }
}

// Run the test
runStressTest()
  .then((result) => {
    process.exit(result.success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
