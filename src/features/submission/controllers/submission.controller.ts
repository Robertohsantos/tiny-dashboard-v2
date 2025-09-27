import { z } from 'zod'
import { igniter } from '@/igniter'
import { SubmissionFeatureProcedure } from '../procedures/submission.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'
import { IntegrationFeatureProcedure } from '@/@saas-boilerplate/features/integration'
import { NotificationProcedure } from '@/@saas-boilerplate/features/notification/procedures/notification.procedure'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { NotificationType } from '@/@saas-boilerplate/features/notification/notification.interfaces'
import type { Submission } from '../submission.interface'

const toSubmissionEventPayload = (
  submission: Submission,
): Record<string, unknown> => ({
  id: submission.id,
  leadId: submission.leadId,
  organizationId: submission.organizationId,
  metadata: submission.metadata,
  createdAt: submission.createdAt.toISOString(),
  updatedAt: submission.updatedAt.toISOString(),
})

export const SubmissionController = igniter.controller({
  name: 'Submission',
  description: 'Manage form submissions and lead data',
  path: '/submissions',
  actions: {
    findMany: igniter.query({
      name: 'listSubmissions',
      description: 'List submissions with filters',
      method: 'GET',
      path: '/',
      use: [SubmissionFeatureProcedure(), AuthFeatureProcedure()],
      query: z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        search: z.string().optional(),
        leadId: z.string().optional(),
      }),
      handler: async ({ response, request, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })
        const result = await context.submission.findMany({
          ...request.query,
          organizationId: auth.organization.id,
        })
        return response.success(result)
      },
    }),

    findOne: igniter.query({
      name: 'getSubmission',
      description: 'Get submission by ID',
      method: 'GET',
      path: '/:id' as const,
      use: [SubmissionFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })
        const result = await context.submission.findOne({
          ...request.params,
          organizationId: auth.organization.id,
        })
        return response.success(result)
      },
    }),

    create: igniter.mutation({
      name: 'createSubmission',
      description: 'Create new submission',
      method: 'POST',
      path: '/',
      use: [
        SubmissionFeatureProcedure(),
        AuthFeatureProcedure(),
        IntegrationFeatureProcedure(),
        NotificationProcedure(),
      ],
      body: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(), // added phone field to the body
        metadata: z.object({
          source: z.string(),
          data: z.record(z.any()),
        }),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        const result = await context.submission.create({
          name: request.body.name,
          email: request.body.email,
          phone: request.body.phone,
          organizationId: auth.organization.id,
          metadata: request.body.metadata,
        })

        // Business Logic: After creating the submission, trigger events for installed plugins.
        const plugins = await context.integration.setupPluginsForOrganization(
          auth.organization.id,
        )

        for (const pluginKey in plugins) {
          const plugin = plugins[pluginKey as keyof typeof plugins]

          if (plugin && 'sendEvent' in plugin) {
            const pluginResult = await tryCatch(
              plugin.sendEvent({
                event: 'submission.created',
                data: toSubmissionEventPayload(result),
              }),
            )

            if (pluginResult.error) {
              igniter.logger.error(
                `Plugin ${pluginKey} failed to send submission.created event: ${pluginResult.error.message}`,
              )
            }
          }
        }

        // Response: Return the newly created submission and trigger real-time updates.
        return response.revalidate(['notification.list']).success(result)
      },
    }),

    update: igniter.mutation({
      name: 'updateSubmission',
      description: 'Update submission data',
      method: 'PUT',
      path: '/:id' as const,
      use: [SubmissionFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        metadata: z.any().optional().nullable(),
        leadId: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const auth = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        const result = await context.submission.update({
          id: request.params.id,
          metadata: request.body.metadata,
          organizationId: auth.organization.id,
        })

        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      name: 'deleteSubmission',
      description: 'Delete submission by ID',
      method: 'DELETE',
      path: '/:id' as const,
      use: [SubmissionFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        await context.submission.delete(request.params)
        return response.success(null)
      },
    }),
  },
})
