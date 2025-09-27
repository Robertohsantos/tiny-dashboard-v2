/**
 * ESLint rule to prevent presentation layer exports in feature index files
 *
 * This rule detects when feature index.ts files export presentation components,
 * which can cause bundle contamination by including client-side code in server bundles.
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent presentation layer exports in feature index files',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noPresentationExports:
        'Feature index files should not export presentation components to prevent bundle contamination. ' +
        'Move presentation component imports to pages/components that need them directly.',
    },
  },

  create(context) {
    const filename = context.getFilename()

    // Only check feature index.ts files
    if (!filename.includes('/features/') || !filename.endsWith('/index.ts')) {
      return {}
    }

    return {
      ExportAllDeclaration(node) {
        const sourceValue = node.source?.value

        if (!sourceValue) return

        // Check for presentation layer exports
        if (
          sourceValue.includes('./presentation/') ||
          sourceValue.includes('./presentation/components') ||
          sourceValue.includes('./presentation/hooks') ||
          sourceValue.includes('./presentation/contexts') ||
          sourceValue.includes('./presentation/utils')
        ) {
          context.report({
            node,
            messageId: 'noPresentationExports',
          })
        }
      },

      ExportNamedDeclaration(node) {
        const sourceValue = node.source?.value

        if (!sourceValue) return

        // Check for presentation layer exports
        if (
          sourceValue.includes('./presentation/') ||
          sourceValue.includes('./presentation/components') ||
          sourceValue.includes('./presentation/hooks') ||
          sourceValue.includes('./presentation/contexts') ||
          sourceValue.includes('./presentation/utils')
        ) {
          context.report({
            node,
            messageId: 'noPresentationExports',
          })
        }
      },
    }
  },
}

export default rule
