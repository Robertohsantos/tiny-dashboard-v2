import { igniter } from '@/igniter'
import type {
  Account,
  LinkAccountDTO,
  LinkAccountResponse,
  UnlinkAccountDTO,
} from '../account.interface'

export const AccountFeatureProcedure = igniter.procedure({
  name: 'AccountFeatureProcedure',
  handler: (_, { context, request }) => {
    return {
      account: {
        findManyByCurrentUser: async (): Promise<Account[]> => {
          const accounts = await context.services.auth.api.listUserAccounts({
            headers: request.headers,
          })

          // Map API response to Account type
          return accounts.map((account) => ({
            id: account.id,
            provider: account.providerId || 'unknown',
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            accountId: account.accountId,
          }))
        },

        link: async (input: LinkAccountDTO): Promise<LinkAccountResponse> => {
          const account = await context.services.auth.api.linkSocialAccount({
            headers: request.headers,
            body: {
              provider: input.provider,
              callbackURL: input.callbackURL,
            },
          })

          return account
        },

        unlink: async (input: UnlinkAccountDTO): Promise<void> => {
          await context.services.auth.api.unlinkAccount({
            headers: request.headers,
            body: {
              providerId: input.provider,
            },
          })
        },
      },
    }
  },
})
