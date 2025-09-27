// Auto-generated empty module for client-side compatibility
// This prevents server-only modules from being bundled in the client

const createEmptyModule = () => {
  const warningShown = new Set()

  const showWarning = (prop) => {
    if (!warningShown.has(prop) && typeof console !== 'undefined') {
      // const stack = new Error().stack
      // console.warn(
      //   `[Igniter] Attempted to use server-only module property "${prop}" in client bundle. This is likely a bug.\nOrigem da importação:\n${stack}`,
      // )
      // warningShown.add(prop)
    }
  }

  // Create a proxy that intercepts all property access
  const handler = {
    get: (target, prop) => {
      // Allow common properties that might be checked
      if (
        prop === 'default' ||
        prop === '__esModule' ||
        prop === Symbol.toStringTag
      ) {
        return target[prop]
      }

      // Show warning for other properties
      showWarning(prop)

      // Return a safe empty function or object
      return typeof prop === 'string' && prop.endsWith('Sync')
        ? () => null // For sync functions
        : () => Promise.resolve(null) // For async functions
    },

    set: () => true, // Allow setting properties silently
    has: () => true, // Pretend all properties exist
    ownKeys: () => [], // Return empty keys
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  }

  const target = {
    default: {},
    __esModule: true,
  }

  return new Proxy(target, handler)
}

const emptyModule = createEmptyModule()

// Export for all module systems
module.exports = emptyModule
module.exports.default = emptyModule

if (typeof exports !== 'undefined') {
  exports.default = emptyModule
}
