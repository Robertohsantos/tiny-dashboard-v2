import * as React from 'react'
import { BlogPostCard } from './blog-post-card'
import type { BlogFeaturedPostsProps } from './types'

/**
 * BlogFeaturedPosts Component
 *
 * Displays featured blog posts in a prominent layout.
 * Optimized for showcasing important or highlighted content.
 *
 * ## Features
 * - **Featured Layout**: Special styling for important posts
 * - **Flexible Display**: Configurable content and metadata
 * - **Responsive Grid**: Adapts to different screen sizes
 * - **Performance**: Efficient rendering with proper keys
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Featured posts with full details
 * <BlogFeaturedPosts
 *   posts={featuredPosts}
 *   title="Featured Articles"
 *   showExcerpt={true}
 *   showAuthor={true}
 *   showDate={true}
 *   showTags={true}
 *   maxPosts={3}
 * />
 *
 * // Minimal featured display
 * <BlogFeaturedPosts
 *   posts={featuredPosts}
 *   title="Spotlight"
 *   showExcerpt={false}
 *   maxPosts={2}
 * />
 *
 * // Custom excerpt length
 * <BlogFeaturedPosts
 *   posts={featuredPosts}
 *   maxExcerptLength={200}
 *   showAuthor={true}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing featured blog posts
 */
export function BlogFeaturedPosts({
  posts,
  title = 'Featured Posts',
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showTags = true,
  maxPosts = 3,
  className = '',
}: BlogFeaturedPostsProps) {
  // Limit posts to maxPosts
  const displayPosts = React.useMemo(() => {
    return posts?.slice(0, maxPosts) || []
  }, [posts, maxPosts])

  // Handle empty state
  if (!displayPosts || displayPosts.length === 0) {
    return null
  }

  return (
    <section className={`space-y-6 ${className}`}>
      {title && (
        <header>
          <h2 className="font-bold text-xl">{title}</h2>
        </header>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayPosts.map((post) => (
          <BlogPostCard
            key={post.id}
            post={post}
            variant="featured"
            showExcerpt={showExcerpt}
            showAuthor={showAuthor}
            showDate={showDate}
            showTags={showTags}
            className="h-full"
          />
        ))}
      </div>
    </section>
  )
}
