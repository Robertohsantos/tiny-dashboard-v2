import {
  Bell,
  UserPlus,
  CreditCard,
  Users,
  TrendingUp,
  Settings,
  AlertTriangle,
} from 'lucide-react'
import { NotificationType } from '@/@saas-boilerplate/features/notification/notification.interfaces'

export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.USER_INVITED:
      return <UserPlus className="h-4 w-4" />
    case NotificationType.BILLING_SUCCESS:
      return <CreditCard className="h-4 w-4" />
    case NotificationType.BILLING_FAILED:
      return <CreditCard className="h-4 w-4" />
    case NotificationType.MEMBER_JOINED:
      return <Users className="h-4 w-4" />
    case NotificationType.LEAD_CREATED:
      return <TrendingUp className="h-4 w-4" />
    case NotificationType.SUBSCRIPTION_CREATED:
      return <CreditCard className="h-4 w-4" />
    case NotificationType.INTEGRATION_CONNECTED:
      return <Settings className="h-4 w-4" />
    case NotificationType.API_KEY_CREATED:
      return <Settings className="h-4 w-4" />
    case NotificationType.SYSTEM_MAINTENANCE:
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}
