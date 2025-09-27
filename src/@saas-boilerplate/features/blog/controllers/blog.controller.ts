import { igniter } from '@/igniter'
import { BlogProcedure } from '../procedures/blog.procedure'
import { BlogListQuerySchema, BlogSearchQuerySchema } from '../blog.interface'
import { z } from 'zod'

export const BlogController = igniter.controller({
  name: 'Blog',
  path: '/blog',
  description: 'REST API endpoints for blog posts and content management',
  actions: {
    getPost: igniter.query({
      name: 'Get Blog Post',
      description: 'Retrieve a specific blog post by its slug',
      path: '/posts/:slug' as const,
      use: [BlogProcedure()],
      handler: async ({ request, context, response }) => {
        // Observation: Extract the slug from the request parameters.
        const { slug } = request.params

        // Business Logic: Retrieve the blog post using the BlogProcedure.
        const result = await context.blog.getPost(slug)

        // Response: Return the retrieved blog post with a 200 status.
        return response.success(result)
      },
    }),

    listPosts: igniter.query({
      name: 'List Blog Posts',
      description: 'List blog posts with optional filters and pagination',
      path: '/posts',
      query: BlogListQuerySchema,
      use: [BlogProcedure()],
      handler: async ({ request, context, response }) => {
        // Observation: Extract the query parameters from the request.
        const query = request.query

        // Business Logic: List the blog posts using the BlogProcedure.
        const result = await context.blog.listPosts({
          limit: query.limit || 12,
          offset: query.offset || 0,
          featured: query.featured || false,
          category: query.category || undefined,
          search: query.search || undefined,
          tag: query.tag || undefined,
        })

        // Response: Return the retrieved blog post with a 200 status.
        return response.success(result)
      },
    }),

    searchPosts: igniter.query({
      name: 'Search Blog Posts',
      description: 'Search blog posts with full-text search',
      path: '/search',
      query: BlogSearchQuerySchema,
      use: [BlogProcedure()],
      handler: async ({ request, context, response }) => {
        // Observation: Extract the query parameters from the request.
        const query = request.query

        // Business Logic: Search the blog posts using the BlogProcedure.
        const result = await context.blog.searchPosts({
          q: query.q || '',
          limit: query.limit || 10,
          category: query.category || undefined,
          tag: query.tag || undefined,
        })

        // Response: Return the retrieved blog post with a 200 status.
        return response.success(result)
      },
    }),

    getPopularPosts: igniter.query({
      name: 'Get Popular Blog Posts',
      description: 'List popular blog posts based on engagement',
      path: '/popular',
      query: z.object({
        limit: z.coerce.number().min(1).max(10).default(5),
      }),
      use: [BlogProcedure()],
      handler: async ({ request, context, response }) => {
        // Observation: Extract the query parameters from the request.
        const { limit } = request.query

        // Business Logic: Retrieve the popular blog posts using the BlogProcedure.
        const result = await context.blog.getPopularPosts(limit)

        // Response: Return the retrieved blog post with a 200 status.
        return response.success({
          posts: result,
          total: result.length,
        })
      },
    }),

    getRelatedPosts: igniter.query({
      name: 'Get Related Blog Posts',
      description: 'Get posts related to a specific blog post',
      path: '/posts/:slug/related' as const,
      query: z.object({
        limit: z.coerce.number().min(1).max(10).default(3),
      }),
      use: [BlogProcedure()],
      handler: async ({ request, context, response }) => {
        // Observation: Extract the slug from the request parameters.
        const { slug } = request.params

        // Observation: Extract the query parameters from the request.
        const { limit } = request.query

        // Business Logic: Retrieve the related blog posts using the BlogProcedure.
        if (!slug) {
          // Response: Return a bad request error if the slug is not provided.
          return response.badRequest('Post slug is required')
        }

        // Business Logic: Retrieve the related blog posts using the BlogProcedure.
        const result = await context.blog.getRelatedPosts(slug, limit)

        // Response: Return the retrieved blog post with a 200 status.
        return response.success({
          posts: result,
          total: result.length,
        })
      },
    }),

    getStats: igniter.query({
      name: 'Get Blog Statistics',
      description: 'Get overall blog statistics and metrics',
      path: '/stats',
      use: [BlogProcedure()],
      handler: async ({ context, response }) => {
        // Business Logic: Retrieve the blog posts using the BlogProcedure.
        const posts = await context.blog.listPosts({ limit: 1000 })

        // Business Logic: Retrieve the popular blog posts using the BlogProcedure.
        const popular = await context.blog.getPopularPosts(5)

        // Business Logic: Retrieve the statistics using the BlogProcedure.
        const stats = {
          totalPosts: posts.total,
          popularPosts: popular.length,
        }

        // Response: Return the retrieved blog post with a 200 status.
        return response.success(stats)
      },
    }),
  },
})
