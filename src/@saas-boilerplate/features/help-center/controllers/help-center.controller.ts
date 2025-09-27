/**
 * Help Center Controller
 *
 * Provides REST API endpoints for help center functionality including
 * article retrieval, search, category management, and popular content.
 *
 * @module HelpCenterController
 */

import { igniter } from '@/igniter'
import { HelpCenterProcedure } from '../procedures/help-center.procedure'
import { HELP_CONSTANTS } from '../help-center.interface'
import type { HelpCategorySlug } from '../help-center.interface'
import { z } from 'zod'

const ALLOWED_CATEGORY_SLUGS = Object.keys(
  HELP_CONSTANTS.CATEGORY_COLORS,
) as HelpCategorySlug[]

const isHelpCategorySlug = (value: string): value is HelpCategorySlug =>
  ALLOWED_CATEGORY_SLUGS.some((slug) => slug === value)

const parseCategory = (value?: string): HelpCategorySlug | undefined => {
  if (!value) return undefined
  return isHelpCategorySlug(value) ? value : undefined
}

/**
 * Help Center Controller
 *
 * Handles all HTTP requests related to help center functionality
 */
export const HelpCenterController = igniter.controller({
  name: 'Help Center',
  path: '/help-center',
  description: 'REST API endpoints for help center and documentation',
  actions: {

    /**
     * Get a specific help article by slug
     *
     * Retrieves a single help article along with related articles
     * and category information.
     *
     * @route GET /help-center/articles/:slug
     */
    getArticle: igniter.query({
      name: 'Get Help Article',
      description: 'Retrieve a specific help center article by its slug',
      path: '/articles/:slug' as const,
      use: [HelpCenterProcedure()],
      handler: async ({ request, context, response }) => {
        try {
          const { slug } = request.params

          if (!slug) {
            return response.badRequest('Article slug is required')
          }

          const result = await context.helpCenter.getArticle(slug)

          if (!result.article) {
            return response.notFound('Article not found')
          }

          return response.success(result)
        } catch (error) {
          igniter.logger.error('Error fetching article:', error)
          return response.badRequest('Internal server error')
        }
      },
    }),

    /**
     * List help articles with optional filtering
     *
     * Retrieves a paginated list of help articles with optional
     * filtering by category and search terms.
     *
     * @route GET /help-center/articles
     */
    listArticles: igniter.query({
      name: 'List Help Articles',
      description: 'List help center articles with optional filters',
      path: '/articles',
      query: z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.coerce.number().min(1).max(50).default(10),
        offset: z.coerce.number().min(0).default(0),
      }),
      use: [HelpCenterProcedure()],
      handler: async ({ request, context, response }) => {
        try {
          const { category, search, limit, offset } = request.query

          const result = await context.helpCenter.listArticles({
            category: parseCategory(category),
            search,
            limit,
            offset,
          })

          return response.success(result)
        } catch (error) {
          igniter.logger.error('Error listing articles:', error)
          return response.badRequest('Internal server error')
        }
      },
    }),

    /**
     * Search help articles
     *
     * Performs a full-text search across help center articles
     * with optional category filtering.
     *
     * @route GET /help-center/search
     */
    searchArticles: igniter.query({
      name: 'Search Help Articles',
      description: 'Search articles in the help center',
      path: '/search',
      query: z.object({
        q: z.string().min(2, 'Query must be at least 2 characters long'),
        category: z.string().optional(),
        limit: z.coerce.number().min(1).max(20).default(10),
      }),
      use: [HelpCenterProcedure()],
      handler: async ({ request, context, response }) => {
        try {
          const { q: query, category, limit } = request.query

          const result = await context.helpCenter.searchArticles({
            query,
            category: parseCategory(category),
            limit,
          })

          return response.success(result)
        } catch (error) {
          igniter.logger.error('Error searching articles:', error)
          return response.badRequest('Internal server error')
        }
      },
    }),

    /**
     * Get all help categories
     *
     * Retrieves all available help center categories with
     * article counts and metadata.
     *
     * @route GET /help-center/categories
     */
    getCategories: igniter.query({
      name: 'Get Help Categories',
      description: 'List all help center categories',
      path: '/categories',
      use: [HelpCenterProcedure()],
      handler: async ({ context, response }) => {
        try {
          const result = await context.helpCenter.getCategories()
          return response.success(result)
        } catch (error) {
          igniter.logger.error('Error fetching categories:', error)
          return response.badRequest('Internal server error')
        }
      },
    }),

    /**
     * Get popular help articles
     *
     * Retrieves the most popular help center articles
     * based on views and engagement metrics.
     *
     * @route GET /help-center/popular
     */
    getPopularArticles: igniter.query({
      name: 'Get Popular Articles',
      description: 'List popular help center articles',
      path: '/popular',
      query: z.object({
        limit: z.coerce.number().min(1).max(10).default(5),
      }),
      use: [HelpCenterProcedure()],
      handler: async ({ request, context, response }) => {
        try {
          const { limit } = request.query

          const result = await context.helpCenter.getPopularArticles(limit)
          return response.success(result)
        } catch (error) {
          igniter.logger.error('Error fetching popular articles:', error)
          return response.badRequest('Internal server error')
        }
      },
    }),
  },
})
