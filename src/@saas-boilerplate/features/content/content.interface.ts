import { z } from 'zod'

// ============================================================================
// CONTENT TYPES
// ============================================================================

export type ContentType = 'help' | 'blog' | 'docs' | 'update'

// ============================================================================
// CONTENT SCHEMAS
// ============================================================================

export const HelpSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
  authorImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  excerpt: z.string().optional(),
  image: z.string().optional(),
  cover: z.string().optional(),
})

export const BlogSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
  authorImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  excerpt: z.string().optional(),
  image: z.string().optional(),
  cover: z.string().optional(),
})

export const DocSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
  authorImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  excerpt: z.string().optional(),
  image: z.string().optional(),
  cover: z.string().optional(),
})

export const UpdateSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string().optional(),
  authorImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  excerpt: z.string().optional(),
  image: z.string().optional(),
  cover: z.string().optional(),
})

// ============================================================================
// CONTENT INTERFACES
// ============================================================================

export type HelpContent = z.infer<typeof HelpSchema>
export type BlogContent = z.infer<typeof BlogSchema>
export type DocContent = z.infer<typeof DocSchema>
export type UpdateContent = z.infer<typeof UpdateSchema>

export type Content = HelpContent | BlogContent | DocContent | UpdateContent

// ============================================================================
// CONTENT HEADING
// ============================================================================

export interface ContentHeading {
  id: string
  title: string
  path: string
  level: number
  items: ContentHeading[]
}

// ============================================================================
// CONTENT FILE DATA
// ============================================================================

export interface ContentFileData {
  slug: string
  title: string
  date: string
  author?: string
  authorImage?: string
  tags?: string[]
  category?: string
  excerpt?: string
  image?: string
  cover?: string
  content: string
  headings: ContentHeading[]
}

// ============================================================================
// CONTENT SEARCH PARAMS
// ============================================================================

export interface ContentSearchParams {
  type?: ContentType
  limit?: number
  offset?: number
  category?: string
  search?: string
  tags?: string[]
}

// ============================================================================
// CONTENT SEARCH RESULTS
// ============================================================================

export interface ContentSearchResults<T = ContentFileData> {
  posts: T[]
  total: number
  hasMore: boolean
  categories: string[]
}

// ============================================================================
// CONTENT LIST PARAMS
// ============================================================================

export type ContentListParams = ContentSearchParams

// ============================================================================
// CONTENT GET PARAMS
// ============================================================================

export interface ContentGetParams {
  type: ContentType
  slug: string
  category?: string
}

// ============================================================================
// CONTENT LIST RESPONSE
// ============================================================================

export type ContentListResponse = ContentSearchResults<BaseContent>

// ============================================================================
// BASE CONTENT TYPE (for compatibility with content-layer)
// ============================================================================

export type BaseContent = {
  id: string
  slug: string
  excerpt: string
  content: string
  data: Content
  headings: ContentHeading[]
}

// ============================================================================
// LEGACY SCHEMAS
// ============================================================================

export const ContentListSchema = z.object({
  type: z.enum(['help', 'blog', 'docs', 'update']).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const ContentGetSchema = z.object({
  type: z.enum(['help', 'blog', 'docs', 'update']),
  slug: z.string(),
  category: z.string().optional(),
})

export const ContentCategoriesSchema = z.object({
  type: z.enum(['help', 'blog', 'docs', 'update']),
})

export const ContentSearchSchema = z.object({
  type: z.enum(['help', 'blog', 'docs', 'update']).optional(),
  query: z.string(),
  category: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export const ContentRelatedSchema = z.object({
  type: z.enum(['help', 'blog', 'docs', 'update']),
  currentSlug: z.string(),
  category: z.string().optional(),
  limit: z.number().optional(),
})

export const ContentTypeSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  category: z.string().optional(),
})
