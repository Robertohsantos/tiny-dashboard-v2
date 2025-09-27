#!/usr/bin/env tsx

/**
 * Local Activation Script for Validated Hooks
 *
 * This script enables validated hooks in the local development environment
 * with comprehensive testing and monitoring setup.
 *
 * Usage:
 *   npm run validation:activate:local
 *   npm run validation:activate:local -- --check-only
 *   npm run validation:activate:local -- --percentage 50
 */

import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import chalk from 'chalk'

interface ActivationOptions {
  checkOnly?: boolean
  percentage?: number
  force?: boolean
  verbose?: boolean
}

class LocalValidationActivator {
  private readonly envPath = path.join(process.cwd(), '.env.local')
  private readonly configPath = path.join(
    process.cwd(),
    'validation.config.json',
  )
  private options: ActivationOptions

  constructor(options: ActivationOptions = {}) {
    this.options = {
      checkOnly: false,
      percentage: 100,
      force: false,
      verbose: false,
      ...options,
    }
  }

  /**
   * Main activation flow
   */
  async activate(): Promise<void> {
    console.log(chalk.blue('🚀 Validated Hooks Local Activation'))
    console.log(chalk.gray('━'.repeat(50)))

    try {
      // Step 1: Pre-flight checks
      await this.runPreflightChecks()

      if (this.options.checkOnly) {
        console.log(
          chalk.green('\n✅ All checks passed! Ready for activation.'),
        )
        return
      }

      // Step 2: Backup current configuration
      await this.backupConfiguration()

      // Step 3: Update environment variables
      await this.updateEnvironment()

      // Step 4: Create validation config
      await this.createValidationConfig()

      // Step 5: Run validation tests
      await this.runValidationTests()

      // Step 6: Start monitoring
      await this.setupMonitoring()

      // Step 7: Display success message
      this.displaySuccessMessage()
    } catch (error) {
      console.error(chalk.red('\n❌ Activation failed:'), error)
      await this.rollback()
      process.exit(1)
    }
  }

  /**
   * Run pre-flight checks
   */
  private async runPreflightChecks(): Promise<void> {
    console.log(chalk.yellow('\n🔍 Running pre-flight checks...'))

    const checks = [
      this.checkNodeVersion(),
      this.checkDependencies(),
      this.checkTestFiles(),
      this.checkBuildStatus(),
      this.checkTypeScript(),
    ]

    const results = await Promise.all(checks)
    const failedChecks = results.filter((r) => !r.success)

    if (failedChecks.length > 0) {
      console.log(chalk.red('\n❌ Pre-flight checks failed:'))
      failedChecks.forEach((check) => {
        console.log(chalk.red(`  - ${check.message}`))
      })

      if (!this.options.force) {
        throw new Error('Pre-flight checks failed. Use --force to override.')
      }

      console.log(chalk.yellow('\n⚠️  Continuing with --force flag...'))
    } else {
      console.log(chalk.green('✅ All pre-flight checks passed'))
    }
  }

  /**
   * Check Node.js version
   */
  private async checkNodeVersion(): Promise<{
    success: boolean
    message: string
  }> {
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1))

    if (majorVersion < 18) {
      return {
        success: false,
        message: `Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`,
      }
    }

    return {
      success: true,
      message: `Node.js version ${nodeVersion}`,
    }
  }

  /**
   * Check required dependencies
   */
  private async checkDependencies(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))

      const requiredDeps = ['zod', 'react-query', '@tanstack/react-query']
      const missingDeps = requiredDeps.filter(
        (dep) =>
          !packageJson.dependencies?.[dep] &&
          !packageJson.devDependencies?.[dep],
      )

      if (missingDeps.length > 0) {
        return {
          success: false,
          message: `Missing dependencies: ${missingDeps.join(', ')}`,
        }
      }

      return {
        success: true,
        message: 'All required dependencies installed',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check dependencies',
      }
    }
  }

  /**
   * Check test files exist
   */
  private async checkTestFiles(): Promise<{
    success: boolean
    message: string
  }> {
    const testFiles = [
      'src/modules/dashboard/hooks/__tests__/use-validated-hooks.integration.test.tsx',
      'tests/e2e/validation-hooks.spec.ts',
    ]

    const missingFiles = []
    for (const file of testFiles) {
      try {
        await fs.access(file)
      } catch {
        missingFiles.push(file)
      }
    }

    if (missingFiles.length > 0) {
      return {
        success: false,
        message: `Missing test files: ${missingFiles.join(', ')}`,
      }
    }

    return {
      success: true,
      message: 'All test files present',
    }
  }

  /**
   * Check build status
   */
  private async checkBuildStatus(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      console.log(chalk.gray('  Checking build status...'))
      execSync('npm run build', { stdio: 'pipe' })

      return {
        success: true,
        message: 'Build successful',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Build failed. Fix build errors before activation.',
      }
    }
  }

  /**
   * Check TypeScript compilation
   */
  private async checkTypeScript(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      console.log(chalk.gray('  Checking TypeScript...'))
      execSync('npm run typecheck', { stdio: 'pipe' })

      return {
        success: true,
        message: 'TypeScript check passed',
      }
    } catch (error) {
      return {
        success: false,
        message: 'TypeScript errors found. Fix type errors before activation.',
      }
    }
  }

  /**
   * Backup current configuration
   */
  private async backupConfiguration(): Promise<void> {
    console.log(chalk.yellow('\n📦 Backing up current configuration...'))

    const backupDir = path.join(process.cwd(), '.validation-backup')
    await fs.mkdir(backupDir, { recursive: true })

    // Backup .env.local if it exists
    try {
      await fs.copyFile(this.envPath, path.join(backupDir, '.env.local.backup'))
      console.log(chalk.green('  ✓ Backed up .env.local'))
    } catch (error) {
      console.log(chalk.gray('  - No .env.local to backup'))
    }

    // Backup validation config if it exists
    try {
      await fs.copyFile(
        this.configPath,
        path.join(backupDir, 'validation.config.json.backup'),
      )
      console.log(chalk.green('  ✓ Backed up validation.config.json'))
    } catch (error) {
      console.log(chalk.gray('  - No validation.config.json to backup'))
    }

    // Save backup timestamp
    await fs.writeFile(
      path.join(backupDir, 'backup.json'),
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
        null,
        2,
      ),
    )
  }

  /**
   * Update environment variables
   */
  private async updateEnvironment(): Promise<void> {
    console.log(chalk.yellow('\n🔧 Updating environment variables...'))

    let envContent = ''
    try {
      envContent = await fs.readFile(this.envPath, 'utf-8')
    } catch {
      // File doesn't exist, create new
    }

    // Parse existing env
    const envLines = envContent.split('\n')
    const envVars = new Map<string, string>()

    envLines.forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        envVars.set(match[1], match[2])
      }
    })

    // Update validation-related variables
    envVars.set('NEXT_PUBLIC_VALIDATION_ENABLED', 'true')
    envVars.set(
      'NEXT_PUBLIC_VALIDATION_PERCENTAGE',
      this.options.percentage!.toString(),
    )
    envVars.set('VALIDATION_ERROR_THRESHOLD', '10')
    envVars.set('VALIDATION_PERFORMANCE_THRESHOLD', '100')
    envVars.set('VALIDATION_TELEMETRY_ENABLED', 'true')
    envVars.set('VALIDATION_AUTO_ROLLBACK', 'true')

    // Write updated env
    const newEnvContent = Array.from(envVars.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    await fs.writeFile(this.envPath, newEnvContent)

    console.log(chalk.green('  ✓ Environment variables updated'))
    console.log(chalk.gray(`  - Validation enabled: ${chalk.cyan('true')}`))
    console.log(
      chalk.gray(
        `  - Rollout percentage: ${chalk.cyan(this.options.percentage + '%')}`,
      ),
    )
    console.log(chalk.gray(`  - Auto-rollback: ${chalk.cyan('enabled')}`))
  }

  /**
   * Create validation configuration file
   */
  private async createValidationConfig(): Promise<void> {
    console.log(chalk.yellow('\n📝 Creating validation configuration...'))

    const config = {
      version: '1.0.0',
      enabled: true,
      percentage: this.options.percentage,
      features: {
        dashboard: true,
        produtos: true,
        reports: false,
        settings: false,
      },
      monitoring: {
        telemetryEnabled: true,
        errorThreshold: 10,
        performanceThreshold: 100,
        autoRollback: true,
        alertWebhook: process.env.VALIDATION_ALERT_WEBHOOK || null,
      },
      rollout: {
        strategy: 'percentage',
        stages: [
          { percentage: 10, duration: '1h' },
          { percentage: 25, duration: '2h' },
          { percentage: 50, duration: '4h' },
          { percentage: 75, duration: '8h' },
          { percentage: 100, duration: 'stable' },
        ],
      },
      excluded: {
        users: [],
        routes: ['/api/health', '/api/status'],
        components: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2))

    console.log(chalk.green('  ✓ Validation configuration created'))
    console.log(
      chalk.gray(`  - Config file: ${chalk.cyan('validation.config.json')}`),
    )
  }

  /**
   * Run validation tests
   */
  private async runValidationTests(): Promise<void> {
    console.log(chalk.yellow('\n🧪 Running validation tests...'))

    try {
      // Run unit tests
      console.log(chalk.gray('  Running unit tests...'))
      execSync('npm run test -- --testPathPattern="validated" --silent', {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        env: {
          ...process.env,
          CI: 'true',
          NEXT_PUBLIC_VALIDATION_ENABLED: 'true',
        },
      })
      console.log(chalk.green('  ✓ Unit tests passed'))

      // Run integration tests
      console.log(chalk.gray('  Running integration tests...'))
      execSync(
        'npm run test:integration -- --testPathPattern="hooks.*integration" --silent',
        {
          stdio: this.options.verbose ? 'inherit' : 'pipe',
          env: {
            ...process.env,
            CI: 'true',
            NEXT_PUBLIC_VALIDATION_ENABLED: 'true',
          },
        },
      )
      console.log(chalk.green('  ✓ Integration tests passed'))
    } catch (error) {
      if (!this.options.force) {
        throw new Error('Validation tests failed')
      }
      console.log(
        chalk.yellow('  ⚠️  Tests failed but continuing with --force'),
      )
    }
  }

  /**
   * Setup monitoring
   */
  private async setupMonitoring(): Promise<void> {
    console.log(chalk.yellow('\n📊 Setting up monitoring...'))

    // Create monitoring script
    const monitorScript = `#!/usr/bin/env node

// Validation Monitoring Service
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      validation: {
        enabled: process.env.NEXT_PUBLIC_VALIDATION_ENABLED === 'true',
        percentage: parseInt(process.env.NEXT_PUBLIC_VALIDATION_PERCENTAGE || '0'),
        timestamp: new Date().toISOString()
      }
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.VALIDATION_MONITOR_PORT || 4000;
server.listen(PORT, () => {
  console.log(\`Validation monitor running on port \${PORT}\`);
});
`

    await fs.writeFile(
      path.join(process.cwd(), 'scripts', 'validation-monitor.js'),
      monitorScript,
    )

    console.log(chalk.green('  ✓ Monitoring setup complete'))
    console.log(
      chalk.gray(
        `  - Monitor endpoint: ${chalk.cyan('http://localhost:4000/health')}`,
      ),
    )
    console.log(
      chalk.gray(
        `  - Dashboard: ${chalk.cyan('http://localhost:3000/admin/validation-monitor')}`,
      ),
    )
  }

  /**
   * Rollback changes
   */
  private async rollback(): Promise<void> {
    console.log(chalk.yellow('\n⏮  Rolling back changes...'))

    const backupDir = path.join(process.cwd(), '.validation-backup')

    try {
      // Restore .env.local
      await fs.copyFile(path.join(backupDir, '.env.local.backup'), this.envPath)
      console.log(chalk.green('  ✓ Restored .env.local'))
    } catch {
      // No backup to restore
    }

    try {
      // Restore validation config
      await fs.copyFile(
        path.join(backupDir, 'validation.config.json.backup'),
        this.configPath,
      )
      console.log(chalk.green('  ✓ Restored validation.config.json'))
    } catch {
      // No backup to restore
    }
  }

  /**
   * Display success message
   */
  private displaySuccessMessage(): void {
    console.log(chalk.green('\n' + '═'.repeat(50)))
    console.log(chalk.green.bold('✅ Validation Hooks Activated Successfully!'))
    console.log(chalk.green('═'.repeat(50)))

    console.log(chalk.white('\n📋 Next Steps:'))
    console.log(chalk.gray('  1. Start the development server:'))
    console.log(chalk.cyan('     npm run dev'))
    console.log(chalk.gray('  2. Open the validation monitor:'))
    console.log(chalk.cyan('     npm run validation:monitor'))
    console.log(chalk.gray('  3. Test your application:'))
    console.log(chalk.cyan('     npm run test:e2e'))

    console.log(chalk.white('\n🔧 Configuration:'))
    console.log(chalk.gray(`  • Validation enabled: ${chalk.green('✓')}`))
    console.log(
      chalk.gray(
        `  • Rollout percentage: ${chalk.cyan(this.options.percentage + '%')}`,
      ),
    )
    console.log(chalk.gray(`  • Auto-rollback: ${chalk.green('enabled')}`))
    console.log(chalk.gray(`  • Telemetry: ${chalk.green('active')}`))

    console.log(chalk.white('\n📊 Monitoring:'))
    console.log(
      chalk.gray('  • Dashboard: ') +
        chalk.cyan('http://localhost:3000/admin/validation-monitor'),
    )
    console.log(
      chalk.gray('  • Health check: ') +
        chalk.cyan('http://localhost:4000/health'),
    )

    console.log(chalk.yellow('\n⚠️  Remember:'))
    console.log(chalk.gray('  • Monitor error rates closely'))
    console.log(chalk.gray('  • Check performance metrics'))
    console.log(chalk.gray('  • Be ready to rollback if needed'))

    console.log(chalk.blue('\n🚀 Happy validating!\n'))
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const options: ActivationOptions = {}

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--check-only':
      options.checkOnly = true
      break
    case '--percentage':
      options.percentage = parseInt(args[++i])
      break
    case '--force':
      options.force = true
      break
    case '--verbose':
      options.verbose = true
      break
    case '--help':
      console.log(`
Usage: npm run validation:activate:local [options]

Options:
  --check-only       Run pre-flight checks only
  --percentage <n>   Set rollout percentage (default: 100)
  --force           Continue even if checks fail
  --verbose         Show detailed output
  --help            Show this help message
`)
      process.exit(0)
  }
}

// Run activation
const activator = new LocalValidationActivator(options)
activator.activate().catch((error) => {
  console.error(chalk.red('Activation failed:'), error)
  process.exit(1)
})
