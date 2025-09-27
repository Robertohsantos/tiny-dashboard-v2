import {
  NotificationType,
  type NotificationData,
} from '@/@saas-boilerplate/features/notification/notification.interfaces'

export function getNotificationContent(
  type: NotificationType,
  data: NotificationData[NotificationType],
) {
  switch (type) {
    case NotificationType.USER_INVITED: {
      const invitedData =
        data as NotificationData[NotificationType.USER_INVITED]
      return {
        title: 'Invitation to organization',
        description: `${invitedData.inviterName} invited you to ${invitedData.organizationName}`,
      }
    }
    case NotificationType.BILLING_SUCCESS: {
      const billingSuccess =
        data as NotificationData[NotificationType.BILLING_SUCCESS]
      return {
        title: 'Payment successful',
        description: `${billingSuccess.currency} ${billingSuccess.amount} payment processed successfully`,
      }
    }
    case NotificationType.BILLING_FAILED: {
      const billingFailed =
        data as NotificationData[NotificationType.BILLING_FAILED]
      return {
        title: 'Payment failed',
        description: `${billingFailed.currency} ${billingFailed.amount} payment failed: ${billingFailed.reason || 'Unknown error'}`,
      }
    }
    case NotificationType.MEMBER_JOINED: {
      const memberJoined = data as NotificationData[NotificationType.MEMBER_JOINED]
      return {
        title: 'New member',
        description: `${memberJoined.memberName} (${memberJoined.memberEmail}) joined the organization as ${memberJoined.role}`,
      }
    }
    case NotificationType.LEAD_CREATED: {
      const leadCreated = data as NotificationData[NotificationType.LEAD_CREATED]
      return {
        title: 'New lead',
        description: `Lead ${leadCreated.leadName || leadCreated.leadEmail} created${leadCreated.source ? ` via ${leadCreated.source}` : ''}`,
      }
    }
    case NotificationType.SUBSCRIPTION_CREATED: {
      const subscriptionCreated =
        data as NotificationData[NotificationType.SUBSCRIPTION_CREATED]
      return {
        title: 'Subscription activated',
        description: `Plan ${subscriptionCreated.planName} activated (${subscriptionCreated.currency} ${subscriptionCreated.amount})`,
      }
    }
    case NotificationType.INTEGRATION_CONNECTED: {
      const integrationConnected =
        data as NotificationData[NotificationType.INTEGRATION_CONNECTED]
      return {
        title: 'Integration connected',
        description: `Integration ${integrationConnected.provider}${integrationConnected.name ? ` (${integrationConnected.name})` : ''} connected`,
      }
    }
    case NotificationType.API_KEY_CREATED: {
      const apiKeyCreated = data as NotificationData[NotificationType.API_KEY_CREATED]
      return {
        title: 'API Key created',
        description: `New API Key "${apiKeyCreated.description}" created (${apiKeyCreated.keyPreview})`,
      }
    }
    case NotificationType.SYSTEM_MAINTENANCE: {
      const maintenanceData =
        data as NotificationData[NotificationType.SYSTEM_MAINTENANCE]
      return {
        title: maintenanceData.title || 'System maintenance',
        description: maintenanceData.description,
      }
    }
    case NotificationType.GENERAL: {
      const generalData = data as NotificationData[NotificationType.GENERAL]
      return { title: generalData.title, description: generalData.description }
    }
    default:
      return {
        title: 'Notification',
        description: 'You have a new notification',
      }
  }
}
