import * as React from 'react'
import { BlogPostCard } from './blog-post-card'
import type { BlogPostGridProps } from './types'

/**
 * BlogPostGrid Component
 *
 * Displays blog posts in a responsive grid layout.
 * Supports different variants and customization options.
 *
 * ## Features
 * - **Responsive Grid**: Automatically adjusts columns based on screen size
 * - **Multiple Variants**: Featured and default layouts
 * - **Flexible Configuration**: Customizable columns and display options
 * - **Performance Optimized**: Efficient rendering with proper keys
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Default 3-column grid
 * <BlogPostGrid posts={posts} />
 *
 * // Featured posts with 2 columns
 * <BlogPostGrid
 *   posts={featuredPosts}
 *   variant="featured"
 *   columns={2}
 *   showExcerpt={true}
 *   showAuthor={true}
 * />
 *
 * // Compact grid for sidebar
 * <BlogPostGrid
 *   posts={recentPosts}
 *   columns={1}
 *   showExcerpt={false}
 *   showTags={false}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the blog post grid
 */
export function BlogPostGrid({
  posts,
  variant = 'default',
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showTags = true,
  maxExcerptLength = 150,
  columns = 3,
  className = '',
}: BlogPostGridProps) {
  // Generate responsive grid classes based on column count
  const gridClasses = React.useMemo(() => {
    const baseClasses = 'grid gap-4'

    switch (columns) {
      case 1:
        return `${baseClasses} grid-cols-1`
      case 2:
        return `${baseClasses} grid-cols-1 md:grid-cols-2`
      case 3:
        return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
      case 4:
        return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
      default:
        return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
    }
  }, [columns])

  // Handle empty state
  if (!posts || posts.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">No blog posts found.</p>
      </div>
    )
  }

  return (
    <div className={gridClasses}>
      {posts.map((post) => (
        <BlogPostCard
          key={post.id}
          post={post}
          variant={variant}
          showExcerpt={showExcerpt}
          showAuthor={showAuthor}
          showDate={showDate}
          showTags={showTags}
          maxExcerptLength={maxExcerptLength}
          className="h-full"
        />
      ))}
    </div>
  )
}
