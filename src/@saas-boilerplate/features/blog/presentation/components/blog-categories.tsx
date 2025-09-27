import * as React from 'react'
import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import type { BlogCategoriesProps } from './types'

/**
 * BlogCategories Component
 *
 * Displays blog categories with post counts and navigation links.
 * Supports both grid and list layouts for different use cases.
 *
 * ## Features
 * - **Flexible Layouts**: Grid or list display options
 * - **Post Counts**: Show number of posts per category
 * - **Active State**: Highlight current category
 * - **Responsive Design**: Adapts to different screen sizes
 * - **SEO Optimized**: Proper semantic HTML and navigation
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Grid layout with post counts
 * <BlogCategories
 *   categories={categories}
 *   title="Categories"
 *   layout="grid"
 *   showPostCount={true}
 * />
 *
 * // List layout for sidebar
 * <BlogCategories
 *   categories={categories}
 *   layout="list"
 *   showDescription={true}
 *   currentCategory="technology"
 * />
 *
 * // Minimal display
 * <BlogCategories
 *   categories={categories}
 *   showPostCount={false}
 *   showDescription={false}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing blog categories
 */
export function BlogCategories({
  categories,
  title = 'Categories',
  showPostCount = true,
  showDescription = false,
  layout = 'list',
  currentCategory,
  className = '',
}: BlogCategoriesProps) {
  // Handle empty state
  if (!categories || categories.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No categories found.</p>
      </div>
    )
  }

  if (layout === 'grid') {
    return (
      <section className={`space-y-6 ${className}`}>
        {title && (
          <header>
            <h2 className="font-bold text-lg">{title}</h2>
          </header>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog?category=${category.slug}`}
              className={`group block p-4 border rounded-lg transition-colors hover:bg-accent ${
                currentCategory === category.slug
                  ? 'bg-accent border-primary'
                  : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <ArrowRightIcon className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </div>

                {showDescription && category.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}

                {showPostCount && (
                  <p className="text-xs text-muted-foreground">
                    {category.postCount}{' '}
                    {category.postCount === 1 ? 'post' : 'posts'}
                  </p>
                )}

                {/* Cover image if available */}
                {category.cover && (
                  <div className="aspect-video overflow-hidden rounded">
                    <img
                      src={category.cover}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  // List layout
  return (
    <section className={`space-y-4 ${className}`}>
      {title && (
        <header>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {title}
          </h2>
        </header>
      )}

      <nav className="space-y-1">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/blog?category=${category.slug}`}
            className={`group flex items-center justify-between p-2 rounded transition-colors hover:bg-accent ${
              currentCategory === category.slug ? 'bg-accent text-primary' : ''
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {category.name}
                </span>

                {showPostCount && (
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    ({category.postCount})
                  </span>
                )}
              </div>

              {showDescription && category.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>

            <ArrowRightIcon className="size-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 ml-2 flex-shrink-0" />
          </Link>
        ))}
      </nav>
    </section>
  )
}
