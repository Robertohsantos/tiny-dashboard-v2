import * as React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { api } from '@/igniter.client'
import { HelpCenterSearch } from './help-center-search'
import { AppConfig } from '@/config/boilerplate.config.client'

/**
 * Props for the HelpCenterHeader component
 */
export interface HelpCenterHeaderProps {
  /** Page title */
  title?: string
  /** Optional CSS class name */
  className?: string
  /** Show breadcrumb navigation */
  showBreadcrumb?: boolean
  /** Custom breadcrumb items */
  breadcrumbItems?: Array<{
    label: string
    href: string
    isActive?: boolean
  }>
  /** Show search functionality */
  showSearch?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Custom header content before title */
  headerPrefix?: React.ReactNode
  /** Custom header content after title */
  headerSuffix?: React.ReactNode
}

/**
 * HelpCenterHeader Component
 *
 * Server component that renders the header with breadcrumbs, title, search,
 * and optional custom content. Fetches articles server-side for search functionality.
 *
 * ## Features
 * - **Flexible Breadcrumbs**: Show/hide breadcrumbs or provide custom items
 * - **Search Integration**: Configurable search with custom placeholder
 * - **Content Injection**: Add custom content before/after title
 * - **Simple Customization**: Essential props for common use cases
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Basic usage
 * <HelpCenterHeader title="Custom Help Title" />
 *
 * // Hide breadcrumbs
 * <HelpCenterHeader title="Support" showBreadcrumb={false} />
 *
 * // Custom breadcrumbs
 * <HelpCenterHeader
 *   breadcrumbItems={[
 *     { label: "Home", href: "/", isActive: false },
 *     { label: "Support", href: "/support", isActive: false },
 *     { label: "Help Center", href: "/help", isActive: true }
 *   ]}
 * />
 *
 * // Add custom content
 * <HelpCenterHeader
 *   title="Help Center"
 *   headerPrefix={<div className="text-sm text-muted-foreground">New features available</div>}
 *   headerSuffix={<div className="text-sm text-muted-foreground">Find answers quickly</div>}
 * />
 * ```
 *
 * @param props - Component props with essential customization options
 * @returns JSX element representing the help header
 */
/**
 * HelpCenterHeader - Server Component
 *
 * Renders the header with breadcrumbs, title, search, and optional custom content.
 * Fetches articles server-side for search functionality.
 */
export async function HelpCenterHeader({
  title = 'How can we help today?',
  className = '',
  showBreadcrumb = true,
  breadcrumbItems,
  showSearch = true,
  searchPlaceholder = 'Search for articles...',
  headerPrefix,
  headerSuffix,
}: HelpCenterHeaderProps) {
  // Fetch articles for search functionality using API
  const articlesResponse = await api.helpCenter.listArticles.query({
    query: {
      limit: 1000, // Get all articles for search
    },
  })

  const articles = articlesResponse?.data?.articles || []

  // Define breadcrumb items
  const defaultBreadcrumbItems = breadcrumbItems || [
    { label: AppConfig.name, href: '/', isActive: false },
    { label: 'Help', href: '/help', isActive: true },
  ]

  return (
    <header className={`border-b -mb-32 bg-background ${className}`}>
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
          {/* Title */}
          <h1 className="text-lg font-bold leading-tight">{title}</h1>

          {/* Custom suffix content */}
          {headerSuffix && <div className="mt-4">{headerSuffix}</div>}

          {/* Search Component */}
          {showSearch && (
            <HelpCenterSearch
              articles={articles}
              placeholder={searchPlaceholder}
            />
          )}
        </div>
      </div>
    </header>
  )
}
