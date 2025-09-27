/**
 * ESLint rule to prevent controller imports in client-side files
 *
 * This rule detects when client-side files (.tsx, .jsx) import controllers directly,
 * which can cause bundle contamination by including server-side code in client bundles.
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent imports from presentation, components, src/app, or any client-side code in client files',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noClientLayerImports:
        'Client-side files should not import from presentation layer, components, src/app, or any other client-side code. ' +
        'Use the appropriate abstraction or API client instead.',
    },
  },

  create(context) {
    const filename = context.getFilename()

    // Only check client-side files
    if (!filename.endsWith('.tsx') && !filename.endsWith('.jsx')) {
      return {}
    }

    // Patterns that should not be imported in client files
    const forbiddenPatterns = [
      // presentation layer of a feature
      /\/features\/[^/]+\/presentation(\/|$)/,
      /\/presentation(\/|$)/,
      // components folder (allow ui primitives)
      /\/components\/(?!ui\/)/,
      // src/app
      /(^|\/)src\/app(\/|$)/,
      // anything from /client or /src/client
      /(^|\/)client(\/|$)/,
      /(^|\/)src\/client(\/|$)/,
    ]

    function isForbiddenImport(sourceValue) {
      return forbiddenPatterns.some((pattern) => pattern.test(sourceValue))
    }

    return {
      ImportDeclaration(node) {
        const sourceValue = node.source?.value
        if (!sourceValue) return

        if (isForbiddenImport(sourceValue)) {
          context.report({
            node,
            messageId: 'noClientLayerImports',
          })
        }
      },

      // Also check dynamic imports
      CallExpression(node) {
        if (node.callee.name === 'import' && node.arguments.length > 0) {
          const arg = node.arguments[0]

          if (arg.type === 'Literal' && typeof arg.value === 'string') {
            const sourceValue = arg.value

            if (isForbiddenImport(sourceValue)) {
              context.report({
                node,
                messageId: 'noClientLayerImports',
              })
            }
          }
        }
      },
    }
  },
}

export default rule
