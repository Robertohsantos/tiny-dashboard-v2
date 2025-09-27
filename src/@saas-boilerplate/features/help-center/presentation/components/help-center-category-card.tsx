/**
 * Help Center Category Card Component
 *
 * Displays an individual help center category with icon, title, description,
 * and article count in a clickable card format.
 */

'use client'

import { Link } from 'next-view-transitions'
import type { HelpCategory } from '../../help-center.interface'

/**
 * Props for the HelpCenterCategoryCard component
 */
export interface HelpCenterCategoryCardProps {
  /** Category data to display */
  category: HelpCategory
  /** Optional CSS class name */
  className?: string
}

/**
 * HelpCenterCategoryCard Component
 *
 * Renders a clickable card for a help center category with visual indicators
 * and hover effects. Displays category icon, title, description, and article count.
 *
 * @param props - Component props
 * @returns JSX element representing the category card
 */
export function HelpCenterCategoryCard({
  category,
  className = '',
}: HelpCenterCategoryCardProps) {
  const { slug, title, description, icon, articleCount = 0 } = category

  return (
    <Link
      href={`/help/${slug}`}
      className={`group h-64 flex flex-col items-start justify-end rounded-md border p-6 bg-background hover:bg-secondary/60 transition-colors ${className}`}
    >
      {/* Category Content */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          {articleCount > 0 && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              {articleCount} article{articleCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  )
}
