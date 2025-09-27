import { betterAuth } from 'better-auth'
import { emailOTP, organization, twoFactor } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'

import type { Prettify } from '@igniter-js/core'

import type { Invitation } from '@/@saas-boilerplate/features/invitation/invitation.interface'
import type { Membership } from '@/@saas-boilerplate/features/membership'
import type { Organization } from '@/@saas-boilerplate/features/organization'
import { AppConfig } from '@/config/boilerplate.config.server'
import { Url } from '@/@saas-boilerplate/utils/url'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { mail } from '@/modules/core/services/mail'
import { prisma } from '@/modules/core/services/prisma'

export const auth = betterAuth({
  baseURL: Url.get(),
  secret: AppConfig.providers.auth.secret,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  socialProviders: {
    github: {
      clientId: AppConfig.providers.auth.providers.github.clientId,
      clientSecret: AppConfig.providers.auth.providers.github.clientSecret,
    },
    google: {
      clientId: AppConfig.providers.auth.providers.google.clientId,
      clientSecret: AppConfig.providers.auth.providers.google.clientSecret,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  plugins: [
    twoFactor(),
    organization({
      sendInvitationEmail: async ({ email, organization, id }) => {
        await mail.send({
          to: email,
          template: 'organization-invite',
          data: {
            email,
            organization: organization.name,
            url: Url.get('/auth?invitation=' + id),
          },
        })
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subjectMap = {
          'sign-in': 'Your Access Code',
          'email-verification': 'Verify Your Email',
          'forget-password': 'Password Recovery',
          default: 'Verification Code',
        }

        const subject = subjectMap[type] || subjectMap.default

        console.log({
          to: email,
          subject,
          template: 'otp-code',
          data: {
            email,
            otpCode: otp,
            expiresInMinutes: 10,
          },
        })

        await delay(5000)

        await mail.send({
          to: email,
          subject,
          template: 'otp-code',
          data: {
            email,
            otpCode: otp,
            expiresInMinutes: 10,
          },
        })
      },
    }),
    nextCookies(),
  ],
})

export type AuthSession = typeof auth.$Infer.Session
export type AuthOrganization = Prettify<
  Organization & {
    members: Prettify<
      Membership & {
        user: {
          id: string
          name: string
          email: string
          image?: string | null
        }
      }
    >[]
    invitations: Invitation[]
  }
>
