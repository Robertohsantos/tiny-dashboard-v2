import { igniter } from '@/igniter'
import type {
  Webhook,
  CreateWebhookDTO,
  UpdateWebhookDTO,
} from '../webhook.interface'
import {
  listIgniterEvents,
  IgniterEvent,
} from '../../../../@saas-boilerplate/utils/igniter-events'

export const WebhookFeatureProcedure = igniter.procedure({
  name: 'WebhookFeatureProcedure',
  handler: (_, { context }) => {
    return {
      webhook: {
        findManyByOrganizationId: (
          organizationId: string,
        ): Promise<Webhook[]> => {
          return context.services.database.webhook.findMany({
            where: {
              organizationId,
            },
          })
        },

        findOne: (params: {
          id: string
          organizationId?: string
        }): Promise<Webhook | null> => {
          return context.services.database.webhook.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
          })
        },

        create: (input: CreateWebhookDTO): Promise<Webhook> => {
          return context.services.database.webhook.create({
            data: {
              url: input.url,
              secret: input.secret,
              events: input.events,
              organizationId: input.organizationId,
            },
          })
        },

        update: async (params: UpdateWebhookDTO): Promise<Webhook> => {
          const webhook = await context.services.database.webhook.findUnique({
            where: { id: params.id },
          })

          if (!webhook) throw new Error('Webhook not found')

          return context.services.database.webhook.update({
            where: { id: params.id },
            data: {
              url: params.url,
              secret: params.secret,
              events: params.events,
            },
          })
        },

        delete: async (params: {
          id: string
          organizationId?: string
        }): Promise<{ id: string }> => {
          await context.services.database.webhook.delete({
            where: { id: params.id, organizationId: params.organizationId },
          })

          return { id: params.id }
        },

        /**
         * @method listEvents
         * @description Lists all available Igniter.js API events for webhook subscription.
         * This method leverages the `listIgniterEvents` utility to provide a type-safe
         * and human-readable list of all `controller.action` combinations available
         * in the application's API schema.
         * @returns {IgniterEvent[]} An array of `IgniterEvent` objects, each representing an available API endpoint.
         */
        listEvents: (): Promise<IgniterEvent[]> => {
          return Promise.resolve(listIgniterEvents())
        },

        dispatch: async (params: {
          event: string
          organizationId: string
          payload: Record<string, unknown>
        }) => {
          const webhooks = await context.services.database.webhook.findMany({
            where: {
              organizationId: params.organizationId,
            },
          })

          for (const webhook of webhooks) {
            if (webhook.events.includes(params.event)) {
              await igniter.jobs.webhook.schedule({
                task: 'dispatch',
                input: {
                  webhook: {
                    id: webhook.id,
                    url: webhook.url,
                    secret: webhook.secret,
                    events: webhook.events,
                  },
                  payload: params.payload,
                  eventName: params.event,
                },
              })
            }
          }
        },
      },
    }
  },
})
