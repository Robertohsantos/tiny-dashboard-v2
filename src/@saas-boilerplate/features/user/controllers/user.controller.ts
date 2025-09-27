import { z } from 'zod'
import { igniter } from '@/igniter'
import { UserFeatureProcedure } from '../procedures/user.procedure'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth/procedures/auth.procedure'
import { UserMetadataSchema } from '../user.interface'

export const UserController = igniter.controller({
  name: 'User',
  description:
    'User profile management including memberships and account updates',
  path: '/user',
  actions: {
    listMemberships: igniter.query({
      name: 'listUserMemberships',
      description: 'List user memberships',
      method: 'GET',
      path: '/memberships',
      use: [UserFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        await context.auth.getSession({ requirements: 'authenticated' })
        const result = await context.user.listMemberships()
        return response.success(result)
      },
    }),

    update: igniter.mutation({
      name: 'updateUser',
      description: 'Update user profile',
      method: 'PUT',
      path: '/' as const,
      use: [UserFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        name: z.string().optional(),
        image: z.string().optional(),
        metadata: UserMetadataSchema.optional(),
      }),
      handler: async ({ request, response, context }) => {
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session || !session.user) {
          return response.unauthorized('Authentication required')
        }

        const result = await context.user.update({
          id: session.user.id,
          metadata: request.body.metadata,
          name: request.body.name,
          image: request.body.image,
        })

        return response.success(result)
      },
    }),

    delete: igniter.mutation({
      name: 'deleteUser',
      description: 'Delete user account',
      method: 'DELETE',
      path: '/:id' as const,
      use: [UserFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        await context.user.delete(request.params)
        return response.success(null)
      },
    }),
  },
})
