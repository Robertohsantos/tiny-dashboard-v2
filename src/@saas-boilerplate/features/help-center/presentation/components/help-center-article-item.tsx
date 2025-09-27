/**
 * Help Center Article Item Component
 *
 * Displays an individual article item within article lists.
 * Includes title, category, date, and navigation functionality.
 */

'use client'

import { Link } from 'next-view-transitions'
import { ArrowUpRightIcon } from 'lucide-react'
import type { HelpArticle } from '../../help-center.interface'

/**
 * Props for the HelpCenterArticleItem component
 */
export interface HelpCenterArticleItemProps {
  /** Article data to display */
  article: HelpArticle
  /** Optional CSS class name */
  className?: string
  /** Show category information */
  showCategory?: boolean
  /** Show date information */
  showDate?: boolean
}

/**
 * HelpCenterArticleItem Component
 *
 * Renders a single article item with title, optional metadata,
 * and navigation functionality. Used within article lists.
 *
 * @param props - Component props
 * @returns JSX element representing the article item
 */
export function HelpCenterArticleItem({
  article,
  className = '',
  showCategory = false,
  showDate = false,
}: HelpCenterArticleItemProps) {
  const { slug, data } = article
  const { title, category, description, date } = data

  return (
    <Link
      href={`/help/${category}/${slug}`}
      className={`group flex w-full items-center justify-between py-4 transition-colors hover:underline ${className}`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {title}
        </h3>

        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}

        {(showCategory || showDate) && (
          <div className="flex items-center gap-2 mt-2">
            {showCategory && (
              <span className="text-xs text-muted-foreground capitalize">
                {category.replace('-', ' ')}
              </span>
            )}
            {showDate && date && (
              <span className="text-xs text-muted-foreground">
                {new Date(date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      </div>

      <ArrowUpRightIcon className="size-4 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100 flex-shrink-0 ml-2" />
    </Link>
  )
}
