/**
 * Simple toast hook for notifications
 * This is a basic implementation - can be replaced with a more robust solution
 */

'use client'

import { useCallback } from 'react'

type ToastVariant = 'default' | 'destructive'

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

/**
 * Simple toast hook that logs to console
 * In production, this should be replaced with a proper toast library
 */
export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, variant = 'default' } = options

    // For now, just log to console
    // In production, this would show an actual toast notification
    if (variant === 'destructive') {
      console.error(`🔴 ${title}${description ? `: ${description}` : ''}`)
    } else {
      console.log(`✅ ${title}${description ? `: ${description}` : ''}`)
    }

    // If you want to use browser notifications (requires permission)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title || 'Notification', {
          body: description,
          icon: variant === 'destructive' ? '❌' : '✅',
        })
      }
    }
  }, [])

  return { toast }
}
