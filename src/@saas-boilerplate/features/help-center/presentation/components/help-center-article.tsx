import { ChevronRightIcon } from 'lucide-react'
import { Markdown } from '@/components/ui/markdown'
import { Link } from 'next-view-transitions'
import { SiteTableOfContents } from '@/modules/site'
import { formatDate } from 'date-fns'
import { AppConfig } from '@/config/boilerplate.config.client'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { ContentTypeResult } from '@/@saas-boilerplate/providers/content-layer/types'
import type {
  HelpArticle,
  HelpCategorySlug,
} from '../../help-center.interface'

export interface HelpCenterArticleProps {
  post: HelpArticle
  related: HelpArticle[]
  slug: string
  category: HelpCategorySlug
}

export function HelpCenterArticle({
  post,
  related,
  slug: _slug,
  category,
}: HelpCenterArticleProps) {
  const tableOfContentsContent: ContentTypeResult = post

  const categoryName = category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

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
                <BreadcrumbLink href="/help">Help Center</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/help#${category}`}>
                  {categoryName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {post.data.title || 'Help Article'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-6 mt-auto">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">
                Published on{' '}
                {post.data.date
                  ? formatDate(post.data.date, 'MMM d, yyyy')
                  : 'Unknown date'}
              </p>
              <h1 className="text-lg font-bold">
                {post.data.title || 'Help Article'}
              </h1>
              {post.data.excerpt && (
                <p className="text-lg text-muted-foreground mt-2">
                  {post.data.excerpt}
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
                  {related.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/help/${item.slug}`}
                      className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-secondary transition-colors"
                    >
                      <h2 className="text-sm font-medium">
                        {item.data.title || 'Related Article'}
                      </h2>
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </main>
            </section>
          </div>
          <aside className="relative py-8">
            <SiteTableOfContents
              content={tableOfContentsContent}
              className="sticky top-24"
            />
          </aside>
        </div>
      </main>
    </article>
  )
}
