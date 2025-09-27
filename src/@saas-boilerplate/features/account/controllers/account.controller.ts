import { z } from 'zod'
import { igniter } from '@/igniter'
import { AccountFeatureProcedure } from '../procedures/account.procedure'
import { AccountProvider } from '../account.interface'

export const AccountController = igniter.controller({
  name: 'Accounts',
  description: 'Account management',
  path: '/account',
  actions: {
    findManyByCurrentUser: igniter.query({
      name: 'listUserAccounts',
      description: 'List user linked accounts',
      method: 'GET',
      path: '/',
      use: [AccountFeatureProcedure()],
      handler: async ({ response, context }) => {
        const result = await context.account.findManyByCurrentUser()
        return response.success(result)
      },
    }),

    link: igniter.mutation({
      name: 'linkAccount',
      description: 'Link external account',
      method: 'POST',
      path: '/',
      use: [AccountFeatureProcedure()],
      body: z.object({
        provider: z.string(),
        callbackURL: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.account.link({
          provider: request.body.provider as AccountProvider,
          callbackURL: request.body.callbackURL,
        })

        return response.success(result)
      },
    }),

    unlink: igniter.mutation({
      name: 'unlinkAccount',
      description: 'Unlink external account',
      method: 'DELETE',
      path: '/' as const,
      use: [AccountFeatureProcedure()],
      body: z.object({
        provider: z.custom<AccountProvider>(),
      }),
      handler: async ({ request, response, context }) => {
        await context.account.unlink(request.body)
        return response.success()
      },
    }),
  },
})
