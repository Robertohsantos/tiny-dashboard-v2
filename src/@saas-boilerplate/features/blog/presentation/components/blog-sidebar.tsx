import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BlogTableOfContents } from './blog-table-of-contents'
import { BlogCategories } from './blog-categories'
import { BlogPostList } from './blog-post-list'
import type { BlogSidebarProps } from './types'

/**
 * BlogSidebar Component
 *
 * Sidebar component for blog post pages with author info, table of contents,
 * categories, and popular posts. Sticky positioned for better UX.
 *
 * ## Features
 * - **Author Information**: Display author details and bio
 * - **Table of Contents**: Navigate article sections
 * - **Categories**: Browse by category
 * - **Popular Posts**: Show trending content
 * - **Sticky Positioning**: Remains visible while scrolling
 * - **Responsive**: Collapses on mobile devices
 *
 * ## Usage Examples
 *
 * ```tsx
 * // Full sidebar with all features
 * <BlogSidebar
 *   post={post}
 *   categories={categories}
 *   popularPosts={popularPosts}
 *   showAuthor={true}
 *   showTableOfContents={true}
 *   showCategories={true}
 *   showPopularPosts={true}
 * />
 *
 * // Minimal sidebar
 * <BlogSidebar
 *   post={post}
 *   showAuthor={true}
 *   showTableOfContents={true}
 * />
 *
 * // Custom configuration
 * <BlogSidebar
 *   post={post}
 *   categories={categories}
 *   tableOfContentsTitle="Contents"
 *   categoriesTitle="Browse by Category"
 * />
 * ```
 *
 * @param props - Component props
 * @returns JSX element representing the blog sidebar
 */
export function BlogSidebar({
  post,
  categories = [],
  popularPosts = [],
  showAuthor = true,
  showTableOfContents = true,
  showCategories = true,
  showPopularPosts = true,
  tableOfContentsTitle = 'Table of Contents',
  categoriesTitle = 'Categories',
  popularPostsTitle = 'Popular Posts',
  className = '',
}: BlogSidebarProps) {
  return (
    <aside className={`space-y-8 ${className}`}>
      {/* Author Information */}
      {showAuthor && (
        <div className="text-sm">
          <p className="text-muted-foreground mb-3 font-medium">Written by</p>
          <div className="flex items-center gap-3">
            <Avatar className="size-10 rounded-full">
              <AvatarImage src={post.authorImage} />
              <AvatarFallback className="text-sm">
                {post.author?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.author}</p>
              <p className="text-xs text-muted-foreground">Author</p>
            </div>
          </div>
        </div>
      )}

      {/* Table of Contents */}
      {showTableOfContents && post.headings && post.headings.length > 0 && (
        <BlogTableOfContents
          // @ts-expect-error - TODO: fix this
          headings={post.headings}
          title={tableOfContentsTitle}
        />
      )}

      {/* Categories */}
      {showCategories && categories.length > 0 && (
        <BlogCategories
          categories={categories}
          title={categoriesTitle}
          layout="list"
          showPostCount={true}
        />
      )}

      {/* Popular Posts */}
      {showPopularPosts && popularPosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{popularPostsTitle}</h3>
          <BlogPostList
            posts={popularPosts}
            showExcerpt={false}
            showAuthor={false}
            showDate={true}
            showTags={false}
            showSeparator={false}
            maxExcerptLength={80}
          />
        </div>
      )}

      {/* Reading Progress (could be added later) */}
      <div className="text-xs text-muted-foreground">
        <div className="flex justify-between mb-1">
          <span>Reading progress</span>
          <span>0%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1">
          <div className="bg-primary h-1 rounded-full w-0 transition-all duration-300"></div>
        </div>
      </div>
    </aside>
  )
}
