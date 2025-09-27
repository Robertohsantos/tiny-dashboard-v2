/**
 * Types seguros para Content Layer
 * Extraídos para evitar bundle contamination no client-side
 */

export interface ContentHeading {
  level: number
  text: string
  slug: string
}

export interface ContentLayerEntity {
  slug: string
  title: string
  description?: string
  content: string
  headings: ContentHeading[]
  metadata: Record<string, any>
  category?: string
  date?: string
  tags?: string[]
  author?: string
  authorImage?: string
  image?: string
  excerpt?: string
  readingTime?: number
  wordCount?: number
}

export interface ContentLayerSearchParams {
  query?: string
  category?: string
  tags?: string[]
  limit?: number
  offset?: number
}

export interface ContentLayerWhereParams {
  category?: string
  slug?: string
  tags?: string[]
}

export interface ContentTypeResult<T = ContentLayerEntity> {
  posts: T[]
  total: number
  categories: string[]
}

// Specific content types
export interface HelpPost extends ContentLayerEntity {
  category: string
  date: string
}

export interface BlogPost extends ContentLayerEntity {
  category: string
  date: string
  tags: string[]
  author: string
  authorImage?: string
  excerpt: string
}

export interface DocPost extends ContentLayerEntity {
  category: string
  order?: number
}

export interface UpdatePost extends ContentLayerEntity {
  date: string
  version?: string
  type?: 'feature' | 'bugfix' | 'improvement'
}
