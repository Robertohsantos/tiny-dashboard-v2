/**
 * Help Center Popular Articles Component
 *
 * Server component that fetches and displays popular help center articles
 * in a responsive grid layout.
 */

import { Link } from 'next-view-transitions'
import { ArrowUpRightIcon } from 'lucide-react'
import { api } from '@/igniter.client'

/**
 * Props for the HelpCenterPopularArticles component
 */
export interface HelpCenterPopularArticlesProps {
  /** Optional CSS class name */
  className?: string
  /** Custom title for the section */
  title?: string
  /** Maximum number of articles to display */
  limit?: number
}

/**
 * HelpCenterPopularArticles Component
 *
 * Server component that fetches and renders popular help center articles.
 * Uses the content layer to retrieve articles server-side.
 *
 * @param props - Component props
 * @returns JSX element representing the popular articles section
 */
export async function HelpCenterPopularArticles({
  className = '',
  title = 'Popular Articles',
  limit = 8,
}: HelpCenterPopularArticlesProps) {
  // Fetch popular articles using API
  const popularResponse = await api.helpCenter.getPopularArticles.query({
    query: {
      limit,
    },
  })

  const posts = popularResponse?.data?.articles || []

  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <section className={className}>
        <div className="container mx-auto max-w-screen-lg">
          <div className="border border-border rounded-md p-6 bg-background">
            <h2 className="text-sm text-muted-foreground mb-6">{title}</h2>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No popular articles available at the moment.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Success state
  return (
    <section className={className}>
      <div className="container mx-auto max-w-screen-lg">
        <div className="border border-border rounded-md p-6 bg-background">
          <h2 className="text-sm text-muted-foreground mb-6">{title}</h2>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-0">
            {posts.map((post, index) => (
              <Link
                href={`/help/${post.slug}`}
                key={index}
                className="group flex w-full items-center justify-between py-4 transition-colors hover:underline"
              >
                <h3 className="text-sm font-medium">{post.data.title}</h3>
                <ArrowUpRightIcon className="size-4 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
