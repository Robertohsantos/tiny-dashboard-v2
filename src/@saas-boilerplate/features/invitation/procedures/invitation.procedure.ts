import { igniter } from '@/igniter'
import { z } from 'zod'
import type { Invitation, CreateInvitationDTO } from '../invitation.interface'
import { InvitationError } from '../invitation.interface'
import { Url } from '@/@saas-boilerplate/utils/url'

type AuthApiErrorShape = {
  code?: string
  message?: string
  status?: number
}

const RoleSchema = z.enum(['owner', 'admin', 'member'])
const InvitationStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'canceled',
])

const coerceDate = z.preprocess((value) => {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return value
}, z.date())

const RawInvitationSchema = z
  .object({
    id: z.string(),
    status: InvitationStatusSchema,
    organizationId: z.string(),
    email: z.string().email(),
    role: RoleSchema.nullable().optional(),
    inviterId: z.string(),
    memberId: z.string().nullable().optional(),
    teamId: z.string().nullable().optional(),
    expiresAt: coerceDate,
    createdAt: coerceDate.optional(),
    updatedAt: coerceDate.optional(),
  })
  .passthrough()

type RawInvitation = z.infer<typeof RawInvitationSchema>

const MemberSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    userId: z.string(),
    role: RoleSchema.nullable().optional(),
    createdAt: coerceDate,
    updatedAt: coerceDate.optional(),
    teamId: z.string().nullable().optional(),
  })
  .passthrough()

const AcceptInvitationResponseSchema = z
  .object({
    invitation: RawInvitationSchema,
    member: MemberSchema,
  })
  .passthrough()

type AcceptInvitationResponse = z.infer<typeof AcceptInvitationResponseSchema>

const mapInvitation = (input: RawInvitation): Invitation => ({
  id: input.id,
  status: input.status,
  organizationId: input.organizationId,
  email: input.email,
  role: input.role ?? null,
  inviterId: input.inviterId,
  inviterMembershipId: input.memberId ?? null,
  expiresAt: input.expiresAt,
  memberId: input.memberId ?? null,
  teamId: input.teamId ?? null,
  createdAt: input.createdAt,
  updatedAt: input.updatedAt,
})

const parseAuthError = (error: unknown): AuthApiErrorShape => {
  if (typeof error !== 'object' || error === null) {
    return {}
  }

  const candidate = error as Record<string, unknown>

  const code =
    typeof candidate.code === 'string' ? candidate.code : undefined
  const message =
    typeof candidate.message === 'string' ? candidate.message : undefined
  const status =
    typeof candidate.status === 'number' ? candidate.status : undefined

  return { code, message, status }
}

/**
 * @typedef {object} InvitationContext
 * @property {object} invitation - The invitation feature context.
 * @property {object} invitation.create - Function to create a new invitation.
 * @property {object} invitation.cancel - Function to cancel an existing invitation.
 * @property {object} invitation.findOne - Function to find a single invitation by ID.
 * @property {object} invitation.accept - Function to accept an invitation.
 * @property {object} invitation.reject - Function to reject an invitation.
 */
export type InvitationContext = {
  invitation: {
    create: (input: CreateInvitationDTO) => Promise<Invitation>
    cancel: (invitationId: string) => Promise<void>
    findOne: (invitationId: string) => Promise<Invitation>
    accept: (invitationId: string) => Promise<void>
    reject: (invitationId: string) => Promise<void>
  }
}

/**
 * @const InvitationFeatureProcedure
 * @description Igniter.js procedure to manage invitation-related operations.
 * This procedure provides methods for creating, canceling, finding, accepting, and rejecting invitations.
 * @returns {InvitationContext} An object containing the invitation management functions.
 */
export const InvitationFeatureProcedure = igniter.procedure({
  name: 'InvitationFeatureProcedure',
  handler: (_, { context, request }) => {
    const { auth } = context.services
    return {
      invitation: {
        /**
         * @method create
         * @description Creates a new invitation and sends an email to the invitee.
         * @param {CreateInvitationDTO} input - The invitation data, including email and role.
         * @returns {Promise<Invitation>} A promise that resolves to the newly created invitation object.
         */
        create: async (input: CreateInvitationDTO): Promise<Invitation> => {
          try {
            // Business Logic: Create an invitation via the authentication API.
            const createdInvite = mapInvitation(
              RawInvitationSchema.parse(
                await auth.api.createInvitation({
                  headers: request.headers,
                  body: {
                    email: input.email,
                    role: input.role,
                  },
                }),
              ),
            )

            // Observation: Find the organization associated with the created invitation.
            const organization =
              await context.services.database.organization.findUnique({
                where: {
                  id: createdInvite.organizationId,
                },
              })

            // Business Rule: If the organization is not found, throw an error.
            if (!organization) {
              throw new InvitationError(
                {
                  code: 'ORGANIZATION_NOT_FOUND',
                  message: 'Organization not found',
                },
                404,
              )
            }

            // Business Logic: Send an organization invitation email.
            await context.services.mail.send({
              to: input.email,
              subject: 'You are invited to join an organization',
              template: 'organization-invite',
              data: {
                email: input.email,
                organization: organization.name,
                url: Url.get(`/app/organization/${organization.id}`),
              },
            })

            // Response: Return the created invitation.
            return createdInvite
          } catch (error) {
            // Error Handling: Standardize error as InvitationError.
            const parsedError = parseAuthError(error)
            throw new InvitationError(
              {
                code: parsedError.code || 'UNKNOWN_ERROR',
                message:
                  parsedError.message || 'Failed to create invitation',
              },
              parsedError.status || 500,
            )
          }
        },

        /**
         * @method cancel
         * @description Cancels an existing invitation.
         * @param {string} invitationId - The ID of the invitation to cancel.
         * @returns {Promise<void>} A promise that resolves when the invitation is successfully canceled.
         */
        cancel: async (invitationId: string): Promise<void> => {
          try {
            // Business Logic: Cancel the invitation via the authentication API.
            await auth.api.cancelInvitation({
              headers: request.headers,
              body: {
                invitationId,
              },
            })
          } catch (error) {
            // Error Handling: Standardize error as InvitationError.
            const parsedError = parseAuthError(error)
            throw new InvitationError(
              {
                code: parsedError.code || 'UNKNOWN_ERROR',
                message:
                  parsedError.message || 'Failed to cancel invitation',
              },
              parsedError.status || 500,
            )
          }
        },

        /**
         * @method findOne
         * @description Finds a single invitation by its ID.
         * @param {string} invitationId - The ID of the invitation to find.
         * @returns {Promise<Invitation>} A promise that resolves to the invitation object if found.
         */
        findOne: async (invitationId: string): Promise<Invitation> => {
          try {
            // Business Logic: Attempt to retrieve the invitation via the authentication API.
            const invite = mapInvitation(
              RawInvitationSchema.parse(
                await auth.api.getInvitation({
                  headers: request.headers,
                  query: {
                    id: invitationId,
                  },
                }),
              ),
            )

            // Response: Return the invitation data.
            return invite
          } catch (error) {
            // Error Handling: Standardize error as InvitationError.
            const parsedError = parseAuthError(error)

            if (parsedError.status === 404) {
              throw new InvitationError(
                {
                  code: 'INVITATION_NOT_FOUND',
                  message: 'Invitation not found',
                },
                404,
              )
            }
            throw new InvitationError(
              {
                code: parsedError.code || 'UNKNOWN_ERROR',
                message:
                  parsedError.message || 'Failed to find invitation',
              },
              parsedError.status || 500,
            )
          }
        },

        /**
         * @method accept
         * @description Accepts an invitation.
         * @param {string} invitationId - The ID of the invitation to accept.
         * @returns {Promise<void>} A promise that resolves when the invitation is successfully accepted.
         */
        accept: async (invitationId: string): Promise<void> => {
          try {
            // Business Logic: Accept the invitation via the authentication API.
            const acceptedInvitation = AcceptInvitationResponseSchema.parse(
              await auth.api.acceptInvitation({
                headers: request.headers,
                body: {
                  invitationId,
                },
              }),
            )

            const invitation = mapInvitation(acceptedInvitation.invitation)

            if (invitation.organizationId) {
              await context.services.notification.send({
                type: 'MEMBER_JOINED',
                context: {
                  organizationId: invitation.organizationId,
                },
                data: {
                  memberName: invitation.email,
                  memberEmail: invitation.email,
                  role: invitation.role,
                },
              })
            }
          } catch (error) {
            // Error Handling: Standardize error as InvitationError.
            const parsedError = parseAuthError(error)
            throw new InvitationError(
              {
                code: parsedError.code || 'UNKNOWN_ERROR',
                message:
                  parsedError.message || 'Failed to accept invitation',
              },
              parsedError.status || 500,
            )
          }
        },

        /**
         * @method reject
         * @description Rejects an invitation.
         * @param {string} invitationId - The ID of the invitation to reject.
         * @returns {Promise<void>} A promise that resolves when the invitation is successfully rejected.
         */
        reject: async (invitationId: string): Promise<void> => {
          try {
            // Business Logic: Reject the invitation via the authentication API.
            await auth.api.rejectInvitation({
              headers: request.headers,
              body: {
                invitationId,
              },
            })
          } catch (error) {
            // Error Handling: Standardize error as InvitationError.
            const parsedError = parseAuthError(error)
            throw new InvitationError(
              {
                code: parsedError.code || 'UNKNOWN_ERROR',
                message:
                  parsedError.message || 'Failed to reject invitation',
              },
              parsedError.status || 500,
            )
          }
        },
      },
    }
  },
})
