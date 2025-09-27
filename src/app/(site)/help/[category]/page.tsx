import type { Metadata } from 'next/types'

import { notFound } from 'next/navigation'
import { api } from '@/igniter.client'
import {
  generateMetadata as baseGenerateMetadata,
  getPageMetadata,
} from '@/modules/site'
import { HelpCenterCategoryHeader } from '@/@saas-boilerplate/features/help-center/presentation/components/help-center-category-header'
import { HelpCenterArticleList } from '@/@saas-boilerplate/features/help-center/presentation/components/help-center-article-list'
import { String } from '@/@saas-boilerplate/utils/string'
import {
  CollectionPageJsonLd,
  createCollectionPageSchema,
  createWebPageBreadcrumb,
} from '@/modules/core/seo'
import { AppConfig } from '@/config/boilerplate.config.client'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PageProps {
  params: Promise<{
    category: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params

  // Get all articles and group by category using API
  const articlesResponse = await api.helpCenter.listArticles.query({
    query: {
      category: categorySlug,
      limit: 1000, // Get all articles for this category
    },
  })

  const category = articlesResponse?.data?.articles || []

  if (!category) {
    return baseGenerateMetadata(getPageMetadata('not-found'))
  }

  const categoryName =
    category[0]?.data.category || String.formatCategoryLabel(categorySlug)

  return baseGenerateMetadata({
    ...getPageMetadata('help-category'),
    title: categoryName,
    description: `Articles and tutorials about ${categoryName}.`,
    path: `/help/${categorySlug}`,
  })
}

export default async function HelpCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params

  // Get articles for this category using API
  const categoryResponse = await api.helpCenter.listArticles.query({
    query: {
      category: categorySlug,
      limit: 50,
    },
  })

  const category = categoryResponse?.data?.articles || []

  if (!category || category.length === 0) {
    return notFound()
  }

  const categoryName =
    category[0]?.data?.title || String.formatCategoryLabel(categorySlug)

  const categoryDescription = category[0]?.data?.description

  // Get all articles for search functionality using API
  const allArticlesResponse = await api.helpCenter.listArticles.query({
    query: {
      limit: 1000,
    },
  })

  const allArticles = allArticlesResponse?.data?.articles || []

  // Get category stats
  const totalArticles = category.length
  const latestArticle = category[0]
  const latestDate = latestArticle
    ? new Date(latestArticle.data?.date || '')
    : null

  // Create SEO structured data for collection page
  const collectionData = createCollectionPageSchema({
    name: categoryName,
    description:
      categoryDescription || `Articles and tutorials about ${categoryName}`,
    url: `${AppConfig.url}/help/${categorySlug}`,
    siteUrl: AppConfig.url,
    items: category.map((article: any) => ({
      name: article.data?.title || 'Help Article',
      description: article.data?.description || article.data?.excerpt || '',
      url: `${AppConfig.url}/help/${categorySlug}/${article.slug}`,
      datePublished: article.data?.date || new Date().toISOString(),
    })),
    breadcrumb: createWebPageBreadcrumb({
      items: [
        { name: AppConfig.name, url: AppConfig.url },
        { name: 'Help Center', url: `${AppConfig.url}/help` },
        { name: categoryName, url: `${AppConfig.url}/help/${categorySlug}` },
      ],
    }),
  })

  return (
    <div className="px-4 space-y-8">
      {/* SEO Structured Data */}
      <CollectionPageJsonLd collectionPage={collectionData} />

      {/* Category Header */}
      <HelpCenterCategoryHeader
        categorySlug={categorySlug}
        categoryName={categoryName}
        categoryDescription={categoryDescription}
        latestDate={latestDate}
        allArticles={allArticles}
      />

      {/* Articles List */}
      <HelpCenterArticleList
        articles={category}
        categorySlug={categorySlug}
        totalArticles={totalArticles}
      />
    </div>
  )
}
