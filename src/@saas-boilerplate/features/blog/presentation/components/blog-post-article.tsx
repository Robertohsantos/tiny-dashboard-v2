import * as React from 'react'
import { ChevronRightIcon } from 'lucide-react'
import { Markdown } from '@/components/ui/markdown'
import { Link } from 'next-view-transitions'
import { SiteTableOfContents } from '@/modules/site'
import { format as formatDate } from 'date-fns'
import { AppConfig } from '@/config/boilerplate.config.client'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { BlogPostResponse } from '../../blog.interface'
import type { ContentHeading } from '@/@saas-boilerplate/providers/content-layer/types'

type BlogHeading = NonNullable<BlogPostResponse['post']['headings']>[number]

const isBlogHeading = (value: unknown): value is BlogHeading =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  'title' in value &&
  'path' in value &&
  'level' in value

const mapHeading = (heading: BlogHeading): ContentHeading => {
  const childItems = Array.isArray(heading.items)
    ? heading.items.filter(isBlogHeading).map(mapHeading)
    : []

  return {
    id: heading.id,
    title: heading.title,
    path: heading.path,
    level: heading.level,
    items: childItems,
  }
}

const transformHeadings = (
  headings: BlogPostResponse['post']['headings'],
): ContentHeading[] => {
  if (!Array.isArray(headings)) {
    return []
  }

  return headings.filter(isBlogHeading).map(mapHeading)
}

export interface BlogPostArticleProps {
  post: BlogPostResponse['post']
  related: BlogPostResponse['related']
  slug: string
}

/**
 * BlogPostArticle Component
 *
 * Renders a complete blog post article with the same design as help-center-article.
 * Includes breadcrumb navigation, table of contents, and clean layout.
 *
 * @param props - Component props
 * @returns JSX element representing the blog post article
 */
export function BlogPostArticle({ post, related, slug }: BlogPostArticleProps) {
  return (
    <article className="marketing-content pb-16 border-b">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto max-w-screen-lg text-left py-8 h-64 flex flex-col">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">{AppConfig.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{post?.title || 'Blog Post'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-6 mt-auto">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">
                Published on{' '}
                {post?.date
                  ? formatDate(post.date, 'MMM d, yyyy')
                  : 'Unknown date'}
              </p>
              <h1 className="text-lg font-bold">
                {post?.title || 'Blog Post'}
              </h1>
              {post?.excerpt && (
                <p className="text-lg text-muted-foreground mt-2">
                  {post?.excerpt}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="container mx-auto max-w-screen-lg grid md:grid-cols-[1fr_240px] gap-8">
          <div className="pt-8 space-y-8">
            <Markdown>{post.content || ''}</Markdown>

            <section className="space-y-4 border-t pt-8">
              <header>
                <h2 className="font-bold text-lg">You might also like</h2>
              </header>
              <main>
                <div className="rounded-md border divide-y">
                  {related?.map((item, index) => (
                    <Link
                      key={`${item.slug}-${index}`}
                      href={`/blog/${item.slug}`}
                      className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-secondary transition-colors"
                    >
                      <h2 className="text-sm font-medium">
                        {item?.title || 'Related Post'}
                      </h2>
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    </Link>
                  )) || []}
                </div>
              </main>
            </section>
          </div>
          <aside className="relative py-8">
            <SiteTableOfContents
              content={{
                id: post.id,
                slug: post.slug,
                excerpt: post.excerpt || '',
                content: post.content,
                data: {
                  title: post.title,
                  date: post.date,
                  author: post.author,
                  tags: post.tags,
                  cover: post.cover,
                },
                headings: transformHeadings(post.headings),
              }}
              className="sticky top-24"
            />
          </aside>
        </div>
      </main>
    </article>
  )
}
