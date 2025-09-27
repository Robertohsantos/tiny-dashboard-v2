'use client'

import { useMemo, useState } from 'react'
import {
  Bell,
  Check,
  Trash2,
  UserPlus,
  CreditCard,
  Users,
  TrendingUp,
  Settings,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useNotifications } from '@/@saas-boilerplate/features/notification/presentation/hooks/use-notifications'
import { NotificationType } from '@/@saas-boilerplate/features/notification/notification.interfaces'
import type { NotificationData } from '@/components/ui/notification'
// NOTE: This file is deprecated; use presentation component at features/notification/presentation/components/notification-menu.tsx

/**
 * @interface NotificationItemProps
 * @description Props for individual notification item component
 */
interface NotificationItemProps {
  notification: NotificationData
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  isMarkingAsRead?: boolean
  isDeleting?: boolean
}

/**
 * @function getNotificationIcon
 * @description Maps notification types to appropriate icons with colors
 */
function getNotificationIcon(type: string) {
  switch (type) {
    case NotificationType.USER_INVITED:
      return <UserPlus className="h-4 w-4 text-blue-500" />
    case NotificationType.BILLING_SUCCESS:
      return <CreditCard className="h-4 w-4 text-green-500" />
    case NotificationType.BILLING_FAILED:
      return <CreditCard className="h-4 w-4 text-red-500" />
    case NotificationType.MEMBER_JOINED:
      return <Users className="h-4 w-4 text-blue-500" />
    case NotificationType.LEAD_CREATED:
      return <TrendingUp className="h-4 w-4 text-purple-500" />
    case NotificationType.SUBSCRIPTION_CREATED:
      return <CreditCard className="h-4 w-4 text-green-500" />
    case NotificationType.INTEGRATION_CONNECTED:
      return <Settings className="h-4 w-4 text-blue-500" />
    case NotificationType.API_KEY_CREATED:
      return <Settings className="h-4 w-4 text-orange-500" />
    case NotificationType.SYSTEM_MAINTENANCE:
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

/**
 * @function getNotificationContent
 * @description Generates notification title and description based on type and data
 */
function getNotificationContent(type: string, data: any) {
  switch (type) {
    case NotificationType.USER_INVITED:
      return {
        title: 'Invitation to organization',
        description: `${data.inviterName} invited you to ${data.organizationName}`,
      }
    case NotificationType.BILLING_SUCCESS:
      return {
        title: 'Payment successful',
        description: `${data.currency} ${data.amount} payment processed successfully`,
      }
    case NotificationType.BILLING_FAILED:
      return {
        title: 'Payment failed',
        description: `${data.currency} ${data.amount} payment failed: ${data.reason || 'Unknown error'}`,
      }
    case NotificationType.MEMBER_JOINED:
      return {
        title: 'New member',
        description: `${data.memberName} (${data.memberEmail}) joined the organization as ${data.role}`,
      }
    case NotificationType.LEAD_CREATED:
      return {
        title: 'New lead',
        description: `Lead ${data.leadName || data.leadEmail} created${data.source ? ` via ${data.source}` : ''}`,
      }
    case NotificationType.SUBSCRIPTION_CREATED:
      return {
        title: 'Subscription activated',
        description: `Plan ${data.planName} activated (${data.currency} ${data.amount})`,
      }
    case NotificationType.INTEGRATION_CONNECTED:
      return {
        title: 'Integration connected',
        description: `Integration ${data.provider}${data.name ? ` (${data.name})` : ''} connected`,
      }
    case NotificationType.API_KEY_CREATED:
      return {
        title: 'API Key created',
        description: `New API Key "${data.description}" created (${data.keyPreview})`,
      }
    case NotificationType.SYSTEM_MAINTENANCE:
      return {
        title: data.title || 'System maintenance',
        description: data.description,
      }
    case NotificationType.GENERAL:
      return {
        title: data.title,
        description: data.description,
      }
    default:
      return {
        title: 'Notification',
        description: 'You have a new notification',
      }
  }
}

/**
 * @component NotificationItem
 * @description Individual notification item with actions and type-specific styling
 */
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isMarkingAsRead,
  isDeleting,
}: NotificationItemProps) {
  const isUnread = !notification.readAt
  const { title, description } = getNotificationContent(
    notification.type,
    notification.data,
  )

  const createdAt = useMemo(() => {
    if (!notification.createdAt) {
      return null
    }

    if (notification.createdAt instanceof Date) {
      return notification.createdAt
    }

    const parsed = new Date(notification.createdAt)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }, [notification.createdAt])

  return (
    <div
      className={`p-3 border-b last:border-b-0 ${isUnread ? 'bg-background' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-1">{getNotificationIcon(notification.type)}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}
              >
                {title}
              </p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {description}
              </p>
              {createdAt && (
                <p className="text-xs text-gray-400 mt-2">
                  {formatDistanceToNow(createdAt, {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </p>
              )}
            </div>

            {/* Unread indicator */}
            {isUnread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-2" />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            {isUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                disabled={isMarkingAsRead}
                className="h-7 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * @component DashboardNotificationBell
 * @description Main notification bell component for the dashboard with real-time updates.
 * Displays notification count badge and provides a popover interface for viewing and managing notifications.
 */
export function DashboardNotificationBell() {
  const [isOpen, setIsOpen] = useState(false)

  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    isError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    currentPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeleting,
  } = useNotifications({
    pageSize: 10,
    refetchInterval: 30000,
  })

  const hasNotifications = notifications.length > 0

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end" side="right">
        <Card className="overflow-y-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isMarkingAllAsRead}
                  className="h-7 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  {isMarkingAllAsRead ? 'Marking...' : 'Mark all as read'}
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {unreadCount}{' '}
                {unreadCount === 1
                  ? 'unread notification'
                  : 'unread notifications'}
              </p>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : isError ? (
              <div className="p-4 text-center text-sm text-red-500">
                Error loading notifications
              </div>
            ) : !hasNotifications ? (
              <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No notifications
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    isMarkingAsRead={isMarkingAsRead}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer with pagination */}
          {hasNotifications && pagination && pagination.totalPages > 1 && (
            <>
              <Separator />
              <div className="px-4 py-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevPage}
                      disabled={!canGoPrev}
                      className="h-6 px-2 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextPage}
                      disabled={!canGoNext}
                      className="h-6 px-2 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  )
}
