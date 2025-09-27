/**
 * Help Center Feature Types and Interfaces
 *
 * This module contains all TypeScript interfaces, types, and constants
 * used throughout the Help Center feature implementation.
 */

import type { ContentHeading } from '@/@saas-boilerplate/providers/content-layer/types'

/**
 * Available help center category slugs
 *
 * These slugs are used for URL routing and content organization
 */
export type HelpCategorySlug =
  | 'getting-started'
  | 'account-management'
  | 'billing'
  | 'integrations'
  | 'api-keys'
  | 'webhooks'
  | 'leads'
  | 'submissions'

/**
 * Help center category information
 *
 * @interface HelpCategory
 */
export interface HelpCategory {
  /** Unique identifier for the category */
  slug: HelpCategorySlug
  /** Display title of the category */
  title: string
  /** Brief description of what the category covers */
  description: string
  /** Optional icon identifier for UI display */
  icon?: React.ReactNode
  /** Optional color theme for the category */
  color?: string
  /** Number of articles in this category */
  articleCount?: number
}

/**
 * Help center article with extended metadata
 *
 * Extends the base ContentTypeResult with help-center specific properties
 *
 * @interface HelpArticle
 * @extends ContentTypeResult
 */
export interface HelpArticle {
  /** Unique identifier */
  id: string
  /** Article slug for URL */
  slug: string
  /** Article excerpt/summary */
  excerpt: string
  /** Full article content */
  content: string
  /** Article metadata from schema */
  data: {
    /** Article title */
    title: string
    /** Category this article belongs to */
    category: HelpCategorySlug
    /** Article tags */
    tags?: string[]
    /** Published date */
    date: string
    /** Article description */
    description?: string
    /** Short excerpt for preview contexts */
    excerpt?: string
    /** Author information */
    author?: string
    /** Author image */
    authorImage?: string
  }
  /** Table of contents headings */
  headings: ContentHeading[]
  /** Estimated reading time in minutes */
  readingTime?: number
  /** Whether this article is marked as popular */
  popular?: boolean
  /** Whether this article is featured */
  featured?: boolean
}

/**
 * Search query parameters for help center articles
 *
 * @interface HelpSearchQuery
 */
export interface HelpSearchQuery {
  /** Search term to look for in articles */
  query: string
  /** Optional category filter */
  category?: HelpCategorySlug
  /** Maximum number of results to return */
  limit?: number
}

/**
 * Search results with metadata
 *
 * @interface HelpSearchResult
 */
export interface HelpSearchResult {
  /** Array of matching articles */
  articles: HelpArticle[]
  /** Total number of matches found */
  total: number
  /** Original search query */
  query: string
  /** Available categories for filtering */
  categories: HelpCategory[]
}

/**
 * Breadcrumb navigation item
 *
 * @interface HelpBreadcrumb
 */
export interface HelpBreadcrumb {
  /** Display text for the breadcrumb */
  title: string
  /** URL path for navigation */
  href: string
}

/**
 * Navigation state and context
 *
 * @interface HelpNavigation
 */
export interface HelpNavigation {
  /** Array of breadcrumb items */
  breadcrumbs: HelpBreadcrumb[]
  /** Currently active category */
  currentCategory?: HelpCategory
  /** Currently viewed article */
  currentArticle?: HelpArticle
}

/**
 * Response for getting a specific help article
 *
 * @interface GetHelpArticleResponse
 */
export interface GetHelpArticleResponse {
  /** The requested article */
  article: HelpArticle
  /** Related articles in the same category */
  relatedArticles: HelpArticle[]
  /** Category information for the article */
  category: HelpCategory
}

/**
 * Response for listing help articles with filters
 *
 * @interface ListHelpArticlesResponse
 */
export interface ListHelpArticlesResponse {
  /** Array of articles matching the criteria */
  articles: HelpArticle[]
  /** Total number of articles found */
  total: number
  /** Category information if filtered by category */
  category?: HelpCategory
}

/**
 * Response for getting all help categories
 *
 * @interface GetHelpCategoriesResponse
 */
export interface GetHelpCategoriesResponse {
  /** Array of all available categories */
  categories: HelpCategory[]
}

/**
 * Response for getting popular articles
 *
 * @interface GetPopularArticlesResponse
 */
export interface GetPopularArticlesResponse {
  /** Array of popular articles */
  articles: HelpArticle[]
}

/**
 * Context type for the main Help Center provider
 *
 * @interface HelpCenterContextType
 */
export interface HelpCenterContextType {
  /** Array of all available categories */
  categories: HelpCategory[]
  /** Loading state for categories */
  isLoading: boolean
  /** Error message if category loading fails */
  error?: string
  /** Function to refresh categories from the server */
  refreshCategories: () => Promise<void>
}

/**
 * Context type for Help Center search functionality
 *
 * @interface HelpSearchContextType
 */
export interface HelpSearchContextType {
  /** Current search query */
  query: string
  /** Search results or null if no search performed */
  results: HelpSearchResult | null
  /** Loading state for search operations */
  isSearching: boolean
  /** History of previous search queries */
  searchHistory: string[]
  /** Function to perform a search */
  search: (query: string, options?: Partial<HelpSearchQuery>) => Promise<void>
  /** Function to clear current search results */
  clearSearch: () => void
  /** Function to clear search history */
  clearHistory: () => void
}

/**
 * Context type for Help Center navigation
 *
 * @interface HelpNavigationContextType
 */
export interface HelpNavigationContextType {
  /** Current navigation state */
  navigation: HelpNavigation
  /** Function to update navigation state */
  setNavigation: (nav: Partial<HelpNavigation>) => void
  /** Function to generate breadcrumbs for a given path */
  generateBreadcrumbs: (
    category?: HelpCategorySlug,
    articleSlug?: string,
  ) => HelpBreadcrumb[]
}

/**
 * Return type for the useHelpSearch hook
 *
 * @interface UseHelpSearchReturn
 * @extends HelpSearchContextType
 */
export type UseHelpSearchReturn = HelpSearchContextType

/**
 * Return type for the useHelpArticle hook
 *
 * @interface UseHelpArticleReturn
 */
export interface UseHelpArticleReturn {
  /** The current article or null if not loaded */
  article: HelpArticle | null
  /** Related articles in the same category */
  relatedArticles: HelpArticle[]
  /** Loading state */
  isLoading: boolean
  /** Error message if loading fails */
  error?: string
  /** Function to refetch the article */
  refetch: () => Promise<void>
}

/**
 * Return type for the useHelpCategories hook
 *
 * @interface UseHelpCategoriesReturn
 */
export interface UseHelpCategoriesReturn {
  /** Array of all categories */
  categories: HelpCategory[]
  /** Loading state */
  isLoading: boolean
  /** Error message if loading fails */
  error?: string
  /** Function to get a category by its slug */
  getCategoryBySlug: (slug: HelpCategorySlug) => HelpCategory | undefined
}

/**
 * Return type for the usePopularArticles hook
 *
 * @interface UsePopularArticlesReturn
 */
export interface UsePopularArticlesReturn {
  /** Array of popular articles */
  articles: HelpArticle[]
  /** Loading state */
  isLoading: boolean
  /** Error message if loading fails */
  error?: string
  /** Current limit for number of articles */
  limit: number
  /** Function to update the limit */
  setLimit: (limit: number) => void
}

/**
 * Return type for the useHelpNavigation hook
 *
 * @interface UseHelpNavigationReturn
 * @extends HelpNavigationContextType
 */
export type UseHelpNavigationReturn = HelpNavigationContextType

/**
 * Options for help center formatters
 *
 * @interface HelpFormatterOptions
 */
export interface HelpFormatterOptions {
  /** Date formatting style */
  dateFormat?: 'short' | 'long' | 'relative'
  /** Reading time formatting style */
  readingTimeFormat?: 'short' | 'long'
}

/**
 * Result of help center validation operations
 *
 * @interface HelpValidationResult
 */
export interface HelpValidationResult {
  /** Whether the validation passed */
  isValid: boolean
  /** Array of error messages if validation failed */
  errors: string[]
}

/**
 * Help Center feature constants
 *
 * Contains all constant values used throughout the Help Center feature
 */
export const HELP_CONSTANTS = {
  /** Minimum length for search queries */
  SEARCH_MIN_LENGTH: 2,
  /** Debounce delay for search input in milliseconds */
  SEARCH_DEBOUNCE_MS: 300,
  /** Default limit for popular articles */
  POPULAR_ARTICLES_DEFAULT_LIMIT: 5,
  /** Maximum number of related articles to show */
  RELATED_ARTICLES_LIMIT: 3,
  /** Maximum number of search queries to keep in history */
  SEARCH_HISTORY_LIMIT: 10,
  /** Color themes for each category */
  CATEGORY_COLORS: {
    'getting-started': 'blue',
    'account-management': 'green',
    billing: 'purple',
    integrations: 'orange',
    'api-keys': 'red',
    webhooks: 'teal',
    leads: 'pink',
    submissions: 'indigo',
  } as const,
} as const
