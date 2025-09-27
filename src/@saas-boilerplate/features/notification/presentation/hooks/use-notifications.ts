'use client'

import { useState, useEffect } from 'react'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import {
  getNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from '@/@saas-boilerplate/hooks/notification-sound'
import { NotificationType } from '../../notification.interfaces'
import type { NotificationData as UINotificationData } from '@/components/ui/notification'

/**
 * @interface UseNotificationsOptions
 * @description Configuration options for the useNotifications hook
 */
interface UseNotificationsOptions {
  pageSize?: number
  refetchInterval?: number
  unreadOnly?: boolean
}

/**
 * @interface UseNotificationsReturn
 * @description Return type for the useNotifications hook
 */
interface UseNotificationsReturn {
  // Data
  notifications: UINotificationData[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  } | null

  // States
  isLoading: boolean
  isError: boolean
  error: any

  // Actions
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void

  // Pagination
  currentPage: number
  nextPage: () => void
  prevPage: () => void
  canGoNext: boolean
  canGoPrev: boolean

  // Mutation states
  isMarkingAsRead: boolean
  isMarkingAllAsRead: boolean
  isDeleting: boolean
  // Sound controls
  soundEnabled: boolean
  setSound: (enabled: boolean) => void
}

/**
 * @hook useNotifications
 * @description Custom hook for managing notifications with real-time updates, pagination, and actions.
 * Provides a complete interface for notification management across the application.
 * @param {UseNotificationsOptions} options - Configuration options for the hook
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    pageSize = 10,
    refetchInterval = 30000, // 30 seconds fallback for real-time
    unreadOnly = false,
  } = options

  const [currentPage, setCurrentPage] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  useEffect(() => {
    const enabled = getNotificationSoundEnabled()
    setSoundEnabled(enabled)
  }, [])

  const setSound = (enabled: boolean) => {
    setNotificationSoundEnabled(enabled)
    setSoundEnabled(enabled)
  }

  // Business Logic: Fetch notifications with real-time updates
  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    invalidate,
  } = api.notification.list.useQuery()

  // Business Logic: Fetch unread count for badge
  const { data: unreadData } = api.notification.unreadCount.useQuery()

  // Business Logic: Mutation for marking single notification as read
  const markAsReadMutation = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      // Real-time updates via revalidation will handle UI refresh automatically
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error)
    },
  })

  // Business Logic: Mutation for marking all notifications as read
  const markAllAsReadMutation = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      // Real-time updates via revalidation will handle UI refresh automatically
      invalidate()
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error)
    },
  })

  // Business Logic: Mutation for deleting notifications
  const deleteMutation = api.notification.delete.useMutation({
    onSuccess: () => {
      // Real-time updates via revalidation will handle UI refresh automatically
      invalidate()
    },
    onError: (error) => {
      console.error('Failed to delete notification:', error)
    },
  })

  // Data extraction
  const isValidNotificationType = (value: unknown): value is NotificationType =>
    typeof value === 'string' &&
    (Object.values(NotificationType) as string[]).includes(value)

  const notifications: UINotificationData[] = (notificationsData?.notifications || []).map(
    (notification: Record<string, unknown>) => {
      const type = isValidNotificationType(notification.type)
        ? notification.type
        : NotificationType.GENERAL

      return {
        ...notification,
        type,
      } as UINotificationData
    },
  )
  const unreadCount = unreadData?.count || 0
  const pagination = notificationsData?.pagination
    ? {
        page: notificationsData.pagination.page,
        limit: notificationsData.pagination.limit,
        total: notificationsData.pagination.total,
        totalPages: notificationsData.pagination.totalPages,
      }
    : null

  // Pagination helpers
  const canGoNext = pagination ? currentPage < pagination.totalPages : false
  const canGoPrev = currentPage > 1

  const nextPage = () => {
    if (canGoNext) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const prevPage = () => {
    if (canGoPrev) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  // Action handlers
  const markAsRead = async (id: string) => {
    // igniter client expects path param; mutate accepts params at top-level
    await markAsReadMutation.mutate({ params: { id } })
    toast.success('Notification marked as read')
  }

  const markAllAsRead = async () => {
    await markAllAsReadMutation.mutate()
    toast.success('All notifications marked as read')
  }

  const deleteNotification = async (id: string) => {
    await deleteMutation.mutate({
      params: { id },
    })
  }

  // Play sound when a new notification arrives
  useEffect(() => {
    // when notifications data changes and sound enabled
    if (!soundEnabled) return

    // simple heuristic: if unreadCount increased, play sound and toast
    // store previous unread in ref
    let prev = 0
    try {
      prev = Number(window.sessionStorage.getItem('prevUnread') || '0')
    } catch (e) {
      prev = 0
    }

    if (unreadCount > prev) {
      // play sound
      const audio = new Audio('/audio/notification.mp3')
      audio.play().catch(() => {})
      toast('You have new notifications')
    }

    try {
      window.sessionStorage.setItem('prevUnread', String(unreadCount))
    } catch (e) {
      // ignore
    }
  }, [unreadCount, soundEnabled])

  return {
    // Data
    notifications,
    unreadCount,
    pagination,

    // States
    isLoading,
    isError,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Pagination
    currentPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isLoading,
    isMarkingAllAsRead: markAllAsReadMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    // Sound controls
    soundEnabled,
    setSound,
  }
}
