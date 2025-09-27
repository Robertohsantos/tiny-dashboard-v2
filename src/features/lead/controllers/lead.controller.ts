import { igniter } from '@/igniter'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth/procedures/auth.procedure'
import {
  LeadCreationSchema,
  LeadUpdateSchema,
  LeadQuerySchema,
  type Lead,
} from '../lead.interface'
import { LeadProcedure } from '../procedures/lead.procedure'
import { IntegrationFeatureProcedure } from '@/@saas-boilerplate/features/integration'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'

const toLeadEventPayload = (lead: Lead): Record<string, unknown> => ({
  id: lead.id,
  email: lead.email,
  name: lead.name,
  phone: lead.phone,
  metadata: lead.metadata ?? null,
  createdAt: lead.createdAt.toISOString(),
  updatedAt: lead.updatedAt.toISOString(),
  organizationId: lead.organizationId,
})

export const LeadController = igniter.controller({
  name: 'lead',
  path: '/leads',
  description: 'Manage customer leads.',
  actions: {
    list: igniter.query({
      name: 'List',
      description: 'List all leads for an organization.',
      path: '/',
      use: [AuthFeatureProcedure(), LeadProcedure()],
      query: LeadQuerySchema,
      handler: async ({ context, response }) => {
        // Authentication: Retrieve the authenticated user's ID and organization ID from the session.
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        // Business Rule: If no active session or organization, return unauthorized.
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Observation: Extract organization ID from authenticated session.
        const organizationId = session.organization.id

        // Business Logic: Retrieve leads using the LeadRepository.
        const leads = await context.lead.findMany(organizationId)

        // Response: Return the list of leads with a 200 status.
        return response.success(leads)
      },
    }),

    create: igniter.mutation({
      name: 'Create',
      description: 'Create a new lead.',
      path: '/',
      method: 'POST',
      use: [
        AuthFeatureProcedure(),
        LeadProcedure(),
        IntegrationFeatureProcedure(),
      ],
      body: LeadCreationSchema,
      handler: async ({ context, request, response }) => {
        // Authentication: Retrieve the authenticated user's ID and organization ID from the session.
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        // Business Rule: If no active session or organization, return unauthorized.
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Observation: Extract organization ID from authenticated session.
        const organizationId = session.organization.id

        // Observation: Extract lead details from the request body.
        const { email, name, phone, metadata } = request.body

        // Business Logic: Create a new lead using the LeadRepository.
        const lead = await context.lead.create(organizationId, {
          email,
          name,
          phone,
          metadata,
        })

        // Business Logic: After creating the lead, trigger events for installed plugins.
        const plugins =
          await context.integration.setupPluginsForOrganization(organizationId)

        for (const pluginKey in plugins) {
          const plugin = plugins[pluginKey as keyof typeof plugins]

          if (plugin && 'sendEvent' in plugin) {
            const result = await tryCatch(
              plugin.sendEvent({
                event: 'lead.created',
                data: toLeadEventPayload(lead),
              }),
            )

            igniter.logger.error(
              result.error ? result.error.message : 'Unknown error',
            )
          }
        }

        // Response: Return the newly created lead with a 201 status and trigger real-time updates.
        return response.revalidate(['notification.list']).created(lead)
      },
    }),

    retrieve: igniter.query({
      name: 'Retrieve',
      description: 'Retrieve a single lead by ID.',
      path: '/:id' as const,
      use: [AuthFeatureProcedure(), LeadProcedure()],
      handler: async ({ context, request, response }) => {
        // Authentication: Retrieve the authenticated user's ID and organization ID from the session.
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        // Business Rule: If no active session or organization, return unauthorized.
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Observation: Extract lead ID from request parameters.
        const { id } = request.params

        // Observation: Extract organization ID from authenticated session.
        const organizationId = session.organization.id

        // Business Logic: Retrieve the lead using the LeadRepository.
        const lead = await context.lead.findUnique(id, organizationId)

        // Business Rule: If the lead is not found, return a 404 Not Found response.
        if (!lead) {
          return response.notFound('Lead not found.')
        }

        // Response: Return the retrieved lead with a 200 status.
        return response.success(lead)
      },
    }),

    update: igniter.mutation({
      name: 'Update',
      description: 'Update an existing lead by ID.',
      path: '/:id' as const,
      method: 'PATCH',
      use: [AuthFeatureProcedure(), LeadProcedure()],
      body: LeadUpdateSchema,
      handler: async ({ context, request, response }) => {
        // Authentication: Retrieve the authenticated user's ID and organization ID from the session.
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        // Business Rule: If no active session or organization, return unauthorized.
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Observation: Extract lead ID from request parameters.
        const { id } = request.params

        // Observation: Extract organization ID from authenticated session.
        const organizationId = session.organization.id

        // Observation: Extract updated lead details from the request body.
        const { email, name, phone, metadata } = request.body

        // Business Logic: Update the lead using the LeadRepository.
        const updatedLead = await context.lead.update(id, organizationId, {
          email,
          name,
          phone,
          metadata,
        })

        // Response: Return the updated lead with a 200 status.
        return response.success(updatedLead)
      },
    }),

    delete: igniter.mutation({
      name: 'Delete',
      description: 'Delete a lead by ID.',
      path: '/:id' as const,
      method: 'DELETE',
      use: [AuthFeatureProcedure(), LeadProcedure()],
      handler: async ({ context, request, response }) => {
        // Authentication: Retrieve the authenticated user's ID and organization ID from the session.
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        // Business Rule: If no active session or organization, return unauthorized.
        if (!session || !session.organization) {
          return response.unauthorized(
            'Authentication required and active organization needed.',
          )
        }

        // Observation: Extract lead ID from request parameters.
        const { id } = request.params

        // Observation: Extract organization ID from authenticated session.
        const organizationId = session.organization.id

        // Business Logic: Delete the lead using the LeadRepository.
        await context.lead.delete(id, organizationId)

        // Response: Return a 204 No Content status after successful deletion.
        return response.noContent()
      },
    }),
  },
})
