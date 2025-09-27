import { z } from 'zod'
import { igniter } from '@/igniter'
import { ApiKeyFeatureProcedure } from '../procedures/api-key.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'
import { NotificationProcedure } from '../../notification/procedures/notification.procedure'

export const ApiKeyController = igniter.controller({
  name: 'API Keys',
  description: 'API key management',
  path: '/api-key',
  actions: {
    findManyByOrganization: igniter.query({
      name: 'listApiKeys',
      description: 'List organization API keys',
      method: 'GET',
      path: '/',
      use: [ApiKeyFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })

        const result = await context.apikey.findManyByOrganization(
          session.organization.id,
        )

        return response.success(result)
      },
    }),

    findOne: igniter.query({
      name: 'getApiKey',
      description: 'Get API key by ID',
      method: 'GET',
      path: '/:id' as const,
      use: [ApiKeyFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })

        const result = await context.apikey.findOne({
          id: request.params.id,
          organizationId: session.organization.id,
        })

        return response.success(result)
      },
    }),

    create: igniter.mutation({
      name: 'createApiKey',
      description: 'Create new API key',
      method: 'POST',
      path: '/',
      use: [
        ApiKeyFeatureProcedure(),
        AuthFeatureProcedure(),
        NotificationProcedure(),
      ],
      body: z.object({
        description: z.string(),
        enabled: z.boolean().optional().nullable(),
        neverExpires: z.boolean().optional().nullable(),
        expiresAt: z.date().optional().nullable(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })

        const result = await context.apikey.create({
          ...request.body,
          organizationId: session.organization.id,
        })

        // Business Logic: Create notification for new API Key.
        await context.services.notification.send({
          type: 'API_KEY_CREATED',
          context: {
            organizationId: session.organization.id,
          },
          data: {
            description: result.description,
            keyPreview: result.key.slice(-4),
          },
        })

        return response.success(result)
      },
    }),

    update: igniter.mutation({
      name: 'updateApiKey',
      description: 'Update existing API key',
      method: 'PUT',
      path: '/:id' as const,
      use: [ApiKeyFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        description: z.string().optional(),
        enabled: z.boolean().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        const result = await context.apikey.update({
          ...request.params,
          ...request.body,
          organizationId: session.organization.id,
        })
        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      name: 'deleteApiKey',
      description: 'Delete API key',
      method: 'DELETE',
      path: '/:id' as const,
      use: [ApiKeyFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['owner', 'admin'],
        })
        await context.apikey.delete({
          ...request.params,
          organizationId: session.organization.id,
        })
        return response.success({ message: 'Api key deleted' })
      },
    }),
  },
})
