import { igniter } from '@/igniter'
import { contentLayer } from '@/modules/core/services/content-layer'
import type {
  ContentListParams,
  ContentGetParams,
  BaseContent,
  ContentListResponse,
  ContentType,
  Content,
} from '../content.interface'
import type { ContentTypeResult } from '@/@saas-boilerplate/providers/content-layer/types'

/**
 * Content procedure - Server-only access to content layer
 * Provides safe access to content without bundle contamination
 */
export const ContentProcedure = igniter.procedure({
  name: 'ContentProcedure',
  handler: () => {
    const emptyResponse: ContentListResponse = {
      posts: [],
      total: 0,
      hasMore: false,
      categories: [],
    }

    const mapContentResult = <TData extends Content>(
      entry: ContentTypeResult<TData>,
    ): BaseContent => ({
      id: entry.id,
      slug: entry.slug,
      excerpt: entry.excerpt,
      content: entry.content,
      data: entry.data,
      headings: entry.headings,
    })

    const normalizeString = (value?: string): string =>
      typeof value === 'string' ? value.toLowerCase() : ''

    const CONTENT_TYPES: readonly ContentType[] = [
      'help',
      'blog',
      'docs',
      'update',
    ]

    // Helper function to list posts
    const listPosts = async (
      params: ContentListParams = {},
    ): Promise<ContentListResponse> => {
      try {
        if (!params.type) {
          return emptyResponse
        }

        const rawPosts = await contentLayer.listPosts({
          type: params.type,
          limit: params.limit,
          offset: params.offset ?? 0,
          where: params.category ? { category: params.category } : undefined,
          orderBy: 'date',
          orderDirection: 'desc',
        })

        const posts = rawPosts.map(mapContentResult)

        const categories = new Set<string>()
        for (const entry of posts) {
          const category = entry.data.category
          if (typeof category === 'string') {
            categories.add(category)
          }
        }

        let filteredPosts = posts

        if (params.search) {
          const searchLower = params.search.toLowerCase()
          filteredPosts = filteredPosts.filter((entry) => {
            const title = normalizeString(entry.data.title)
            const excerpt = entry.excerpt.toLowerCase()
            const content = entry.content.toLowerCase()
            const dataExcerpt = normalizeString(entry.data.excerpt)
            return (
              title.includes(searchLower) ||
              excerpt.includes(searchLower) ||
              content.includes(searchLower) ||
              dataExcerpt.includes(searchLower)
            )
          })
        }

        const requestedTags = params.tags ?? []
        if (requestedTags.length > 0) {
          filteredPosts = filteredPosts.filter((entry) => {
            const tags = entry.data.tags?.filter(
              (tag): tag is string => typeof tag === 'string',
            )
            if (!tags?.length) {
              return false
            }

            const normalizedTags = tags.map((tag) => tag.toLowerCase())
            return requestedTags.some((tag) =>
              normalizedTags.includes(tag.toLowerCase()),
            )
          })
        }

        return {
          posts: filteredPosts,
          total: filteredPosts.length,
          hasMore: false, // Content layer doesn't support pagination metadata
          categories: Array.from(categories),
        }
      } catch (error) {
        igniter.logger.error('Error listing posts:', error)
        return emptyResponse
      }
    }

    // Helper function to search posts
    const searchPosts = async (
      params: ContentListParams & { query?: string },
    ): Promise<ContentListResponse> => {
      try {
        const searchQuery = params.query ?? params.search

        if (!searchQuery) {
          const { query: _query, ...listParams } = params
          return listPosts(listParams)
        }

        if (!params.type) {
          const aggregatedPosts: BaseContent[] = []

          for (const type of CONTENT_TYPES) {
            const result = await contentLayer.listPosts({
              type,
              limit: 1000,
              offset: 0,
              where: params.category ? { category: params.category } : undefined,
              orderBy: 'date',
              orderDirection: 'desc',
            })
            aggregatedPosts.push(...result.map(mapContentResult))
          }

          const searchLower = searchQuery.toLowerCase()
          const filteredPosts = aggregatedPosts.filter((post) => {
            const title = normalizeString(post.data.title)
            const excerpt = post.excerpt.toLowerCase()
            const content = post.content.toLowerCase()
            const dataExcerpt = normalizeString(post.data.excerpt)
            return (
              title.includes(searchLower) ||
              excerpt.includes(searchLower) ||
              content.includes(searchLower) ||
              dataExcerpt.includes(searchLower)
            )
          })

          const categories = new Set<string>()
          for (const post of filteredPosts) {
            const category = post.data.category
            if (typeof category === 'string') {
              categories.add(category)
            }
          }

          return {
            posts: filteredPosts,
            total: filteredPosts.length,
            hasMore: false,
            categories: Array.from(categories),
          }
        }

        const { query: _query, ...listParams } = params
        return listPosts(listParams)
      } catch (error) {
        igniter.logger.error('Error searching posts:', error)
        return {
          posts: [],
          total: 0,
          hasMore: false,
          categories: [],
        }
      }
    }

    return {
      content: {
        /**
         * Get a specific post by type and slug
         */
        getPost: async (
          type: ContentType,
          slug: string,
        ): Promise<BaseContent | null> => {
          try {
            // Decode URL-encoded slug (e.g., getting-started%2F01-first-steps -> getting-started/01-first-steps)
            const decodedSlug = decodeURIComponent(slug)
            const result = await contentLayer.getPostBySlug(type, decodedSlug)

            if (!result) return null

            return mapContentResult(result)
          } catch (error) {
            igniter.logger.error('Error getting post:', error)
            return null
          }
        },

        /**
         * List posts with filtering
         */
        listPosts,

        /**
         * Get categories for a specific content type
         */
        getCategories: async (
          type: ContentType,
        ): Promise<string[]> => {
          try {
            const result = await contentLayer.listPosts({
              type,
              limit: 1000,
              offset: 0,
            })

            const categories = new Set<string>()
            for (const post of result.map(mapContentResult)) {
              const category = post.data.category
              if (typeof category === 'string') {
                categories.add(category)
              }
            }

            return Array.from(categories)
          } catch (error) {
            igniter.logger.error('Error getting categories:', error)
            return []
          }
        },

        /**
         * Search posts with advanced filtering
         */
        searchPosts,

        /**
         * Get related posts (excluding current post)
         */
        getRelatedPosts: async (params: {
          type: ContentType
          currentSlug: string
          category?: string
          limit?: number
        }): Promise<BaseContent[]> => {
          try {
            const { type, category, limit = 3 } = params
            // Decode URL-encoded slug for comparison
            const decodedCurrentSlug = decodeURIComponent(params.currentSlug)

            const result = await contentLayer.listPosts({
              type,
              where: category ? { category } : undefined,
              limit: limit + 1, // Get one extra to filter out current
              orderBy: 'date',
              orderDirection: 'desc',
            })

            if (!result || result.length === 0) return []

            // Filter out current post and limit results
            const filteredPosts = result
              .map(mapContentResult)
              .filter((post) => post.slug !== decodedCurrentSlug)
              .slice(0, limit)

            return filteredPosts
          } catch (error) {
            igniter.logger.error('Error getting related posts:', error)
            return []
          }
        },

        /**
         * Get posts by type with filtering
         */
        getPostsByType: async (
          type: ContentType,
          params: Omit<ContentListParams, 'type'> = {},
        ): Promise<ContentListResponse> => {
          return listPosts({
            ...params,
            type,
          })
        },
      },
    }
  },
})
