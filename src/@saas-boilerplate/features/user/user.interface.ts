import type { DeepPartial } from '@igniter-js/core'
import { z } from 'zod'
import type { Membership } from '../membership'
import { NotificationType } from '@/@saas-boilerplate/features/notification/notification.interfaces'

export const notificationTypePreferenceSchema = z.object({
  inApp: z.boolean().default(true),
  email: z.boolean().default(true),
})

export const notificationPreferencesSchema = z.object({
  [NotificationType.USER_INVITED]: notificationTypePreferenceSchema,
  [NotificationType.BILLING_SUCCESS]: notificationTypePreferenceSchema,
  [NotificationType.BILLING_FAILED]: notificationTypePreferenceSchema,
  [NotificationType.MEMBER_JOINED]: notificationTypePreferenceSchema,
  [NotificationType.MEMBER_LEFT]: notificationTypePreferenceSchema,
  [NotificationType.LEAD_CREATED]: notificationTypePreferenceSchema,
  [NotificationType.LEAD_UPDATED]: notificationTypePreferenceSchema,
  [NotificationType.SUBSCRIPTION_CREATED]: notificationTypePreferenceSchema,
  [NotificationType.SUBSCRIPTION_UPDATED]: notificationTypePreferenceSchema,
  [NotificationType.SUBSCRIPTION_CANCELED]: notificationTypePreferenceSchema,
  [NotificationType.INTEGRATION_CONNECTED]: notificationTypePreferenceSchema,
  [NotificationType.INTEGRATION_DISCONNECTED]: notificationTypePreferenceSchema,
  [NotificationType.WEBHOOK_FAILED]: notificationTypePreferenceSchema,
  [NotificationType.API_KEY_CREATED]: notificationTypePreferenceSchema,
  [NotificationType.API_KEY_EXPIRED]: notificationTypePreferenceSchema,
  [NotificationType.SYSTEM_MAINTENANCE]: notificationTypePreferenceSchema,
  [NotificationType.GENERAL]: notificationTypePreferenceSchema,
})

export const UserMetadataSchema = z
  .object({
    contact: z.object({
      phone: z.string(),
    }),
    notifications: z.object({
      preferences: notificationPreferencesSchema,
    }),
    extra: z.object({
      referral_source: z.string().min(1, 'Selecione como nos conheceu'),
    }),
  })
  .deepPartial()

export type UserMetadata = z.infer<typeof UserMetadataSchema>

/**
 * Represents a User entity.
 */
export interface User {
  /** Id's id property */
  id: string
  /** Name's name property */
  name: string
  /** Email's email property */
  email: string
  /** EmailVerified's emailVerified property */
  emailVerified: boolean
  /** Image's image property */
  image: string | null
  /** CreatedAt's createdAt property */
  createdAt: Date
  /** UpdatedAt's updatedAt property */
  updatedAt: Date
  /** Role's role property */
  role: string | null
  /** Metadata's metadata property */
  metadata: UserMetadata
  /** Memberships associated with the user */
  members?: Membership[]
}

/**
 * Data transfer object for updating an existing User.
 */
export interface UpdateUserDTO {
  /** Id's id property  */
  id: string
  /** Name's name property  */
  name?: string
  /** Email's email property  */
  email?: string
  /** Image's image property  */
  image?: string | null
  /** Metadata's metadata property  */
  metadata?: DeepPartial<UserMetadata>
}

/**
 * Query parameters for fetching Category entities
 */
export interface UserQueryParams {
  /** Current page number for pagination */
  page?: number
  /** Number of items to return per page */
  limit?: number
  /** Property to sort by */
  sortBy?: string
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
  /** Search term for filtering */
  search?: string
}
