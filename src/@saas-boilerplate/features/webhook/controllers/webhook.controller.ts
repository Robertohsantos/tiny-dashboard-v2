import { z } from 'zod'
import { igniter } from '@/igniter'
import { WebhookFeatureProcedure } from '../procedures/webhook.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'

export const WebhookController = igniter.controller({
  name: 'Webhook',
  description:
    'Webhook configuration and event management for real-time notifications',
  path: '/webhook',
  actions: {
    findMany: igniter.query({
      name: 'listWebhooks',
      description: 'List organization webhooks',
      method: 'GET',
      path: '/',
      use: [WebhookFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        const result = await context.webhook.findManyByOrganizationId(
          session.organization.id,
        )
        return response.success(result)
      },
    }),

    findOne: igniter.query({
      name: 'getWebhook',
      description: 'Get webhook by ID',
      method: 'GET',
      path: '/:id' as const,
      use: [WebhookFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        const result = await context.webhook.findOne({
          id: request.params.id,
          organizationId: session.organization.id,
        })
        return response.success(result)
      },
    }),

    create: igniter.mutation({
      name: 'createWebhook',
      description: 'Create new webhook',
      method: 'POST',
      path: '/',
      use: [WebhookFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        url: z.string(),
        secret: z.string(),
        events: z.array(z.string()),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })

        // Business Logic: Create the webhook in the database
        const result = await context.webhook.create({
          ...request.body,
          organizationId: session.organization.id,
        })

        return response.success(result)
      },
    }),

    update: igniter.mutation({
      name: 'updateWebhook',
      description: 'Update existing webhook',
      method: 'PUT',
      path: '/:id' as const,
      use: [WebhookFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        url: z.string().optional(),
        secret: z.string().optional(),
        events: z.array(z.string()).optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })

        // Business Logic: Update the webhook in the database
        const result = await context.webhook.update({
          ...request.params,
          ...request.body,
          organizationId: session.organization.id,
        })

        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      name: 'deleteWebhook',
      description: 'Delete webhook',
      method: 'DELETE',
      path: '/:id' as const,
      use: [WebhookFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })

        // Business Logic: Delete the webhook from the database
        const result = await context.webhook.delete({
          ...request.params,
          organizationId: session.organization.id,
        })

        return response.success({ message: 'Webhook deleted successfully' })
      },
    }),

    listEvents: igniter.query({
      name: 'listEvents',
      description: 'List available events',
      method: 'GET',
      path: '/events',
      use: [WebhookFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const result = await context.webhook.listEvents()
        return response.success(result)
      },
    }),
  },
})
