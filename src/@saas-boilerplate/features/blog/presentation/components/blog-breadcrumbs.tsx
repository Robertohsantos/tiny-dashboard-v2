import * as React from 'react'
import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'
import type { BlogBreadcrumbsProps } from './types'

/**
 * BlogBreadcrumbs Component
 *
 * Navigation breadcrumbs for blog pages with customizable separator and max items.
 * Provides clear navigation hierarchy for users.
 *
 * ## Features
 * - **Customizable Separator**: Use custom separator icon or text
 * - **Item Limiting**: Control maximum number of breadcrumb items
 * - **Accessibility**: Proper ARIA labels and semantic navigation
 * - **Responsive**: Adapts to different screen sizes
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Basic breadcrumbs
 * <BlogBreadcrumbs
 *   items={[
 *     { label: "Home", href: "/", isActive: false },
 *     { label: "Blog", href: "/blog", isActive: false },
 *     { label: "Article Title", href: "/blog/article", isActive: true }
 *   ]}
 * />
 *
 * // Custom separator
 * <BlogBreadcrumbs
 *   items={breadcrumbItems}
 *   separator={<span className="mx-2">/</span>}
 * />
 *
 * // Limited items
 * <BlogBreadcrumbs
 *   items={longBreadcrumbItems}
 *   maxItems={3}
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the breadcrumb navigation
 */
export function BlogBreadcrumbs({
  items,
  separator,
  maxItems,
  className = '',
}: BlogBreadcrumbsProps) {
  const hasItems = Array.isArray(items) && items.length > 0

  // Limit items if specified
  const displayItems = React.useMemo(() => {
    if (!hasItems || !items) {
      return []
    }

    if (!maxItems || items.length <= maxItems) {
      return items
    }

    // Keep first item, add ellipsis, then last maxItems-2 items
    const firstItem = items[0]
    const lastItems = items.slice(-(maxItems - 2))

    return [
      firstItem,
      { label: '...', href: '#', isActive: false },
      ...lastItems,
    ]
  }, [hasItems, items, maxItems])

  // Handle empty items
  if (!hasItems) {
    return null
  }

  // Default separator
  const defaultSeparator = separator || (
    <ChevronRightIcon className="size-4 text-muted-foreground" />
  )

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1
          const isEllipsis = item.label === '...'

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted-foreground" aria-hidden="true">
                  {defaultSeparator}
                </span>
              )}

              {isEllipsis ? (
                <span className="text-muted-foreground" aria-current="page">
                  {item.label}
                </span>
              ) : isLast ? (
                <span
                  className="text-foreground font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
