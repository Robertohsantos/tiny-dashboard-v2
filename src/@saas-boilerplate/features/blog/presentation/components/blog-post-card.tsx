import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatRelative, parseISO } from 'date-fns'
import { ArrowUpRightIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { BlogPostCardProps } from './types'

/**
 * BlogPostCard Component
 *
 * Displays a blog post in card format with author, date, tags, and excerpt.
 * Optimized for different layouts and responsive design.
 *
 * ## Features
 * - **Multiple Variants**: Default, featured, and compact layouts
 * - **Responsive Design**: Adapts to different screen sizes
 * - **SEO Optimized**: Proper semantic HTML and image optimization
 * - **Accessibility**: Screen reader friendly with proper ARIA labels
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Default card
 * <BlogPostCard post={post} />
 *
 * // Featured variant with full excerpt
 * <BlogPostCard
 *   post={post}
 *   variant="featured"
 *   showExcerpt={true}
 *   showAuthor={true}
 *   showDate={true}
 *   showTags={true}
 * />
 *
 * // Compact variant for sidebar
 * <BlogPostCard
 *   post={post}
 *   variant="compact"
 *   maxExcerptLength={100}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the blog post card
 */
export function BlogPostCard({
  post,
  variant = 'default',
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showTags = true,
  maxExcerptLength = 150,
  className = '',
}: BlogPostCardProps) {
  // Generate excerpt if needed
  const excerpt = React.useMemo(() => {
    if (!showExcerpt || !post.excerpt) return null

    const text =
      post.excerpt.length > maxExcerptLength
        ? `${post.excerpt.substring(0, maxExcerptLength)}...`
        : post.excerpt

    return text
  }, [post.excerpt, maxExcerptLength, showExcerpt])

  // Card styling based on variant
  const cardClasses = React.useMemo(() => {
    const baseClasses =
      'group w-full bg-white border rounded-md hover:bg-accent transition-all duration-200'

    switch (variant) {
      case 'featured':
        return `${baseClasses} p-6 h-72 flex flex-col justify-between hover:bg-accent`
      case 'compact':
        return `${baseClasses} p-4 flex gap-4 hover:bg-accent`
      default:
        return `${baseClasses} p-6 flex flex-col justify-between`
    }
  }, [variant])

  return (
    <Link href={`/blog/${post.slug}`} className={cardClasses}>
      <div className={className}>
        {/* Compact variant layout */}
        {variant === 'compact' && post.cover && (
          <div className="flex-shrink-0">
            <Image
              src={post.cover}
              alt={post.title}
              width={120}
              height={80}
              className="w-32 h-20 object-cover rounded-md"
            />
          </div>
        )}

        <div className={variant === 'compact' ? 'flex-1 min-w-0' : 'flex-1'}>
          {/* Author and Date */}
          {(showAuthor || showDate) && (
            <div className="flex items-center space-x-2 text-xs mb-6">
              {showAuthor && (
                <div className="flex items-center space-x-2">
                  <Avatar className="size-4 rounded-full">
                    <AvatarFallback>
                      {post.author?.[0]?.toUpperCase()}
                    </AvatarFallback>
                    <AvatarImage src={post.authorImage} />
                  </Avatar>
                  <span className="text-muted-foreground">{post.author}</span>
                </div>
              )}

              {showDate && (
                <span className="text-muted-foreground">
                  {formatRelative(parseISO(post.date), new Date())}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {showTags && post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
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

          {/* Title */}
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-2 line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {excerpt}
            </p>
          )}

          {/* Featured image for default/featured variants */}
          {variant !== 'compact' && post.cover && (
            <div className="mt-4">
              <Image
                src={post.cover}
                alt={post.title}
                width={400}
                height={200}
                className="w-full h-32 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        {/* Read more indicator */}
        <div className="mt-4 flex items-center text-xs text-primary font-medium">
          <span>Read more</span>
          <ArrowUpRightIcon className="ml-1 size-3 opacity-30" />
        </div>
      </div>
    </Link>
  )
}
