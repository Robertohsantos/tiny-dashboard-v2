/**
 * Help Center Category Grid Component
 *
 * Server component that displays a responsive grid of help center categories.
 * Uses static category data with dynamic article counts.
 */

import { HelpCenterCategoryCard } from './help-center-category-card'
import { api } from '@/igniter.client'

/**
 * Props for the HelpCenterCategoryGrid component
 */
export interface HelpCenterCategoryGridProps {
  /** Optional CSS class name */
  className?: string
}

/**
 * HelpCenterCategoryGrid Component
 *
 * Server component that renders a responsive grid layout of help center categories.
 * Fetches article counts dynamically and uses static category definitions.
 *
 * @param props - Component props
 * @returns JSX element representing the category grid
 */
export async function HelpCenterCategoryGrid({
  className = '',
}: HelpCenterCategoryGridProps) {
  // Get categories with article counts from API
  const categoriesResponse = await api.helpCenter.getCategories.query()

  // Use categories from API response
  const categories = categoriesResponse?.data?.categories || []

  // Empty state
  if (categories.length === 0) {
    return (
      <section className={className}>
        <div className="container mx-auto max-w-screen-lg">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No categories available
            </h3>
            <p className="text-muted-foreground">
              Check back later for help center categories.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Success state
  return (
    <section className={className}>
      <div className="container mx-auto max-w-screen-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <HelpCenterCategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
}
