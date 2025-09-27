import { AppRouterSchema } from '@/igniter.schema'

/**
 * @interface IgniterEvent
 * @description Represents a single event/endpoint available in the Igniter.js API.
 */
export interface IgniterEvent {
  /** The full path of the event, e.g., 'auth.signInWithProvider' */
  value: string
  /** A human-readable label for the event, e.g., 'Authentication - Sign In With Provider' */
  label: string
}

/**
 * @function listIgniterEvents
 * @description Generates a type-safe list of all available Igniter.js API events (controller.action).
 * This utility parses the `AppRouterSchema` to extract all defined controllers and their actions,
 * providing a structured and human-readable list for various purposes, such as webhook event selection.
 * @returns {IgniterEvent[]} An array of `IgniterEvent` objects, each representing an available API endpoint.
 */
export function listIgniterEvents(): IgniterEvent[] {
  const events: IgniterEvent[] = []

  const controllers = AppRouterSchema.controllers as Record<
    string,
    {
      name: string
      actions?: Record<string, { name?: string }>
    }
  >

  for (const [controllerName, controller] of Object.entries(controllers)) {
    const actions = controller.actions ?? {}

    for (const [actionName, action] of Object.entries(actions)) {
      if (action?.name) {
        const value = `${controllerName}.${actionName}`
        const label = `${controller.name} - ${action.name}`
        events.push({ value, label })
      }
    }
  }

  return events
}
