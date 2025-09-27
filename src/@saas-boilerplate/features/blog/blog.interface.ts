/**
 * Blog Feature Interfaces
 *
 * Type definitions for the blog feature including post data structures,
 * query parameters, and API response types.
 *
 * @module BlogInterface
 */

import { z } from 'zod'

/**
 * @interface BlogPost
 * @description Represents the detailed structure of a blog post, including its content and metadata.
 */
export interface BlogPost {
  /**
   * @property id
   * @description The unique identifier of the blog post.
   */
  id: string
  /**
   * @property slug
   * @description The URL-friendly identifier of the blog post.
   */
  slug: string
  /**
   * @property title
   * @description The title of the blog post.
   */
  title: string
  /**
   * @property excerpt
   * @description A short summary or snippet of the blog post content.
   */
  excerpt: string
  /**
   * @property content
   * @description The full content of the blog post in Markdown or MDX format.
   */
  content: string
  /**
   * @property author
   * @description The name of the author of the blog post.
   */
  author: string
  /**
   * @property authorImage
   * @description Optional URL to the author's profile image.
   */
  authorImage?: string
  /**
   * @property date
   * @description The publication date of the blog post in ISO format.
   */
  date: string
  /**
   * @property cover
   * @description Optional URL to the cover image of the blog post.
   */
  cover?: string
  /**
   * @property tags
   * @description An array of tags associated with the blog post.
   */
  tags?: string[]
  /**
   * @property category
   * @description The category to which the blog post belongs.
   */
  category?: string
  /**
   * @property wordCount
   * @description Optional number of words in the blog post.
   */
  wordCount?: number
  /**
   * @property readingTime
   * @description Optional estimated reading time of the blog post in minutes.
   */
  readingTime?: number
  /**
   * @property headings
   * @description An array of headings within the blog post, useful for table of contents.
   */
  headings?: Array<{
    id: string
    title: string
    path: string
    level: number
    items: Array<{
      id: string
      title: string
      path: string
      level: number
      items: any[]
    }>
  }>
  /**
   * @property data
   * @description Raw data properties from Contentlayer, including title, description, cover, date, author, authorImage, tags.
   */
  data?: {
    title: string
    description?: string
    cover?: string
    date: string
    author: string
    authorImage?: string
    tags?: string[]
  }
}

/**
 * @interface BlogPostMeta
 * @description Defines the metadata structure for SEO purposes for a blog post.
 */
export interface BlogPostMeta {
  /**
   * @property title
   * @description The title for SEO.
   */
  title: string
  /**
   * @property description
   * @description The description for SEO.
   */
  description: string
  /**
   * @property keywords
   * @description An array of keywords for SEO.
   */
  keywords: string[]
  /**
   * @property ogImage
   * @description URL for the Open Graph image.
   */
  ogImage?: string
  /**
   * @property canonical
   * @description The canonical URL for the post.
   */
  canonical?: string
  /**
   * @property publishedTime
   * @description The publication date in ISO format.
   */
  publishedTime: string
  /**
   * @property modifiedTime
   * @description The last modification date in ISO format.
   */
  modifiedTime?: string
  /**
   * @property author
   * @description Author details for SEO.
   */
  author: {
    name: string
    image?: string
    url?: string
  }
  /**
   * @property section
   * @description The section or category of the blog post.
   */
  section?: string
  /**
   * @property tags
   * @description Tags for SEO.
   */
  tags: string[]
}

/**
 * @interface BlogCategory
 * @description Represents a blog category with its details.
 */
export interface BlogCategory {
  /**
   * @property id
   * @description The unique identifier of the category.
   */
  id: string
  /**
   * @property name
   * @description The name of the category.
   */
  name: string
  /**
   * @property slug
   * @description The URL-friendly identifier of the category.
   */
  slug: string
  /**
   * @property description
   * @description Optional description of the category.
   */
  description?: string
  /**
   * @property postCount
   * @description The number of posts within this category.
   */
  postCount: number
  /**
   * @property cover
   * @description Optional URL to the cover image of the category.
   */
  cover?: string
}

/**
 * @schema BlogListQuerySchema
 * @description Zod schema for validating query parameters when listing blog posts.
 * Supports filtering by category, tag, search, and pagination.
 */
export const BlogListQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(12),
  offset: z.coerce.number().min(0).default(0),
  featured: z.coerce.boolean().default(false),
})

/**
 * @typedef {import("zod").infer<typeof BlogListQuerySchema>} BlogListQuery
 * @description Type definition for blog post list query parameters, inferred from BlogListQuerySchema.
 */
export type BlogListQuery = z.infer<typeof BlogListQuerySchema>

/**
 * @schema BlogSearchQuerySchema
 * @description Zod schema for validating query parameters when searching blog posts.
 * Requires a search query and supports optional category, tag, and limit.
 */
export const BlogSearchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  category: z.string().optional(),
  tag: z.string().optional(),
  limit: z.coerce.number().min(1).max(20).default(10),
})

/**
 * @typedef {import("zod").infer<typeof BlogSearchQuerySchema>} BlogSearchQuery
 * @description Type definition for blog search query parameters, inferred from BlogSearchQuerySchema.
 */
export type BlogSearchQuery = z.infer<typeof BlogSearchQuerySchema>

/**
 * @interface BlogPostsResponse
 * @description API response structure for a list of blog posts, including total count and pagination info.
 */
export interface BlogPostsResponse {
  /**
   * @property posts
   * @description An array of blog posts.
   */
  posts: BlogPost[]
  /**
   * @property total
   * @description The total number of posts matching the query.
   */
  total: number
  /**
   * @property hasMore
   * @description Indicates if there are more posts available for pagination.
   */
  hasMore: boolean
  /**
   * @property featured
   * @description Optional array of featured blog posts.
   */
  featured?: BlogPost[]
  /**
   * @property categories
   * @description Optional array of blog categories.
   */
  categories?: BlogCategory[]
}

/**
 * @interface BlogPostResponse
 * @description API response structure for a single blog post, including related posts and SEO metadata.
 */
export interface BlogPostResponse {
  /**
   * @property post
   * @description The main blog post object.
   */
  post: BlogPost
  /**
   * @property related
   * @description An array of related blog posts.
   */
  related: BlogPost[]
  /**
   * @property next
   * @description Optional next blog post in sequence.
   */
  next?: BlogPost
  /**
   * @property previous
   * @description Optional previous blog post in sequence.
   */
  previous?: BlogPost
  /**
   * @property meta
   * @description SEO metadata for the blog post.
   */
  meta: BlogPostMeta
}

/**
 * @interface BlogCategoriesResponse
 * @description API response structure for a list of blog categories.
 */
export interface BlogCategoriesResponse {
  /**
   * @property categories
   * @description An array of blog categories.
   */
  categories: BlogCategory[]
  /**
   * @property total
   * @description The total number of categories.
   */
  total: number
}

/**
 * @interface BlogSearchResponse
 * @description API response structure for blog search results.
 */
export interface BlogSearchResponse {
  /**
   * @property results
   * @description An array of blog posts matching the search query.
   */
  results: BlogPost[]
  /**
   * @property total
   * @description The total number of results found.
   */
  total: number
  /**
   * @property query
   * @description The original search query string.
   */
  query: string
  /**
   * @property suggestions
   * @description Optional array of search suggestions.
   */
  suggestions?: string[]
}

// A interface BlogContext foi removida, pois a injeção do repositório agora a torna desnecessária.
