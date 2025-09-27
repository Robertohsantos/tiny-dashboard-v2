import * as React from 'react'
import Link from 'next/link'
import { formatRelative, parseISO } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { BlogPostListProps } from './types'

/**
 * BlogPostList Component
 *
 * Displays blog posts in a vertical list format with separators.
 * Optimized for readability and mobile responsiveness.
 *
 * ## Features
 * - **List Layout**: Vertical stacking with optional separators
 * - **Flexible Display**: Configurable author, date, tags, and excerpt
 * - **Mobile Optimized**: Responsive design for all screen sizes
 * - **Performance**: Efficient rendering with proper keys
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Basic list with all features
 * <BlogPostList posts={posts} />
 *
 * // Minimal list for sidebar
 * <BlogPostList
 *   posts={recentPosts}
 *   showExcerpt={false}
 *   showTags={false}
 *   showSeparator={false}
 * />
 *
 * // Custom excerpt length
 * <BlogPostList
 *   posts={posts}
 *   maxExcerptLength={100}
 *   showAuthor={true}
 *   showDate={true}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the blog post list
 */
export function BlogPostList({
  posts,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showTags = true,
  maxExcerptLength = 200,
  showSeparator = true,
  className = '',
}: BlogPostListProps) {
  // Handle empty state
  if (!posts || posts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No blog posts found.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {posts.map((post, index) => (
        <article
          key={post.id}
          className={`group ${showSeparator && index < posts.length - 1 ? 'border-b pb-6' : ''}`}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="block hover:bg-accent/50 -mx-4 px-4 py-4 rounded-md transition-colors"
          >
            <div className="space-y-3">
              {/* Header with author and date */}
              {(showAuthor || showDate) && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    {showAuthor && (
                      <>
                        <Avatar className="size-4 rounded-full">
                          <AvatarFallback>
                            {post.author?.[0]?.toUpperCase()}
                          </AvatarFallback>
                          <AvatarImage src={post.authorImage} />
                        </Avatar>
                        <span>{post.author}</span>
                      </>
                    )}
                  </div>

                  {showDate && (
                    <span>
                      {formatRelative(parseISO(post.date), new Date())}
                    </span>
                  )}
                </div>
              )}

              {/* Title */}
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight">
                {post.title}
              </h3>

              {/* Excerpt */}
              {showExcerpt && post.excerpt && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {post.excerpt.length > maxExcerptLength
                    ? `${post.excerpt.substring(0, maxExcerptLength)}...`
                    : post.excerpt}
                </p>
              )}

              {/* Tags */}
              {showTags && post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs px-2 py-0.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      +{post.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Link>
        </article>
      ))}
    </div>
  )
}
