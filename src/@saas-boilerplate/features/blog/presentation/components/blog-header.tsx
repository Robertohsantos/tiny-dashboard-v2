import * as React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { api } from '@/igniter.client'
import { BlogSearch } from './blog-search'
import { AppConfig } from '@/config/boilerplate.config.client'
import type { BlogHeaderProps } from './types'

/**
 * BlogHeader Component
 *
 * Server component that renders the header with breadcrumbs, title, description,
 * search, and optional custom content. Fetches posts server-side for search functionality.
 *
 * ## Features
 * - **Flexible Breadcrumbs**: Show/hide breadcrumbs or provide custom items
 * - **Search Integration**: Configurable search with custom placeholder
 * - **Content Injection**: Add custom content before/after title
 * - **SEO Optimized**: Proper heading structure and semantic HTML
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Basic usage
 * <BlogHeader title="Latest Articles" />
 *
 * // Hide breadcrumbs
 * <BlogHeader title="Blog" showBreadcrumb={false} />
 *
 * // Custom breadcrumbs
 * <BlogHeader
 *   title="Technology"
 *   breadcrumbItems={[
 *     { label: "Home", href: "/", isActive: false },
 *     { label: "Blog", href: "/blog", isActive: false },
 *     { label: "Technology", href: "/blog/category/technology", isActive: true }
 *   ]}
 * />
 *
 * // Add custom content
 * <BlogHeader
 *   title="Blog"
 *   headerPrefix={<div className="text-sm text-muted-foreground">Welcome to our blog</div>}
 *   headerSuffix={<div className="text-sm text-muted-foreground">Latest updates and insights</div>}
 * />
 * ```
 *
 * @param props - Component props with essential customization options
 * @returns JSX element representing the blog header
 */
export async function BlogHeader({
  title = 'Latest Articles',
  description,
  className = '',
  showBreadcrumb = true,
  breadcrumbItems,
  showSearch = true,
  searchPlaceholder = 'Search articles...',
  headerPrefix,
  headerSuffix,
}: BlogHeaderProps) {
  // Fetch posts for search functionality
  const postsResponse = await api.blog.listPosts.query({
    query: {
      limit: 1000, // Get all posts for comprehensive search
    },
  })

  const posts = postsResponse?.data?.posts || []

  // Define breadcrumb items
  const defaultBreadcrumbItems = breadcrumbItems || [
    { label: AppConfig.name, href: '/', isActive: false },
    { label: 'Blog', href: '/blog', isActive: true },
  ]

  return (
    <header className={`border-b -mb-24 bg-background ${className}`}>
      <div className="container mx-auto max-w-screen-lg text-left py-8 h-64">
        {/* Custom prefix content */}
        {headerPrefix && <div className="mb-6">{headerPrefix}</div>}

        {/* Breadcrumb Navigation */}
        {showBreadcrumb && (
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              {defaultBreadcrumbItems.map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={item.href}
                      className={
                        item.isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }
                    >
                      {item.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < defaultBreadcrumbItems.length - 1 && (
                    <BreadcrumbSeparator />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Main Header Content */}
        <div className="space-y-6">
          {/* Title and Description */}
          <div className="space-y-1">
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground text-sm max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {/* Custom suffix content */}
          {headerSuffix && <div className="mt-4">{headerSuffix}</div>}

          {/* Search Component */}
          {showSearch && posts.length > 0 && (
            <BlogSearch
              placeholder={searchPlaceholder}
              posts={posts.map((post) => ({
                title: post.data.title,
                author: post.data.author || 'Anonymous',
                date: post.data.date,
                excerpt: post.excerpt,
                slug: post.slug,
                id: post.id,
                content: post.content,
              }))}
            />
          )}
        </div>
      </div>
    </header>
  )
}
