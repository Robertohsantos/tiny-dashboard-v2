import { igniter } from '@/igniter'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth/procedures/auth.procedure'
import { NotificationProcedure } from '../procedures/notification.procedure'
import { ListNotificationsQuerySchema } from '../notification.interfaces'
import { z } from 'zod'

/**
 * @controller NotificationController
 * @description Controller for managing user notifications with real-time streaming capabilities.
 * Provides endpoints for listing, marking as read, and managing notifications with proper authentication and organization isolation.
 */
export const NotificationController = igniter.controller({
  name: 'notification',
  path: '/notification',
  description: 'Manage user notifications',
  actions: {
    /**
     * @action list
     * @description Retrieves notifications for the authenticated user with pagination and filtering.
     * Supports real-time streaming for automatic updates when new notifications are created.
     */
    list: igniter.query({
      name: 'List',
      description: 'List user notifications with real-time updates',
      path: '/',
      method: 'GET',
      stream: true, // Enable real-time streaming for automatic updates
      use: [AuthFeatureProcedure(), NotificationProcedure()],
      query: ListNotificationsQuerySchema,
      handler: async ({ request, response, context }) => {
        // 🔍 Authentication validation inside handler
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        // Observation: Extract query parameters for pagination and filtering with defaults.
        const query = {
          limit: request.query.limit || 10,
          page: request.query.page || 1,
          unreadOnly: request.query.unreadOnly || false,
          type: request.query.type,
        }

        // Business Logic: Retrieve notifications using the repository with organizational isolation.
        const result = await context.notification.list({
          recipientId: session.user!.id,
          organizationId: session.organization.id,
          query,
        })

        // Data Transformation: Calculate pagination metadata.
        const totalPages = Math.ceil(result.total / query.limit)

        // Response: Return paginated notifications with metadata.
        return response.success({
          notifications: result.notifications,
          pagination: {
            page: query.page,
            limit: query.limit,
            total: result.total,
            totalPages,
          },
        })
      },
    }),

    /**
     * @action markAsRead
     * @description Marks a specific notification as read for the authenticated user.
     * Triggers real-time updates to connected clients via revalidation.
     */
    markAsRead: igniter.mutation({
      name: 'Mark as Read',
      description: 'Mark a notification as read',
      path: '/:id/read' as const,
      method: 'PATCH',
      use: [AuthFeatureProcedure(), NotificationProcedure()],
      handler: async ({ request, response, context }) => {
        // 🔍 Authentication validation inside handler
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        // Observation: Extract notification ID from path parameters.
        const notificationId = request.params.id

        // Business Logic: Mark notification as read using repository.
        const notification = await context.notification.markAsRead({
          notificationId,
          recipientId: session.user!.id,
          organizationId: session.organization.id,
        })

        if (!notification) {
          return response.notFound('Notification not found or access denied')
        }

        // Response: Return updated notification and trigger real-time updates.
        return response.revalidate(['notification.list']).success(notification)
      },
    }),

    /**
     * @action markAllAsRead
     * @description Marks all unread notifications as read for the authenticated user.
     * Triggers real-time updates to connected clients via revalidation.
     */
    markAllAsRead: igniter.mutation({
      name: 'Mark All as Read',
      description: 'Mark all notifications as read',
      path: '/read-all',
      method: 'PATCH',
      use: [AuthFeatureProcedure(), NotificationProcedure()],
      handler: async ({ response, context }) => {
        // 🔍 Authentication validation inside handler
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        // Business Logic: Mark all unread notifications as read using repository.
        const { count: updatedCount } = await context.notification.markAllAsRead({
          recipientId: session.user!.id,
          organizationId: session.organization.id,
        })

        // Response: Return count of updated notifications and trigger real-time updates.
        return response.revalidate(['notification.list']).success({
          updatedCount,
          message: `${updatedCount} notifications marked as read`,
        })
      },
    }),

    /**
     * @action unreadCount
     * @description Gets the count of unread notifications for the authenticated user.
     * Useful for displaying notification badges and indicators.
     */
    unreadCount: igniter.query({
      name: 'Unread Count',
      description: 'Get count of unread notifications',
      path: '/unread-count',
      method: 'GET',
      use: [AuthFeatureProcedure(), NotificationProcedure()],
      handler: async ({ response, context }) => {
        // 🔍 Authentication validation inside handler
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        // Business Logic: Get unread notification count using repository.
        const count = await context.notification.getUnreadCount({
          recipientId: session.user!.id,
          organizationId: session.organization.id,
        })

        // Response: Return unread count.
        return response.success({ count })
      },
    }),

    /**
     * @action delete
     * @description Deletes a specific notification for the authenticated user.
     * Triggers real-time updates to connected clients via revalidation.
     */
    delete: igniter.mutation({
      name: 'Delete',
      description: 'Delete a notification',
      path: '/:id' as const,
      method: 'DELETE',
      use: [AuthFeatureProcedure(), NotificationProcedure()],
      handler: async ({ request, response, context }) => {
        // 🔍 Authentication validation inside handler
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner', 'member'],
        })

        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }

        // Observation: Extract notification ID from path parameters.
        const notificationId = request.params.id

        // Business Logic: Delete notification using repository.
        const deleted = await context.notification.delete({
          notificationId,
          recipientId: session.user!.id,
          organizationId: session.organization.id,
        })

        if (!deleted) {
          return response.notFound('Notification not found or access denied')
        }

        // Response: Confirm deletion and trigger real-time updates.
        return response.revalidate(['notification.list']).success({
          message: 'Notification deleted successfully',
        })
      },
    }),
  },
})
