import { z } from 'zod'
import { igniter } from '@/igniter'
import { SessionFeatureProcedure } from '../procedures/session.procedure'

export const SessionController = igniter.controller({
  name: 'Session',
  description:
    'User session management including active session tracking and token revocation',
  path: '/session',
  actions: {
    findManyByCurrentUser: igniter.query({
      name: 'listUserSessions',
      description: 'List user sessions',
      method: 'GET',
      path: '/',
      use: [SessionFeatureProcedure()],
      handler: async ({ response, context }) => {
        const result = await context.session.findMany()
        return response.success(result)
      },
    }),

    revoke: igniter.mutation({
      name: 'revokeSession',
      description: 'Revoke user session',
      method: 'DELETE',
      path: '/revoke' as const,
      use: [SessionFeatureProcedure()],
      body: z.object({
        token: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.session.revoke(request.body.token)
        return response.success(result)
      },
    }),
  },
})
