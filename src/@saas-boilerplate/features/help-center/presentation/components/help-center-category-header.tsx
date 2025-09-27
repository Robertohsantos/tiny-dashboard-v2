/**
 * Help Center Category Header Component
 *
 * Server component that displays the header section for help center category pages.
 * Includes breadcrumb navigation, category information, and search functionality.
 *
 * @module HelpCenterCategoryHeader
 */

import * as React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { HelpCenterSearch } from './help-center-search'
import { AppConfig } from '@/config/boilerplate.config.client'
import type { HelpArticle } from '../../help-center.interface'

/**
 * Props for the HelpCenterCategoryHeader component
 */
export interface HelpCenterCategoryHeaderProps {
  /** Category slug for URL construction */
  categorySlug: string
  /** Category name for display */
  categoryName: string
  /** Category description */
  categoryDescription?: string
  /** Latest article date for "last updated" info */
  latestDate?: Date | null
  /** All articles for search functionality */
  allArticles: HelpArticle[]
  /** Optional CSS class name */
  className?: string
}

/**
 * HelpCenterCategoryHeader Component
 *
 * Displays the header section for a help center category page with
 * breadcrumb navigation, category information, and search functionality.
 *
 * ## Features
 * - **Breadcrumb Navigation**: Shows navigation path from home to current category
 * - **Category Information**: Displays name, description, and last updated date
 * - **Search Integration**: Provides search functionality for the category
 * - **Responsive Design**: Adapts to different screen sizes
 *
 * ## Usage Examples
 *
 * ```tsx
 * <HelpCenterCategoryHeader
 *   categorySlug="getting-started"
 *   categoryName="Getting Started"
 *   categoryDescription="Learn the basics of our platform"
 *   latestDate={new Date('2024-01-15')}
 *   allArticles={articles}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the category header
 */
export function HelpCenterCategoryHeader({
  categorySlug,
  categoryName,
  categoryDescription,
  latestDate,
  allArticles,
  className = '',
}: HelpCenterCategoryHeaderProps) {
  return (
    <header
      id={`help-category-${categorySlug}`}
      className={`border-b bg-secondary dark:bg-secondary/20 ${className}`}
    >
      <div className="container mx-auto max-w-screen-lg text-left py-8 h-64">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{AppConfig.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/help">Help Center</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{categoryName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-bold">{categoryName}</h1>

            {categoryDescription && (
              <p className="text-muted-foreground max-w-2xl">
                {categoryDescription}
              </p>
            )}

            {latestDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Last updated{' '}
                  {latestDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <HelpCenterSearch
            articles={allArticles}
            placeholder={`Search in ${categoryName}...`}
          />
        </div>
      </div>
    </header>
  )
}
