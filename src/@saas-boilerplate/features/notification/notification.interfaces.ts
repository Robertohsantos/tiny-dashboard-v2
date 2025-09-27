// Zod schemas and TypeScript types for the notification feature.
import { z } from 'zod'

/**
 * @enum NotificationType
 * @description Enum defining the different types of notifications available in the system.
 * Each type represents a specific event or action that can trigger a notification.
 */
export enum NotificationType {
  USER_INVITED = 'USER_INVITED',
  BILLING_SUCCESS = 'BILLING_SUCCESS',
  BILLING_FAILED = 'BILLING_FAILED',
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_LEFT = 'MEMBER_LEFT',
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  INTEGRATION_CONNECTED = 'INTEGRATION_CONNECTED',
  INTEGRATION_DISCONNECTED = 'INTEGRATION_DISCONNECTED',
  WEBHOOK_FAILED = 'WEBHOOK_FAILED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  GENERAL = 'GENERAL',
}

/**
 * @schema CreateNotificationBodySchema
 * @description Zod schema for validating the request body when creating a new notification.
 * Ensures all required fields are present and properly typed.
 */
export const CreateNotificationBodySchema = z.object({
  type: z.nativeEnum(NotificationType),
  data: z.record(z.any()).optional().default({}),
  action: z.string().optional(),
  recipientId: z.string().uuid(),
  organizationId: z.string().uuid(),
})

/**
 * @schema MarkAsReadParamsSchema
 * @description Zod schema for validating path parameters when marking a notification as read.
 */
export const MarkAsReadParamsSchema = z.object({
  id: z.string().uuid(),
})

/**
 * @schema ListNotificationsQuerySchema
 * @description Zod schema for validating query parameters when listing notifications.
 * Includes pagination and filtering options.
 */
export const ListNotificationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
  type: z.nativeEnum(NotificationType).optional(),
})

/**
 * @schema DeleteNotificationParamsSchema
 * @description Zod schema for validating path parameters when deleting a notification.
 */
export const DeleteNotificationParamsSchema = z.object({
  id: z.string().uuid(),
})

/**
 * @typedef {import("zod").infer<typeof CreateNotificationBodySchema>} CreateNotificationBody
 * @description Type definition for the create notification request body, inferred from CreateNotificationBodySchema.
 */
export type CreateNotificationBody = z.infer<
  typeof CreateNotificationBodySchema
>

/**
 * @typedef {import("zod").infer<typeof MarkAsReadParamsSchema>} MarkAsReadParams
 * @description Type definition for the mark as read parameters, inferred from MarkAsReadParamsSchema.
 */
export type MarkAsReadParams = z.infer<typeof MarkAsReadParamsSchema>

/**
 * @typedef {import("zod").infer<typeof ListNotificationsQuerySchema>} ListNotificationsQuery
 * @description Type definition for the list notifications query parameters, inferred from ListNotificationsQuerySchema.
 */
export type ListNotificationsQuery = z.infer<
  typeof ListNotificationsQuerySchema
>

/**
 * @typedef {import("zod").infer<typeof DeleteNotificationParamsSchema>} DeleteNotificationParams
 * @description Type definition for the delete notification parameters, inferred from DeleteNotificationParamsSchema.
 */
export type DeleteNotificationParams = z.infer<
  typeof DeleteNotificationParamsSchema
>

/**
 * @interface NotificationData
 * @description Interface defining the structure of notification data payloads for different types.
 */
export interface NotificationData {
  USER_INVITED: {
    organizationName: string
    inviterName: string
    role?: string
  }
  BILLING_SUCCESS: {
    amount: number
    currency: string
    planName?: string
  }
  BILLING_FAILED: {
    amount: number
    currency: string
    reason?: string
  }
  MEMBER_JOINED: {
    memberName: string
    memberEmail: string
    role: string
  }
  MEMBER_LEFT: {
    memberName: string
    memberEmail: string
  }
  LEAD_CREATED: {
    leadName?: string
    leadEmail: string
    source?: string
  }
  LEAD_UPDATED: {
    leadName?: string
    leadEmail: string
    changes: string[]
  }
  SUBSCRIPTION_CREATED: {
    planName: string
    amount: number
    currency: string
  }
  SUBSCRIPTION_UPDATED: {
    planName: string
    changes: string[]
  }
  SUBSCRIPTION_CANCELED: {
    planName: string
    reason?: string
  }
  INTEGRATION_CONNECTED: {
    provider: string
    name?: string
  }
  INTEGRATION_DISCONNECTED: {
    provider: string
    name?: string
  }
  WEBHOOK_FAILED: {
    url: string
    error: string
    attempts: number
  }
  API_KEY_CREATED: {
    description: string
    keyPreview: string
  }
  API_KEY_EXPIRED: {
    description: string
    keyPreview: string
  }
  SYSTEM_MAINTENANCE: {
    title: string
    description: string
    scheduledAt?: string
  }
  GENERAL: {
    title: string
    description: string
  }
}

/**
 * @interface NotificationWithPagination
 * @description Interface for paginated notification results.
 */
export interface NotificationWithPagination {
  notifications: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * @interface UnreadCountResponse
 * @description Interface for unread notification count response.
 */
export interface UnreadCountResponse {
  count: number
}

/**
 * @interface Notification
 * @description Interface for notification data.
 */
export interface Notification<
  TType extends NotificationType,
  TData extends NotificationData[TType],
> {
  id: string
  type: TType
  data: TData
  recipientId: string
  organizationId: string
  action?: string
}
