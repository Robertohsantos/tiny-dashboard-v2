#!/usr/bin/env tsx

/**
 * Automated Migration Script for Validated Hooks
 *
 * This script helps migrate components from using original hooks to validated hooks
 * It can run in two modes:
 * 1. Analyze mode: Identifies components using original hooks and suggests migrations
 * 2. Migrate mode: Automatically performs the migration with safety checks
 *
 * Usage:
 *   npm run migrate:hooks -- --analyze         # Analyze components
 *   npm run migrate:hooks -- --migrate         # Perform migration
 *   npm run migrate:hooks -- --component=path  # Migrate specific component
 *   npm run migrate:hooks -- --dry-run         # Preview changes without applying
 */

import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'
import chalk from 'chalk'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'

// Configuration
const HOOK_MAPPINGS = {
  // Dashboard hooks
  useDashboardMetrics: 'useDashboardMetricsValidated',
  useFinancialMetrics: 'useFinancialMetricsValidated',
  useChartData: 'useChartDataValidated',
  useShippingDifference: 'useShippingDifferenceValidated',
  useDashboardData: 'useDashboardDataValidated',
  usePrefetchDashboardData: 'usePrefetchDashboardDataValidated',

  // Product hooks
  useProdutoMetrics: 'useProdutoMetricsValidated',
  useProdutosList: 'useProdutosListValidated',
  useStockDistribution: 'useStockDistributionValidated',
  useProdutosReposicao: 'useProdutosReposicaoValidated',
  useProdutoData: 'useProdutoDataValidated',
  useProdutoById: 'useProdutoByIdValidated',
  useAllProdutoData: 'useAllProdutoDataValidated',
  useSaveProduto: 'useSaveProdutoValidated',
} as const satisfies Record<string, string>

type HookName = keyof typeof HOOK_MAPPINGS

const IMPORT_MAPPINGS = {
  '@/modules/dashboard/hooks/data/use-dashboard-data':
    '@/modules/dashboard/hooks/data/use-dashboard-data-validated',
  '@/modules/produtos/hooks/data/use-produtos-data':
    '@/modules/produtos/hooks/data/use-produtos-data-validated',
} as const satisfies Record<string, string>

const COMPONENT_PATHS = [
  'src/app/**/*.tsx',
  'src/app/**/*.ts',
  'src/components/**/*.tsx',
  'src/components/**/*.ts',
  'src/modules/**/*.tsx',
  'src/modules/**/*.ts',
  'src/features/**/*.tsx',
  'src/features/**/*.ts',
]

const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/*.test.tsx',
  '**/*.test.ts',
  '**/*.spec.tsx',
  '**/*.spec.ts',
  '**/use-*-validated.ts',
  '**/use-*-validated.tsx',
  '**/*-validated.tsx',
  '**/*-switch.tsx',
]

const CONFIG = {
  componentPaths: COMPONENT_PATHS,
  hookMappings: HOOK_MAPPINGS,
  importMappings: IMPORT_MAPPINGS,
  excludePatterns: EXCLUDE_PATTERNS,
}

type ImportPath = keyof typeof IMPORT_MAPPINGS

function isHookName(value: string): value is HookName {
  return value in CONFIG.hookMappings
}

function isImportPath(value: string): value is ImportPath {
  return value in CONFIG.importMappings
}

// Types
interface MigrationResult {
  filePath: string
  originalHooks: HookName[]
  migratedHooks: string[]
  hasErrors: boolean
  errors: string[]
  changes: string[]
}

interface AnalysisResult {
  filePath: string
  hooksFound: HookName[]
  canMigrate: boolean
  warnings: string[]
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  return {
    analyze: args.includes('--analyze'),
    migrate: args.includes('--migrate'),
    dryRun: args.includes('--dry-run'),
    component: args
      .find((arg) => arg.startsWith('--component='))
      ?.split('=')[1],
    verbose: args.includes('--verbose'),
    force: args.includes('--force'),
  }
}

// Find all component files
async function findComponentFiles(
  specificComponent?: string,
): Promise<string[]> {
  if (specificComponent) {
    return [specificComponent]
  }

  const files: string[] = []

  for (const pattern of CONFIG.componentPaths) {
    const matches = await glob(pattern, {
      ignore: CONFIG.excludePatterns,
    })
    files.push(...matches)
  }

  return files
}

// Analyze a file for hook usage
async function analyzeFile(filePath: string): Promise<AnalysisResult> {
  const content = await fs.readFile(filePath, 'utf-8')
  const hooksFound: HookName[] = []
  const warnings: string[] = []

  try {
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee

        // Check if it's a hook call
        if (t.isIdentifier(callee)) {
          const hookName = callee.name
          if (isHookName(hookName)) {
            hooksFound.push(hookName)
          }
        }
      },

      ImportDeclaration(path) {
        const source = path.node.source.value

        // Check for imports that need updating
        if (isImportPath(source)) {
          const specifiers = path.node.specifiers
          specifiers.forEach((spec) => {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              const importedName = spec.imported.name
              if (isHookName(importedName)) {
                // Check if already importing validated version
                if (!hooksFound.includes(importedName)) {
                  hooksFound.push(importedName)
                }
              }
            }
          })
        }

        // Check if already using validated hooks
        if (source.includes('-validated')) {
          warnings.push('File already imports validated hooks')
        }
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown parse error'
    warnings.push(`Parse error: ${message}`)
    return {
      filePath,
      hooksFound: [],
      canMigrate: false,
      warnings,
    }
  }

  // Check for complex patterns that might need manual review
  if (content.includes('ValidationError')) {
    warnings.push('File already handles ValidationError')
  }

  if (content.includes('validationTelemetry')) {
    warnings.push('File already uses validation telemetry')
  }

  const canMigrate = hooksFound.length > 0 && warnings.length === 0

  return {
    filePath,
    hooksFound,
    canMigrate,
    warnings,
  }
}

// Migrate a file to use validated hooks
async function migrateFile(
  filePath: string,
  dryRun: boolean = false,
): Promise<MigrationResult> {
  const content = await fs.readFile(filePath, 'utf-8')
  const result: MigrationResult = {
    filePath,
    originalHooks: [],
    migratedHooks: [],
    hasErrors: false,
    errors: [],
    changes: [],
  }

  try {
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })

    let hasChanges = false

    // Track imports to add
    const importsToAdd = new Set<string>()
    const importSpecifiersToUpdate = new Map<string, string[]>()

    traverse(ast, {
      // Update import statements
      ImportDeclaration(path) {
        const source = path.node.source.value
        if (isImportPath(source)) {
          const newSource = CONFIG.importMappings[source]
          // Update import path
          path.node.source.value = newSource
          hasChanges = true
          result.changes.push(
            `Updated import from '${source}' to '${newSource}'`,
          )

          // Update import specifiers
          path.node.specifiers.forEach((spec) => {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              const oldName = spec.imported.name
              if (isHookName(oldName)) {
                const newName = CONFIG.hookMappings[oldName]
                result.originalHooks.push(oldName)
                result.migratedHooks.push(newName)

                // Update the imported name
                spec.imported = t.identifier(newName)

                // If there's a local alias, keep it the same for backward compatibility
                if (t.isIdentifier(spec.local) && spec.local.name === oldName) {
                  spec.local = t.identifier(newName)
                }
              }
            }
          })
        }
      },

      // Update hook calls
      CallExpression(path) {
        const callee = path.node.callee

        if (t.isIdentifier(callee)) {
          const oldName = callee.name
          if (isHookName(oldName)) {
            const newName = CONFIG.hookMappings[oldName]
            callee.name = newName
            hasChanges = true
            result.changes.push(`Renamed ${oldName} to ${newName}`)

            // Add onValidationError handler if using combined data hooks
            if (
              oldName === 'useDashboardData' ||
              oldName === 'useAllProdutoData'
            ) {
              const args = path.node.arguments

              // Check if options object exists
              if (args.length < 2) {
                // Add options with onValidationError
                const optionsArg = t.objectExpression([
                  t.objectProperty(
                    t.identifier('onValidationError'),
                    t.arrowFunctionExpression(
                      [t.identifier('errors')],
                      t.blockStatement([
                        t.expressionStatement(
                          t.callExpression(
                            t.memberExpression(
                              t.identifier('console'),
                              t.identifier('error'),
                            ),
                            [
                              t.stringLiteral('Validation errors:'),
                              t.identifier('errors'),
                            ],
                          ),
                        ),
                      ]),
                    ),
                  ),
                ])

                path.node.arguments.push(optionsArg)
                result.changes.push(
                  `Added onValidationError handler to ${newName}`,
                )
              }
            }
          }
        }
      },

      // Update type imports if needed
      ImportSpecifier(path) {
        if (t.isIdentifier(path.node.imported)) {
          const name = path.node.imported.name

          // Check if we need to update type imports
          if (name.includes('Dashboard') || name.includes('Produto')) {
            const parent = path.parent
            if (t.isImportDeclaration(parent)) {
              const source = parent.source.value

              // If importing from schemas, add Validated suffix
              if (source.includes('/schemas/')) {
                const validatedName = name.replace(/^(.+)$/, '$1Validated')
                if (!name.includes('Validated')) {
                  path.node.imported = t.identifier(validatedName)
                  if (path.node.local.name === name) {
                    path.node.local = t.identifier(validatedName)
                  }
                  hasChanges = true
                  result.changes.push(
                    `Updated type import ${name} to ${validatedName}`,
                  )
                }
              }
            }
          }
        }
      },
    })

    if (hasChanges) {
      const { code } = generate(ast, {
        retainLines: true,
        retainFunctionParens: true,
        compact: false,
      })

      if (!dryRun) {
        // Create backup
        const backupPath = `${filePath}.backup.${Date.now()}`
        await fs.copyFile(filePath, backupPath)
        result.changes.push(`Created backup at ${backupPath}`)

        // Write migrated file
        await fs.writeFile(filePath, code, 'utf-8')
        result.changes.push(`File successfully migrated`)
      } else {
        result.changes.push(
          `[DRY RUN] Would update file with ${result.migratedHooks.length} hook migrations`,
        )
      }
    } else {
      result.changes.push('No changes needed')
    }
  } catch (error: unknown) {
    result.hasErrors = true
    const message = error instanceof Error ? error.message : 'Unknown migration error'
    result.errors.push(`Migration error: ${message}`)
  }

  return result
}

// Print analysis results
function printAnalysisResults(results: AnalysisResult[]) {
  console.log(chalk.blue('\n📊 Hook Usage Analysis Results\n'))

  const migratable = results.filter((r) => r.canMigrate)
  const withWarnings = results.filter((r) => r.warnings.length > 0)
  const total = results.length

  console.log(
    chalk.green(`✅ ${migratable.length} files can be automatically migrated`),
  )
  console.log(chalk.yellow(`⚠️  ${withWarnings.length} files have warnings`))
  console.log(chalk.gray(`📁 ${total} total files analyzed\n`))

  // Show files that can be migrated
  if (migratable.length > 0) {
    console.log(chalk.green('\nFiles ready for migration:'))
    migratable.forEach((result) => {
      console.log(chalk.gray(`  📄 ${result.filePath}`))
      result.hooksFound.forEach((hook) => {
        console.log(chalk.cyan(`     - ${hook} → ${CONFIG.hookMappings[hook]}`))
      })
    })
  }

  // Show files with warnings
  if (withWarnings.length > 0) {
    console.log(chalk.yellow('\nFiles requiring manual review:'))
    withWarnings.forEach((result) => {
      console.log(chalk.gray(`  📄 ${result.filePath}`))
      result.warnings.forEach((warning) => {
        console.log(chalk.yellow(`     ⚠️  ${warning}`))
      })
    })
  }

  // Summary
  console.log(chalk.blue('\n📈 Summary:'))
  const totalHooks = results.reduce((sum, r) => sum + r.hooksFound.length, 0)
  console.log(chalk.cyan(`  Total hooks found: ${totalHooks}`))

  const hookCounts = new Map<string, number>()
  results.forEach((r) => {
    r.hooksFound.forEach((hook) => {
      hookCounts.set(hook, (hookCounts.get(hook) || 0) + 1)
    })
  })

  if (hookCounts.size > 0) {
    console.log(chalk.cyan('\n  Hook usage breakdown:'))
    Array.from(hookCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([hook, count]) => {
        console.log(chalk.gray(`    ${hook}: ${count} usage(s)`))
      })
  }
}

// Print migration results
function printMigrationResults(results: MigrationResult[]) {
  console.log(chalk.blue('\n🔄 Migration Results\n'))

  const successful = results.filter(
    (r) => !r.hasErrors && r.migratedHooks.length > 0,
  )
  const failed = results.filter((r) => r.hasErrors)
  const skipped = results.filter(
    (r) => !r.hasErrors && r.migratedHooks.length === 0,
  )

  console.log(
    chalk.green(`✅ ${successful.length} files successfully migrated`),
  )
  console.log(chalk.red(`❌ ${failed.length} files failed`))
  console.log(
    chalk.gray(`⏭️  ${skipped.length} files skipped (no changes needed)`),
  )

  // Show successful migrations
  if (successful.length > 0) {
    console.log(chalk.green('\nSuccessful migrations:'))
    successful.forEach((result) => {
      console.log(chalk.gray(`  📄 ${result.filePath}`))
      result.changes.forEach((change) => {
        console.log(chalk.green(`     ✓ ${change}`))
      })
    })
  }

  // Show failed migrations
  if (failed.length > 0) {
    console.log(chalk.red('\nFailed migrations:'))
    failed.forEach((result) => {
      console.log(chalk.gray(`  📄 ${result.filePath}`))
      result.errors.forEach((error) => {
        console.log(chalk.red(`     ✗ ${error}`))
      })
    })
  }

  // Summary
  console.log(chalk.blue('\n📊 Migration Summary:'))
  const totalHooksMigrated = successful.reduce(
    (sum, r) => sum + r.migratedHooks.length,
    0,
  )
  console.log(chalk.cyan(`  Total hooks migrated: ${totalHooksMigrated}`))

  if (successful.length > 0) {
    console.log(
      chalk.yellow('\n⚠️  Important: Please review the migrated files and:'),
    )
    console.log(chalk.yellow('  1. Run your tests to ensure everything works'))
    console.log(chalk.yellow('  2. Test the application in development mode'))
    console.log(chalk.yellow('  3. Update any error handling if needed'))
    console.log(chalk.yellow('  4. Consider adding telemetry monitoring'))
  }
}

// Main function
async function main() {
  const args = parseArgs()

  // Validate arguments
  if (!args.analyze && !args.migrate) {
    console.log(chalk.red('❌ Please specify either --analyze or --migrate'))
    console.log(chalk.gray('\nUsage:'))
    console.log(
      chalk.gray(
        '  npm run migrate:hooks -- --analyze         # Analyze components',
      ),
    )
    console.log(
      chalk.gray(
        '  npm run migrate:hooks -- --migrate         # Perform migration',
      ),
    )
    console.log(
      chalk.gray(
        '  npm run migrate:hooks -- --dry-run         # Preview changes',
      ),
    )
    process.exit(1)
  }

  console.log(chalk.blue('🚀 Starting Validated Hooks Migration Tool\n'))

  // Find component files
  const files = await findComponentFiles(args.component)
  console.log(chalk.cyan(`Found ${files.length} files to process\n`))

  if (args.analyze) {
    // Analyze mode
    console.log(chalk.blue('🔍 Analyzing component files...\n'))

    const results: AnalysisResult[] = []

    for (const file of files) {
      if (args.verbose) {
        console.log(chalk.gray(`Analyzing ${file}...`))
      }

      const result = await analyzeFile(file)
      results.push(result)
    }

    printAnalysisResults(results)

    // Suggest next steps
    if (results.some((r) => r.canMigrate)) {
      console.log(chalk.green('\n✨ Ready to migrate!'))
      console.log(chalk.gray('Run the following command to perform migration:'))
      console.log(chalk.cyan('  npm run migrate:hooks -- --migrate'))
      console.log(chalk.gray('Or preview changes first with:'))
      console.log(chalk.cyan('  npm run migrate:hooks -- --migrate --dry-run'))
    }
  } else if (args.migrate) {
    // Migration mode
    const action = args.dryRun ? 'Previewing' : 'Performing'
    console.log(chalk.blue(`🔄 ${action} migration...\n`))

    // First analyze to check which files can be migrated
    const analysisResults: AnalysisResult[] = []

    for (const file of files) {
      const result = await analyzeFile(file)
      analysisResults.push(result)
    }

    // Filter files that can be migrated
    const filesToMigrate = analysisResults
      .filter((r) => args.force || r.canMigrate)
      .map((r) => r.filePath)

    if (filesToMigrate.length === 0) {
      console.log(
        chalk.yellow('⚠️  No files found that can be automatically migrated'),
      )
      console.log(chalk.gray('Use --force to attempt migration on all files'))
      return
    }

    console.log(
      chalk.cyan(`${action} migration on ${filesToMigrate.length} files...\n`),
    )

    // Perform migration
    const migrationResults: MigrationResult[] = []

    for (const file of filesToMigrate) {
      if (args.verbose) {
        console.log(chalk.gray(`Migrating ${file}...`))
      }

      const result = await migrateFile(file, args.dryRun)
      migrationResults.push(result)
    }

    printMigrationResults(migrationResults)
  }
}

// Run the script
main().catch((error) => {
  console.error(chalk.red('❌ Fatal error:'), error)
  process.exit(1)
})
