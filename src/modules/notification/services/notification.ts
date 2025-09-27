import {
  NotificationService,
  type NotificationChannel,
  type NotificationTemplate,
  type NotificationTemplates,
} from '@/@saas-boilerplate/features/notification/services/notification.service'
import { prisma } from '@/modules/core/services/prisma'
import { mail } from '@/modules/core/services/mail'
import { z } from 'zod'
import type { InputJsonValue } from '@prisma/client/runtime/library'

type NotificationContext = {
  recipientId?: string
  organizationId?: string
}

const emailAndInAppChannels = ['email', 'in-app'] as const
const inAppOnlyChannels = ['in-app'] as const

type NotificationChannelName = (typeof emailAndInAppChannels)[number]

const defineTemplate = <
  TSchema extends z.ZodTypeAny,
  TChannels extends readonly string[],
>(
  template: NotificationTemplate<TSchema, TChannels>,
): NotificationTemplate<TSchema, TChannels> &
  NotificationTemplate<z.ZodTypeAny, TChannels> =>
  template as NotificationTemplate<TSchema, TChannels> &
    NotificationTemplate<z.ZodTypeAny, TChannels>

const notificationTemplates = {
  USER_INVITED: defineTemplate({
    channels: emailAndInAppChannels,
    title: 'User Invited',
    description: 'You have been invited to join an organization',
    help: 'When a user is invited to an organization',
    action: {
      label: 'Accept',
      url: '/app/invites',
    },
    schema: z.object({
      organizationName: z.string(),
      inviterName: z.string(),
      role: z.string(),
    }),
  }),
  BILLING_SUCCESS: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Billing Successful for ' + (data.planName || 'your plan'),
    description: (data) =>
      'Your payment of ' +
      data.amount +
      ' ' +
      data.currency +
      ' for ' +
      (data.planName || 'your plan') +
      ' was successful.',
    help: 'When a billing payment is successful',
    action: {
      label: 'View Invoice',
      url: '/app/billing',
    },
    schema: z.object({
      amount: z.number(),
      currency: z.string(),
      planName: z.string().optional(),
    }),
  }),
  BILLING_FAILED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Billing Failed for ' + (data.planName || 'your plan'),
    description: (data) =>
      'Your payment of ' +
      data.amount +
      ' ' +
      data.currency +
      ' for ' +
      (data.planName || 'your plan') +
      ' failed. Reason: ' +
      (data.reason || 'unknown') +
      '.',
    help: 'When a billing payment fails',
    action: {
      label: 'Update Payment',
      url: '/app/billing/settings',
    },
    schema: z.object({
      amount: z.number(),
      currency: z.string(),
      reason: z.string().optional(),
      planName: z.string().optional(),
    }),
  }),
  MEMBER_JOINED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => data.memberName + ' Joined Your Organization',
    description: (data) =>
      data.memberName +
      ' (' +
      data.memberEmail +
      ') has joined your organization as a ' +
      data.role +
      '.',
    help: 'When a new member joins the organization',
    action: {
      label: 'View Members',
      url: '/app/settings/members',
    },
    schema: z.object({
      memberName: z.string(),
      memberEmail: z.string(),
      role: z.string(),
    }),
  }),
  MEMBER_LEFT: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => data.memberName + ' Left Your Organization',
    description: (data) =>
      data.memberName +
      ' (' +
      data.memberEmail +
      ') has left your organization.',
    help: 'When a member leaves the organization',
    action: {
      label: 'View Members',
      url: '/app/settings/members',
    },
    schema: z.object({
      memberName: z.string(),
      memberEmail: z.string(),
    }),
  }),
  LEAD_CREATED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'New Lead Created: ' + (data.leadName || data.leadEmail),
    description: (data) =>
      'A new lead ' +
      (data.leadName || data.leadEmail) +
      ' has been created from ' +
      (data.source || 'an unknown source') +
      '.',
    help: 'When a new lead is created',
    action: (data) => ({
      label: 'View Lead',
      url: '/app/leads?search=' + data.leadEmail,
    }),
    schema: z.object({
      leadName: z.string().optional().nullable(),
      leadEmail: z.string(),
      source: z.string().optional().nullable(),
    }),
  }),
  LEAD_UPDATED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Lead Updated: ' + (data.leadName || data.leadEmail),
    description: (data) =>
      'The lead ' +
      (data.leadName || data.leadEmail) +
      ' has been updated. Changes: ' +
      data.changes.join(', ') +
      '.',
    help: 'When a lead is updated',
    action: (data) => ({
      label: 'View Lead',
      url: '/app/leads?search=' + data.leadEmail,
    }),
    schema: z.object({
      leadName: z.string().optional().nullable(),
      leadEmail: z.string(),
      changes: z.array(z.string()),
    }),
  }),
  LEAD_DELETED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Lead Deleted: ' + (data.leadName || data.leadEmail),
    description: (data) =>
      'The lead ' +
      (data.leadName || data.leadEmail || data.leadId) +
      ' has been removed from the pipeline.',
    help: 'When a lead is deleted from the system',
    action: {
      label: 'View Leads',
      url: '/app/leads',
    },
    schema: z.object({
      leadId: z.string(),
      leadEmail: z.string(),
      leadName: z.string().optional().nullable(),
    }),
  }),
  SUBMISSION_CREATED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Submission Created: ' + (data.leadName || data.leadEmail),
    description: (data) =>
      'A new submission ' +
      (data.leadName || data.leadEmail) +
      ' has been created from ' +
      (data.source || 'an unknown source') +
      '.',
    help: 'When a new submission is created',
    action: (data) => ({
      label: 'View Submission',
      url: '/app/submissions?search=' + data.leadEmail,
    }),
    schema: z.object({
      leadName: z.string().optional().nullable(),
      leadEmail: z.string(),
      source: z.string().optional().nullable(),
    }),
  }),
  SUBSCRIPTION_CREATED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Subscription Created: ' + data.planName,
    description: (data) =>
      'Your new subscription for ' +
      data.planName +
      ' has been successfully created with a payment of ' +
      data.amount +
      ' ' +
      data.currency +
      '.',
    help: 'When a new subscription is created',
    action: {
      label: 'View Subscription',
      url: '/app/billing',
    },
    schema: z.object({
      planName: z.string(),
      amount: z.number(),
      currency: z.string(),
    }),
  }),
  SUBSCRIPTION_UPDATED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Subscription Updated: ' + data.planName,
    description: (data) =>
      'Your subscription for ' +
      data.planName +
      ' has been updated. Changes: ' +
      data.changes.join(', ') +
      '.',
    help: 'When a subscription is updated',
    action: {
      label: 'View Subscription',
      url: '/app/billing',
    },
    schema: z.object({
      planName: z.string(),
      changes: z.array(z.string()),
    }),
  }),
  SUBSCRIPTION_CANCELED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Subscription Canceled: ' + data.planName,
    description: (data) =>
      'Your subscription for ' +
      data.planName +
      ' has been canceled. Reason: ' +
      (data.reason || 'not specified') +
      '.',
    help: 'When a subscription is canceled',
    action: {
      label: 'View Billing',
      url: '/app/billing',
    },
    schema: z.object({
      planName: z.string(),
      reason: z.string().optional(),
    }),
  }),
  INTEGRATION_CONNECTED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Integration Connected: ' + (data.name || data.provider),
    description: (data) =>
      'The ' + (data.name || data.provider) + ' integration has been successfully connected.',
    help: 'When a new integration is connected',
    action: {
      label: 'View Integrations',
      url: '/app/settings/integrations',
    },
    schema: z.object({
      provider: z.string(),
      name: z.string().optional(),
    }),
  }),
  INTEGRATION_DISCONNECTED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Integration Disconnected: ' + (data.name || data.provider),
    description: (data) =>
      'The ' + (data.name || data.provider) + ' integration has been disconnected.',
    help: 'When an integration is disconnected',
    action: {
      label: 'View Integrations',
      url: '/app/settings/integrations',
    },
    schema: z.object({
      provider: z.string(),
      name: z.string().optional(),
    }),
  }),
  WEBHOOK_FAILED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Webhook Failed for ' + data.url,
    description: (data) =>
      'A webhook to ' +
      data.url +
      ' failed with error: "' +
      data.error +
      '" after ' +
      data.attempts +
      ' attempts.',
    help: 'When a webhook delivery fails',
    action: {
      label: 'View Webhooks',
      url: '/app/settings/webhooks',
    },
    schema: z.object({
      url: z.string(),
      error: z.string(),
      attempts: z.number(),
    }),
  }),
  API_KEY_CREATED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'New API Key Created: ' + data.description,
    description: (data) =>
      'A new API key "' +
      data.keyPreview +
      '..." has been created for: ' +
      data.description +
      '.',
    help: 'When a new API key is created',
    action: {
      label: 'View API Keys',
      url: '/app/settings/api-keys',
    },
    schema: z.object({
      description: z.string(),
      keyPreview: z.string(),
    }),
  }),
  API_KEY_EXPIRED: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'API Key Expired: ' + data.description,
    description: (data) =>
      'Your API key "' +
      data.keyPreview +
      '..." for: ' +
      data.description +
      ' has expired.',
    help: 'When an API key expires',
    action: {
      label: 'Manage API Keys',
      url: '/app/settings/api-keys',
    },
    schema: z.object({
      description: z.string(),
      keyPreview: z.string(),
    }),
  }),
  SYSTEM_MAINTENANCE: defineTemplate({
    channels: inAppOnlyChannels,
    title: (data) => 'System Maintenance: ' + data.title,
    description: (data) =>
      data.description + ' (Scheduled at: ' + (data.scheduledAt || 'N/A') + ')',
    help: 'System wide maintenance notifications',
    action: {
      label: 'View Status',
      url: '/status',
    },
    schema: z.object({
      title: z.string(),
      description: z.string(),
      scheduledAt: z.string().optional(),
    }),
  }),
  GENERAL: defineTemplate({
    channels: emailAndInAppChannels,
    title: (data) => 'Notification: ' + data.title,
    description: (data) => data.description,
    help: 'General purpose notification',
    action: {
      label: 'View Details',
      url: '/app/notifications',
    },
    schema: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }),
} as const satisfies NotificationTemplates

type NotificationTemplateMap = typeof notificationTemplates

type NotificationType = keyof NotificationTemplateMap

const defaultNotificationContext: NotificationContext = {}

const isNotificationType = (type: string): type is NotificationType =>
  type in notificationTemplates

const parsePayload = <T extends NotificationType>(
  type: T,
  raw: unknown,
): z.infer<NotificationTemplateMap[T]['schema']> =>
  notificationTemplates[type].schema.parse(raw)

async function getEmailRecipients({
  recipientId,
  organizationId,
}: NotificationContext) {
  if (recipientId) {
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, email: true, name: true },
    })

    return recipient ? [recipient] : []
  }

  if (organizationId) {
    const members = await prisma.member.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    return members
      .map((member) => member.user)
      .filter((user): user is { id: string; email: string; name: string } => Boolean(user))
  }

  return prisma.user.findMany({
    select: { id: true, email: true, name: true },
  })
}

async function getRecipientIds({
  recipientId,
  organizationId,
}: NotificationContext) {
  if (recipientId) {
    return [recipientId]
  }

  if (organizationId) {
    const members = await prisma.member.findMany({
      where: { organizationId },
      select: { userId: true },
    })

    return members.map((member) => member.userId)
  }

  const users = await prisma.user.findMany({
    select: { id: true },
  })

  return users.map((user) => user.id)
}

const notificationChannels: Record<
  NotificationChannelName,
  NotificationChannel<NotificationChannelName, NotificationContext, NotificationTemplateMap>
> = {
  email: {
    name: 'email',
    async send({ data, template, context }) {
      if (!context) {
        throw new Error('Context is required')
      }

      if (!isNotificationType(template.type)) {
        console.warn('Unknown notification template "' + template.type + '"')
        return { success: false, message: 'Unknown template' }
      }

      const recipients = await getEmailRecipients(context)

      if (recipients.length === 0) {
        console.warn('No recipients found for email notification.')
        return { success: false, message: 'No recipients found' }
      }

      const title = template.title as string
      const description = template.description as string
      const action = template.action as { label: string; url: string }

      await Promise.all(
        recipients.map(async (recipient) => {
          if (!recipient.email) {
            console.warn('Recipient ' + recipient.id + ' does not have an email address.')
            return
          }

          const displayName = recipient.name ?? recipient.email.split('@')[0]

          await mail.send({
            template: 'notification',
            to: recipient.email,
            subject: title,
            data: {
              email: recipient.email,
              name: displayName,
              content: description,
              title,
              action,
            },
          })
        }),
      )

      return { success: true }
    },
  },
  'in-app': {
    name: 'in-app',
    async send({ data, template, context }) {
      if (!context) {
        throw new Error('Notification context is required')
      }

      if (!isNotificationType(template.type)) {
        console.warn('Unknown notification template "' + template.type + '"')
        return { success: false, message: 'Unknown template' }
      }

      const recipientIds = await getRecipientIds(context)

      if (recipientIds.length === 0) {
        console.warn('No recipients found for in-app notification.')
        return { success: false, message: 'No recipients found' }
      }

      const payload = parsePayload(template.type, data)
      const serializedPayload = JSON.parse(
        JSON.stringify(payload),
      ) as InputJsonValue
      const actionPayload = JSON.parse(
        JSON.stringify(template.action),
      ) as InputJsonValue

      const notifications = await Promise.all(
        recipientIds.map((recipientId) =>
          prisma.notification.create({
            data: {
              type: template.type,
              data: serializedPayload,
              recipientId,
              organizationId: context.organizationId,
              action: actionPayload,
            },
            include: {
              organization: {
                select: {
                  name: true,
                },
              },
            },
          }),
        ),
      )

      return {
        success: true,
        ids: notifications.map((notification) => notification.id),
      }
    },
  },
}

export const notification = new NotificationService({
  context: defaultNotificationContext,
  channels: notificationChannels,
  templates: notificationTemplates,
})
