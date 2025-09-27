import type { Metadata } from 'next'
import {
  SiteCTA,
  SiteFaqSection,
  SiteTestimonialsSection,
  MainHeroSection,
  SitePricingSection,
  SiteInteractiveFeaturesSection,
  SiteUseCasesCarousel,
  generateMetadata,
  getPageMetadata,
} from '@/modules/site'
import { api } from '@/igniter.client'
import { AppConfig } from '@/config/boilerplate.config.client'
import { SITE_FAQ_ITEMS } from '@/content/site/site-faq-items'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
export const metadata: Metadata = generateMetadata(getPageMetadata('home'))

export default async function Page() {
  const plans = await api.plan.findMany.query()

  // Transform plans data to match the expected interface
  const transformedPlans = (plans.data ?? []).map((plan) => ({
    ...plan,
    description: plan.description ?? '', // Ensure description is always a string
  }))

  return (
    <div className="space-y-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: `${AppConfig.name} Demo`,
            url: AppConfig.url,
            logo: `${AppConfig.url}${AppConfig.brand.logo.light}`,
            sameAs: [
              AppConfig.links.twitter,
              AppConfig.links.linkedin,
              AppConfig.links.facebook,
              AppConfig.links.instagram,
              AppConfig.creator.links.github,
            ].filter(Boolean),
            contactPoint: [
              {
                '@type': 'ContactPoint',
                email: AppConfig.links.mail,
                contactType: 'customer support',
                availableLanguage: ['en', 'pt-BR'],
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: `${AppConfig.name} Demo`,
            url: AppConfig.url,
            inLanguage: 'pt-BR',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${AppConfig.url}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: SITE_FAQ_ITEMS.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          }),
        }}
      />

      <MainHeroSection />
      <SiteInteractiveFeaturesSection />
      <SiteUseCasesCarousel />
      <SitePricingSection plans={transformedPlans} />
      <SiteTestimonialsSection />
      <SiteFaqSection />
      <SiteCTA />
    </div>
  )
}
