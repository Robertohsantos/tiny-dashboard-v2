import { Metadata } from 'next'
import {
  generateMetadata,
  getPageMetadata,
  SiteCTA,
} from '@/modules/site'
import { api } from '@/igniter.client'
import {
  BlogHeader,
  BlogPostGrid,
} from '@/@saas-boilerplate/features/blog/presentation/components'
import { WebPageJsonLd, createWebPageSchema } from '@/modules/core/seo'

export const metadata: Metadata = generateMetadata(getPageMetadata('blog'))

export default async function Page() {
  const featuredPostsResponse = await api.blog.listPosts.query({
    query: {
      limit: 3,
      featured: true,
    },
  })

  const latestPostsResponse = await api.blog.listPosts.query({
    query: {
      limit: 12,
    },
  })

  const featured = featuredPostsResponse.data?.posts || []
  const latest = latestPostsResponse.data?.posts || []

  // Create webpage structured data
  const webpageData = createWebPageSchema({
    name: 'Latest Articles',
    description:
      'Discover our latest blog posts and insights on technology, business, and innovation.',
    url: '/blog',
    siteUrl: 'https://example.com',
  })

  return (
    <div className="bg-secondary dark:bg-secondary/20">
      {/* SEO Structured Data */}
      <WebPageJsonLd webpage={webpageData} />

      {/* Header with Search */}
      <BlogHeader
        title="Latest Articles"
        description="Discover our latest insights and stories"
        showSearch={true}
      />

      <div className="space-y-16">
        {/* Featured Posts */}
        {featured.length > 0 && (
          <section>
            <div className="container mx-auto max-w-screen-lg">
              <BlogPostGrid
                variant="featured"
                showExcerpt={true}
                showAuthor={true}
                showDate={true}
                showTags={true}
                columns={3}
                posts={featured.map((post) => ({
                  title: post.data.title,
                  author: post.data.author || 'Anonymous',
                  date: post.data.date,
                  excerpt: post.excerpt,
                  slug: post.slug,
                  id: post.id,
                  content: post.content,
                }))}
              />
            </div>
          </section>
        )}

        {/* Latest Articles */}
        {latest.length > 0 && (
          <section className="space-y-8">
            <header>
              <div className="container mx-auto max-w-screen-lg">
                <h2 className="font-bold text-2xl">Latest Articles</h2>
                <p className="text-muted-foreground mt-2">
                  Stay updated with our recent publications
                </p>
              </div>
            </header>

            <div className="container mx-auto max-w-screen-lg">
              <BlogPostGrid
                showExcerpt={true}
                showAuthor={true}
                showDate={true}
                showTags={true}
                columns={1}
                posts={latest.map((post) => ({
                  title: post.data.title,
                  author: post.data.author || 'Anonymous',
                  date: post.data.date,
                  excerpt: post.excerpt,
                  slug: post.slug,
                  id: post.id,
                  content: post.content,
                }))}
              />
            </div>
          </section>
        )}
      </div>

      <SiteCTA className="py-16" />
    </div>
  )
}
