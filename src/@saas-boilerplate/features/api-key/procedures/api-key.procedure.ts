import { igniter } from '@/igniter'
import type {
  ApiKey,
  CreateApiKeyDTO,
  UpdateApiKeyDTO,
} from '../api-key.interface'
import crypto from 'node:crypto'

export const ApiKeyFeatureProcedure = igniter.procedure({
  name: 'ApiKeyFeatureProcedure',
  handler: (_, { context }) => {
    return {
      apikey: {
        findManyByOrganization: async (
          organizationId: string,
        ): Promise<ApiKey[]> => {
          return context.services.database.apiKey.findMany({
            where: {
              organizationId,
            },
          })
        },

        findOne: async (params: {
          id: string
          organizationId?: string
        }): Promise<ApiKey | null> => {
          return context.services.database.apiKey.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
          })
        },

        create: async (input: CreateApiKeyDTO): Promise<ApiKey> => {
          // Generate a secure API key with prefix
          const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`

          return context.services.database.apiKey.create({
            data: {
              description: input.description,
              key: apiKey,
              enabled: true,
              neverExpires: input.neverExpires ?? true,
              expiresAt: input.expiresAt,
              organizationId: input.organizationId,
            },
          })
        },

        update: async (params: UpdateApiKeyDTO): Promise<ApiKey> => {
          const apikey = await context.services.database.apiKey.findUnique({
            where: { id: params.id },
          })

          if (!apikey) throw new Error('ApiKey not found')

          return context.services.database.apiKey.update({
            where: { id: params.id },
            data: {
              description: params.description,
              enabled: params.enabled,
            },
          })
        },

        delete: async (params: {
          id: string
          organizationId?: string
        }): Promise<void> => {
          await context.services.database.apiKey.delete({
            where: { id: params.id, organizationId: params.organizationId },
          })
        },
      },
    }
  },
})
