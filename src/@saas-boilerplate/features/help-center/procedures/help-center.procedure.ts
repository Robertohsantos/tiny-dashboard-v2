/**
 * Help Center Procedure
 *
 * Contains all business logic specific to help center functionality.
 * Handles data processing, validation, and integration with content providers.
 *
 * @module HelpCenterProcedure
 */

import { igniter } from '@/igniter'
import { contentLayer } from '@/modules/core/services/content-layer'
import type {
  HelpArticle,
  HelpCategory,
  HelpCategorySlug,
  HelpSearchQuery,
  GetHelpArticleResponse,
  ListHelpArticlesResponse,
  GetHelpCategoriesResponse,
  GetPopularArticlesResponse,
  HelpSearchResult,
} from '../help-center.interface'

/**
 * Help Center Procedure
 *
 * Provides business logic methods for help center operations
 */
export const HelpCenterProcedure = igniter.procedure({
  name: 'HelpCenterProcedure',
  handler: () => {
    const helpCenter = {
      /**
       * Retrieves a specific help center article by slug
       *
       * @param slug - The article slug to search for
       * @returns Promise resolving to article with related content
       * @throws Error if article is not found
       */
      async getArticle(slug: string): Promise<GetHelpArticleResponse> {
        const decodedSlug = decodeURIComponent(slug)

        // Fetch the main article using contentLayer
        const article = (await contentLayer.getPostBySlug(
          'help',
          decodedSlug,
        )) as HelpArticle

        if (!article) {
          throw new Error(`Article not found: ${slug}`)
        }

        // Fetch category information
        const category = await helpCenter.getCategoryBySlug(
          article.data.category,
        )

        // Fetch related articles in the same category
        const relatedArticles = await helpCenter.getRelatedArticles(
          article.data.category,
          slug,
          3,
        )

        return {
          article,
          relatedArticles,
          category: category!,
        }
      },

      /**
       * Lists articles with optional filtering and pagination
       *
       * @param options - Filtering and pagination options
       * @returns Promise resolving to paginated article list
       */
      async listArticles(
        options: {
          category?: HelpCategorySlug
          search?: string
          limit?: number
          offset?: number
        } = {},
      ): Promise<ListHelpArticlesResponse> {
        const { category, search, limit = 10, offset = 0 } = options

        let articles = (await contentLayer.listPosts({
          type: 'help',
          limit: limit + offset, // Fetch more to compensate for offset
        })) as HelpArticle[]

        // Filter by category if specified
        if (category) {
          articles = articles.filter(
            (article) => article.data.category === category,
          )
        }

        // Filter by search term if specified
        if (search) {
          const searchLower = search.toLowerCase()
          articles = articles.filter(
            (article) =>
              article.data.title.toLowerCase().includes(searchLower) ||
              article.excerpt?.toLowerCase().includes(searchLower) ||
              article.data.tags?.some((tag) =>
                tag.toLowerCase().includes(searchLower),
              ),
          )
        }

        // Apply pagination
        const paginatedArticles = articles.slice(offset, offset + limit)

        // Fetch category data if filtered by category
        const categoryData = category
          ? await helpCenter.getCategoryBySlug(category)
          : undefined

        return {
          articles: paginatedArticles,
          total: articles.length,
          category: categoryData,
        }
      },

      /**
       * Searches articles in the help center
       *
       * @param query - Search parameters including query string and filters
       * @returns Promise resolving to search results with metadata
       */
      async searchArticles(query: HelpSearchQuery): Promise<HelpSearchResult> {
        const { query: searchQuery, category, limit = 10 } = query

        // Fetch all articles and filter client-side since contentLayer doesn't have search
        const allArticles = (await contentLayer.listPosts({
          type: 'help',
          limit: 1000, // Large limit to get all articles for search
        })) as HelpArticle[]

        // Perform search filtering
        const searchResults = searchQuery
          ? allArticles.filter((article) => {
              const title = article.data.title?.toLowerCase() || ''
              const excerpt = article.excerpt?.toLowerCase() || ''
              const category = article.data.category?.toLowerCase() || ''

              const searchLower = searchQuery.toLowerCase()

              return (
                title.includes(searchLower) ||
                excerpt.includes(searchLower) ||
                category.includes(searchLower)
              )
            })
          : allArticles

        // Filter by category if specified
        let filteredResults = searchResults
        if (category) {
          filteredResults = searchResults.filter(
            (article) => article.data.category === category,
          )
        }

        // Fetch all categories for the result metadata
        const categories = await helpCenter.getCategories()

        return {
          articles: filteredResults,
          total: filteredResults.length,
          query: searchQuery,
          categories: categories.categories,
        }
      },

      /**
       * Lists all help center categories
       *
       * @returns Promise resolving to all available categories with article counts
       */
      async getCategories(): Promise<GetHelpCategoriesResponse> {
        // Fetch all articles to count by category
        const allArticles = (await contentLayer.listPosts({
          type: 'help',
          limit: 1000, // High limit to get all articles
        })) as HelpArticle[]

        // Count articles per category
        const categoryCount: Record<string, number> = {}
        allArticles.forEach((article) => {
          categoryCount[article.data.category] =
            (categoryCount[article.data.category] || 0) + 1
        })

        // Define available categories
        const categories: HelpCategory[] = [
          {
            slug: 'getting-started',
            title: 'Getting Started',
            description: 'Guides to help you start using the platform',
            icon: 'rocket',
            color: 'blue',
            articleCount: categoryCount['getting-started'] || 0,
          },
          {
            slug: 'account-management',
            title: 'Account Management',
            description: 'How to manage your account and settings',
            icon: 'user',
            color: 'green',
            articleCount: categoryCount['account-management'] || 0,
          },
          {
            slug: 'billing',
            title: 'Billing',
            description: 'Information about plans and payments',
            icon: 'credit-card',
            color: 'purple',
            articleCount: categoryCount.billing || 0,
          },
          {
            slug: 'integrations',
            title: 'Integrations',
            description: 'How to connect with other tools',
            icon: 'plug',
            color: 'orange',
            articleCount: categoryCount.integrations || 0,
          },
          {
            slug: 'api-keys',
            title: 'API Keys',
            description: 'API key management and configuration',
            icon: 'key',
            color: 'red',
            articleCount: categoryCount['api-keys'] || 0,
          },
          {
            slug: 'webhooks',
            title: 'Webhooks',
            description: 'Webhook configuration and usage',
            icon: 'webhook',
            color: 'teal',
            articleCount: categoryCount.webhooks || 0,
          },
          {
            slug: 'leads',
            title: 'Leads',
            description: 'Lead and prospect management',
            icon: 'users',
            color: 'pink',
            articleCount: categoryCount.leads || 0,
          },
          {
            slug: 'submissions',
            title: 'Submissions',
            description: 'Form submission management',
            icon: 'file-text',
            color: 'indigo',
            articleCount: categoryCount.submissions || 0,
          },
        ]

        return { categories }
      },

      /**
       * Retrieves popular help articles
       *
       * @param limit - Maximum number of articles to return
       * @returns Promise resolving to popular articles
       */
      async getPopularArticles(
        limit: number = 5,
      ): Promise<GetPopularArticlesResponse> {
        const articles = (await contentLayer.listPosts({
          type: 'help',
          limit,
        })) as HelpArticle[]

        // For now, return the first articles
        // TODO: Implement popularity logic based on views/clicks
        const popularArticles = articles
          .filter((article) => article.popular !== false)
          .slice(0, limit)

        return { articles: popularArticles }
      },

      /**
       * Finds related articles by category
       *
       * @param category - Category to search within
       * @param excludeSlug - Article slug to exclude from results
       * @param limit - Maximum number of related articles to return
       * @returns Promise resolving to related articles
       */
      async getRelatedArticles(
        category: HelpCategorySlug,
        excludeSlug: string,
        limit: number = 3,
      ): Promise<HelpArticle[]> {
        const articles = (await contentLayer.listPosts({
          type: 'help',
          limit: limit + 50, // Large limit to get all articles, then filter
        })) as HelpArticle[]

        return articles
          .filter(
            (article) =>
              article.data.category === category &&
              article.slug !== excludeSlug,
          )
          .slice(0, limit)
      },

      /**
       * Finds a category by its slug
       *
       * @param slug - Category slug to search for
       * @returns Promise resolving to category or undefined if not found
       */
      async getCategoryBySlug(
        slug: HelpCategorySlug,
      ): Promise<HelpCategory | undefined> {
        const categories = await helpCenter.getCategories()
        return categories.categories.find((cat) => cat.slug === slug)
      },
    }

    return { helpCenter }
  },
})
