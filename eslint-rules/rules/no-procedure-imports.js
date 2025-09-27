/**
 * ESLint rule to prevent procedure imports in client-side files
 *
 * This rule detects when client-side files (.tsx, .jsx) import procedures directly,
 * which can cause bundle contamination by including server-side code in client bundles.
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent procedure imports in client-side files',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noProcedureImports:
        'Client-side files should not import procedures directly. ' +
        'Use the `api` client instead to communicate with server-side endpoints.',
    },
  },

  create(context) {
    const filename = context.getFilename()

    // Only check client-side files
    if (!filename.endsWith('.tsx') && !filename.endsWith('.jsx')) {
      return {}
    }

    return {
      ImportDeclaration(node) {
        const sourceValue = node.source?.value

        if (!sourceValue) return

        // Check for procedure imports
        if (
          sourceValue.includes('/procedures/') ||
          sourceValue.includes('.procedure') ||
          sourceValue.endsWith('Procedure')
        ) {
          // Allow imports from api client (these are safe)
          if (
            sourceValue.includes('api') ||
            sourceValue.includes('client') ||
            sourceValue.includes('@/igniter.client')
          ) {
            return
          }

          context.report({
            node,
            messageId: 'noProcedureImports',
          })
        }
      },

      // Also check dynamic imports
      CallExpression(node) {
        if (node.callee.name === 'import' && node.arguments.length > 0) {
          const arg = node.arguments[0]

          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            const sourceValue = arg.value

            if (
              sourceValue.includes('/procedures/') ||
              sourceValue.includes('.procedure') ||
              sourceValue.endsWith('Procedure')
            ) {
              // Allow imports from api client
              if (
                sourceValue.includes('api') ||
                sourceValue.includes('client') ||
                sourceValue.includes('@/igniter.client')
              ) {
                return
              }

              context.report({
                node,
                messageId: 'noProcedureImports',
              })
            }
          }
        }
      },
    }
  },
}

export default rule
