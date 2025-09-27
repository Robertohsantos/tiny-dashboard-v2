# Help Center Feature Documentation

## Overview

The Help Center feature is a comprehensive help center implementation following Feature-Sliced Design architecture. It provides functionality for managing help articles, categories, search, and navigation with a clean separation of concerns.

This feature extracts help center specific functionality from the generic content feature, providing dedicated controllers, specialized components, improved type safety, and better maintainability.

## Architecture

### Directory Structure

```
help-center/
├── controllers/                    # API layer - HTTP endpoints
│   └── help-center.controller.ts  # REST API endpoints
├── procedures/                     # Business logic layer
│   └── help-center.procedure.ts   # Core business operations
├── presentation/                   # Presentation layer
│   ├── components/                 # React components
│   │   ├── help-header/           # Header with breadcrumbs
│   │   ├── category-grid/         # Category grid layout
│   │   ├── category-card/         # Individual category cards
│   │   ├── popular-articles/      # Popular articles display
│   │   └── help-search/           # Search functionality
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-help-search.ts     # Search state management
│   │   ├── use-help-article.ts    # Article data management
│   │   ├── use-help-categories.ts # Category management
│   │   ├── use-popular-articles.ts# Popular content
│   │   └── use-help-navigation.ts # Navigation utilities
│   ├── contexts/                  # React contexts for state
│   │   ├── help-center-context.tsx# Main feature context
│   │   ├── help-search-context.tsx# Search state context
│   │   └── help-navigation-context.tsx# Navigation context
│   └── utils/                     # Presentation utilities
│       ├── help-formatters.ts     # Data formatting
│       ├── help-validators.ts     # Input validation
│       ├── help-transformers.ts   # Data transformation
│       ├── help-constants.ts      # UI constants
│       └── help-helpers.ts        # Helper functions
├── help-center.interface.ts       # TypeScript definitions
├── DOCS.md                        # This documentation
└── index.ts                       # Feature exports
```

## API Layer

### HelpCenterController

The controller provides REST API endpoints for all help center functionality:

#### Endpoints

| Method | Endpoint                      | Description                | Parameters                                      |
| ------ | ----------------------------- | -------------------------- | ----------------------------------------------- |
| `GET`  | `/help-center/articles/:slug` | Get specific article       | `slug` (path)                                   |
| `GET`  | `/help-center/articles`       | List articles with filters | `category`, `search`, `limit`, `offset` (query) |
| `GET`  | `/help-center/search`         | Search articles            | `q`, `category`, `limit` (query)                |
| `GET`  | `/help-center/categories`     | Get all categories         | None                                            |
| `GET`  | `/help-center/popular`        | Get popular articles       | `limit` (query)                                 |

#### Response Types

All endpoints return standardized responses with proper HTTP status codes:

- **Success (200)**: Returns requested data
- **Bad Request (400)**: Invalid parameters or validation errors
- **Not Found (404)**: Requested resource not found
- **Internal Server Error (500)**: Server-side processing errors

## Business Logic Layer

### HelpCenterProcedure

Contains all business logic operations with comprehensive error handling and data validation:

#### Core Operations

- **Article Management**: Retrieval, filtering, and related content discovery
- **Search Engine**: Full-text search with category filtering
- **Category System**: Dynamic category listing with article counts
- **Content Discovery**: Popular articles and recommendations
- **Data Processing**: Content transformation and validation

## Presentation Layer

### Components

All components follow React best practices with TypeScript support and proper error boundaries:

#### Component Structure

- **help-header/**: Navigation header with breadcrumbs and search integration
- **category-grid/**: Responsive grid layout for category display
- **category-card/**: Individual category cards with article counts and icons
- **popular-articles/**: Curated list of most accessed articles
- **help-search/**: Advanced search with filters and real-time results

### Custom Hooks

Encapsulate complex state logic and API interactions:

#### Hook Specifications

| Hook                 | Purpose                 | Returns                           | Key Features                            |
| -------------------- | ----------------------- | --------------------------------- | --------------------------------------- |
| `useHelpSearch`      | Search state management | Query, results, loading states    | Debounced search, history tracking      |
| `useHelpArticle`     | Article data management | Article, related content, actions | Caching, error handling                 |
| `useHelpCategories`  | Category operations     | Categories, filtering utilities   | Dynamic counts, slug resolution         |
| `usePopularArticles` | Popular content         | Articles, limit controls          | Configurable limits, refresh capability |
| `useHelpNavigation`  | Navigation utilities    | Breadcrumbs, navigation state     | Auto-generation, history management     |

### React Contexts

Provide global state management across the feature:

#### Context Architecture

- **HelpCenterContext**: Main feature state, category management, global configuration
- **HelpSearchContext**: Search state, query history, result caching
- **HelpNavigationContext**: Breadcrumb generation, current location tracking

### Utility Functions

Pure functions for data processing and validation:

#### Utility Categories

- **Formatters**: Date formatting, reading time calculation, text processing
- **Validators**: Input validation, slug verification, query sanitization
- **Transformers**: Data shape conversion, API response processing
- **Constants**: Configuration values, limits, default settings
- **Helpers**: Breadcrumb generation, content analysis, utility functions

## Implementation Guide

### Basic Setup

```tsx
import {
  HelpCenterProvider,
  HelpHeader,
  CategoryGrid,
  PopularArticles,
} from '@/@saas-boilerplate/features/help-center'

/**
 * Basic help center page implementation
 */
function HelpPage() {
  return (
    <HelpCenterProvider>
      <div className="help-center">
        <HelpHeader />
        <main className="help-content">
          <CategoryGrid />
          <PopularArticles />
        </main>
      </div>
    </HelpCenterProvider>
  )
}
```

### Advanced Hook Usage

```tsx
import {
  useHelpSearch,
  useHelpCategories,
  useHelpNavigation,
} from '@/@saas-boilerplate/features/help-center'

/**
 * Advanced search component with category filtering
 */
function AdvancedSearchComponent() {
  const { query, results, search, isSearching, searchHistory } = useHelpSearch()

  const { categories, getCategoryBySlug } = useHelpCategories()
  const { generateBreadcrumbs } = useHelpNavigation()

  const handleSearch = (searchTerm: string, categorySlug?: string) => {
    search(searchTerm, { category: categorySlug, limit: 20 })
  }

  return (
    <div className="advanced-search">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search help articles..."
          className="search-field"
        />
        {isSearching && <div className="loading">Searching...</div>}
      </div>

      <div className="category-filters">
        {categories.map((category) => (
          <button
            key={category.slug}
            onClick={() => handleSearch(query, category.slug)}
            className="category-filter"
          >
            {category.title} ({category.articleCount})
          </button>
        ))}
      </div>

      {results && (
        <div className="search-results">
          <h3>Found {results.total} articles</h3>
          {results.articles.map((article) => (
            <article key={article.slug} className="search-result">
              <h4>{article.title}</h4>
              <p>{article.excerpt}</p>
              <span className="category">
                {getCategoryBySlug(article.category)?.title}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
```

## API Integration

### Client-Side API Usage

```typescript
import { api } from '@/igniter.client'

// Get specific article with related content
const getArticle = async (slug: string) => {
  try {
    const response = await api.helpCenter.getArticle.query({
      params: { slug },
    })
    return response.data
  } catch (error) {
    console.error('Failed to fetch article:', error)
    throw error
  }
}

// Search articles with filters
const searchArticles = async (query: string, category?: string) => {
  try {
    const response = await api.helpCenter.searchArticles.query({
      query: { q: query, category, limit: 20 },
    })
    return response.data
  } catch (error) {
    console.error('Search failed:', error)
    throw error
  }
}

// Get paginated articles by category
const getArticlesByCategory = async (category: string, page: number = 0) => {
  const limit = 10
  const offset = page * limit

  try {
    const response = await api.helpCenter.listArticles.query({
      query: { category, limit, offset },
    })
    return response.data
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    throw error
  }
}
```

### Server-Side Usage (RSC)

```tsx
import { api } from '@/igniter.client'

/**
 * Server component for article page
 */
async function ArticlePage({ params }: { params: { slug: string } }) {
  // Direct server-side API call
  const articleData = await api.helpCenter.getArticle.query({
    params: { slug: params.slug },
  })

  if (!articleData.data.article) {
    notFound()
  }

  const { article, relatedArticles, category } = articleData.data

  return (
    <article className="help-article">
      <header>
        <h1>{article.title}</h1>
        <p className="category">{category.title}</p>
      </header>

      <div className="article-content">{/* Article content rendering */}</div>

      <aside className="related-articles">
        <h3>Related Articles</h3>
        {relatedArticles.map((related) => (
          <a key={related.slug} href={`/help/${category.slug}/${related.slug}`}>
            {related.title}
          </a>
        ))}
      </aside>
    </article>
  )
}
```

## TypeScript Integration

### Type Definitions

```typescript
import type {
  HelpArticle,
  HelpCategory,
  HelpSearchQuery,
  UseHelpSearchReturn,
  UseHelpArticleReturn,
} from '@/@saas-boilerplate/features/help-center'

// Custom hook with proper typing
const useCustomHelpLogic = (): CustomHelpReturn => {
  const searchHook = useHelpSearch()
  const articleHook = useHelpArticle('getting-started')

  return {
    ...searchHook,
    currentArticle: articleHook.article,
    isLoading: searchHook.isSearching || articleHook.isLoading,
  }
}

interface CustomHelpReturn extends UseHelpSearchReturn {
  currentArticle: HelpArticle | null
  isLoading: boolean
}
```

## Performance Considerations

### Optimization Strategies

- **Lazy Loading**: Components are code-split for optimal bundle size
- **Caching**: Search results and categories are cached in contexts
- **Debouncing**: Search input is debounced to prevent excessive API calls
- **Pagination**: Large article lists are paginated for better performance
- **Prefetching**: Related articles are prefetched for faster navigation

### Best Practices

1. **Use Server Components** for initial data loading when possible
2. **Implement proper error boundaries** around help center components
3. **Cache search results** to improve user experience
4. **Optimize images** in help articles for faster loading
5. **Use semantic HTML** for better accessibility and SEO

## Development Workflow

### Adding New Features

1. **Define Types**: Add new interfaces to `help-center.interface.ts`
2. **Implement API**: Add endpoints to controller and business logic to procedure
3. **Create Components**: Build React components following the established patterns
4. **Add Hooks**: Create custom hooks for state management if needed
5. **Update Documentation**: Keep this documentation current with changes

### Testing Strategy

```typescript
// Example test structure
describe('HelpCenterController', () => {
  it('should return article by slug', async () => {
    const response = await api.helpCenter.getArticle.query({
      params: { slug: 'test-article' },
    })

    expect(response.data.article).toBeDefined()
    expect(response.data.article.slug).toBe('test-article')
  })
})
```

### Code Quality Standards

- **TypeScript**: Strict typing with comprehensive interfaces
- **TSDoc**: Complete documentation for all public APIs
- **Error Handling**: Proper error boundaries and graceful degradation
- **Accessibility**: WCAG 2.1 AA compliance for all components
- **Testing**: Unit tests for hooks, integration tests for components

## Migration Guide

### From Generic Content Feature

1. **Update Imports**: Change from `@/features/content` to `@/@saas-boilerplate/features/help-center`
2. **API Endpoints**: Update API calls to use new help-center specific endpoints
3. **Component Props**: Review component interfaces for any breaking changes
4. **State Management**: Migrate to new context providers if using content contexts

### Breaking Changes

- Content-specific endpoints moved to dedicated help-center namespace
- Component prop interfaces updated for better type safety
- Context structure changed to be more specific to help center needs

This feature provides a robust, scalable foundation for help center functionality with excellent developer experience and user performance.
