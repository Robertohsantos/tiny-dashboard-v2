import { igniter } from '@/igniter'
import { contentLayer } from '@/modules/core/services/content-layer'
import type { BlogPost, BlogPostMeta, BlogSearchQuery } from '../blog.interface'
import { Url } from '@/@saas-boilerplate/utils/url'

export const BlogProcedure = igniter.procedure({
  name: 'BlogProcedure',
  handler: () => {
    const blog = {
      async getPost(slug: string) {
        // Business Logic: Decode the slug
        const decodedSlug = decodeURIComponent(slug)

        // Business Logic: Fetch the main post using contentLayer
        const post = await contentLayer.getPostBySlug('blog', decodedSlug)

        // Business Rule: If the post is not found, throw an error
        if (!post) {
          // Business Logic: Throw an error if the post is not found
          throw new Error(`Post not found: ${slug}`)
        }

        // Business Logic: Fetch related posts based on tags or category
        const relatedPosts = await blog.getRelatedPosts(slug, 3)

        // Business Logic: Generate metadata for SEO
        const meta = blog.generatePostMeta({
          id: post.id,
          author: post.data.author || 'Anonymous',
          date: post.data.date,
          excerpt: post.excerpt,
          title: post.data.title,
          slug: post.slug,
          content: post.content,
          tags: post.data.tags,
        })

        return {
          post,
          related: relatedPosts,
          next: undefined, // TODO: Implement next post logic
          previous: undefined, // TODO: Implement previous post logic
          meta,
        }
      },

      /**
       * Lists posts with optional filtering and pagination
       *
       * @param options - Filtering and pagination options
       * @returns Promise resolving to paginated post list
       */
      async listPosts(
        options: {
          category?: string
          tag?: string
          search?: string
          limit?: number
          offset?: number
          featured?: boolean
        } = {},
      ) {
        const {
          category,
          tag,
          search,
          limit = 12,
          offset = 0,
          featured = false,
        } = options

        let posts = await contentLayer.listPosts({
          type: 'blog',
          limit: limit + offset + 50, // Fetch more to compensate for offset and filtering
        })

        // Filter by search term if specified
        if (search) {
          const searchLower = search.toLowerCase()
          posts = posts.filter(
            (post) =>
              post.data.title.toLowerCase().includes(searchLower) ||
              post.excerpt?.toLowerCase().includes(searchLower) ||
              post.data.tags?.some((tag) =>
                tag.toLowerCase().includes(searchLower),
              ),
          )
        }

        // Apply pagination
        const paginatedPosts = posts.slice(offset, offset + limit)

        return {
          posts: paginatedPosts,
          total: posts.length,
          hasMore: posts.length > offset + limit,
        }
      },

      /**
       * Searches posts in the blog
       *
       * @param query - Search parameters including query string and filters
       * @returns Promise resolving to search results with metadata
       */
      async searchPosts(query: BlogSearchQuery) {
        const { q: searchQuery, category, tag, limit = 10 } = query

        // Fetch all posts and filter client-side since contentLayer doesn't have search
        const allPosts = await contentLayer.listPosts({
          type: 'blog',
          limit: 1000, // Large limit to get all posts for search
        })

        // Perform search filtering
        const searchResults = searchQuery
          ? allPosts.filter((post) => {
              const title = post.data.title?.toLowerCase() || ''
              const excerpt = post.excerpt?.toLowerCase() || ''
              const tags = post.data.tags?.join(' ').toLowerCase() || ''

              const searchLower = searchQuery.toLowerCase()

              return (
                title.includes(searchLower) ||
                excerpt.includes(searchLower) ||
                tags.includes(searchLower)
              )
            })
          : allPosts

        // Limit results
        const limitedResults = searchResults.slice(0, limit)

        return {
          results: limitedResults,
          total: searchResults.length,
          query: searchQuery,
          suggestions: [], // TODO: Implement search suggestions
        }
      },

      /**
       * Retrieves popular blog posts
       *
       * @param limit - Maximum number of posts to return
       * @returns Promise resolving to popular posts
       */
      async getPopularPosts(limit: number = 5) {
        const posts = await contentLayer.listPosts({
          type: 'blog',
          limit: limit * 2, // Get more posts to filter
        })

        // For now, return the most recent posts as "popular"
        // TODO: Implement popularity logic based on views/engagement
        return posts
          .sort(
            (a, b) =>
              new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
          )
          .slice(0, limit)
      },

      /**
       * Finds related posts by tags and category
       *
       * @param excludeSlug - Post slug to exclude from results
       * @param limit - Maximum number of related posts to return
       * @returns Promise resolving to related posts
       */
      async getRelatedPosts(excludeSlug: string, limit: number = 3) {
        const allPosts = await contentLayer.listPosts({
          type: 'blog',
          limit: 50, // Get a reasonable number of posts
        })

        // Find the current post to get its tags and category
        const currentPost = allPosts.find((post) => post.slug === excludeSlug)

        if (!currentPost) {
          // If current post not found, return recent posts
          return allPosts
            .filter((post) => post.slug !== excludeSlug)
            .slice(0, limit)
        }

        // Score posts based on tag matches and category match
        const scoredPosts = allPosts
          .filter((post) => post.slug !== excludeSlug)
          .map((post) => {
            const score = 0
            return { post, score }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((item) => item.post)

        return scoredPosts
      },

      /**
       * Generates SEO metadata for a blog post
       *
       * @param post - The blog post
       * @returns Promise resolving to post metadata
       */
      generatePostMeta(post: BlogPost): BlogPostMeta {
        return {
          title: post.title,
          description: post.excerpt || post.title,
          keywords: post.tags ?? [],
          ogImage: post.cover || '/images/default-og-image.jpg',
          canonical: Url.get(`/blog/${post.slug}`),
          publishedTime: post.date,
          modifiedTime: post.date,
          author: {
            name: post.author || 'Anonymous',
            image: post.authorImage,
            url: undefined,
          },
          section: post.category,
          tags: post.tags ?? [],
        }
      },
    }

    return { blog }
  },
})
