import { Metadata } from 'next'
import { generateMetadata, getPageMetadata, SiteCTA } from '@/modules/site'
import { HelpCenterHeader } from '@/@saas-boilerplate/features/help-center/presentation/components/help-center-header'
import { HelpCenterPopularArticles } from '@/@saas-boilerplate/features/help-center/presentation/components/help-center-popular-articles'
import { HelpCenterCategoryGrid } from '@/@saas-boilerplate/features/help-center/presentation/components/help-center-category-grid'
import {
  WebPageJsonLd,
  createWebPageSchema,
  createWebPageBreadcrumb,
} from '@/modules/core/seo'
import { AppConfig } from '@/config/boilerplate.config.client'

export const metadata: Metadata = generateMetadata(getPageMetadata('help'))

export default function Page() {
  // Create SEO structured data
  const webpageData = createWebPageSchema({
    name: 'Help Center',
    description: `Get help with ${AppConfig.name}. Find answers to common questions and get support for your SaaS application.`,
    url: `${AppConfig.url}/help`,
    siteUrl: AppConfig.url,
    breadcrumb: createWebPageBreadcrumb({
      items: [
        { name: AppConfig.name, url: AppConfig.url },
        { name: 'Help Center', url: `${AppConfig.url}/help` },
      ],
    }),
  })

  return (
    <div className="bg-secondary dark:bg-secondary/20">
      {/* SEO Structured Data */}
      <WebPageJsonLd webpage={webpageData} />

      <HelpCenterHeader />
      <div className="py-16 space-y-24">
        <HelpCenterPopularArticles />
        <HelpCenterCategoryGrid />
      </div>
      <SiteCTA />
    </div>
  )
}
