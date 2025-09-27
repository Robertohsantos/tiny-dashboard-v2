import type { Metadata } from 'next/types'
import {
  SiteCTA,
  SiteFaqSection,
  SiteFeaturedSection,
  SitePricingSection,
  generateMetadata,
  getPageMetadata,
} from '@/modules/site'
import { api } from '@/igniter.client'

export const metadata: Metadata = generateMetadata(getPageMetadata('pricing'))

export default async function Page() {
  // Fetch plans on server side
  const plansResponse = await api.plan.findMany.query()
  const plans = (plansResponse.data || []).map((plan) => ({
    ...plan,
    description: plan.description || '', // Ensure description is never undefined
  }))

  return (
    <div>
      <SitePricingSection plans={plans} />
      <SiteFeaturedSection />
      <SiteFaqSection />
      <SiteCTA />
    </div>
  )
}
