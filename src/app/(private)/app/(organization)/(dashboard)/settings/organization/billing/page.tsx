import {
  PageWrapper,
  PageHeader,
  PageMainBar,
  PageBody,
} from '@/components/ui/page'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { CurrentTierSection } from '@/@saas-boilerplate/features/billing/presentation/components/billing-current-tier-section'
import { BillingCurrentUsageSection } from '@/@saas-boilerplate/features/billing/presentation/components/billing-current-usage-section'
import { BillingChangeEmailSection } from '@/@saas-boilerplate/features/billing/presentation/components/billing-change-email-form'
import { BillingTrialInfoSection } from '@/@saas-boilerplate/features/billing/presentation/components/billing-trial-info-section'
import { BillingAlertsSection } from '@/@saas-boilerplate/features/billing/presentation/components/billing-alerts-section'

export const metadata = {
  title: 'Billing',
  description:
    "Manage your organization's billing information, subscription plan, and usage metrics",
}

export default function Page() {
  return (
    <PageWrapper>
      <PageHeader>
        <PageMainBar>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/app/settings">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/app/settings/organization">
                  Organization
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Billing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
      </PageHeader>
      <PageBody>
        <div className="container max-w-screen-md space-y-12">
          <BillingAlertsSection />
          <BillingTrialInfoSection />
          <CurrentTierSection />
          <BillingCurrentUsageSection />
          <BillingChangeEmailSection />
        </div>
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
