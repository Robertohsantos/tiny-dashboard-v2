import { igniter } from '@/igniter'
import {
  type User,
  type UpdateUserDTO,
  UserMetadataSchema,
} from '../user.interface'
import { updateMetadataSafe } from '@/modules/core/services/metadata'

export const UserFeatureProcedure = igniter.procedure({
  name: 'UserFeatureProcedure',
  handler: (_, { context, request }) => {
    return {
      user: {
        listMemberships: () => {
          return context.services.auth.api.listOrganizations({
            headers: request.headers,
          })
        },

        update: async (params: UpdateUserDTO): Promise<User> => {
          const user = await context.services.database.user.findUnique({
            where: { id: params.id },
          })

          if (!user) throw new Error('User not found')

          if (params.metadata) {
            const res = await updateMetadataSafe('user', {
              field: 'metadata',
              where: { id: user.id },
              data: params.metadata,
              schema: UserMetadataSchema,
            })

            if (!res.success) {
              console.error(res.error)
              throw new Error(res.error?.message)
            }
          }

          // @ts-expect-error - metadata is not required
          return context.services.database.user.update({
            where: { id: params.id },
            data: {
              name: params.name,
              image: params.image,
            },
          })
        },

        delete: async (params: { id: string }): Promise<{ id: string }> => {
          await context.services.database.user.delete({
            where: { id: params.id },
          })

          return { id: params.id }
        },
      },
    }
  },
})
