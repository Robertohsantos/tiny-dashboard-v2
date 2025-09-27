import { igniter } from '@/igniter'
import { CreateLeadBody, Lead, UpdateLeadBody } from '../lead.interface'
import { parseMetadata } from '@/modules/core/utils/parse-metadata'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const mapLeadRecord = (lead: {
  id: string
  email: string
  name: string | null
  phone: string | null
  metadata: unknown
  createdAt: Date
  updatedAt: Date
  organizationId: string
}): Lead => {
  const { id, email, name, phone, metadata, createdAt, updatedAt, organizationId } = lead

  const metadataValue =
    typeof metadata === 'string' || isRecord(metadata)
      ? parseMetadata<Record<string, unknown>>(metadata)
      : null

  return {
    id,
    email,
    name,
    phone,
    createdAt,
    updatedAt,
    organizationId,
    metadata: metadataValue,
  }
}

/**
 * @const LeadProcedure
 * @description Igniter.js procedure to inject an instance of LeadRepository into the context under a hierarchical structure.
 * This creates a consistent pattern: context.{featureName}.{resourceType}.{resourceName}
 * @returns {LeadContext} An object containing the lead repository in hierarchical structure.
 */
export const LeadProcedure = igniter.procedure({
  name: 'LeadProcedure',
  handler: (_, { context }) => {
    // Context Extension: Return the repository instance in hierarchical structure for consistency.
    return {
      lead: {
        findMany: async (organizationId: string): Promise<Lead[]> => {
          const leads = await context.services.database.lead.findMany({
            where: {
              organizationId: organizationId,
            },
          })

          return leads.map((lead) => mapLeadRecord(lead))
        },
        findUnique: async (
          id: string,
          organizationId: string,
        ): Promise<Lead | null> => {
          const lead = await context.services.database.lead.findUnique({
            where: {
              id: id,
              organizationId: organizationId,
            },
          })

          if (!lead) return null

          return mapLeadRecord(lead)
        },
        create: async (
          organizationId: string,
          data: CreateLeadBody,
        ): Promise<Lead> => {
          const lead = await context.services.database.lead.create({
            data: {
              ...data,
              organizationId: organizationId,
            },
          })

          await context.services.notification.send({
            type: 'LEAD_CREATED',
            context: {
              organizationId: organizationId,
            },
            data: {
              leadName: lead.name,
              leadEmail: lead.email,
              source: data.metadata?.source,
            },
          })

          return mapLeadRecord(lead)
        },
        update: async (
          id: string,
          organizationId: string,
          data: UpdateLeadBody,
        ): Promise<Lead> => {
          const leadAlreadyExists =
            await context.services.database.lead.findUnique({
              where: {
                id: id,
                organizationId: organizationId,
              },
            })

          if (!leadAlreadyExists) {
            throw new Error('Lead not found')
          }

          const lead = await context.services.database.lead.update({
            where: {
              id: id,
              organizationId: organizationId,
            },
            data: data,
          })

          await context.services.notification.send({
            type: 'LEAD_UPDATED',
            context: {
              organizationId: organizationId,
            },
            data: {
              leadName: lead.name,
              leadEmail: lead.email,
              changes: Object.keys(data).map(
                (key) => `${key}: ${data[key as keyof UpdateLeadBody]}`,
              ),
            },
          })

          return mapLeadRecord(lead)
        },
        delete: async (id: string, organizationId: string): Promise<Lead> => {
          const lead = await context.services.database.lead.delete({
            where: {
              id: id,
              organizationId: organizationId,
            },
          })

          await context.services.notification.send({
            type: 'LEAD_DELETED',
            context: {
              organizationId: lead.organizationId,
            },
            data: {
              leadId: lead.id,
              leadEmail: lead.email,
            },
          })

          return mapLeadRecord(lead)
        },
      },
    }
  },
})
