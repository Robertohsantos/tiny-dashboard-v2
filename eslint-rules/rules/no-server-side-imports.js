/**
 * ESLint rule to prevent server-side code imports in hooks
 *
 * This rule detects when hooks import server-side code that could cause bundle contamination.
 * Hooks should be client-side only and use the api client for server communication.
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent server-side code imports in hooks',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noServerSideImports:
        'Hooks should not import server-side code directly. ' +
        'Use the `api` client for server communication to prevent bundle contamination.',
    },
  },

  create(context) {
    const filename = context.getFilename()

    // Only check hook files
    if (!filename.includes('/hooks/') && !filename.includes('use-')) {
      return {}
    }

    return {
      ImportDeclaration(node) {
        const sourceValue = node.source?.value

        if (!sourceValue) return

        // Check for server-side imports that should not be in hooks
        const serverSidePatterns = [
          '/controllers/',
          '/procedures/',
          '/repositories/',
          '/services/',
          '.controller',
          '.procedure',
          '.repository',
          '.service',
          'Controller',
          'Procedure',
          'Repository',
          'Service',
        ]

        const isServerSideImport = serverSidePatterns.some((pattern) =>
          sourceValue.includes(pattern),
        )

        if (isServerSideImport) {
          // Allow some safe imports
          const safeImports = [
            '@/igniter.client',
            '@/api',
            'next/navigation', // Navigation hooks are client-safe
            'next/router', // Router hooks are client-safe
            'react', // React hooks are safe
            'react-dom', // React DOM hooks are safe
            /^@\//, // Relative imports might be safe utilities
          ]

          const isSafeImport = safeImports.some((safe) =>
            typeof safe === 'string'
              ? sourceValue.includes(safe)
              : safe.test(sourceValue),
          )

          if (!isSafeImport) {
            context.report({
              node,
              messageId: 'noServerSideImports',
            })
          }
        }
      },

      // Also check dynamic imports
      CallExpression(node) {
        if (node.callee.name === 'import' && node.arguments.length > 0) {
          const arg = node.arguments[0]

          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            const sourceValue = arg.value

            const serverSidePatterns = [
              '/controllers/',
              '/procedures/',
              '/repositories/',
              '/services/',
              '.controller',
              '.procedure',
              '.repository',
              '.service',
              'Controller',
              'Procedure',
              'Repository',
              'Service',
            ]

            const isServerSideImport = serverSidePatterns.some((pattern) =>
              sourceValue.includes(pattern),
            )

            if (isServerSideImport) {
              const safeImports = [
                '@/igniter.client',
                '@/api',
              ]

              const isSafeImport = safeImports.some((safe) =>
                sourceValue.includes(safe),
              )

              if (!isSafeImport) {
                context.report({
                  node,
                  messageId: 'noServerSideImports',
                })
              }
            }
          }
        }
      },
    }
  },
}

export default rule
