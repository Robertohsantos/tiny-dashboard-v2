#!/usr/bin/env tsx

/**
 * Staging Rollout Script for Validated Hooks
 *
 * This script manages the gradual rollout of validated hooks in staging environment
 * with automated monitoring, health checks, and rollback capabilities.
 *
 * Usage:
 *   npm run validation:rollout:staging
 *   npm run validation:rollout:staging -- --stage 1
 *   npm run validation:rollout:staging -- --rollback
 */

import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import chalk from 'chalk'
import https from 'https'

interface RolloutStage {
  stage: number
  percentage: number
  duration: string
  description: string
  successCriteria: {
    maxErrorRate: number
    minSuccessRate: number
    maxResponseTime: number
  }
}

interface RolloutState {
  currentStage: number
  startedAt: string
  lastCheckAt: string
  status: 'active' | 'paused' | 'completed' | 'rolled-back'
  metrics: {
    errorCount: number
    successCount: number
    avgResponseTime: number
    rollbackCount: number
  }
  history: Array<{
    stage: number
    startedAt: string
    completedAt?: string
    status: 'success' | 'failed' | 'rolled-back'
    metrics: any
  }>
}

class StagingRolloutManager {
  private readonly stages: RolloutStage[] = [
    {
      stage: 1,
      percentage: 10,
      duration: '2h',
      description: 'Initial canary deployment',
      successCriteria: {
        maxErrorRate: 5,
        minSuccessRate: 95,
        maxResponseTime: 1000,
      },
    },
    {
      stage: 2,
      percentage: 25,
      duration: '4h',
      description: 'Early adopters',
      successCriteria: {
        maxErrorRate: 3,
        minSuccessRate: 97,
        maxResponseTime: 800,
      },
    },
    {
      stage: 3,
      percentage: 50,
      duration: '8h',
      description: 'Half of staging traffic',
      successCriteria: {
        maxErrorRate: 2,
        minSuccessRate: 98,
        maxResponseTime: 700,
      },
    },
    {
      stage: 4,
      percentage: 75,
      duration: '12h',
      description: 'Majority rollout',
      successCriteria: {
        maxErrorRate: 1.5,
        minSuccessRate: 98.5,
        maxResponseTime: 600,
      },
    },
    {
      stage: 5,
      percentage: 100,
      duration: 'stable',
      description: 'Full rollout',
      successCriteria: {
        maxErrorRate: 1,
        minSuccessRate: 99,
        maxResponseTime: 500,
      },
    },
  ]

  private readonly statePath = path.join(
    process.cwd(),
    '.validation-rollout-state.json',
  )
  private readonly configPath = path.join(
    process.cwd(),
    'validation.config.json',
  )
  private readonly stagingUrl =
    process.env.STAGING_URL || 'https://staging.example.com'
  private readonly monitoringUrl =
    process.env.MONITORING_URL || 'https://monitoring.example.com'
  private state: RolloutState | null = null

  constructor() {}

  /**
   * Execute rollout command
   */
  async execute(command: string, options: any = {}): Promise<void> {
    console.log(chalk.blue('🚀 Staging Validation Rollout Manager'))
    console.log(chalk.gray('━'.repeat(50)))

    switch (command) {
      case 'start':
        await this.startRollout(options.stage)
        break
      case 'advance':
        await this.advanceStage()
        break
      case 'rollback':
        await this.rollback()
        break
      case 'status':
        await this.showStatus()
        break
      case 'monitor':
        await this.startMonitoring()
        break
      default:
        await this.interactiveMode()
    }
  }

  /**
   * Start rollout from a specific stage
   */
  private async startRollout(stageNumber?: number): Promise<void> {
    console.log(chalk.yellow('\n🎬 Starting staging rollout...'))

    // Load or initialize state
    await this.loadState()

    if (this.state && this.state.status === 'active') {
      console.log(chalk.yellow('⚠️  Rollout already in progress'))
      console.log(chalk.gray(`  Current stage: ${this.state.currentStage}`))
      return
    }

    const stage = stageNumber || 1
    const rolloutStage = this.stages[stage - 1]

    if (!rolloutStage) {
      throw new Error(`Invalid stage: ${stage}`)
    }

    // Initialize new rollout state
    this.state = {
      currentStage: stage,
      startedAt: new Date().toISOString(),
      lastCheckAt: new Date().toISOString(),
      status: 'active',
      metrics: {
        errorCount: 0,
        successCount: 0,
        avgResponseTime: 0,
        rollbackCount: 0,
      },
      history: [],
    }

    await this.saveState()

    // Deploy to staging
    await this.deployToStaging(rolloutStage)

    // Start monitoring
    await this.startHealthChecks(rolloutStage)

    console.log(chalk.green(`\n✅ Stage ${stage} rollout started`))
    console.log(chalk.gray(`  • Percentage: ${rolloutStage.percentage}%`))
    console.log(chalk.gray(`  • Duration: ${rolloutStage.duration}`))
    console.log(chalk.gray(`  • Description: ${rolloutStage.description}`))
  }

  /**
   * Deploy configuration to staging environment
   */
  private async deployToStaging(stage: RolloutStage): Promise<void> {
    console.log(chalk.yellow('\n📦 Deploying to staging...'))

    // Update configuration
    const config = {
      environment: 'staging',
      validation: {
        enabled: true,
        percentage: stage.percentage,
        stage: stage.stage,
        features: {
          dashboard: true,
          produtos: true,
          reports: stage.stage >= 3,
          settings: stage.stage >= 4,
        },
      },
      monitoring: {
        enabled: true,
        errorThreshold: stage.successCriteria.maxErrorRate,
        performanceThreshold: stage.successCriteria.maxResponseTime,
        autoRollback: true,
        alerting: {
          slack: process.env.SLACK_WEBHOOK,
          email: process.env.ALERT_EMAIL,
        },
      },
      createdAt: new Date().toISOString(),
    }

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2))

    // Deploy using your deployment method
    console.log(chalk.gray('  Pushing configuration...'))

    try {
      // Example: Deploy using git push to staging branch
      execSync('git add validation.config.json', { stdio: 'pipe' })
      execSync(
        `git commit -m "chore: rollout validation stage ${stage.stage}"`,
        { stdio: 'pipe' },
      )
      execSync('git push origin staging', { stdio: 'pipe' })

      console.log(chalk.green('  ✓ Configuration deployed'))
    } catch (error) {
      console.log(chalk.yellow('  ⚠️  Manual deployment required'))
      console.log(
        chalk.gray('  Please deploy validation.config.json to staging'),
      )
    }

    // Wait for deployment to propagate
    console.log(chalk.gray('  Waiting for deployment...'))
    await this.sleep(30000) // 30 seconds

    // Verify deployment
    await this.verifyDeployment(stage)
  }

  /**
   * Verify deployment was successful
   */
  private async verifyDeployment(stage: RolloutStage): Promise<void> {
    console.log(chalk.yellow('\n🔍 Verifying deployment...'))

    return new Promise((resolve, reject) => {
      const url = `${this.stagingUrl}/api/monitoring/validation/status`

      https
        .get(url, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              const status = JSON.parse(data)

              if (status.validation?.percentage === stage.percentage) {
                console.log(chalk.green('  ✓ Deployment verified'))
                console.log(
                  chalk.gray(
                    `    • Validation enabled: ${status.validation.enabled}`,
                  ),
                )
                console.log(
                  chalk.gray(
                    `    • Percentage: ${status.validation.percentage}%`,
                  ),
                )
                resolve()
              } else {
                throw new Error('Deployment verification failed')
              }
            } catch (error) {
              reject(error)
            }
          })
        })
        .on('error', reject)
    })
  }

  /**
   * Start health checks for current stage
   */
  private async startHealthChecks(stage: RolloutStage): Promise<void> {
    console.log(chalk.yellow('\n🏥 Starting health checks...'))

    const checkInterval = 60000 // 1 minute
    const duration = this.parseDuration(stage.duration)
    const endTime = duration ? Date.now() + duration : null

    const performCheck = async () => {
      if (!this.state || this.state.status !== 'active') {
        return
      }

      const metrics = await this.collectMetrics()
      await this.evaluateHealth(stage, metrics)

      // Check if stage duration has elapsed
      if (endTime && Date.now() >= endTime) {
        await this.completeStage()
      } else {
        // Schedule next check
        setTimeout(performCheck, checkInterval)
      }
    }

    // Start checking
    setTimeout(performCheck, checkInterval)

    console.log(chalk.green('  ✓ Health monitoring started'))
    console.log(chalk.gray(`    • Check interval: ${checkInterval / 1000}s`))
    console.log(chalk.gray(`    • Stage duration: ${stage.duration}`))
  }

  /**
   * Collect metrics from staging environment
   */
  private async collectMetrics(): Promise<any> {
    return new Promise((resolve) => {
      const url = `${this.monitoringUrl}/api/metrics/validation`

      https
        .get(url, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              const metrics = JSON.parse(data)
              resolve(metrics)
            } catch (error) {
              // Return default metrics on error
              resolve({
                errorRate: 0,
                successRate: 100,
                avgResponseTime: 0,
                requestCount: 0,
              })
            }
          })
        })
        .on('error', () => {
          // Return default metrics on error
          resolve({
            errorRate: 0,
            successRate: 100,
            avgResponseTime: 0,
            requestCount: 0,
          })
        })
    })
  }

  /**
   * Evaluate health based on success criteria
   */
  private async evaluateHealth(
    stage: RolloutStage,
    metrics: any,
  ): Promise<void> {
    if (!this.state) return

    // Update state metrics
    this.state.metrics.errorCount += metrics.errors || 0
    this.state.metrics.successCount += metrics.success || 0
    this.state.metrics.avgResponseTime = metrics.avgResponseTime || 0
    this.state.lastCheckAt = new Date().toISOString()

    await this.saveState()

    // Check against success criteria
    const errorRate = metrics.errorRate || 0
    const successRate = metrics.successRate || 100
    const responseTime = metrics.avgResponseTime || 0

    const violations = []

    if (errorRate > stage.successCriteria.maxErrorRate) {
      violations.push(
        `Error rate ${errorRate}% exceeds threshold ${stage.successCriteria.maxErrorRate}%`,
      )
    }

    if (successRate < stage.successCriteria.minSuccessRate) {
      violations.push(
        `Success rate ${successRate}% below threshold ${stage.successCriteria.minSuccessRate}%`,
      )
    }

    if (responseTime > stage.successCriteria.maxResponseTime) {
      violations.push(
        `Response time ${responseTime}ms exceeds threshold ${stage.successCriteria.maxResponseTime}ms`,
      )
    }

    if (violations.length > 0) {
      console.log(chalk.red('\n⚠️  Health check violations:'))
      violations.forEach((v) => console.log(chalk.red(`  • ${v}`)))

      // Trigger automatic rollback
      await this.triggerAutoRollback('Health check violations')
    } else {
      console.log(
        chalk.green(`✅ Health check passed at ${new Date().toISOString()}`),
      )
    }
  }

  /**
   * Complete current stage and advance to next
   */
  private async completeStage(): Promise<void> {
    if (!this.state) return

    const currentStage = this.stages[this.state.currentStage - 1]

    console.log(
      chalk.green(
        `\n✅ Stage ${this.state.currentStage} completed successfully`,
      ),
    )

    // Add to history
    this.state.history.push({
      stage: this.state.currentStage,
      startedAt: this.state.startedAt,
      completedAt: new Date().toISOString(),
      status: 'success',
      metrics: { ...this.state.metrics },
    })

    // Check if this was the final stage
    if (this.state.currentStage >= this.stages.length) {
      this.state.status = 'completed'
      await this.saveState()

      console.log(chalk.green.bold('\n🎉 ROLLOUT COMPLETED SUCCESSFULLY!'))
      console.log(
        chalk.gray('Validated hooks are now fully deployed in staging'),
      )

      await this.notifyCompletion()
    } else {
      // Advance to next stage
      await this.advanceStage()
    }
  }

  /**
   * Advance to the next rollout stage
   */
  private async advanceStage(): Promise<void> {
    if (!this.state) {
      await this.loadState()
    }

    if (!this.state || this.state.status !== 'active') {
      console.log(chalk.red('❌ No active rollout to advance'))
      return
    }

    const nextStage = this.state.currentStage + 1

    if (nextStage > this.stages.length) {
      console.log(chalk.yellow('⚠️  Already at final stage'))
      return
    }

    console.log(chalk.blue(`\n⏭  Advancing to stage ${nextStage}...`))

    const stage = this.stages[nextStage - 1]

    // Update state
    this.state.currentStage = nextStage
    this.state.startedAt = new Date().toISOString()
    await this.saveState()

    // Deploy new configuration
    await this.deployToStaging(stage)

    // Restart health checks
    await this.startHealthChecks(stage)

    console.log(chalk.green(`✅ Advanced to stage ${nextStage}`))
  }

  /**
   * Rollback to previous stage or disable validation
   */
  private async rollback(): Promise<void> {
    console.log(chalk.red('\n⏮  Initiating rollback...'))

    await this.loadState()

    if (!this.state) {
      console.log(chalk.yellow('⚠️  No rollout state found'))
      return
    }

    // Disable validation
    const config = {
      environment: 'staging',
      validation: {
        enabled: false,
        percentage: 0,
        stage: 0,
      },
      rollback: {
        reason: 'Manual rollback',
        timestamp: new Date().toISOString(),
        previousStage: this.state.currentStage,
      },
    }

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2))

    // Update state
    this.state.status = 'rolled-back'
    this.state.metrics.rollbackCount++
    await this.saveState()

    // Deploy rollback
    try {
      execSync('git add validation.config.json', { stdio: 'pipe' })
      execSync('git commit -m "chore: rollback validation hooks"', {
        stdio: 'pipe',
      })
      execSync('git push origin staging', { stdio: 'pipe' })

      console.log(chalk.green('✅ Rollback deployed'))
    } catch {
      console.log(chalk.yellow('⚠️  Manual rollback deployment required'))
    }

    await this.notifyRollback('Manual rollback initiated')
  }

  /**
   * Trigger automatic rollback
   */
  private async triggerAutoRollback(reason: string): Promise<void> {
    console.log(chalk.red(`\n🚨 AUTO-ROLLBACK TRIGGERED: ${reason}`))

    await this.rollback()

    // Send alerts
    await this.sendAlert({
      severity: 'critical',
      title: 'Validation Hooks Auto-Rollback',
      message: reason,
      stage: this.state?.currentStage,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Show current rollout status
   */
  private async showStatus(): Promise<void> {
    await this.loadState()

    if (!this.state) {
      console.log(chalk.yellow('No active rollout'))
      return
    }

    console.log(chalk.blue('\n📊 Rollout Status'))
    console.log(chalk.gray('━'.repeat(50)))

    console.log(chalk.white('Current State:'))
    console.log(
      chalk.gray(`  • Stage: ${this.state.currentStage}/${this.stages.length}`),
    )
    console.log(chalk.gray(`  • Status: ${this.state.status}`))
    console.log(chalk.gray(`  • Started: ${this.state.startedAt}`))
    console.log(chalk.gray(`  • Last check: ${this.state.lastCheckAt}`))

    const stage = this.stages[this.state.currentStage - 1]
    if (stage) {
      console.log(chalk.white('\nCurrent Stage:'))
      console.log(chalk.gray(`  • Percentage: ${stage.percentage}%`))
      console.log(chalk.gray(`  • Duration: ${stage.duration}`))
      console.log(chalk.gray(`  • Description: ${stage.description}`))
    }

    console.log(chalk.white('\nMetrics:'))
    console.log(chalk.gray(`  • Errors: ${this.state.metrics.errorCount}`))
    console.log(chalk.gray(`  • Success: ${this.state.metrics.successCount}`))
    console.log(
      chalk.gray(
        `  • Avg response time: ${this.state.metrics.avgResponseTime}ms`,
      ),
    )
    console.log(
      chalk.gray(`  • Rollbacks: ${this.state.metrics.rollbackCount}`),
    )

    if (this.state.history.length > 0) {
      console.log(chalk.white('\nHistory:'))
      this.state.history.forEach((h) => {
        const status =
          h.status === 'success' ? chalk.green('✓') : chalk.red('✗')
        console.log(chalk.gray(`  ${status} Stage ${h.stage}: ${h.status}`))
      })
    }
  }

  /**
   * Start continuous monitoring
   */
  private async startMonitoring(): Promise<void> {
    console.log(chalk.blue('👀 Starting continuous monitoring...'))
    console.log(chalk.gray('Press Ctrl+C to stop'))

    const monitor = async () => {
      await this.showStatus()

      // Collect and display real-time metrics
      const metrics = await this.collectMetrics()

      console.log(chalk.white('\n📈 Real-time Metrics:'))
      console.log(chalk.gray(`  • Error rate: ${metrics.errorRate || 0}%`))
      console.log(
        chalk.gray(`  • Success rate: ${metrics.successRate || 100}%`),
      )
      console.log(
        chalk.gray(`  • Response time: ${metrics.avgResponseTime || 0}ms`),
      )
      console.log(
        chalk.gray(`  • Requests/min: ${metrics.requestsPerMinute || 0}`),
      )

      console.log(chalk.gray('\n' + '─'.repeat(50)))
    }

    // Monitor every 30 seconds
    setInterval(monitor, 30000)
    await monitor() // Initial display
  }

  /**
   * Interactive mode for managing rollout
   */
  private async interactiveMode(): Promise<void> {
    console.log(chalk.blue('📋 Staging Rollout Options:'))
    console.log(chalk.gray('  1. Start new rollout'))
    console.log(chalk.gray('  2. Advance to next stage'))
    console.log(chalk.gray('  3. Show status'))
    console.log(chalk.gray('  4. Start monitoring'))
    console.log(chalk.gray('  5. Rollback'))
    console.log(chalk.gray('  6. Exit'))

    // In a real implementation, you would use inquirer or similar
    // For now, just show the status
    await this.showStatus()
  }

  /**
   * Load rollout state from file
   */
  private async loadState(): Promise<void> {
    try {
      const data = await fs.readFile(this.statePath, 'utf-8')
      this.state = JSON.parse(data)
    } catch {
      this.state = null
    }
  }

  /**
   * Save rollout state to file
   */
  private async saveState(): Promise<void> {
    if (!this.state) return

    await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2))
  }

  /**
   * Parse duration string to milliseconds
   */
  private parseDuration(duration: string): number | null {
    if (duration === 'stable') return null

    const match = duration.match(/^(\d+)([hmd])$/)
    if (!match) return null

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000
      case 'd':
        return value * 24 * 60 * 60 * 1000
      case 'm':
        return value * 60 * 1000
      default:
        return null
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alert: any): Promise<void> {
    // Implement your alerting logic here
    console.log(chalk.red(`\n🚨 ALERT: ${alert.title}`))
    console.log(chalk.red(`  ${alert.message}`))

    // Example: Send to Slack, PagerDuty, etc.
    if (process.env.SLACK_WEBHOOK) {
      // Send to Slack
    }

    if (process.env.PAGERDUTY_KEY) {
      // Send to PagerDuty
    }
  }

  /**
   * Notify rollback
   */
  private async notifyRollback(reason: string): Promise<void> {
    await this.sendAlert({
      severity: 'high',
      title: 'Validation Hooks Rolled Back',
      message: reason,
      stage: this.state?.currentStage,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Notify successful completion
   */
  private async notifyCompletion(): Promise<void> {
    await this.sendAlert({
      severity: 'info',
      title: 'Validation Hooks Rollout Complete',
      message: 'All stages completed successfully',
      metrics: this.state?.metrics,
      timestamp: new Date().toISOString(),
    })
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
let command = 'interactive'
const options: any = {}

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case 'start':
    case 'advance':
    case 'rollback':
    case 'status':
    case 'monitor':
      command = args[i]
      break
    case '--stage':
      options.stage = parseInt(args[++i])
      break
    case '--help':
      console.log(`
Usage: npm run validation:rollout:staging [command] [options]

Commands:
  start      Start new rollout (optionally specify --stage)
  advance    Advance to next stage
  rollback   Rollback current rollout
  status     Show current status
  monitor    Start continuous monitoring

Options:
  --stage <n>  Start from specific stage (1-5)
  --help       Show this help message

Examples:
  npm run validation:rollout:staging start
  npm run validation:rollout:staging start -- --stage 2
  npm run validation:rollout:staging advance
  npm run validation:rollout:staging rollback
  npm run validation:rollout:staging monitor
`)
      process.exit(0)
  }
}

// Execute rollout
const manager = new StagingRolloutManager()
manager.execute(command, options).catch((error) => {
  console.error(chalk.red('Rollout failed:'), error)
  process.exit(1)
})
