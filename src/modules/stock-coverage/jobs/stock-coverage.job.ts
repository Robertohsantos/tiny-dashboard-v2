/**
 * Stock Coverage Calculation Job
 * Periodic job to recalculate stock coverage for all products
 */

import { stockCoverageService } from '@/modules/stock-coverage'
import { prisma } from '@/modules/core/services/prisma'
import { logger } from '@/modules/core/services/logger'

export interface StockCoverageJobConfig {
  enabled: boolean
  cronExpression: string // e.g., "0 2 * * *" (daily at 2 AM)
  batchSize: number
  maxAge: number // Hours before coverage is considered stale
  organizations?: string[] // Specific orgs to process, or all if empty
}

const DEFAULT_CONFIG: StockCoverageJobConfig = {
  enabled: true,
  cronExpression: '0 2 * * *', // Daily at 2 AM
  batchSize: 50,
  maxAge: 24, // Recalculate if older than 24 hours
  organizations: [],
}

export class StockCoverageJob {
  private config: StockCoverageJobConfig
  private isRunning: boolean = false

  constructor(config?: Partial<StockCoverageJobConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Main job execution
   */
  async execute(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Stock coverage job is disabled')
      return
    }

    if (this.isRunning) {
      logger.warn('Stock coverage job is already running, skipping')
      return
    }

    this.isRunning = true
    const startTime = Date.now()

    try {
      logger.info('Starting stock coverage calculation job')

      // Get organizations to process
      const organizations = await this.getOrganizations()

      logger.info(`Processing ${organizations.length} organizations`)

      let totalProducts = 0
      let successfulCalculations = 0
      let failedCalculations = 0

      // Process each organization
      for (const org of organizations) {
        try {
          const result = await this.processOrganization(org.id)
          totalProducts += result.total
          successfulCalculations += result.successful
          failedCalculations += result.failed

          logger.info(
            `Processed organization ${org.id}: ${result.successful}/${result.total} successful`,
          )
        } catch (error) {
          logger.error(`Failed to process organization ${org.id}:`, error)
        }
      }

      const duration = Date.now() - startTime

      // Log summary
      const successRate =
        totalProducts > 0
          ? `${((successfulCalculations / totalProducts) * 100).toFixed(1)}%`
          : '0.0%'

      logger.info('Stock coverage job completed', {
        duration: `${duration}ms`,
        totalProducts,
        successful: successfulCalculations,
        failed: failedCalculations,
        successRate,
      })

      // Clean up old calculations
      await this.cleanup()
    } catch (error) {
      logger.error('Stock coverage job failed:', error)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Process a single organization
   */
  private async processOrganization(organizationId: string): Promise<{
    total: number
    successful: number
    failed: number
  }> {
    // Get products needing recalculation
    const products = await prisma.product.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        sku: true,
        currentStock: true,
        stockCoverages: {
          orderBy: {
            calculatedAt: 'desc',
          },
          take: 1,
        },
      },
    })

    // Filter products that need recalculation
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - this.config.maxAge)

    const productsToProcess = products.filter((product) => {
      // No coverage calculated yet
      if (product.stockCoverages.length === 0) {
        return true
      }

      // Coverage is too old
      const lastCoverage = product.stockCoverages[0]
      return lastCoverage.calculatedAt < cutoffDate
    })

    logger.info(
      `Found ${productsToProcess.length} products needing recalculation in org ${organizationId}`,
    )

    let successful = 0
    let failed = 0

    // Process in batches
    for (let i = 0; i < productsToProcess.length; i += this.config.batchSize) {
      const batch = productsToProcess.slice(i, i + this.config.batchSize)

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map((product) =>
          stockCoverageService
            .calculateCoverage(product.id, false)
            .then(() => {
              successful++
              return { sku: product.sku, success: true }
            })
            .catch((error) => {
              failed++
              logger.error(
                `Failed to calculate coverage for ${product.sku}:`,
                error,
              )
              return { sku: product.sku, success: false, error }
            }),
        ),
      )

      // Log batch results
      const batchSuccessful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success,
      ).length

      logger.debug(
        `Batch ${i / this.config.batchSize + 1}: ${batchSuccessful}/${batch.length} successful`,
      )

      // Small delay between batches to avoid overload
      if (i + this.config.batchSize < productsToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return {
      total: productsToProcess.length,
      successful,
      failed,
    }
  }

  /**
   * Get organizations to process
   */
  private async getOrganizations() {
    if (this.config.organizations && this.config.organizations.length > 0) {
      return prisma.organization.findMany({
        where: {
          id: { in: this.config.organizations },
        },
        select: {
          id: true,
          name: true,
        },
      })
    }

    // Get all active organizations with products
    return prisma.organization.findMany({
      where: {
        products: {
          some: {
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    })
  }

  /**
   * Clean up old coverage calculations
   */
  private async cleanup(): Promise<void> {
    try {
      const deleted = await stockCoverageService.cleanup()
      logger.info(`Cleaned up ${deleted} expired coverage calculations`)
    } catch (error) {
      logger.error('Failed to cleanup old calculations:', error)
    }
  }

  /**
   * Get job status
   */
  getStatus(): {
    isRunning: boolean
    config: StockCoverageJobConfig
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    }
  }

  /**
   * Update job configuration
   */
  updateConfig(config: Partial<StockCoverageJobConfig>): void {
    this.config = { ...this.config, ...config }
    logger.info('Stock coverage job configuration updated', this.config)
  }
}

// Export singleton instance
export const stockCoverageJob = new StockCoverageJob()

/**
 * Register the job with a cron scheduler
 * Example using node-cron:
 *
 * import * as cron from 'node-cron'
 *
 * cron.schedule(stockCoverageJob.config.cronExpression, async () => {
 *   await stockCoverageJob.execute()
 * })
 */
