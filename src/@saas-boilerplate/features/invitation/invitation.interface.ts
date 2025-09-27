import type { Organization } from '../organization/organization.interface'
import type { Membership } from '../membership/membership.interface'
import type { OrganizationMembershipRole } from '../auth'
import type { IgniterCommonErrorCode } from '@igniter-js/core'
import { z } from 'zod'

type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled'

/**
 * @interface Invitation
 * @description Represents an invitation entity within an organization.
 * This interface defines the structure of an invitation, including its status, associated organization, email, role, and timestamps.
 */
export interface Invitation {
  /** Unique identifier for the invitation. */
  id: string
  /** The current status of the invitation (e.g., 'pending', 'accepted'). */
  status: InvitationStatus
  /** The ID of the organization to which the invitation belongs. */
  organizationId: string
  /** The associated Organization entity (optional, for relations). */
  organization?: Organization
  /** The email address of the invitee. */
  email: string
  /** The role assigned to the invitee within the organization. */
  role: OrganizationMembershipRole | null
  /** The ID of the user that created this invitation. */
  inviterId: string
  /** The membership reference for the inviter, if available. */
  inviterMembershipId?: string | null
  /** The associated Inviter Membership entity (optional, for relations). */
  inviterMembership?: Membership
  /** The date and time when the invitation expires. */
  expiresAt: Date
  /** Optional reference to the member created after accept flow. */
  memberId?: string | null
  /** Optional team assignment for this invitation. */
  teamId?: string | null
  /** The date and time when the invitation was created. */
  createdAt?: Date
  /** The date and time when the invitation was last updated. */
  updatedAt?: Date
}

/**
 * @interface InvitationErrorDetails
 * @description Standardized error details structure for invitation-related operations.
 */
export interface InvitationErrorDetails {
  /** The error code, typically a constant string. */
  code: string
  /** A human-readable message describing the error. */
  message: string
}

/**
 * @class InvitationError
 * @extends {IgniterResponseError<IgniterCommonErrorCode, InvitationErrorDetails>}
 * @description Custom error class for invitation-related issues, extending IgniterResponseError.
 * This allows for standardized error handling and propagation throughout the application.
 */
export class InvitationError extends Error {
  public readonly status: number
  public readonly code: IgniterCommonErrorCode
  public readonly data: InvitationErrorDetails

  constructor(details: InvitationErrorDetails, status: number = 400) {
    super(details.message)
    this.name = 'InvitationError'
    this.status = status
    this.code = details.code as IgniterCommonErrorCode
    this.data = details

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * @schema InviteMemberSchema
 * @description Zod schema for validating invitation requests, including email and role.
 */
export const InviteMemberSchema = z.object({
  email: z.string().min(1, 'At least one email is required'),
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
})

/**
 * @typedef {import("zod").infer<typeof InviteMemberSchema>} InviteMemberInput
 * @description Type definition for the input of an invitation, inferred from InviteMemberSchema.
 */
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>

/**
 * Data transfer object for creating a new Invitation.
 * @interface CreateInvitationDTO
 */
export interface CreateInvitationDTO {
  /** The email address of the invitee. */
  email: string
  /** The role to assign to the invitee within the organization. */
  role: OrganizationMembershipRole
}

/**
 * Data transfer object for updating an existing Invitation.
 * @interface UpdateInvitationDTO
 */
export interface UpdateInvitationDTO {
  /** Optional unique identifier for the invitation. */
  id?: string | null
  /** Optional status of the invitation. */
  status?: InvitationStatus | null
  /** Optional ID of the organization. */
  organizationId?: string
  /** Optional email address of the invitee. */
  email?: string
  /** Optional role assigned to the invitee. */
  role?: string
  /** Optional ID of the inviter membership. */
  inviterMembershipId?: string | null
  /** Optional expiration date and time. */
  expiresAt?: Date
  /** Optional creation date and time. */
  createdAt?: Date | null
  /** Optional last update date and time. */
  updatedAt?: Date
}

/**
 * Query parameters for fetching Invitation entities.
 * @interface InvitationQueryParams
 */
export interface InvitationQueryParams {
  /** Current page number for pagination. */
  page?: number
  /** Number of items to return per page. */
  limit?: number
  /** Property to sort by. */
  sortBy?: string
  /** Sort order ('asc' or 'desc'). */
  sortOrder?: 'asc' | 'desc'
  /** Search term for filtering invitations. */
  search?: string
}
