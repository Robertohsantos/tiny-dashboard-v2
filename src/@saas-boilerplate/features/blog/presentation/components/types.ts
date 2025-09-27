/**
 * Blog Component Types
 *
 * Type definitions for blog presentation components.
 * Ensures type safety and consistent component APIs.
 *
 * @module BlogComponentTypes
 */

import React from 'react'
import type { BlogPost, BlogCategory } from '../../blog.interface'

/**
 * Base component props interface
 */
export interface BaseBlogProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Blog header component props
 */
export interface BlogHeaderProps extends BaseBlogProps {
  title?: string
  description?: string
  showBreadcrumb?: boolean
  breadcrumbItems?: Array<{
    label: string
    href: string
    isActive?: boolean
  }>
  showSearch?: boolean
  searchPlaceholder?: string
  headerPrefix?: React.ReactNode
  headerSuffix?: React.ReactNode
}

/**
 * Blog post card component props
 */
export interface BlogPostCardProps extends BaseBlogProps {
  post: BlogPost
  variant?: 'default' | 'featured' | 'compact'
  showExcerpt?: boolean
  showAuthor?: boolean
  showDate?: boolean
  showTags?: boolean
  maxExcerptLength?: number
}

/**
 * Blog post grid component props
 */
export interface BlogPostGridProps extends BaseBlogProps {
  posts: BlogPost[]
  variant?: 'featured' | 'default'
  showExcerpt?: boolean
  showAuthor?: boolean
  showDate?: boolean
  showTags?: boolean
  maxExcerptLength?: number
  columns?: 1 | 2 | 3 | 4
}

/**
 * Blog post list component props
 */
export interface BlogPostListProps extends BaseBlogProps {
  posts: BlogPost[]
  showExcerpt?: boolean
  showAuthor?: boolean
  showDate?: boolean
  showTags?: boolean
  maxExcerptLength?: number
  showSeparator?: boolean
}

/**
 * Blog post article component props
 */
export interface BlogPostArticleProps extends BaseBlogProps {
  post: BlogPost
  relatedPosts?: BlogPost[]
  nextPost?: BlogPost
  previousPost?: BlogPost
  showTableOfContents?: boolean
  showRelatedPosts?: boolean
  showNavigation?: boolean
  customCTA?: React.ReactNode
}

/**
 * Blog sidebar component props
 */
export interface BlogSidebarProps extends BaseBlogProps {
  post: BlogPost
  categories?: BlogCategory[]
  popularPosts?: BlogPost[]
  showAuthor?: boolean
  showTableOfContents?: boolean
  showCategories?: boolean
  showPopularPosts?: boolean
  tableOfContentsTitle?: string
  categoriesTitle?: string
  popularPostsTitle?: string
}

/**
 * Blog related posts component props
 */
export interface BlogRelatedPostsProps extends BaseBlogProps {
  posts: BlogPost[]
  currentPostSlug?: string
  title?: string
  maxPosts?: number
  showExcerpt?: boolean
  showDate?: boolean
  layout?: 'grid' | 'list'
}

/**
 * Blog categories component props
 */
export interface BlogCategoriesProps extends BaseBlogProps {
  categories: BlogCategory[]
  title?: string
  showPostCount?: boolean
  showDescription?: boolean
  layout?: 'grid' | 'list'
  currentCategory?: string
}

/**
 * Blog search component props
 */
export interface BlogSearchProps extends BaseBlogProps {
  posts: BlogPost[]
  placeholder?: string
  showResults?: boolean
  maxResults?: number
  onSearch?: (query: string, results: BlogPost[]) => void
}

/**
 * Blog featured posts component props
 */
export interface BlogFeaturedPostsProps extends BaseBlogProps {
  posts: BlogPost[]
  title?: string
  showExcerpt?: boolean
  showAuthor?: boolean
  showDate?: boolean
  showTags?: boolean
  maxPosts?: number
}

/**
 * Blog breadcrumbs component props
 */
export interface BlogBreadcrumbsProps extends BaseBlogProps {
  items: Array<{
    label: string
    href: string
    isActive?: boolean
  }>
  separator?: React.ReactNode
  maxItems?: number
}

/**
 * Blog post navigation component props
 */
export interface BlogPostNavigationProps extends BaseBlogProps {
  previousPost?: BlogPost
  nextPost?: BlogPost
  showTitles?: boolean
  showExcerpt?: boolean
}

/**
 * Blog table of contents component props
 */
export interface BlogTableOfContentsProps extends BaseBlogProps {
  headings: Array<{
    level: number
    text: string
    id: string
  }>
  title?: string
  activeHeading?: string
  onHeadingClick?: (headingId: string) => void
}

/**
 * Blog CTA (Call to Action) component props
 */
export interface BlogCTAProps extends BaseBlogProps {
  title?: string
  description?: string
  primaryAction?: {
    label: string
    href: string
    variant?: 'default' | 'outline' | 'secondary'
  }
  secondaryAction?: {
    label: string
    href: string
    variant?: 'default' | 'outline' | 'secondary'
  }
  features?: string[]
  showFeatures?: boolean
}

/**
 * Blog author card component props
 */
export interface BlogAuthorCardProps extends BaseBlogProps {
  name: string
  image?: string
  bio?: string
  socialLinks?: Array<{
    platform: string
    url: string
    icon?: React.ReactNode
  }>
  showBio?: boolean
  showSocialLinks?: boolean
  layout?: 'horizontal' | 'vertical'
}
