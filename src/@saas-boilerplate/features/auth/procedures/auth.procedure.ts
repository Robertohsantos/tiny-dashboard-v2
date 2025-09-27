import { igniter } from '@/igniter'
import { Url } from '@/@saas-boilerplate/utils/url'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { z } from 'zod'

import type {
  AppSession,
  AuthRequirements,
  GetSessionInput,
  OrganizationMembershipRole,
  Session,
  SessionActiveOrganization,
  SendVerificationOTPInput,
  SignInInput,
} from '../auth.interface'
import { parseMetadata } from '@/modules/core/utils/parse-metadata'
import type { OrganizationMetadata } from '../../organization'
import type { UserMetadata } from '../../user'
import type { Customer } from '@/@saas-boilerplate/providers/payment'

const EMPTY_ORGANIZATION_METADATA: OrganizationMetadata = {}
const EMPTY_USER_METADATA: UserMetadata = {}

type MetadataCandidate = Record<string, unknown> | string | null | undefined

const organizationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().optional(),
  slug: z.string().optional(),
  logo: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
  members: z.array(z.unknown()).optional(),
  invitations: z.array(z.unknown()).optional(),
  customer: z.unknown().optional(),
})

const customerSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    providerId: z.string().optional(),
    organizationId: z.union([z.string(), z.number()]),
    name: z.string().optional(),
    email: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough()

type ParsedCustomer = z.infer<typeof customerSchema>

const normalizeCustomer = (
  input: ParsedCustomer,
  fallbackName: string,
  fallbackEmail: string,
): SessionActiveOrganization['customer'] => ({
  id: String(input.id),
  providerId: input.providerId ?? 'unknown',
  organizationId: String(input.organizationId),
  name: input.name ?? fallbackName,
  email: input.email ?? fallbackEmail,
  metadata: input.metadata ?? {},
  createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
  updatedAt: input.updatedAt ? new Date(input.updatedAt) : undefined,
})

const toSessionCustomer = (
  customer: Customer,
): SessionActiveOrganization['customer'] => ({
  ...customer,
  metadata: customer.metadata ?? {},
})

export const AuthFeatureProcedure = igniter.procedure({
  name: 'AuthFeatureProcedure',
  handler: (options, { request, response, context }) => {
    return {
      auth: {
        setActiveOrganization: async (input: { organizationId: string }) => {
          await tryCatch(
            context.services.auth.api.setActiveOrganization({
              body: input,
              headers: request.headers,
            }),
          )
        },

        listSession: async () => {
          return tryCatch(
            context.services.auth.api.listSessions({
              headers: request.headers,
            }),
          )
        },

        signInWithProvider: async (input: SignInInput) => {
          const response = await tryCatch(
            context.services.auth.api.signInSocial({
              headers: request.headers,
              body: {
                provider: input.provider,
                callbackURL: Url.get('/app'),
                newUserCallbackURL: Url.get('/app/get-started'),
                errorCallbackURL: Url.get('/auth?error=true'),
              },
            }),
          )

          if (response.error) {
            console.error(response.error.message, {
              input,
              response,
            })

            return {
              error: {
                code: 'ERR_BAD_REQUEST',
                message: response.error.message,
              },
            }
          }

          return {
            data: {
              redirect: true,
              url: response.data.url,
            },
          }
        },

        signInWithOTP: async (input: { email: string; otpCode: string }) => {
          const response = await tryCatch(
            context.services.auth.api.signInEmailOTP({
              headers: request.headers,
              body: {
                email: input.email,
                otp: input.otpCode,
              },
            }),
          )

          if (response.error) {
            console.error(response.error.message, {
              input,
              response,
            })

            return {
              error: {
                code: 'ERR_BAD_REQUEST',
                message: response.error.message,
              },
            }
          }

          return {
            data: {
              success: true,
            },
          }
        },

        sendOTPVerificationCode: async (input: SendVerificationOTPInput) => {
          const response = await tryCatch(
            context.services.auth.api.sendVerificationOTP({
              headers: request.headers,
              body: input,
            }),
          )

          if (response.error) {
            return {
              error: {
                code: 'ERR_BAD_REQUEST',
                message: response.error.message,
              },
            }
          }

          return {
            data: {
              success: true,
            },
          }
        },

        signOut: async () => {
          await tryCatch(
            context.services.auth.api.signOut({
              headers: request.headers,
            }),
          )
        },

        getSession: async <
          TRequirements extends AuthRequirements | undefined = undefined,
          TRoles extends OrganizationMembershipRole[] | undefined = undefined,
        >(
          options?: GetSessionInput<TRequirements, TRoles>,
        ): Promise<AppSession<TRequirements, TRoles>> => {
          const session = await context.services.auth.api.getSession({
            headers: request.headers,
          })

          // Check for API Key authentication if no session exists
          let apiKeyOrganization: unknown = null
          if (!session) {
            const authHeader = request.headers.get('Authorization')

            if (authHeader && authHeader.startsWith('Bearer ')) {
              const token = authHeader.substring(7) // Remove 'Bearer ' prefix

              // Validate API Key
              const apiKey = await context.services.database.apiKey.findUnique({
                where: {
                  key: token,
                  enabled: true,
                },
                include: {
                  organization: true,
                },
              })

              if (apiKey) {
                // Check if API key is expired
                if (
                  !apiKey.neverExpires &&
                  apiKey.expiresAt &&
                  new Date() > apiKey.expiresAt
                ) {
                  throw new Error('API_KEY_EXPIRED')
                }

                // For API Key authentication, we only allow access to endpoints with roles (organization endpoints)
                if (!options?.roles || options.roles.length === 0) {
                  throw new Error('API_KEY_REQUIRES_ORGANIZATION_ENDPOINT')
                }

                apiKeyOrganization = apiKey.organization
              }
            }
          }

          // Handle unauthenticated requirement
          if (options?.requirements === 'unauthenticated') {
            if (session || apiKeyOrganization) {
              throw new Error('ALREADY_AUTHENTICATED')
            }
            return null as AppSession<TRequirements, TRoles>
          }

          // Handle authenticated requirement
          if (
            options?.requirements === 'authenticated' &&
            !session &&
            !apiKeyOrganization
          ) {
            throw new Error('UNAUTHORIZED')
          }

          // If no session and no API key organization, return null
          if (!session && !apiKeyOrganization) {
            return null as AppSession<TRequirements, TRoles>
          }

          // Handle API Key authentication
          if (apiKeyOrganization && !session) {
            const parsedApiKeyOrganization =
              organizationSchema.safeParse(apiKeyOrganization)

            if (!parsedApiKeyOrganization.success) {
              throw new Error('API_KEY_ORGANIZATION_PARSE_FAILED')
            }

            const parsedOrganization = parsedApiKeyOrganization.data
            const now = new Date()
            const organizationId = String(
              parsedOrganization.id ?? `api-key-${Date.now()}`,
            )
            const organizationName =
              typeof parsedOrganization.name === 'string'
                ? parsedOrganization.name
                : 'API Key Organization'
            const organizationSlug =
              typeof parsedOrganization.slug === 'string'
                ? parsedOrganization.slug
                : 'api-key'
            const organizationLogo =
              typeof parsedOrganization.logo === 'string'
                ? parsedOrganization.logo
                : null

            const metadata = parseMetadata<OrganizationMetadata>(
              parsedOrganization.metadata as MetadataCandidate,
              EMPTY_ORGANIZATION_METADATA,
            )

            const billingRecord =
              await context.services.payment.getCustomerById(organizationId)

            const fallbackCustomer: SessionActiveOrganization['customer'] =
              billingRecord
                ? toSessionCustomer(billingRecord)
                : {
                    id: `api-key-${organizationId}`,
                    providerId: 'api-key',
                    organizationId,
                    name: organizationName,
                    email: 'api-key@local',
                    metadata: {},
                    createdAt: now,
                    updatedAt: now,
                  }

            const members = Array.isArray(parsedOrganization.members)
              ? (parsedOrganization.members as SessionActiveOrganization['members'])
              : []

            const invitations = Array.isArray(parsedOrganization.invitations)
              ? (parsedOrganization.invitations as SessionActiveOrganization['invitations'])
              : []

            const organizationForSession: SessionActiveOrganization = {
              id: organizationId,
              name: organizationName,
              slug: organizationSlug,
              logo: organizationLogo,
              metadata,
              members,
              invitations,
              customer: fallbackCustomer,
              billing: fallbackCustomer,
            }

            return {
              user: null,
              organization: organizationForSession,
            } as AppSession<TRequirements, TRoles>
          }

          // Handle regular session authentication
          if (!session) {
            return null as AppSession<TRequirements, TRoles>
          }

          if (!session.user) {
            throw new Error('USER_NOT_FOUND')
          }

          const databaseUser = await context.services.database.user.findUnique({
            where: { id: session.user.id },
          })

          if (!databaseUser) {
            throw new Error('USER_NOT_FOUND')
          }

          const sessionUser: Session['user'] = {
            ...session.user,
            id: databaseUser.id,
            name: databaseUser.name ?? session.user.name ?? 'Unknown User',
            email: databaseUser.email,
            emailVerified: Boolean(databaseUser.emailVerified),
            image: databaseUser.image,
            createdAt: databaseUser.createdAt,
            updatedAt: databaseUser.updatedAt,
            role: databaseUser.role,
            metadata: parseMetadata<UserMetadata>(
              databaseUser.metadata as MetadataCandidate,
              EMPTY_USER_METADATA,
            ),
          }

          const { user: _rawSessionUser, ...sessionRest } = session

          let organization =
            await context.services.auth.api.getFullOrganization({
              headers: request.headers,
            })

          if (!organization) {
            const userOrganizations =
              await context.services.auth.api.listOrganizations({
                headers: request.headers,
              })

            if (userOrganizations.length > 0) {
              await context.services.auth.api.setActiveOrganization({
                body: { organizationId: userOrganizations[0].id },
                headers: request.headers,
              })

              organization =
                await context.services.auth.api.getFullOrganization({
                  query: { organizationId: userOrganizations[0].id },
                  headers: request.headers,
                })
            }
          }

          // Get active membership
          const membership = await context.services.auth.api.getActiveMember({
            headers: request.headers,
          })

          // Validate roles if specified (only for regular session authentication)
          if (options?.roles && options.roles.length > 0 && session) {
            if (!organization || !membership) {
              throw new Error('NO_ORGANIZATION_ACCESS')
            }

            if (
              !options.roles.includes(
                membership.role as OrganizationMembershipRole,
              )
            ) {
              throw new Error('INSUFFICIENT_PERMISSIONS')
            }
          }

          // If roles are required but no organization, throw error (only for regular session)
          if (
            options?.roles &&
            options.roles.length > 0 &&
            !organization &&
            session
          ) {
            throw new Error('NO_ORGANIZATION_ACCESS')
          }

          if (!organization) {
            const sessionWithoutOrganization = {
              ...sessionRest,
              user: sessionUser,
              organization: undefined,
            } as unknown as Session<TRoles>

            return sessionWithoutOrganization as AppSession<
              TRequirements,
              TRoles
            >
          }

          const parsedOrganization = organizationSchema.safeParse(organization)

          if (!parsedOrganization.success) {
            throw new Error('ORGANIZATION_PARSE_FAILED')
          }

          const organizationData = parsedOrganization.data

          const organizationMetadata = parseMetadata<OrganizationMetadata>(
            organizationData.metadata as MetadataCandidate,
            EMPTY_ORGANIZATION_METADATA,
          )

          const organizationBilling =
            await context.services.payment.getCustomerById(
              String(organizationData.id),
            )

          const fallbackBilling: SessionActiveOrganization['billing'] =
            organizationBilling
              ? toSessionCustomer(organizationBilling)
              : {
                  id: `org-${organizationData.id}-billing`,
                  providerId: 'internal',
                  organizationId: String(organizationData.id),
                  name: organizationData.name ?? sessionUser.name,
                  email: sessionUser.email,
                  metadata: {} as Record<string, unknown>,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }

          const parsedCustomer = customerSchema.safeParse(
            organizationData.customer,
          )

          const sessionCustomer: SessionActiveOrganization['customer'] =
            parsedCustomer.success
              ? normalizeCustomer(
                  parsedCustomer.data,
                  organizationData.name ?? sessionUser.name,
                  sessionUser.email,
                )
              : fallbackBilling

          const sessionOrganization = {
            id: String(organizationData.id),
            name: organizationData.name ?? sessionUser.name,
            slug: organizationData.slug ?? String(organizationData.id),
            logo: organizationData.logo ?? null,
            metadata: organizationMetadata,
            members: Array.isArray(organizationData.members)
              ? (organizationData.members as SessionActiveOrganization['members'])
              : [],
            invitations: Array.isArray(organizationData.invitations)
              ? (organizationData.invitations as SessionActiveOrganization['invitations'])
              : [],
            customer: sessionCustomer,
            billing: fallbackBilling,
          } satisfies SessionActiveOrganization

          const sessionWithOrganization = {
            ...sessionRest,
            user: sessionUser,
            organization: sessionOrganization,
          } as unknown as Session<TRoles>

          return sessionWithOrganization as AppSession<
            TRequirements,
            TRoles
          >
        },
      },
    }
  },
})
