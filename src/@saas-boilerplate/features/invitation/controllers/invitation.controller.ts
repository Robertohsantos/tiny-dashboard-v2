import { igniter } from '@/igniter'
import { InvitationFeatureProcedure } from '../procedures/invitation.procedure'
import { AuthFeatureProcedure } from '../../auth/procedures/auth.procedure'
import { InvitationError, InviteMemberSchema } from '../invitation.interface'
import { NotificationProcedure } from '../../notification/procedures/notification.procedure'

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

/**
 * @const InvitationController
 * @description Controller for managing organization invitations.
 * This controller provides API actions for finding, creating, accepting, rejecting, and canceling invitations.
 */
export const InvitationController = igniter.controller({
  name: 'Invitation',
  description:
    'Organization invitation management including sending, accepting, and canceling invites',
  path: '/invitation',
  actions: {
    /**
     * @method findOne
     * @description Get invitation details by ID.
     * @param {string} id - The ID of the invitation.
     * @returns {Promise<Invitation | null>} A promise that resolves to the invitation object if found, otherwise null.
     */
    findOne: igniter.query({
      name: 'getInvitation',
      description: 'Get invitation details',
      method: 'GET',
      path: '/:id' as const,
      use: [InvitationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          // Business Logic: Attempt to find the invitation using the procedure.
          const result = await context.invitation.findOne(request.params.id)

          // Response: Return the invitation data.
          return response.success(result)
        } catch (error) {
          // Error Handling: If an InvitationError occurred, return an appropriate error response.
          if (error instanceof InvitationError) {
            return response.status(error.status).json(error.data)
          }
          // Error Handling: For any other unexpected error, return a generic bad request.
          return response.badRequest(
            resolveErrorMessage(error, 'Failed to find invitation'),
          )
        }
      },
    }),

    /**
     * @method create
     * @description Create a new invitation.
     * @param {string} email - The email of the invitee.
     * @param {('admin' | 'member')} role - The role to assign to the invitee.
     * @returns {Promise<Invitation>} A promise that resolves to the newly created invitation object.
     */
    create: igniter.mutation({
      name: 'createInvitation',
      description: 'Create new invitation',
      method: 'POST',
      path: '/',
      use: [
        AuthFeatureProcedure(),
        InvitationFeatureProcedure(),
        NotificationProcedure(),
      ],
      body: InviteMemberSchema,
      handler: async ({ request, response, context }) => {
        try {
          // Business Logic: Create a new invitation using the procedure.
          const result = await context.invitation.create(request.body)

          // Response: Return the newly created invitation.
          return response.success(result)
        } catch (error) {
          // Error Handling: If an InvitationError occurred, return an appropriate error response.
          if (error instanceof InvitationError) {
            return response.status(error.status).json(error.data)
          }
          // Error Handling: For any other unexpected error, return a generic bad request.
          return response.badRequest(
            resolveErrorMessage(error, 'Failed to create invitation'),
          )
        }
      },
    }),

    /**
     * @method accept
     * @description Accept an invitation.
     * @param {string} id - The ID of the invitation to accept.
     * @returns {Promise<void>} A promise that resolves when the invitation is successfully accepted.
     */
    accept: igniter.mutation({
      name: 'acceptInvitation',
      description: 'Accept invitation',
      method: 'POST',
      path: '/:id/accept' as const,
      use: [
        AuthFeatureProcedure(),
        InvitationFeatureProcedure(),
        NotificationProcedure(),
      ],
      handler: async ({ request, response, context }) => {
        try {
          // Business Logic: Accept the invitation using the procedure.
          await context.invitation.accept(request.params.id)

          // Response: Return a success response.
          return response.success()
        } catch (error) {
          // Error Handling: If an InvitationError occurred, return an appropriate error response.
          if (error instanceof InvitationError) {
            return response.status(error.status).json(error.data)
          }
          // Error Handling: For any other unexpected error, return a generic bad request.
          return response.badRequest(
            resolveErrorMessage(error, 'Failed to accept invitation'),
          )
        }
      },
    }),

    /**
     * @method reject
     * @description Reject an invitation.
     * @param {string} id - The ID of the invitation to reject.
     * @returns {Promise<void>} A promise that resolves when the invitation is successfully rejected.
     */
    reject: igniter.mutation({
      name: 'rejectInvitation',
      description: 'Reject invitation',
      method: 'POST',
      path: '/:id/reject' as const,
      use: [InvitationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          // Business Logic: Reject the invitation using the procedure.
          await context.invitation.reject(request.params.id)

          // Response: Return a success response.
          return response.success()
        } catch (error) {
          // Error Handling: If an InvitationError occurred, return an appropriate error response.
          if (error instanceof InvitationError) {
            return response.status(error.status).json(error.data)
          }
          // Error Handling: For any other unexpected error, return a generic bad request.
          return response.badRequest(
            resolveErrorMessage(error, 'Failed to reject invitation'),
          )
        }
      },
    }),

    /**
     * @method cancel
     * @description Cancel an invitation.
     * @param {string} id - The ID of the invitation to cancel.
     * @returns {Promise<{ message: string }>} A promise that resolves with a success message when the invitation is canceled.
     */
    cancel: igniter.mutation({
      name: 'cancelInvitation',
      description: 'Cancel invitation',
      method: 'DELETE',
      path: '/:id/cancel' as const,
      use: [InvitationFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          // Business Logic: Cancel the invitation using the procedure.
          await context.invitation.cancel(request.params.id)

          // Response: Return a success message.
          return response.success({ message: 'Invitation canceled' })
        } catch (error) {
          // Error Handling: If an InvitationError occurred, return an appropriate error response.
          if (error instanceof InvitationError) {
            return response.status(error.status).json(error.data)
          }
          // Error Handling: For any other unexpected error, return a generic bad request.
          return response.badRequest(
            resolveErrorMessage(error, 'Failed to cancel invitation'),
          )
        }
      },
    }),
  },
})
