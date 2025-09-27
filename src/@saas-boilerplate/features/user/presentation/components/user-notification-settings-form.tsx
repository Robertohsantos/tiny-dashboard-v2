'use client'

import * as React from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '@/igniter.client'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Annotated } from '@/components/ui/annotated'
import { Switch } from '@/components/ui/switch'
import { BellIcon } from 'lucide-react'
import { useAuth } from '@/modules/auth'
import { NotificationType } from '@/@saas-boilerplate/features/notification/notification.interfaces'
import { UserMetadataSchema } from '../../user.interface'

type NotificationSetting = {
  type: NotificationType
  title: string
  description: string
  group: 'Transactional' | 'Marketing' | 'System'
}

type NotificationPreference = {
  inApp: boolean
  email: boolean
}

type NotificationPreferencesRecord = Partial<
  Record<NotificationType, NotificationPreference>
>

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    type: NotificationType.USER_INVITED,
    title: 'User Invitation',
    description: 'When a user is invited to an organization',
    group: 'Transactional',
  },
  {
    type: NotificationType.BILLING_SUCCESS,
    title: 'Billing Success',
    description: 'When a payment is processed successfully',
    group: 'Transactional',
  },
  {
    type: NotificationType.BILLING_FAILED,
    title: 'Billing Failed',
    description: 'When a payment fails',
    group: 'Transactional',
  },
  {
    type: NotificationType.MEMBER_JOINED,
    title: 'New Member Joined',
    description: 'When a new member joins your organization',
    group: 'Transactional',
  },
  {
    type: NotificationType.MEMBER_LEFT,
    title: 'Member Left',
    description: 'When a member leaves your organization',
    group: 'Transactional',
  },
  {
    type: NotificationType.LEAD_CREATED,
    title: 'New Lead Created',
    description: 'When a new lead is created',
    group: 'Marketing',
  },
  {
    type: NotificationType.LEAD_UPDATED,
    title: 'Lead Updated',
    description: 'When a lead is updated',
    group: 'Marketing',
  },
  {
    type: NotificationType.SUBSCRIPTION_CREATED,
    title: 'Subscription Created',
    description: 'When a new subscription is activated',
    group: 'Transactional',
  },
  {
    type: NotificationType.SUBSCRIPTION_UPDATED,
    title: 'Subscription Updated',
    description: 'When a subscription is updated',
    group: 'Transactional',
  },
  {
    type: NotificationType.SUBSCRIPTION_CANCELED,
    title: 'Subscription Cancelled',
    description: 'When a subscription is cancelled',
    group: 'Transactional',
  },
  {
    type: NotificationType.INTEGRATION_CONNECTED,
    title: 'Integration Connected',
    description: 'When an integration is connected',
    group: 'Transactional',
  },
  {
    type: NotificationType.INTEGRATION_DISCONNECTED,
    title: 'Integration Disconnected',
    description: 'When an integration is disconnected',
    group: 'Transactional',
  },
  {
    type: NotificationType.WEBHOOK_FAILED,
    title: 'Webhook Failed',
    description: 'When a webhook delivery fails',
    group: 'Transactional',
  },
  {
    type: NotificationType.API_KEY_CREATED,
    title: 'API Key Created',
    description: 'When a new API key is created',
    group: 'Transactional',
  },
  {
    type: NotificationType.API_KEY_EXPIRED,
    title: 'API Key Expired',
    description: 'When an API key expires',
    group: 'Transactional',
  },
  {
    type: NotificationType.SYSTEM_MAINTENANCE,
    title: 'System Maintenance',
    description: 'Notifications about system maintenance',
    group: 'System',
  },
  {
    type: NotificationType.GENERAL,
    title: 'General Notification',
    description: 'General announcements and information',
    group: 'System',
  },
]

export function UserNotificationSettingsForm() {
  const auth = useAuth()

  const getNotificationPreference = React.useCallback(
    (type: NotificationType, preferenceType: 'inApp' | 'email') => {
      try {
        const user = auth.session?.user
        if (!user?.metadata) return true
        const preferences = user.metadata.notifications?.preferences
        return preferences?.[type]?.[preferenceType] ?? true
      } catch (error) {
        console.warn('Error accessing notification preferences:', error)
        return true
      }
    },
    [auth.session?.user],
  )

  const defaultPreferences = React.useMemo<NotificationPreferencesRecord>(() => {
    return NOTIFICATION_SETTINGS.reduce<NotificationPreferencesRecord>(
      (accumulator, setting) => {
        accumulator[setting.type] = {
          inApp: getNotificationPreference(setting.type, 'inApp'),
          email: getNotificationPreference(setting.type, 'email'),
        }

        return accumulator
      },
      {},
    )
  }, [getNotificationPreference])

  const form = useFormWithZod({
    mode: 'onChange',
    schema: z.object({
      metadata: UserMetadataSchema,
    }),
    defaultValues: {
      metadata: {
        notifications: {
          preferences: defaultPreferences,
        },
      },
    },
    onSubmit: async (values) => {
      const result = await tryCatch(
        api.user.update.mutate({
          body: {
            metadata: values.metadata,
          },
        }),
      )

      if (result.error) {
        toast.error('Error saving notification preferences', {
          description: 'Please check your data and try again',
        })
        return
      }

      toast.success('Notification preferences saved successfully!')
    },
  })

  const renderNotificationGroup = (
    group: 'Transactional' | 'Marketing' | 'System',
  ) => {
    const filteredSettings = NOTIFICATION_SETTINGS.filter(
      (setting) => setting.group === group,
    )

    if (filteredSettings.length === 0) return null

    return (
      <Annotated.Section>
        <div className="merge-form-section">
          <h2 className="py-2 px-6 text-xs">{group} Notifications</h2>
          {filteredSettings.map((notification) => (
            <div
              key={notification.type}
              className="flex flex-col space-y-4 rounded-lg text-sm border p-4 mb-4 last:mb-0"
            >
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <h3>{notification.title}</h3>
                  <span className="text-muted-foreground">
                    {notification.description}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`metadata.notifications.preferences.${notification.type}.inApp`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg text-sm border p-2 space-y-0">
                      <FormLabel>In-App</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          // In-app notifications are always active, so this switch is disabled
                          onCheckedChange={field.onChange}
                          disabled={true}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`metadata.notifications.preferences.${notification.type}.email`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg text-sm border p-2 space-y-0">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </Annotated.Section>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.onSubmit} className="space-y-12 relative">
        <Annotated>
          <Annotated.Sidebar>
            <Annotated.Icon>
              <BellIcon className="w-4 h-4" />
            </Annotated.Icon>
            <Annotated.Title>Notification Preferences</Annotated.Title>
            <Annotated.Description>
              Manage how you receive notifications.
            </Annotated.Description>
          </Annotated.Sidebar>
          <Annotated.Content>
            {renderNotificationGroup('Transactional')}
            {renderNotificationGroup('Marketing')}
            {renderNotificationGroup('System')}
          </Annotated.Content>
        </Annotated>
      </form>
    </Form>
  )
}
