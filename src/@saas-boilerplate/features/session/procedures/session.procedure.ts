import { igniter } from '@/igniter'

export const SessionFeatureProcedure = igniter.procedure({
  name: 'SessionFeatureProcedure',
  handler: (_, { context, request }) => ({
    session: {
      async findMany() {
        return context.services.auth.api.listSessions({
          headers: request.headers,
        })
      },
      async revoke(token: string) {
        if (!token) {
          throw new Error('Session token is required to revoke a session')
        }

        return context.services.auth.api.revokeSession({
          headers: request.headers,
          body: {
            token,
          },
        })
      },
    },
  }),
})
