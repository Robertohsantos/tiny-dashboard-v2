#!/usr/bin/env tsx

/**
 * Health Check Script for Validated Hooks System
 * Verifies all components are operational before rollout changes
 */

import { createClient } from 'redis'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

interface HealthCheckResult {
  component: string
  status: 'healthy' | 'warning' | 'error'
  message: string
  details?: any
}

class ValidationHealthChecker {
  private results: HealthCheckResult[] = []

  async run(): Promise<boolean> {
    console.log(
      `${COLORS.cyan}🏥 Starting Validation System Health Check...${COLORS.reset}\n`,
    )

    // Check all critical components
    await this.checkRedisConnection()
    await this.checkEnvironmentVariables()
    await this.checkValidationConfig()
    await this.checkHookFiles()
    await this.checkMonitoringEndpoints()
    await this.checkDockerServices()
    await this.checkServerStatus()

    // Display results
    this.displayResults()

    // Return overall health status
    const hasErrors = this.results.some((r) => r.status === 'error')
    const hasWarnings = this.results.some((r) => r.status === 'warning')

    if (hasErrors) {
      console.log(
        `\n${COLORS.red}❌ Health check FAILED - Critical issues found${COLORS.reset}`,
      )
      return false
    } else if (hasWarnings) {
      console.log(
        `\n${COLORS.yellow}⚠️ Health check PASSED with warnings${COLORS.reset}`,
      )
      return true
    } else {
      console.log(
        `\n${COLORS.green}✅ Health check PASSED - System is healthy${COLORS.reset}`,
      )
      return true
    }
  }

  private async checkRedisConnection(): Promise<void> {
    try {
      const client = createClient({
        url: 'redis://localhost:6379',
      })

      await client.connect()
      await client.ping()
      await client.disconnect()

      this.results.push({
        component: 'Redis Connection',
        status: 'healthy',
        message: 'Redis is accessible and responding',
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown Redis error'
      this.results.push({
        component: 'Redis Connection',
        status: 'error',
        message: 'Redis connection failed',
        details: message,
      })
    }
  }

  private async checkEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'NEXT_PUBLIC_USE_VALIDATED_HOOKS',
      'NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE',
      'NEXT_PUBLIC_VALIDATION_ENABLED_COMPONENTS',
    ]

    const envPath = path.join(process.cwd(), '.env.local')

    if (!fs.existsSync(envPath)) {
      this.results.push({
        component: 'Environment Variables',
        status: 'error',
        message: '.env.local file not found',
      })
      return
    }

    const envContent = fs.readFileSync(envPath, 'utf-8')
    const missingVars = requiredVars.filter((v) => !envContent.includes(v))

    if (missingVars.length > 0) {
      this.results.push({
        component: 'Environment Variables',
        status: 'warning',
        message: 'Some environment variables are missing',
        details: missingVars,
      })
    } else {
      this.results.push({
        component: 'Environment Variables',
        status: 'healthy',
        message: 'All required environment variables are configured',
      })
    }
  }

  private async checkValidationConfig(): Promise<void> {
    const configPath = path.join(process.cwd(), 'validation.config.json')

    if (!fs.existsSync(configPath)) {
      this.results.push({
        component: 'Validation Config',
        status: 'error',
        message: 'validation.config.json not found',
      })
      return
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

      if (
        config.enabled &&
        config.percentage >= 0 &&
        config.percentage <= 100
      ) {
        this.results.push({
          component: 'Validation Config',
          status: 'healthy',
          message: `Configuration valid (${config.percentage}% rollout)`,
          details: config,
        })
      } else {
        this.results.push({
          component: 'Validation Config',
          status: 'warning',
          message: 'Configuration may have invalid values',
          details: config,
        })
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown config parse error'
      this.results.push({
        component: 'Validation Config',
        status: 'error',
        message: 'Failed to parse validation config',
        details: message,
      })
    }
  }

  private async checkHookFiles(): Promise<void> {
    const hookPaths = [
      'src/modules/dashboard/hooks/data/use-dashboard-data-validated.ts',
      'src/modules/dashboard/hooks/data/use-dashboard-data-switch.ts',
      'src/modules/produtos/hooks/data/use-produtos-data-validated.ts',
      'src/modules/produtos/hooks/data/use-produtos-data-switch.ts',
    ]

    const missingFiles = hookPaths.filter(
      (p) => !fs.existsSync(path.join(process.cwd(), p)),
    )

    if (missingFiles.length > 0) {
      this.results.push({
        component: 'Hook Files',
        status: 'error',
        message: 'Critical hook files are missing',
        details: missingFiles,
      })
    } else {
      this.results.push({
        component: 'Hook Files',
        status: 'healthy',
        message: 'All required hook files exist',
      })
    }
  }

  private async checkMonitoringEndpoints(): Promise<void> {
    const endpoints = [
      'src/app/api/monitoring/validation/route.ts',
      'src/app/api/monitoring/rollback-alert/route.ts',
      'src/app/admin/validation-monitor/page.tsx',
    ]

    const missingEndpoints = endpoints.filter(
      (e) => !fs.existsSync(path.join(process.cwd(), e)),
    )

    if (missingEndpoints.length > 0) {
      this.results.push({
        component: 'Monitoring Endpoints',
        status: 'warning',
        message: 'Some monitoring endpoints are missing',
        details: missingEndpoints,
      })
    } else {
      this.results.push({
        component: 'Monitoring Endpoints',
        status: 'healthy',
        message: 'All monitoring endpoints are configured',
      })
    }
  }

  private async checkDockerServices(): Promise<void> {
    try {
      const output = execSync('docker ps --format "{{.Names}}"', {
        encoding: 'utf-8',
      })
      const runningContainers = output.toLowerCase()

      const requiredServices = ['redis', 'postgres']
      const missingServices = requiredServices.filter(
        (s) => !runningContainers.includes(s),
      )

      if (missingServices.length > 0) {
        this.results.push({
          component: 'Docker Services',
          status: 'warning',
          message: 'Some Docker services are not running',
          details: missingServices,
        })
      } else {
        this.results.push({
          component: 'Docker Services',
          status: 'healthy',
          message: 'All required Docker services are running',
        })
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown Docker error'
      this.results.push({
        component: 'Docker Services',
        status: 'warning',
        message: 'Could not check Docker services',
        details: message,
      })
    }
  }

  private async checkServerStatus(): Promise<void> {
    try {
      const response = await fetch(
        'http://localhost:3000/api/monitoring/validation',
      )

      if (response.ok) {
        this.results.push({
          component: 'Dev Server',
          status: 'healthy',
          message: 'Development server is running and API is accessible',
        })
      } else {
        this.results.push({
          component: 'Dev Server',
          status: 'warning',
          message: `Server responding with status ${response.status}`,
        })
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Development server not reachable'
      this.results.push({
        component: 'Dev Server',
        status: 'warning',
        message: 'Development server may not be running',
        details: message,
      })
    }
  }

  private displayResults(): void {
    console.log(
      `${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`,
    )
    console.log(`${COLORS.cyan}📋 Health Check Results${COLORS.reset}\n`)

    for (const result of this.results) {
      const statusIcon =
        result.status === 'healthy'
          ? '✅'
          : result.status === 'warning'
            ? '⚠️'
            : '❌'
      const statusColor =
        result.status === 'healthy'
          ? COLORS.green
          : result.status === 'warning'
            ? COLORS.yellow
            : COLORS.red

      console.log(
        `${statusIcon} ${result.component}: ${statusColor}${result.message}${COLORS.reset}`,
      )

      if (result.details) {
        console.log(`   ${COLORS.cyan}Details:${COLORS.reset}`, result.details)
      }
    }

    console.log(
      `${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`,
    )

    // Summary statistics
    const healthy = this.results.filter((r) => r.status === 'healthy').length
    const warnings = this.results.filter((r) => r.status === 'warning').length
    const errors = this.results.filter((r) => r.status === 'error').length

    console.log(`\n${COLORS.cyan}Summary:${COLORS.reset}`)
    console.log(`  ${COLORS.green}Healthy: ${healthy}${COLORS.reset}`)
    console.log(`  ${COLORS.yellow}Warnings: ${warnings}${COLORS.reset}`)
    console.log(`  ${COLORS.red}Errors: ${errors}${COLORS.reset}`)
  }
}

// Main execution
async function main() {
  const checker = new ValidationHealthChecker()
  const isHealthy = await checker.run()

  if (!isHealthy) {
    console.log(
      `\n${COLORS.yellow}💡 Tip: Fix critical issues before proceeding with rollout${COLORS.reset}`,
    )
    process.exit(1)
  }

  console.log(
    `\n${COLORS.green}🚀 System is ready for validation rollout!${COLORS.reset}`,
  )
  process.exit(0)
}

main().catch((error) => {
  console.error(`${COLORS.red}Fatal error:${COLORS.reset}`, error)
  process.exit(1)
})
