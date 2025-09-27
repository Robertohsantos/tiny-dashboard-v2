/**
 * ESLint Plugin for Igniter.js Bundle Contamination Prevention
 *
 * This plugin provides rules to prevent bundle contamination in Igniter.js applications
 * by detecting improper imports and exports that could leak server-side code to client bundles.
 */

import noPresentationExports from './rules/no-presentation-exports.js'
import noControllerImports from './rules/no-controller-imports.js'
import noProcedureImports from './rules/no-procedure-imports.js'
import noServerSideImports from './rules/no-server-side-imports.js'

const plugin = {
  rules: {
    'no-presentation-exports': noPresentationExports,
    'no-controller-imports': noControllerImports,
    'no-procedure-imports': noProcedureImports,
    'no-server-side-imports': noServerSideImports,
  },
  configs: {
    recommended: {
      plugins: ['@saas-boilerplate/eslint-plugin'],
      rules: {
        '@saas-boilerplate/eslint-plugin/no-presentation-exports': 'error',
        '@saas-boilerplate/eslint-plugin/no-controller-imports': 'error',
        '@saas-boilerplate/eslint-plugin/no-procedure-imports': 'error',
        '@saas-boilerplate/eslint-plugin/no-server-side-imports': 'error',
      },
    },
  },
}

export default plugin
