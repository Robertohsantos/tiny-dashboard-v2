import { igniter } from '@/igniter'
import { AccountController } from '@/@saas-boilerplate/features/account/controllers/account.controller'
import { ApiKeyController } from '@/@saas-boilerplate/features/api-key/controllers/api-key.controller'
import { AuthController } from '@/@saas-boilerplate/features/auth/controllers/auth.controller'
import { InvitationController } from '@/@saas-boilerplate/features/invitation/controllers/invitation.controller'
import { OrganizationController } from '@/@saas-boilerplate/features/organization/controllers/organization.controller'
import { MembershipController } from '@/@saas-boilerplate/features/membership/controllers/membership.controller'
import { UserController } from '@/@saas-boilerplate/features/user/controllers/user.controller'
import { WebhookController } from '@/@saas-boilerplate/features/webhook/controllers/webhook.controller'
import { SessionController } from '@/@saas-boilerplate/features/session/controllers/session.controller'
import { PlanController } from '@/@saas-boilerplate/features/plan/controllers/plan.controller'
import { LeadController } from './features/lead/controllers/lead.controller'
import { SubmissionController } from './features/submission/controllers/submission.controller'
import { IntegrationController } from './@saas-boilerplate/features/integration/controllers/integration.controller'
import { BillingController } from './@saas-boilerplate/features/billing/controllers/billing.controller'
import { ContentController } from './@saas-boilerplate/features/content/controllers/content.controller'
import { HelpCenterController } from './@saas-boilerplate/features/help-center/controllers/help-center.controller'
import { BlogController } from './@saas-boilerplate/features/blog/controllers/blog.controller'
import { NotificationController } from './@saas-boilerplate/features/notification/controllers/notification.controller'

export const AppRouter = igniter.router({
  controllers: {
    // SaaS Boilerplate controllers
    account: AccountController,
    apiKey: ApiKeyController,
    auth: AuthController,
    invitation: InvitationController,
    membership: MembershipController,
    organization: OrganizationController,
    integration: IntegrationController,
    user: UserController,
    webhook: WebhookController,
    session: SessionController,
    plan: PlanController,
    billing: BillingController,
    content: ContentController,
    helpCenter: HelpCenterController,
    blog: BlogController,
    notification: NotificationController,

    // Custom controllers
    submission: SubmissionController,
    lead: LeadController,
  },
})

export type AppRouterType = typeof AppRouter
