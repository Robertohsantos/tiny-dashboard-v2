import { igniter } from '@/igniter'
import { ContentProcedure } from '../procedures/content.procedure'
import { z } from 'zod'

/**
 * Content controller
 * @description Handles all content-related API endpoints
 */
export const ContentController = igniter.controller({
  name: 'Content',
  path: '/content',
  actions: {
    // GET /content/list - List content posts with filtering options
    list: igniter.query({
      name: 'List Content',
      description: 'List content posts with filtering options',
      path: '/list',
      use: [ContentProcedure()],
      query: z.object({
        type: z.enum(['help', 'blog', 'docs', 'update']).optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      handler: async ({ request, context, response }) => {
        const { type, limit, offset, category, search, tags } = request.query

        const result = await context.content.listPosts({
          type,
          limit,
          offset,
          category,
          search,
          tags,
        })

        return response.success(result)
      },
    }),

    // GET /content/get - Get a specific content post by type and slug
    get: igniter.query({
      name: 'Get Content',
      description:
        'Get a specific content post by type and slug using query parameters',
      path: '/get',
      query: z.object({
        type: z.enum(['help', 'blog', 'docs', 'update']),
        slug: z.string(),
        category: z.string().optional(),
      }),
      use: [ContentProcedure()],
      handler: async ({ request, context, response }) => {
        const { type, slug, category } = request.query

        // For help posts, if category is provided, combine it with slug
        // For blog posts, use slug directly
        const fullSlug =
          type === 'help' && category ? `${category}/${slug}` : slug

        const result = await context.content.getPost(type, fullSlug)

        return response.success(result)
      },
    }),

    // GET /content/categories - List categories for a specific content type
    categories: igniter.query({
      name: 'Get Content Categories',
      description: 'Get available categories for a specific content type',
      path: '/categories',
      use: [ContentProcedure()],
      query: z.object({
        type: z.enum(['help', 'blog', 'docs', 'update']),
      }),
      handler: async ({ request, context, response }) => {
        const { type } = request.query

        const result = await context.content.getCategories(type)

        return response.success(result)
      },
    }),

    // GET /content/search - Search posts
    search: igniter.query({
      name: 'Search Content',
      description:
        'Search posts across all content types or within a specific type',
      path: '/search',
      use: [ContentProcedure()],
      query: z.object({
        query: z.string().optional(),
        search: z.string().optional(),
        type: z.enum(['help', 'blog', 'docs', 'update']).optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
        offset: z.coerce.number().min(0).default(0),
      }),
      handler: async ({ request, context, response }) => {
        const { query, search, type, category, tags, limit, offset } =
          request.query

        const result = await context.content.searchPosts({
          query,
          search,
          type,
          category,
          tags,
          limit,
          offset,
        })

        return response.success(result)
      },
    }),

    // GET /content/related - Get related content posts
    related: igniter.query({
      name: 'Get Related Content',
      description:
        'Get related content posts for a specific post using query parameters',
      path: '/related',
      query: z.object({
        type: z.enum(['help', 'blog', 'docs', 'update']),
        slug: z.string(),
        category: z.string().optional(),
        limit: z.coerce.number().optional().default(3),
      }),
      use: [ContentProcedure()],
      handler: async ({ request, context, response }) => {
        const { type, slug, category, limit } = request.query

        // For help posts, if category is provided, combine it with slug
        // For blog posts, use slug directly
        const fullSlug =
          type === 'help' && category ? `${category}/${slug}` : slug

        const result = await context.content.getRelatedPosts({
          type,
          currentSlug: fullSlug,
          category,
          limit,
        })

        return response.success(result)
      },
    }),

    // GET /content/blog - Get blog posts
    blog: igniter.query({
      name: 'List Blog Posts',
      description: 'List blog posts with filtering',
      path: '/blog',
      use: [ContentProcedure()],
      query: z.object({
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      handler: async ({ request, context, response }) => {
        const { limit, offset, category, search, tags } = request.query

        const result = await context.content.getPostsByType('blog', {
          limit,
          offset,
          category,
          search,
          tags,
        })

        return response.success(result)
      },
    }),

    // GET /content/help - Get help posts
    help: igniter.query({
      name: 'List Help Articles',
      description: 'List help center articles with category filtering',
      path: '/help',
      use: [ContentProcedure()],
      query: z.object({
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      handler: async ({ request, context, response }) => {
        const { limit, offset, category, search, tags } = request.query

        const result = await context.content.getPostsByType('help', {
          limit,
          offset,
          category,
          search,
          tags,
        })

        return response.success(result)
      },
    }),

    // GET /content/docs - Get documentation posts
    docs: igniter.query({
      name: 'List Documentation',
      description: 'List documentation with category filtering',
      path: '/docs',
      use: [ContentProcedure()],
      query: z.object({
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      handler: async ({ request, context, response }) => {
        const { limit, offset, category, search, tags } = request.query

        const result = await context.content.getPostsByType('docs', {
          limit,
          offset,
          category,
          search,
          tags,
        })

        return response.success(result)
      },
    }),

    // GET /content/updates - Get update posts
    updates: igniter.query({
      name: 'List Updates',
      description: 'List product updates and changelog',
      path: '/updates',
      use: [ContentProcedure()],
      query: z.object({
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      handler: async ({ request, context, response }) => {
        const { limit, offset, category, search, tags } = request.query

        const result = await context.content.getPostsByType('update', {
          limit,
          offset,
          category,
          search,
          tags,
        })

        return response.success(result)
      },
    }),
  },
})
