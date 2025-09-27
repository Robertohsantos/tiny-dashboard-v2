import * as React from 'react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { BlogPostNavigationProps } from './types'

/**
 * BlogPostNavigation Component
 *
 * Navigation component for previous/next blog post links.
 * Provides seamless navigation between related articles.
 *
 * ## Features
 * - **Previous/Next Navigation**: Links to adjacent posts
 * - **Flexible Display**: Optional titles and excerpts
 * - **Responsive Design**: Adapts to different screen sizes
 * - **Accessibility**: Proper ARIA labels and keyboard navigation
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Full navigation with titles and excerpts
 * <BlogPostNavigation
 *   previousPost={previousPost}
 *   nextPost={nextPost}
 *   showTitles={true}
 *   showExcerpt={true}
 * />
 *
 * // Minimal navigation with titles only
 * <BlogPostNavigation
 *   previousPost={previousPost}
 *   nextPost={nextPost}
 *   showTitles={true}
 *   showExcerpt={false}
 * />
 *
 * // Excerpt only navigation
 * <BlogPostNavigation
 *   nextPost={nextPost}
 *   showTitles={false}
 *   showExcerpt={true}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing post navigation
 */
export function BlogPostNavigation({
  previousPost,
  nextPost,
  showTitles = true,
  showExcerpt = false,
  className = '',
}: BlogPostNavigationProps) {
  // Handle empty state
  if (!previousPost && !nextPost) {
    return null
  }

  return (
    <nav
      className={`flex items-center justify-between gap-4 pt-8 border-t ${className}`}
      aria-label="Post navigation"
    >
      {/* Previous Post */}
      <div className="flex-1 min-w-0">
        {previousPost ? (
          <Link
            href={`/blog/${previousPost.slug}`}
            className="group flex items-center gap-3 p-4 rounded-lg hover:bg-accent transition-colors"
            aria-label={`Previous post: ${previousPost.title}`}
          >
            <ChevronLeftIcon className="size-5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground mb-1">Previous</p>
              {showTitles && (
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                  {previousPost.title}
                </h3>
              )}
              {showExcerpt && previousPost.excerpt && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {previousPost.excerpt}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <div className="p-4 opacity-50">
            <p className="text-sm text-muted-foreground">No previous post</p>
          </div>
        )}
      </div>

      {/* Next Post */}
      <div className="flex-1 min-w-0 text-right">
        {nextPost ? (
          <Link
            href={`/blog/${nextPost.slug}`}
            className="group flex items-center justify-end gap-3 p-4 rounded-lg hover:bg-accent transition-colors"
            aria-label={`Next post: ${nextPost.title}`}
          >
            <div className="min-w-0 flex-1 text-right">
              <p className="text-sm text-muted-foreground mb-1">Next</p>
              {showTitles && (
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                  {nextPost.title}
                </h3>
              )}
              {showExcerpt && nextPost.excerpt && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {nextPost.excerpt}
                </p>
              )}
            </div>
            <ChevronRightIcon className="size-5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
          </Link>
        ) : (
          <div className="p-4 opacity-50 text-right">
            <p className="text-sm text-muted-foreground">No next post</p>
          </div>
        )}
      </div>
    </nav>
  )
}
