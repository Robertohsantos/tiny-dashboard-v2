import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatRelative, parseISO } from 'date-fns'
import type { BlogRelatedPostsProps } from './types'

/**
 * BlogRelatedPosts Component
 *
 * Displays related blog posts in grid or list layout.
 * Optimized for engagement and cross-linking between content.
 *
 * ## Features
 * - **Flexible Layouts**: Grid or list display options
 * - **Responsive Design**: Adapts to different screen sizes
 * - **Content Preview**: Optional excerpts and metadata
 * - **SEO Benefits**: Internal linking improves site structure
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Grid layout with excerpts
 * <BlogRelatedPosts
 *   posts={relatedPosts}
 *   title="Related Articles"
 *   layout="grid"
 *   showExcerpt={true}
 *   showDate={true}
 *   maxPosts={3}
 * />
 *
 * // List layout for sidebar
 * <BlogRelatedPosts
 *   posts={relatedPosts}
 *   layout="list"
 *   showExcerpt={false}
 *   showDate={true}
 * />
 *
 * // Minimal display
 * <BlogRelatedPosts
 *   posts={relatedPosts}
 *   title="You might also like"
 *   showExcerpt={false}
 *   showDate={false}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing related blog posts
 */
export function BlogRelatedPosts({
  posts,
  currentPostSlug,
  title = 'Related Posts',
  maxPosts = 3,
  showExcerpt = true,
  showDate = true,
  layout = 'grid',
  className = '',
}: BlogRelatedPostsProps) {
  // Filter out current post and limit posts
  const displayPosts = React.useMemo(() => {
    const filtered = posts.filter((post) => post.slug !== currentPostSlug)
    return filtered.slice(0, maxPosts)
  }, [posts, currentPostSlug, maxPosts])

  // Handle empty state
  if (!displayPosts || displayPosts.length === 0) {
    return null
  }

  if (layout === 'list') {
    return (
      <section className={`space-y-4 ${className}`}>
        <header>
          <h2 className="font-bold text-lg">{title}</h2>
        </header>
        <div className="space-y-3">
          {displayPosts.map((post) => (
            <article key={post.id} className="border-b pb-3 last:border-b-0">
              <Link
                href={`/blog/${post.slug}`}
                className="block hover:bg-accent/50 -mx-2 px-2 py-2 rounded transition-colors"
              >
                <div className="space-y-2">
                  <h3 className="font-medium text-sm leading-tight hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  {showExcerpt && post.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {post.excerpt.length > 100
                        ? `${post.excerpt.substring(0, 100)}...`
                        : post.excerpt}
                    </p>
                  )}
                  {showDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(parseISO(post.date), new Date())}
                    </p>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    )
  }

  // Grid layout
  return (
    <section className={`space-y-6 ${className}`}>
      <header>
        <h2 className="font-bold text-lg">{title}</h2>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayPosts.map((post) => (
          <article key={post.id} className="group">
            <Link href={`/blog/${post.slug}`} className="block">
              <div className="space-y-3">
                {/* Cover image */}
                {post.cover && (
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={post.cover}
                      alt={post.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {showExcerpt && post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt.length > 120
                        ? `${post.excerpt.substring(0, 120)}...`
                        : post.excerpt}
                    </p>
                  )}

                  {showDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(parseISO(post.date), new Date())}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
