import { test, expect, Page } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'

/**
 * E2E Tests for Validated Hooks Migration
 * Tests the complete validation flow including:
 * - Hook switching mechanism
 * - Validation error handling
 * - Fallback behavior
 * - Telemetry reporting
 * - Auto-rollback triggers
 */

test.describe('Validated Hooks E2E Tests', () => {
  let page: Page
  let context: BrowserContext

  test.beforeEach(async ({ browser }) => {
    // Create context with validation enabled
    context = await browser.newContext({
      storageState: undefined,
      extraHTTPHeaders: {
        'X-Validation-Enabled': 'true',
      },
    })
    page = await context.newPage()

    // Mock authentication if needed
    await page.addInitScript(() => {
      window.localStorage.setItem('validation-enabled', 'true')
      window.localStorage.setItem('auth-token', 'test-token')
    })
  })

  test.afterEach(async () => {
    await context.close()
  })

  test.describe('Dashboard Validation', () => {
    test('should load dashboard with validated hooks', async () => {
      // Navigate to dashboard
      await page.goto('/dashboard-vendas')

      // Wait for data to load
      await page.waitForSelector('[data-testid="dashboard-metrics"]', {
        timeout: 10000,
      })

      // Verify metrics are displayed
      const metricsCard = page.locator('[data-testid="metrics-card"]')
      await expect(metricsCard).toBeVisible()

      // Check for validation indicators
      const validationIndicator = page.locator(
        '[data-testid="validation-status"]',
      )
      await expect(validationIndicator).toHaveText(/validated/i)
    })

    test('should handle validation errors gracefully', async () => {
      // Force validation error by manipulating data
      await page.route('**/api/dashboard/metrics', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            // Invalid data structure to trigger validation error
            invalidField: 'this should cause validation error',
          }),
        })
      })

      await page.goto('/dashboard-vendas')

      // Should show fallback UI
      const fallbackIndicator = page.locator('[data-testid="fallback-active"]')
      await expect(fallbackIndicator).toBeVisible()

      // Should still show data (from fallback)
      const metricsCard = page.locator('[data-testid="metrics-card"]')
      await expect(metricsCard).toBeVisible()

      // Verify telemetry was sent
      const telemetryRequests = await page.evaluate(() => {
        return window.performance
          .getEntriesByType('resource')
          .filter((entry) => entry.name.includes('/api/monitoring/validation'))
      })
      expect(telemetryRequests.length).toBeGreaterThan(0)
    })

    test('should switch to original hooks on error threshold', async () => {
      let errorCount = 0

      // Intercept API calls to force errors
      await page.route('**/api/dashboard/**', async (route) => {
        errorCount++
        if (errorCount <= 5) {
          // Force validation errors for first 5 requests
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ invalid: true }),
          })
        } else {
          // Allow normal response after threshold
          await route.continue()
        }
      })

      await page.goto('/dashboard-vendas')

      // Wait for multiple retries
      await page.waitForTimeout(3000)

      // Check that fallback is active
      const fallbackStatus = await page.evaluate(() => {
        return window.localStorage.getItem('validation-fallback-active')
      })
      expect(fallbackStatus).toBe('true')

      // Verify rollback alert was triggered
      const rollbackAlerts = await page.evaluate(() => {
        return window.performance
          .getEntriesByType('resource')
          .filter((entry) =>
            entry.name.includes('/api/monitoring/rollback-alert'),
          )
      })
      expect(rollbackAlerts.length).toBeGreaterThan(0)
    })

    test('should measure performance impact', async () => {
      // Test with original hooks
      await page.addInitScript(() => {
        window.localStorage.setItem('validation-enabled', 'false')
      })

      const startTimeOriginal = Date.now()
      await page.goto('/dashboard-vendas')
      await page.waitForSelector('[data-testid="dashboard-metrics"]')
      const loadTimeOriginal = Date.now() - startTimeOriginal

      // Test with validated hooks
      await page.addInitScript(() => {
        window.localStorage.setItem('validation-enabled', 'true')
      })

      const startTimeValidated = Date.now()
      await page.reload()
      await page.waitForSelector('[data-testid="dashboard-metrics"]')
      const loadTimeValidated = Date.now() - startTimeValidated

      // Performance impact should be minimal (< 10% increase)
      const impact =
        ((loadTimeValidated - loadTimeOriginal) / loadTimeOriginal) * 100
      expect(impact).toBeLessThan(10)

      console.log(`Performance impact: ${impact.toFixed(2)}%`)
    })
  })

  test.describe('Product Page Validation', () => {
    test('should load products with validated hooks', async () => {
      await page.goto('/produtos')

      // Wait for products to load
      await page.waitForSelector('[data-testid="products-metrics"]', {
        timeout: 10000,
      })

      // Verify metrics are displayed
      const metricsSection = page.locator(
        '[data-testid="products-metrics-section"]',
      )
      await expect(metricsSection).toBeVisible()

      // Check validation is active
      const validationStatus = await page.evaluate(() => {
        return window.__VALIDATION_ACTIVE__ || false
      })
      expect(validationStatus).toBe(true)
    })

    test('should handle product data validation errors', async () => {
      // Mock invalid product data
      await page.route('**/api/produtos/metrics', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            metrics: {
              // Missing required fields to trigger validation
              invalid: 'data',
            },
          }),
        })
      })

      await page.goto('/produtos')

      // Should show error toast
      const toast = page.locator('[data-testid="toast-error"]')
      await expect(toast).toBeVisible({ timeout: 5000 })

      // Should use fallback data
      const metricsSection = page.locator(
        '[data-testid="products-metrics-section"]',
      )
      await expect(metricsSection).toBeVisible()
    })
  })

  test.describe('Validation Monitor', () => {
    test('should display validation monitoring dashboard', async () => {
      await page.goto('/admin/validation-monitor')

      // Wait for monitor to load
      await page.waitForSelector('[data-testid="validation-monitor"]', {
        timeout: 10000,
      })

      // Check key sections are present
      const sections = [
        'validation-status',
        'error-metrics',
        'performance-metrics',
        'rollback-controls',
      ]

      for (const section of sections) {
        const element = page.locator(`[data-testid="${section}"]`)
        await expect(element).toBeVisible()
      }
    })

    test('should allow manual rollback', async () => {
      await page.goto('/admin/validation-monitor')

      // Click rollback button
      const rollbackButton = page.locator('[data-testid="manual-rollback-btn"]')
      await rollbackButton.click()

      // Confirm rollback
      const confirmButton = page.locator('[data-testid="confirm-rollback"]')
      await confirmButton.click()

      // Verify rollback was executed
      await page.waitForTimeout(1000)
      const validationStatus = await page.evaluate(() => {
        return window.localStorage.getItem('validation-enabled')
      })
      expect(validationStatus).toBe('false')

      // Check rollback notification
      const notification = page.locator('[data-testid="rollback-success"]')
      await expect(notification).toBeVisible()
    })

    test('should display real-time error metrics', async () => {
      await page.goto('/admin/validation-monitor')

      // Trigger some validation errors in another tab
      const errorPage = await context.newPage()

      // Force validation errors
      await errorPage.route('**/api/dashboard/**', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ invalid: true }),
        })
      })

      await errorPage.goto('/dashboard-vendas')
      await errorPage.waitForTimeout(2000)

      // Return to monitor page
      await page.bringToFront()
      await page.reload()

      // Check error count increased
      const errorCount = page.locator('[data-testid="error-count"]')
      const count = await errorCount.textContent()
      expect(parseInt(count || '0')).toBeGreaterThan(0)

      await errorPage.close()
    })
  })

  test.describe('Component Migration', () => {
    test('should use switch hooks in migrated components', async () => {
      // Test dashboard component
      await page.goto('/dashboard-vendas')

      // Check that switch hooks are active
      const switchStatus = await page.evaluate(() => {
        // This would be set by the switch hook implementation
        return window.__USING_SWITCH_HOOKS__ || false
      })
      expect(switchStatus).toBe(true)

      // Verify data loads correctly
      await expect(
        page.locator('[data-testid="dashboard-content"]'),
      ).toBeVisible()
    })

    test('should maintain functionality after migration', async () => {
      // Test all key user flows still work

      // 1. Dashboard navigation
      await page.goto('/dashboard-vendas')
      await expect(page).toHaveURL(/dashboard-vendas/)

      // 2. Product page navigation
      await page.click('[data-testid="nav-produtos"]')
      await expect(page).toHaveURL(/produtos/)

      // 3. Data refresh
      const refreshButton = page.locator('[data-testid="refresh-data"]')
      if (await refreshButton.isVisible()) {
        await refreshButton.click()
        await page.waitForSelector('[data-testid="loading-spinner"]')
        await page.waitForSelector('[data-testid="loading-spinner"]', {
          state: 'hidden',
        })
      }

      // 4. Verify no console errors
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.reload()
      await page.waitForTimeout(2000)

      expect(consoleErrors).toHaveLength(0)
    })
  })

  test.describe('Gradual Rollout', () => {
    test('should respect feature flag percentage', async () => {
      // Test with different user segments
      const results = []

      for (let i = 0; i < 10; i++) {
        const testContext = await browser.newContext({
          storageState: undefined,
        })
        const testPage = await testContext.newPage()

        // Set unique user ID to test percentage rollout
        await testPage.addInitScript((userId) => {
          window.localStorage.setItem('user-id', userId)
          // Feature flag would check this to determine if user gets validated hooks
        }, `user-${i}`)

        await testPage.goto('/dashboard-vendas')

        const isValidated = await testPage.evaluate(() => {
          return window.localStorage.getItem('validation-enabled') === 'true'
        })

        results.push(isValidated)
        await testContext.close()
      }

      // With gradual rollout, not all users should have validation
      const validatedCount = results.filter((r) => r).length
      expect(validatedCount).toBeGreaterThan(0)
      expect(validatedCount).toBeLessThan(10)
    })
  })
})

test.describe('Validation Performance Tests', () => {
  test('should not exceed memory limits', async ({ page }) => {
    await page.goto('/dashboard-vendas')

    // Monitor memory usage
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        }
      }
      return null
    })

    if (metrics) {
      const heapUsagePercent =
        (metrics.usedJSHeapSize / metrics.totalJSHeapSize) * 100
      expect(heapUsagePercent).toBeLessThan(80)
    }
  })

  test('should handle rapid navigation without memory leaks', async ({
    page,
  }) => {
    const pages = [
      '/dashboard-vendas',
      '/produtos',
      '/admin/validation-monitor',
    ]

    // Navigate rapidly between pages
    for (let i = 0; i < 20; i++) {
      const pageUrl = pages[i % pages.length]
      await page.goto(pageUrl)
      await page.waitForTimeout(100)
    }

    // Check for memory leaks
    const finalMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })

    // Memory should not grow excessively
    expect(finalMetrics).toBeLessThan(100 * 1024 * 1024) // Less than 100MB
  })
})

test.describe('Error Recovery', () => {
  test('should recover from temporary API failures', async ({ page }) => {
    let requestCount = 0

    // Simulate intermittent failures
    await page.route('**/api/dashboard/**', async (route) => {
      requestCount++
      if (requestCount <= 2) {
        // Fail first 2 requests
        await route.abort('failed')
      } else {
        // Succeed on retry
        await route.continue()
      }
    })

    await page.goto('/dashboard-vendas')

    // Should eventually load successfully
    await expect(page.locator('[data-testid="dashboard-metrics"]')).toBeVisible(
      {
        timeout: 15000,
      },
    )

    // Should not show permanent error state
    const errorState = page.locator('[data-testid="permanent-error"]')
    await expect(errorState).not.toBeVisible()
  })

  test('should handle network disconnection gracefully', async ({
    page,
    context,
  }) => {
    await page.goto('/dashboard-vendas')

    // Wait for initial load
    await page.waitForSelector('[data-testid="dashboard-metrics"]')

    // Simulate offline
    await context.setOffline(true)

    // Try to refresh data
    const refreshButton = page.locator('[data-testid="refresh-data"]')
    if (await refreshButton.isVisible()) {
      await refreshButton.click()
    }

    // Should show offline indicator
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 })

    // Restore connection
    await context.setOffline(false)

    // Should recover automatically
    await page.waitForTimeout(2000)
    await expect(offlineIndicator).not.toBeVisible()
  })
})
