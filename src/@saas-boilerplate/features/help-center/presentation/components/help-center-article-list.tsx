/**
 * Help Center Article List Component
 *
 * Server component that displays a list of articles for a help center category.
 * Shows article cards with metadata, tags, and navigation links.
 *
 * @module HelpCenterArticleList
 */

import { Link } from 'next-view-transitions'
import { ChevronRightIcon, CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { HelpArticle } from '../../help-center.interface'

/**
 * Props for the HelpCenterArticleList component
 */
export interface HelpCenterArticleListProps {
  /** Array of articles to display */
  articles: HelpArticle[]
  /** Category slug for URL construction */
  categorySlug: string
  /** Total number of articles in the category */
  totalArticles: number
  /** Optional CSS class name */
  className?: string
}

/**
 * HelpCenterArticleList Component
 *
 * Displays a list of articles for a help center category with
 * article metadata, tags, and navigation functionality.
 *
 * ## Features
 * - **Article Cards**: Displays article title, description, and metadata
 * - **Date Formatting**: Shows article publication dates
 * - **Tag Display**: Shows article tags with overflow handling
 * - **Navigation**: Links to individual article pages
 * - **Empty State**: Handles cases with no articles
 * - **Responsive Design**: Adapts to different screen sizes
 *
 * ## Usage Examples
 *
 * ```tsx
 * <HelpCenterArticleList
 *   articles={categoryArticles}
 *   categorySlug="getting-started"
 *   totalArticles={15}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the article list
 */
export function HelpCenterArticleList({
  articles,
  categorySlug,
  totalArticles,
  className = '',
}: HelpCenterArticleListProps) {
  // Empty state
  if (!articles || articles.length === 0) {
    return (
      <main
        className={`space-y-4 pb-8 min-h-[calc(100vh-10rem)] border-b ${className}`}
      >
        <div className="container mx-auto max-w-screen-lg space-y-4">
          <div className="border rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No articles found
            </h3>
            <p className="text-muted-foreground">
              There are no articles in this category yet.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className={`space-y-4 pb-8 min-h-[calc(100vh-10rem)] border-b ${className}`}
    >
      <div className="container mx-auto max-w-screen-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Articles</h2>
          <Badge variant="secondary">{totalArticles} total</Badge>
        </div>

        <div className="border rounded-lg divide-y">
          {articles.map((post, index) => (
            <Link
              href={`/help/${categorySlug}/${post.slug.split('/').pop()}`}
              key={index}
              className="flex gap-4 p-6 text-sm w-full items-center justify-between hover:bg-secondary cursor-pointer transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium group-hover:text-primary transition-colors">
                  {post.data.title}
                </h3>
                {post.data.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {post.data.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-3" />
                    {new Date(post.data.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {post.data.tags && post.data.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>Tags:</span>
                      <div className="flex gap-1">
                        {post.data.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {post.data.tags.length > 3 && (
                          <span className="text-xs">
                            +{post.data.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRightIcon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
