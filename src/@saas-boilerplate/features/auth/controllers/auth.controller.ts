import { z } from 'zod'
import { igniter } from '@/igniter'
import { AuthFeatureProcedure } from '../procedures/auth.procedure'
import type { AccountProvider } from '../../account'

export const AuthController = igniter.controller({
  name: 'Authentication',
  description: 'Authentication management',
  path: '/auth',
  actions: {
    getActiveSocialProvider: igniter.query({
      name: 'getActiveSocialProvider',
      description: 'List available providers',
      method: 'GET',
      path: '/social-provider',
      use: [AuthFeatureProcedure()],
      handler: ({ response }) => {
        return response.success(['google', 'github'])
      },
    }),

    signInWithProvider: igniter.mutation({
      name: 'signInWithProvider',
      description: 'Sign in with OAuth provider',
      method: 'POST',
      path: '/sign-in',
      use: [AuthFeatureProcedure()],
      body: z.object({
        provider: z.string(),
        callbackURL: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.auth.signInWithProvider({
          provider: request.body.provider as AccountProvider,
          callbackURL: request.body.callbackURL,
        })

        if (result.error) {
          throw new Error(result.error.code)
        }

        return response.success(result.data)
      },
    }),

    signInWithOTP: igniter.mutation({
      name: 'signInWithOtp',
      description: 'Sign in with OTP code',
      method: 'POST',
      path: '/sign-in/otp',
      use: [AuthFeatureProcedure()],
      body: z.object({
        email: z.string(),
        otpCode: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        const result = await context.auth.signInWithOTP(request.body)

        if (result.error) {
          return response.badRequest(result.error.message)
        }

        return response.success(result.data)
      },
    }),

    sendOTPVerificationCode: igniter.mutation({
      name: 'sendOtpCode',
      description: 'Send OTP verification code',
      method: 'POST',
      path: '/send-otp-verification',
      use: [AuthFeatureProcedure()],
      body: z.object({
        email: z.string(),
        type: z.enum(['sign-in', 'email-verification', 'forget-password']),
      }),
      handler: async ({ request, response, context }) => {
        await context.auth.sendOTPVerificationCode(request.body)
        return response.success({ email: request.body.email })
      },
    }),

    signOut: igniter.mutation({
      name: 'signOut',
      description: 'Sign out current user',
      method: 'POST',
      path: '/sign-out',
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        await context.auth.signOut()
        return response.success({ callbackURL: '/' })
      },
    }),

    getSession: igniter.query({
      name: 'getCurrentSession',
      description: 'Get current user session',
      method: 'GET',
      path: '/session',
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        try {
          // Business Rule: Get session without requiring roles first (for new users without organization)
          const result = await context.auth.getSession({
            requirements: 'authenticated',
          })
          return response.success(result)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'

          switch (errorMessage) {
            case 'UNAUTHORIZED':
              return response.unauthorized('Authentication required')
            case 'INSUFFICIENT_PERMISSIONS':
              return response.forbidden(
                'Insufficient permissions for this organization',
              )
            case 'NO_ORGANIZATION_ACCESS':
              return response.forbidden('Organization access required')
            case 'USER_NOT_FOUND':
              return response.unauthorized('User not found')
            case 'ALREADY_AUTHENTICATED':
              return response.badRequest('User is already authenticated')
            default:
              return response.badRequest('Failed to retrieve session')
          }
        }
      },
    }),

    setActiveOrganization: igniter.mutation({
      name: 'setActiveOrganization',
      description: 'Set active organization',
      method: 'POST',
      path: '/set-active-organization',
      use: [AuthFeatureProcedure()],
      body: z.object({
        organizationId: z.string(),
      }),
      handler: async ({ request, response, context }) => {
        await context.auth.setActiveOrganization(request.body)
        return response.success({
          organizationId: request.body.organizationId,
        })
      },
    }),
  },
})
