import { z } from 'zod'
import { igniter } from '@/igniter'
import { OrganizationFeatureProcedure } from '../procedures/organization.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth/procedures/auth.procedure'
import { NotificationProcedure } from '../../notification/procedures/notification.procedure'
import { OrganizationMetadataSchema } from '../organization.interface'

export const OrganizationController = igniter.controller({
  name: 'Organization',
  description:
    'Organization management including creation, updates, verification, and statistics',
  path: '/organization',
  actions: {
    create: igniter.mutation({
      name: 'createOrganization',
      description: 'Create new organization',
      method: 'POST',
      path: '/',
      use: [
        OrganizationFeatureProcedure(),
        AuthFeatureProcedure(),
        NotificationProcedure(),
      ],
      body: z.object({
        name: z.string(),
        slug: z.string(),
        logo: z.string().optional(),
        metadata: OrganizationMetadataSchema.optional(),
        withDemoData: z.boolean().optional().default(false),
      }),
      handler: async ({ request, response, context }) => {
        const disponibility = await context.organization.verify({
          slug: request.body.slug,
        })

        if (!disponibility) {
          return response.badRequest('Slug is not available')
        }

        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.user) {
          return response.unauthorized('Authentication required')
        }

        const result = await context.organization.create({
          ...request.body,
          userId: session.user.id,
          withDemoData: request.body.withDemoData || false,
          metadata: {
            contact: {
              email: session.user.email,
            },
          },
        })

        return response.success(result)
      },
    }),

    stats: igniter.query({
      name: 'getOrganizationStats',
      description: 'Get organization stats',
      method: 'GET',
      path: '/stats',
      use: [OrganizationFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        // Business Rule: Get session without requiring roles first to check organization
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        // Business Rule: Check if user has an organization before requiring roles
        if (!session.organization) {
          return response.forbidden(
            'Organization access required. Please complete onboarding first.',
          )
        }

        // Business Rule: Now verify roles since we confirmed organization exists
        const sessionWithRoles = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })

        const stats = await context.organization.getStats({
          organizationId: sessionWithRoles.organization.id,
        })
        return response.success(stats)
      },
    }),

    verify: igniter.mutation({
      name: 'verifyOrganization',
      description: 'Verify organization',
      method: 'POST',
      path: '/verify' as const,
      use: [OrganizationFeatureProcedure()],
      body: z.object({
        slug: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.organization.verify({
          slug: request.body.slug,
        })
        return response.success({ available: result })
      },
    }),

    update: igniter.mutation({
      name: 'updateOrganization',
      description: 'Update organization',
      method: 'PUT',
      path: '/' as const,
      use: [OrganizationFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        name: z.string().optional(),
        slug: z.string().optional(),
        logo: z.string().optional().nullable(),
        metadata: z.any().optional().nullable(),
      }),
      handler: async ({ request, response, context }) => {
        // Business Rule: Get session without requiring roles first to check organization
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        // Business Rule: Check if user has an organization before requiring roles
        if (!session.organization) {
          return response.forbidden(
            'Organization access required. Please complete onboarding first.',
          )
        }

        // Business Rule: Now verify roles since we confirmed organization exists
        const sessionWithRoles = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'member', 'owner'],
        })

        const result = await context.organization.update({
          id: sessionWithRoles.organization.id,
          ...request.body,
        })
        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      name: 'deleteOrganization',
      description: 'Delete organization',
      method: 'DELETE',
      path: '/:id' as const,
      use: [OrganizationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        await context.organization.delete(request.params)
        return response.success(null)
      },
    }),

    getBySlug: igniter.query({
      name: 'getOrganizationBySlug',
      description: 'Get organization by slug',
      method: 'GET',
      path: '/public/:slug' as const,
      use: [OrganizationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        const organization = await context.organization.getBySlug({
          slug: request.params.slug,
        })

        if (!organization) {
          return response.notFound('Organization not found')
        }

        return response.success(organization)
      },
    }),
  },
})
