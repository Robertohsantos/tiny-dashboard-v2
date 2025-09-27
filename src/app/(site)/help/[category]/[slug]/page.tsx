import type { Metadata } from 'next/types'

import { api } from '@/igniter.client'
import { notFound } from 'next/navigation'
import { generateMetadata as baseGenerateMetadata } from '@/modules/site'
import { HelpCenterArticle } from '@/@saas-boilerplate/features/help-center/presentation/components/help-center-article'
import {
  ArticleJsonLd,
  createArticleSchema,
  createArticleBreadcrumb,
} from '@/modules/core/seo'
import { AppConfig } from '@/config/boilerplate.config.client'
import type { BaseContent } from '@/@saas-boilerplate/features/content/content.interface'
import {
  HELP_CONSTANTS,
  type HelpArticle,
  type HelpCategorySlug,
} from '@/@saas-boilerplate/features/help-center/help-center.interface'

const ALLOWED_HELP_CATEGORIES = Object.keys(
  HELP_CONSTANTS.CATEGORY_COLORS,
) as HelpCategorySlug[]

const isHelpCategorySlug = (value: unknown): value is HelpCategorySlug =>
  typeof value === 'string' &&
  ALLOWED_HELP_CATEGORIES.some((slug) => slug === value)

const toHelpArticle = (content: BaseContent): HelpArticle | null => {
  const { data } = content

  if (!data || typeof data !== 'object') {
    return null
  }

  const title = typeof data.title === 'string' ? data.title : 'Help Article'
  const category = isHelpCategorySlug((data as { category?: unknown }).category)
    ? ((data as { category?: HelpCategorySlug }).category as HelpCategorySlug)
    : undefined

  if (!category) {
    return null
  }

  const tagsRaw = (data as { tags?: unknown }).tags
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((tag): tag is string => typeof tag === 'string')
    : undefined

  const excerpt = typeof data.excerpt === 'string' ? data.excerpt : undefined
  const description =
    typeof (data as { description?: unknown }).description === 'string'
      ? ((data as { description?: string }).description ?? undefined)
      : undefined

  const dateStr = typeof data.date === 'string' ? data.date : undefined

  const author = typeof data.author === 'string' ? data.author : undefined
  const authorImage =
    typeof data.authorImage === 'string' ? data.authorImage : undefined

  const popular = typeof (data as { popular?: unknown }).popular === 'boolean'
    ? ((data as { popular?: boolean }).popular ?? undefined)
    : undefined

  const featured =
    typeof (data as { featured?: unknown }).featured === 'boolean'
      ? ((data as { featured?: boolean }).featured ?? undefined)
      : undefined

  const readingTime =
    typeof (data as { readingTime?: unknown }).readingTime === 'number'
      ? ((data as { readingTime?: number }).readingTime as number)
      : undefined

  const safeDate = dateStr ?? new Date().toISOString()

  return {
    id: content.id,
    slug: content.slug,
    excerpt: content.excerpt,
    content: content.content,
    data: {
      title,
      category,
      tags,
      date: safeDate,
      description,
      excerpt,
      author,
      authorImage,
    },
    headings: content.headings,
    readingTime,
    popular,
    featured,
  }
}

const mapRelatedArticles = (
  posts: BaseContent[] | null | undefined,
): HelpArticle[] =>
  (posts ?? [])
    .map((entry) => toHelpArticle(entry))
    .filter((article): article is HelpArticle => article !== null)

// Configure dynamic behavior
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type PageProps = {
  params: Promise<{ slug: string; category: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, category } = await params

  const post = await api.content.get.query({
    query: {
      type: 'help',
      slug,
      category,
    },
  })

  const article = post?.data ? toHelpArticle(post.data) : null

  if (!article) {
    return baseGenerateMetadata({
      title: 'Article Not Found',
      description: 'The help article you are looking for could not be found.',
      path: `/help/${category}/${slug}`,
      noIndex: true,
    })
  }

  const postTitle = article.data.title || 'Help Article'
  const postExcerpt = article.data.excerpt || article.excerpt || ''

  return baseGenerateMetadata({
    title: postTitle,
    description: postExcerpt.substring(0, 160),
    path: `/help/${category}/${slug}`,
    keywords: ['Help Center', 'Support', postTitle],
  })
}

export default async function Page({ params }: PageProps) {
  const { slug, category } = await params

  if (!isHelpCategorySlug(category)) {
    return notFound()
  }

  const categorySlug = category

  const post = await api.content.get.query({
    query: {
      type: 'help',
      slug,
      category,
    },
  })

  const related = await api.content.related.query({
    query: {
      type: 'help',
      slug,
      category,
    },
  })

  const article = post?.data ? toHelpArticle(post.data) : null

  if (!article) return notFound()

  const relatedArticles = mapRelatedArticles(related?.data)

  // Create SEO structured data for article
  const categoryName = categorySlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
  const articleData = createArticleSchema({
    headline: article.data.title || 'Help Article',
    description: article.data.excerpt || article.excerpt || '',
    datePublished: article.data.date || new Date().toISOString(),
    author: {
      name: article.data.author || 'Help Center',
    },
    publisher: {
      name: AppConfig.name,
      url: AppConfig.url,
      logo: AppConfig.brand.logo.light,
    },
    url: `${AppConfig.url}/help/${categorySlug}/${slug}`,
    section: categoryName,
    keywords: article.data.tags || [],
    breadcrumb: createArticleBreadcrumb({
      items: [
        { name: AppConfig.name, url: AppConfig.url },
        { name: 'Help Center', url: `${AppConfig.url}/help` },
        { name: categoryName, url: `${AppConfig.url}/help/${categorySlug}` },
        {
          name: article.data.title || 'Article',
          url: `${AppConfig.url}/help/${categorySlug}/${slug}`,
        },
      ],
    }),
  })

  return (
    <>
      {/* SEO Structured Data */}
      <ArticleJsonLd article={articleData} />

      <HelpCenterArticle
        post={article}
        related={relatedArticles}
        slug={slug}
        category={categorySlug}
      />
    </>
  )
}
