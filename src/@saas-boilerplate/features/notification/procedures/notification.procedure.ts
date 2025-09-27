import { igniter } from '@/igniter'
import type {
  ListNotificationsQuery,
  NotificationType,
} from '../notification.interfaces'

/**
 * @const notificationProcedure
 * @description Igniter.js procedure to inject notification repository and service instances into the context.
 * This creates a consistent hierarchical pattern: context.features.notification.{repository|service}
 * @returns {NotificationContext} An object containing the notification repository and service in hierarchical structure.
 */
export const NotificationProcedure = igniter.procedure({
  name: 'NotificationProcedure', // Adhering to naming convention
  handler: (_, { context }) => {
    // Context Extension: Return both instances in hierarchical structure for consistency.
    return {
      notification: {
        list: async ({
          recipientId,
          organizationId,
          query,
        }: {
          recipientId: string
          organizationId: string
          query: ListNotificationsQuery
        }) => {
          // Business Rule: Always filter by recipientId and organizationId for multi-tenant isolation.
          const where = {
            recipientId,
            organizationId,
            ...(query.unreadOnly && { readAt: null }),
            ...(query.type && { type: query.type }),
          }

          // Business Logic: Calculate pagination offset.
          const skip = (query.page - 1) * query.limit

          // Observation: Execute both queries in parallel for better performance.
          const [notifications, total] = await Promise.all([
            context.services.database.notification.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              skip,
              take: query.limit,
              include: {
                recipient: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            }),
            context.services.database.notification.count({ where }),
          ])

          // Business Logic: Render the notifications.
          const renderedNotifications = await Promise.all(
            notifications.map(async (notification) => {
              const template =
                await context.services.notification.renderTemplate(
                  notification.type as NotificationType,
                  notification.data as any,
                )
              return {
                ...notification,
                ...template,
              }
            }),
          )

          // Response: Return the rendered notifications and total count.
          return { notifications: renderedNotifications, total }
        },
        findById: ({
          notificationId,
          recipientId,
          organizationId,
        }: {
          notificationId: string
          recipientId: string
          organizationId: string
        }) => {
          return context.services.database.notification.findUnique({
            where: {
              id: notificationId,
              recipientId,
              organizationId,
            },
          })
        },
        markAsRead: ({
          notificationId,
          recipientId,
          organizationId,
        }: {
          notificationId: string
          recipientId: string
          organizationId: string
        }) => {
          return context.services.database.notification.update({
            where: {
              id: notificationId,
              recipientId,
              organizationId,
            },
            data: { readAt: new Date() },
          })
        },
        markAllAsRead: ({
          recipientId,
          organizationId,
        }: {
          recipientId: string
          organizationId: string
        }) => {
          return context.services.database.notification.updateMany({
            where: {
              recipientId,
              organizationId,
              readAt: null,
            },
            data: { readAt: new Date() },
          })
        },
        getUnreadCount: ({
          recipientId,
          organizationId,
        }: {
          recipientId: string
          organizationId: string
        }) => {
          return context.services.database.notification.count({
            where: {
              recipientId,
              organizationId,
              readAt: null,
            },
          })
        },
        delete: ({
          notificationId,
          recipientId,
          organizationId,
        }: {
          notificationId: string
          recipientId: string
          organizationId: string
        }) => {
          return context.services.database.notification.delete({
            where: {
              id: notificationId,
              recipientId,
              organizationId,
            },
          })
        },
      },
    }
  },
})
